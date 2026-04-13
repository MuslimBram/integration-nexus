import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = req.method === "POST" ? await req.json() : null;

    // Get n8n config
    const { data: config } = await supabaseClient
      .from("n8n_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    switch (action) {
      case "save-config": {
        const { base_url, api_key, webhook_secret } = body;
        const { data, error } = await supabaseClient
          .from("n8n_config")
          .upsert({
            user_id: user.id,
            base_url,
            api_key_encrypted: api_key,
            webhook_secret: webhook_secret || null,
            is_connected: false,
          }, { onConflict: "user_id" })
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ success: true, config: data });
      }

      case "test-connection": {
        if (!config) {
          return jsonResponse({ success: false, error: "No n8n config found" }, 400);
        }
        try {
          const res = await fetch(`${config.base_url}/api/v1/workflows`, {
            headers: { "X-N8N-API-KEY": config.api_key_encrypted! },
          });
          const connected = res.ok;
          await supabaseClient
            .from("n8n_config")
            .update({ is_connected: connected })
            .eq("user_id", user.id);
          return jsonResponse({ success: connected, status: res.status });
        } catch (e) {
          return jsonResponse({ success: false, error: String(e) });
        }
      }

      case "sync-workflows": {
        if (!config?.is_connected) {
          return jsonResponse({ success: false, error: "Not connected to n8n" }, 400);
        }
        const res = await fetch(`${config.base_url}/api/v1/workflows`, {
          headers: { "X-N8N-API-KEY": config.api_key_encrypted! },
        });
        if (!res.ok) throw new Error(`n8n API error: ${res.status}`);
        const { data: workflows } = await res.json();

        for (const wf of workflows) {
          await supabaseClient.from("n8n_workflows").upsert({
            user_id: user.id,
            n8n_workflow_id: String(wf.id),
            name: wf.name,
            active: wf.active,
            status: wf.active ? "active" : "idle",
          }, { onConflict: "user_id,n8n_workflow_id" });
        }

        await supabaseClient
          .from("n8n_config")
          .update({ last_sync: new Date().toISOString() })
          .eq("user_id", user.id);

        return jsonResponse({ success: true, count: workflows.length });
      }

      case "toggle-workflow": {
        const { workflow_id, active } = body;
        if (!config?.is_connected) {
          return jsonResponse({ success: false, error: "Not connected" }, 400);
        }

        const { data: wf } = await supabaseClient
          .from("n8n_workflows")
          .select("n8n_workflow_id")
          .eq("id", workflow_id)
          .eq("user_id", user.id)
          .single();

        if (!wf) return jsonResponse({ success: false, error: "Workflow not found" }, 404);

        const endpoint = active ? "activate" : "deactivate";
        await fetch(`${config.base_url}/api/v1/workflows/${wf.n8n_workflow_id}/${endpoint}`, {
          method: "POST",
          headers: { "X-N8N-API-KEY": config.api_key_encrypted! },
        });

        await supabaseClient
          .from("n8n_workflows")
          .update({ active, status: active ? "active" : "idle" })
          .eq("id", workflow_id);

        return jsonResponse({ success: true });
      }

      case "trigger-workflow": {
        const { workflow_id } = body;
        if (!config?.is_connected) {
          return jsonResponse({ success: false, error: "Not connected" }, 400);
        }

        const { data: wf } = await supabaseClient
          .from("n8n_workflows")
          .select("n8n_workflow_id")
          .eq("id", workflow_id)
          .eq("user_id", user.id)
          .single();

        if (!wf) return jsonResponse({ success: false, error: "Workflow not found" }, 404);

        const res = await fetch(`${config.base_url}/api/v1/workflows/${wf.n8n_workflow_id}/run`, {
          method: "POST",
          headers: {
            "X-N8N-API-KEY": config.api_key_encrypted!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        const result = await res.json();

        await supabaseClient
          .from("n8n_workflows")
          .update({
            last_run: new Date().toISOString(),
            status: res.ok ? "success" : "error",
          })
          .eq("id", workflow_id);

        return jsonResponse({ success: res.ok, result });
      }

      case "get-config": {
        return jsonResponse({ config });
      }

      case "get-workflows": {
        const { data: workflows } = await supabaseClient
          .from("n8n_workflows")
          .select("*")
          .eq("user_id", user.id)
          .order("name");
        return jsonResponse({ workflows: workflows || [] });
      }

      case "update-mapping": {
        const { workflow_id, event_type, business_id, channel_id, provider } = body;
        const { error } = await supabaseClient
          .from("n8n_workflows")
          .update({ event_type, business_id, channel_id, provider })
          .eq("id", workflow_id)
          .eq("user_id", user.id);
        if (error) throw error;
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (error) {
    console.error("n8n-proxy error:", error);
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
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Content-Type": "application/json",
    },
  });
}
