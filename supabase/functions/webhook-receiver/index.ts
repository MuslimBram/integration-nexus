import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { event_type, source, payload, user_id } = body;

    if (!event_type || !user_id) {
      return jsonResponse({ error: "event_type and user_id are required" }, 400);
    }

    // Verify webhook secret if provided
    const webhookSecret = req.headers.get("x-webhook-secret");
    if (webhookSecret) {
      const { data: config } = await adminClient
        .from("n8n_config")
        .select("webhook_secret")
        .eq("user_id", user_id)
        .single();
      if (config?.webhook_secret && config.webhook_secret !== webhookSecret) {
        return jsonResponse({ error: "Invalid webhook secret" }, 403);
      }
    }

    // Find matching workflow
    const { data: workflow } = await adminClient
      .from("n8n_workflows")
      .select("*, n8n_config:n8n_config!inner(*)")
      .eq("user_id", user_id)
      .eq("event_type", event_type)
      .eq("active", true)
      .single();

    // Log the event
    const { data: event } = await adminClient.from("webhook_events").insert({
      user_id,
      event_type,
      source: source || "external",
      payload,
      workflow_id: workflow?.id || null,
      status: workflow ? "processing" : "no_workflow",
    }).select().single();

    // Trigger n8n workflow if found
    if (workflow) {
      const { data: n8nConfig } = await adminClient
        .from("n8n_config")
        .select("*")
        .eq("user_id", user_id)
        .single();

      if (n8nConfig?.is_connected && n8nConfig.api_key_encrypted) {
        try {
          // Decrypt API key
          const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          let apiKey = n8nConfig.api_key_encrypted;
          try {
            const { data: decrypted } = await adminClient.rpc("decrypt_secret", {
              encrypted_text: n8nConfig.api_key_encrypted,
              encryption_key: ENCRYPTION_KEY,
            });
            if (decrypted) apiKey = decrypted;
          } catch { /* fallback to raw value */ }

          const res = await fetch(
            `${n8nConfig.base_url}/api/v1/workflows/${workflow.n8n_workflow_id}/run`,
            {
              method: "POST",
              headers: {
                "X-N8N-API-KEY": apiKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ data: payload }),
            }
          );

          const status = res.ok ? "completed" : "error";
          await adminClient.from("webhook_events")
            .update({ status, processed_at: new Date().toISOString() })
            .eq("id", event!.id);

          await adminClient.from("n8n_workflows")
            .update({ last_run: new Date().toISOString(), status: res.ok ? "success" : "error" })
            .eq("id", workflow.id);
        } catch (e) {
          await adminClient.from("webhook_events")
            .update({ status: "error", processed_at: new Date().toISOString() })
            .eq("id", event!.id);
        }
      }
    }

    return jsonResponse({ success: true, event_id: event?.id, workflow_triggered: !!workflow });
  } catch (error) {
    console.error("webhook-receiver error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
      "Content-Type": "application/json",
    },
  });
}
