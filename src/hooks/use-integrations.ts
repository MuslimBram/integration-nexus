import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { integrations as defaultIntegrations } from "@/data/integrations";
import { useToast } from "@/hooks/use-toast";

export type DbIntegration = Tables<"integrations">;

export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return defaultIntegrations.map(i => ({ ...i, user_id: "", id: i.id } as any));

      const { data, error } = await supabase.from("integrations").select("*").eq("user_id", user.id);
      if (error) throw error;

      // If user has no integrations yet, seed them
      if (!data || data.length === 0) {
        const toInsert: TablesInsert<"integrations">[] = defaultIntegrations.map(i => ({
          user_id: user.id,
          provider_id: i.id,
          name: i.name,
          category: i.category,
          status: "disconnected" as const,
          supports_oauth: i.supportsOAuth,
          icon: i.icon,
          description: i.description,
          fields: i.fields,
        }));
        const { data: seeded, error: seedError } = await supabase
          .from("integrations")
          .insert(toInsert)
          .select();
        if (seedError) throw seedError;
        return seeded;
      }
      return data;
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DbIntegration> }) => {
      const { data, error } = await supabase
        .from("integrations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });
}

export function useSaveApiKey() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, apiKey, config }: { id: string; apiKey: string; config?: Record<string, string> }) => {
      const { data, error } = await supabase
        .from("integrations")
        .update({
          api_key_encrypted: apiKey,
          config: config || {},
          status: "connected",
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Sukses", description: "API key u ruajt dhe integrimi u lidh." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase.functions.invoke("oauth-handler", {
        body: { integration_id: integrationId },
        headers: {},
      });
      // Also handle as query param approach
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("oauth_connections").delete()
          .eq("integration_id", integrationId).eq("user_id", user.id);
        await supabase.from("integrations").update({
          status: "disconnected" as const,
          api_key_encrypted: null,
          config: {},
        }).eq("id", integrationId).eq("user_id", user.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Disconnected", description: "Integrimi u shkëput." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });
}

export function useOAuthConnect() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ provider, integrationId }: { provider: string; integrationId: string }) => {
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const { data, error } = await supabase.functions.invoke("oauth-handler?action=get-auth-url", {
        body: { provider, integration_id: integrationId, redirect_uri: redirectUri },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
      return data;
    },
    onError: (error) => {
      toast({
        title: "OAuth Error",
        description: `Nuk u arrit të fillojë OAuth: ${error}. Sigurohuni që OAuth credentials janë konfiguruar.`,
        variant: "destructive",
      });
    },
  });
}
