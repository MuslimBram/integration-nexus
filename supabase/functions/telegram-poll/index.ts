import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startTime = Date.now();

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
    return json({ error: "Missing env vars" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Get current offset
  const { data: state } = await supabase
    .from("telegram_bot_state")
    .select("update_offset")
    .eq("id", 1)
    .single();
  let currentOffset = state?.update_offset ?? 0;

  // Get bot owner (the user that "owns" all incoming Telegram messages)
  const { data: ownerRow } = await supabase
    .from("telegram_bot_owner")
    .select("owner_user_id")
    .eq("id", 1)
    .single();
  const ownerUserId = ownerRow?.owner_user_id;

  let totalProcessed = 0;

  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;
    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    const res = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offset: currentOffset,
        timeout,
        allowed_updates: ["message"],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("getUpdates failed", data);
      return json({ error: data }, 502);
    }

    const updates = data.result ?? [];
    if (updates.length === 0) continue;

    for (const u of updates) {
      if (!u.message) continue;
      try {
        await processMessage(supabase, u, ownerUserId, LOVABLE_API_KEY, TELEGRAM_API_KEY);
        totalProcessed++;
      } catch (e) {
        console.error("processMessage error", e);
      }
    }

    const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
    await supabase
      .from("telegram_bot_state")
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq("id", 1);
    currentOffset = newOffset;
  }

  return json({ ok: true, processed: totalProcessed, finalOffset: currentOffset });
});

async function processMessage(
  supabase: any,
  update: any,
  ownerUserId: string | null,
  lovableKey: string,
  telegramKey: string,
) {
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text ?? "";
  const fromName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ");
  const fromHandle = msg.from?.username ? `@${msg.from.username}` : String(msg.from?.id ?? "");

  if (!ownerUserId) {
    console.log("No bot owner set — message ignored");
    return;
  }

  // Upsert conversation
  const { data: convo } = await supabase
    .from("conversations")
    .upsert(
      {
        user_id: ownerUserId,
        channel: "telegram",
        external_id: String(chatId),
        contact_name: fromName || null,
        contact_handle: fromHandle,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "user_id,channel,external_id" },
    )
    .select()
    .single();

  if (!convo) {
    console.error("Failed to upsert conversation");
    return;
  }

  // Insert inbound message
  await supabase.from("messages").insert({
    user_id: ownerUserId,
    conversation_id: convo.id,
    channel: "telegram",
    direction: "inbound",
    sender: "contact",
    content: text,
    external_message_id: String(msg.message_id),
    status: "delivered",
    metadata: { from: msg.from, chat: msg.chat },
  });

  // Create lead if first message in conversation
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", convo.id);

  if ((count ?? 0) <= 1) {
    await supabase.from("leads").insert({
      user_id: ownerUserId,
      source: "telegram",
      channel: "telegram",
      contact_name: fromName || null,
      contact_handle: fromHandle,
      message: text,
      conversation_id: convo.id,
      payload: { update },
    });
  }

  // Log webhook event (n8n bridge)
  await supabase.from("webhook_events").insert({
    user_id: ownerUserId,
    event_type: count && count > 1 ? "new_message" : "new_lead",
    source: "telegram",
    payload: { chat_id: chatId, text, from: msg.from, conversation_id: convo.id },
    status: "received",
  });

  // Channel settings — AI auto-reply?
  const { data: settings } = await supabase
    .from("channel_settings")
    .select("*")
    .eq("user_id", ownerUserId)
    .eq("channel", "telegram")
    .maybeSingle();

  const aiEnabled = settings?.ai_auto_reply ?? true;
  const systemPrompt = settings?.system_prompt ?? "You are a helpful customer support assistant. Be concise and friendly.";

  if (!aiEnabled || !text) return;

  // Build conversation history (last 10 messages)
  const { data: history } = await supabase
    .from("messages")
    .select("direction, content")
    .eq("conversation_id", convo.id)
    .order("created_at", { ascending: true })
    .limit(10);

  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...(history ?? []).map((m: any) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  // Call Lovable AI
  let aiReply = "";
  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
      }),
    });
    if (aiRes.status === 429 || aiRes.status === 402) {
      aiReply = aiRes.status === 402
        ? "AI credits exhausted. Please add funds in workspace settings."
        : "Rate limited. Please try again shortly.";
    } else if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return;
    } else {
      const aiData = await aiRes.json();
      aiReply = aiData.choices?.[0]?.message?.content ?? "";
    }
  } catch (e) {
    console.error("AI call failed", e);
    return;
  }

  if (!aiReply) return;

  // Send via Telegram
  const sendRes = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text: aiReply }),
  });
  const sendData = await sendRes.json();

  // Log outbound
  await supabase.from("messages").insert({
    user_id: ownerUserId,
    conversation_id: convo.id,
    channel: "telegram",
    direction: "outbound",
    sender: "ai",
    content: aiReply,
    external_message_id: sendData?.result?.message_id ? String(sendData.result.message_id) : null,
    status: sendRes.ok ? "sent" : "failed",
    metadata: { ai_model: "google/gemini-3-flash-preview" },
  });

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", convo.id);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
