import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type N8nConfig = Tables<"n8n_config">;
export type N8nWorkflow = Tables<"n8n_workflows">;

export function useN8nConfig() {
  return useQuery({
    queryKey: ["n8n-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("n8n_config").select("*").eq("user_id", user.id).single();
      return data;
    },
  });
}

export function useN8nWorkflows() {
  return useQuery({
    queryKey: ["n8n-workflows"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("n8n_workflows").select("*").eq("user_id", user.id).order("name");
      return data || [];
    },
  });
}

export function useSaveN8nConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: { base_url: string; api_key: string; webhook_secret?: string }) => {
      // Save config without plaintext keys first
      const { data, error } = await supabase.functions.invoke("n8n-proxy?action=save-config", {
        body: { base_url: config.base_url, api_key: "__encrypted__", webhook_secret: config.webhook_secret },
      });
      if (error) throw error;

      // Encrypt the API key via encrypt-secret function
      if (config.api_key && data?.config?.id) {
        const { error: encError } = await supabase.functions.invoke("encrypt-secret?action=encrypt-and-save", {
          body: { table: "n8n_config", id: data.config.id, field: "api_key_encrypted", value: config.api_key },
        });
        if (encError) throw encError;
      }

      // Encrypt webhook secret if provided
      if (config.webhook_secret && data?.config?.id) {
        const { error: encError } = await supabase.functions.invoke("encrypt-secret?action=encrypt-and-save", {
          body: { table: "n8n_config", id: data.config.id, field: "webhook_secret", value: config.webhook_secret },
        });
        if (encError) throw encError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["n8n-config"] });
      toast({ title: "Ruajtur", description: "Konfigurimi n8n u ruajt me enkriptim." });
    },
    onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
  });
}

export function useTestN8nConnection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("n8n-proxy?action=test-connection");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["n8n-config"] });
      toast({
        title: data.success ? "Sukses" : "Dështoi",
        description: data.success ? "Lidhja me n8n u konfirmua!" : "Nuk u arrit lidhja.",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
  });
}

export function useSyncN8nWorkflows() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("n8n-proxy?action=sync-workflows");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["n8n-workflows"] });
      toast({ title: "Sinkronizuar", description: `${data.count} workflows u sinkronizuan.` });
    },
    onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
  });
}

export function useToggleN8nWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workflow_id, active }: { workflow_id: string; active: boolean }) => {
      const { data, error } = await supabase.functions.invoke("n8n-proxy?action=toggle-workflow", {
        body: { workflow_id, active },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["n8n-workflows"] });
    },
  });
}

export function useTriggerN8nWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (workflow_id: string) => {
      const { data, error } = await supabase.functions.invoke("n8n-proxy?action=trigger-workflow", {
        body: { workflow_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["n8n-workflows"] });
      toast({ title: "Triggered", description: "Workflow u ekzekutua." });
    },
    onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
  });
}

export function useUpdateWorkflowMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (body: {
      workflow_id: string;
      event_type?: string;
      business_id?: string;
      channel_id?: string;
      provider?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("n8n-proxy?action=update-mapping", {
        body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["n8n-workflows"] });
      toast({ title: "Përditësuar", description: "Mapping u përditësua." });
    },
    onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
  });
}
