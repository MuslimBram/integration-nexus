import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OAuth provider configs
const OAUTH_PROVIDERS: Record<string, {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
}> = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "email", "profile"],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["repo", "user"],
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
  },
  facebook: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: ["pages_manage_posts", "pages_read_engagement"],
    clientIdEnv: "FACEBOOK_APP_ID",
    clientSecretEnv: "FACEBOOK_APP_SECRET",
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["user.info.basic"],
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
  },
  airtable: {
    authUrl: "https://airtable.com/oauth2/v1/authorize",
    tokenUrl: "https://airtable.com/oauth2/v1/token",
    scopes: ["data.records:read", "data.records:write", "schema.bases:read"],
    clientIdEnv: "AIRTABLE_CLIENT_ID",
    clientSecretEnv: "AIRTABLE_CLIENT_SECRET",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    switch (action) {
      case "get-auth-url": {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return unauthorized();

        const body = await req.json();
        const { provider, integration_id, redirect_uri } = body;
        const config = OAUTH_PROVIDERS[provider];
        if (!config) return jsonResponse({ error: "Unsupported provider" }, 400);

        const clientId = Deno.env.get(config.clientIdEnv);
        if (!clientId) return jsonResponse({ error: `${config.clientIdEnv} not configured` }, 400);

        const state = btoa(JSON.stringify({ user_id: user.id, integration_id, provider }));

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri,
          response_type: "code",
          scope: config.scopes.join(" "),
          state,
          access_type: "offline",
          prompt: "consent",
        });

        return jsonResponse({ url: `${config.authUrl}?${params.toString()}` });
      }

      case "callback": {
        const body = await req.json();
        const { code, state, redirect_uri } = body;

        const stateData = JSON.parse(atob(state));
        const { user_id, integration_id, provider } = stateData;
        const config = OAUTH_PROVIDERS[provider];
        if (!config) return jsonResponse({ error: "Unsupported provider" }, 400);

        const clientId = Deno.env.get(config.clientIdEnv);
        const clientSecret = Deno.env.get(config.clientSecretEnv);
        if (!clientId || !clientSecret) {
          return jsonResponse({ error: "OAuth credentials not configured" }, 400);
        }

        // Token exchange
        const tokenParams = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri,
          grant_type: "authorization_code",
        });

        const tokenRes = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
          body: tokenParams.toString(),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
          return jsonResponse({ error: "Token exchange failed", details: tokenData }, 400);
        }

        // Use service role to save tokens
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const tokenExpiry = tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null;

        await adminClient.from("oauth_connections").upsert({
          user_id,
          integration_id,
          provider,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expiry: tokenExpiry,
          scopes: config.scopes,
        });

        await adminClient.from("integrations")
          .update({ status: "connected" })
          .eq("id", integration_id)
          .eq("user_id", user_id);

        return jsonResponse({ success: true });
      }

      case "refresh": {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return unauthorized();

        const body = await req.json();
        const { connection_id } = body;

        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const { data: conn } = await adminClient
          .from("oauth_connections")
          .select("*")
          .eq("id", connection_id)
          .eq("user_id", user.id)
          .single();

        if (!conn || !conn.refresh_token) {
          return jsonResponse({ error: "No refresh token available" }, 400);
        }

        const config = OAUTH_PROVIDERS[conn.provider];
        if (!config) return jsonResponse({ error: "Unsupported provider" }, 400);

        const clientId = Deno.env.get(config.clientIdEnv);
        const clientSecret = Deno.env.get(config.clientSecretEnv);

        const tokenRes = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId!,
            client_secret: clientSecret!,
            refresh_token: conn.refresh_token,
            grant_type: "refresh_token",
          }).toString(),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
          await adminClient.from("integrations")
            .update({ status: "error" })
            .eq("id", conn.integration_id);
          return jsonResponse({ error: "Refresh failed", details: tokenData }, 400);
        }

        await adminClient.from("oauth_connections").update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || conn.refresh_token,
          token_expiry: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
        }).eq("id", connection_id);

        return jsonResponse({ success: true });
      }

      case "disconnect": {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return unauthorized();

        const body = await req.json();
        const { integration_id } = body;

        await supabaseClient.from("oauth_connections")
          .delete()
          .eq("integration_id", integration_id)
          .eq("user_id", user.id);

        await supabaseClient.from("integrations")
          .update({ status: "disconnected", api_key_encrypted: null, config: {} })
          .eq("id", integration_id)
          .eq("user_id", user.id);

        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (error) {
    console.error("oauth-handler error:", error);
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

function unauthorized() {
  return jsonResponse({ error: "Unauthorized" }, 401);
}
