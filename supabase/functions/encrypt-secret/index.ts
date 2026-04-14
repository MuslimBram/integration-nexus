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
    const body = await req.json();

    const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "encrypt-and-save") {
      const { table, id, field, value } = body;

      // Validate allowed tables and fields
      const allowedTargets: Record<string, string[]> = {
        integrations: ["api_key_encrypted"],
        n8n_config: ["api_key_encrypted", "webhook_secret"],
      };

      if (!allowedTargets[table]?.includes(field)) {
        return jsonResponse({ error: "Invalid target" }, 400);
      }

      // Encrypt using pgcrypto via SQL function
      const { data: encrypted, error: encErr } = await adminClient.rpc("encrypt_secret", {
        plain_text: value,
        encryption_key: ENCRYPTION_KEY,
      });

      if (encErr) throw encErr;

      const { error: updateErr } = await adminClient
        .from(table)
        .update({ [field]: encrypted })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateErr) throw updateErr;

      return jsonResponse({ success: true });
    }

    if (action === "decrypt") {
      const { table, id, field } = body;

      const allowedTargets: Record<string, string[]> = {
        integrations: ["api_key_encrypted"],
        n8n_config: ["api_key_encrypted", "webhook_secret"],
      };

      if (!allowedTargets[table]?.includes(field)) {
        return jsonResponse({ error: "Invalid target" }, 400);
      }

      // Fetch encrypted value
      const { data: row, error: fetchErr } = await adminClient
        .from(table)
        .select(field)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchErr || !row) {
        return jsonResponse({ error: "Not found" }, 404);
      }

      const encryptedValue = (row as any)[field];
      if (!encryptedValue) {
        return jsonResponse({ value: null });
      }

      const { data: decrypted, error: decErr } = await adminClient.rpc("decrypt_secret", {
        encrypted_text: encryptedValue,
        encryption_key: ENCRYPTION_KEY,
      });

      if (decErr) {
        return jsonResponse({ value: null, error: "Decryption failed" });
      }

      return jsonResponse({ value: decrypted });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("encrypt-secret error:", error);
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
