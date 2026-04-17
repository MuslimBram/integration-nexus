// Lets the current authenticated user claim ownership of the Telegram bot
// (so all incoming Telegram messages are routed to their account).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization");
    if (!auth) return resp({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return resp({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { error } = await admin
      .from("telegram_bot_owner")
      .update({ owner_user_id: user.id, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) return resp({ error: error.message }, 500);

    // Ensure default channel settings exist
    await admin.from("channel_settings").upsert({
      user_id: user.id,
      channel: "telegram",
      enabled: true,
      ai_auto_reply: true,
    }, { onConflict: "user_id,channel" });

    return resp({ ok: true, owner_user_id: user.id });
  } catch (e) {
    return resp({ error: String(e) }, 500);
  }
});

function resp(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
