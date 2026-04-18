import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useTwilioConfig() {
  return useQuery({
    queryKey: ["twilio-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("twilio_config")
        .select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
  });
}

export function useSaveTwilioConfig() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (patch: {
      sms_from_number?: string | null;
      whatsapp_from_number?: string | null;
      webhook_secret?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate a secret if not provided and none exists
      let webhook_secret = patch.webhook_secret;
      const { data: existing } = await supabase.from("twilio_config")
        .select("*").eq("user_id", user.id).maybeSingle();
      if (!webhook_secret) {
        webhook_secret = existing?.webhook_secret ?? crypto.randomUUID().replace(/-/g, "");
      }

      const { data, error } = await supabase.from("twilio_config")
        .upsert({ user_id: user.id, ...patch, webhook_secret }, { onConflict: "user_id" })
        .select().single();
      if (error) throw error;

      // Refresh routing rows
      await supabase.from("twilio_number_routing").delete().eq("user_id", user.id);
      const rows = [];
      if (data.sms_from_number) rows.push({ phone_number: data.sms_from_number, user_id: user.id, channel: "sms" });
      if (data.whatsapp_from_number) rows.push({ phone_number: data.whatsapp_from_number, user_id: user.id, channel: "whatsapp" });
      if (rows.length) await supabase.from("twilio_number_routing").insert(rows);

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["twilio-config"] });
      toast({ title: "Ruajtur", description: "Konfigurimi Twilio u ruajt." });
    },
    onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
  });
}

export function useSendTwilioMessage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (vars: { conversation_id: string; text: string; channel: "sms" | "whatsapp" }) => {
      const { data, error } = await supabase.functions.invoke("twilio-send", { body: vars });
      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["messages", v.conversation_id] }),
    onError: (e) => toast({ title: "Dështoi", description: String(e), variant: "destructive" }),
  });
}
