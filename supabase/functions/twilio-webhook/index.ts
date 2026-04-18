import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

// Public webhook called by Twilio. URL format: /twilio-webhook?secret=xxx
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  // Twilio sends form-encoded body
  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => { params[k] = String(v); });

  const fromRaw = params.From ?? "";
  const toRaw = params.To ?? "";
  const text = params.Body ?? "";
  const messageSid = params.MessageSid ?? params.SmsMessageSid ?? "";

  const isWhatsApp = fromRaw.startsWith("whatsapp:");
  const channel = isWhatsApp ? "whatsapp" : "sms";
  const fromNum = fromRaw.replace(/^whatsapp:/, "");
  const toNum = toRaw.replace(/^whatsapp:/, "");

  // Route to user via the To number
  const { data: routing } = await supabase
    .from("twilio_number_routing")
    .select("user_id")
    .eq("phone_number", toNum)
    .eq("channel", channel)
    .maybeSingle();

  if (!routing) {
    console.warn("No routing for", toNum, channel);
    return twiml("");
  }
  const userId = routing.user_id;

  // Validate per-user webhook secret
  const { data: cfg } = await supabase
    .from("twilio_config").select("webhook_secret").eq("user_id", userId).maybeSingle();
  if (!cfg?.webhook_secret || cfg.webhook_secret !== secret) {
    console.warn("Invalid webhook secret for user", userId);
    return new Response("Forbidden", { status: 403 });
  }

  // Upsert conversation
  const { data: convo } = await supabase.from("conversations").upsert({
    user_id: userId,
    channel,
    external_id: fromNum,
    contact_handle: fromNum,
    last_message_at: new Date().toISOString(),
  }, { onConflict: "user_id,channel,external_id" }).select().single();

  if (!convo) return twiml("");

  // Insert inbound
  await supabase.from("messages").insert({
    user_id: userId,
    conversation_id: convo.id,
    channel,
    direction: "inbound",
    sender: "contact",
    content: text,
    external_message_id: messageSid || null,
    status: "delivered",
    metadata: { twilio: params },
  });

  // Lead on first message
  const { count } = await supabase.from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", convo.id);

  if ((count ?? 0) <= 1) {
    await supabase.from("leads").insert({
      user_id: userId, source: channel, channel,
      contact_handle: fromNum, message: text,
      conversation_id: convo.id, payload: { twilio: params },
    });
  }

  await supabase.from("webhook_events").insert({
    user_id: userId,
    event_type: count && count > 1 ? "new_message" : "new_lead",
    source: channel,
    payload: { from: fromNum, to: toNum, text, conversation_id: convo.id },
    status: "received",
  });

  // AI auto-reply
  const { data: settings } = await supabase.from("channel_settings")
    .select("*").eq("user_id", userId).eq("channel", channel).maybeSingle();
  const aiEnabled = settings?.ai_auto_reply ?? true;
  const systemPrompt = settings?.system_prompt ?? "You are a helpful customer support assistant. Be concise and friendly.";
  if (!aiEnabled || !text || !LOVABLE_API_KEY || !TWILIO_API_KEY) return twiml("");

  const { data: history } = await supabase.from("messages")
    .select("direction, content").eq("conversation_id", convo.id)
    .order("created_at", { ascending: true }).limit(10);
  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...(history ?? []).map((m: any) => ({
      role: m.direction === "inbound" ? "user" : "assistant", content: m.content,
    })),
  ];

  let aiReply = "";
  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages }),
    });
    if (aiRes.ok) {
      const d = await aiRes.json();
      aiReply = d.choices?.[0]?.message?.content ?? "";
    } else {
      console.error("AI error", aiRes.status, await aiRes.text());
    }
  } catch (e) { console.error("AI call failed", e); }

  if (!aiReply) return twiml("");

  // Send reply via Twilio
  const From = isWhatsApp ? `whatsapp:${toNum}` : toNum;
  const To = isWhatsApp ? `whatsapp:${fromNum}` : fromNum;
  const sendRes = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To, From, Body: aiReply }),
  });
  const sendData = await sendRes.json();

  await supabase.from("messages").insert({
    user_id: userId,
    conversation_id: convo.id,
    channel,
    direction: "outbound",
    sender: "ai",
    content: aiReply,
    external_message_id: sendData?.sid ?? null,
    status: sendRes.ok ? "sent" : "failed",
    metadata: { ai_model: "google/gemini-3-flash-preview", twilio: sendData },
  });
  await supabase.from("conversations")
    .update({ last_message_at: new Date().toISOString() }).eq("id", convo.id);

  return twiml("");
});

function twiml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
