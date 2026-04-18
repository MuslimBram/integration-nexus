import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) return json({ error: "Twilio not configured" }, 500);

    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { conversation_id, text, channel } = body as {
      conversation_id: string; text: string; channel: "sms" | "whatsapp";
    };
    if (!conversation_id || !text || !channel) return json({ error: "Missing fields" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: convo } = await supabase
      .from("conversations").select("*").eq("id", conversation_id).single();
    if (!convo || convo.user_id !== user.id) return json({ error: "Forbidden" }, 403);

    const { data: cfg } = await supabase
      .from("twilio_config").select("*").eq("user_id", user.id).maybeSingle();
    if (!cfg) return json({ error: "Twilio config missing" }, 400);

    const fromRaw = channel === "whatsapp" ? cfg.whatsapp_from_number : cfg.sms_from_number;
    if (!fromRaw) return json({ error: `No ${channel} from-number configured` }, 400);

    const From = channel === "whatsapp" ? `whatsapp:${fromRaw}` : fromRaw;
    const To = channel === "whatsapp" ? `whatsapp:${convo.external_id}` : convo.external_id;

    const twRes = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To, From, Body: text }),
    });
    const twData = await twRes.json();
    if (!twRes.ok) {
      console.error("Twilio send failed", twData);
      return json({ error: twData }, 502);
    }

    await supabase.from("messages").insert({
      user_id: user.id,
      conversation_id,
      channel,
      direction: "outbound",
      sender: "agent",
      content: text,
      external_message_id: twData.sid ?? null,
      status: "sent",
      metadata: { twilio: twData },
    });
    await supabase.from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation_id);

    return json({ ok: true, sid: twData.sid });
  } catch (e) {
    console.error("twilio-send error", e);
    return json({ error: String(e) }, 500);
  }
});

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
