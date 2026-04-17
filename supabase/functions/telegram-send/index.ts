import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
      return json({ error: "Missing env vars" }, 500);
    }

    // Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { conversation_id, text } = await req.json();
    if (!conversation_id || !text) return json({ error: "conversation_id and text required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: convo } = await admin
      .from("conversations")
      .select("*")
      .eq("id", conversation_id)
      .eq("user_id", user.id)
      .single();
    if (!convo) return json({ error: "Conversation not found" }, 404);

    const sendRes = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: convo.external_id, text }),
    });
    const sendData = await sendRes.json();

    const { data: msg } = await admin.from("messages").insert({
      user_id: user.id,
      conversation_id: convo.id,
      channel: "telegram",
      direction: "outbound",
      sender: "agent",
      content: text,
      external_message_id: sendData?.result?.message_id ? String(sendData.result.message_id) : null,
      status: sendRes.ok ? "sent" : "failed",
      metadata: sendRes.ok ? {} : { error: sendData },
    }).select().single();

    await admin
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", convo.id);

    return json({ ok: sendRes.ok, message: msg, telegram: sendData });
  } catch (e) {
    console.error("telegram-send error", e);
    return json({ error: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
