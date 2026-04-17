import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useConversations() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("conversations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      return data ?? [];
    },
  });
}

export function useMessages(conversationId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, qc]);

  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!conversationId,
  });
}

export function useSendTelegramMessage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ conversation_id, text }: { conversation_id: string; text: string }) => {
      const { data, error } = await supabase.functions.invoke("telegram-send", {
        body: { conversation_id, text },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversation_id] });
    },
    onError: (e) => toast({ title: "Dështoi", description: String(e), variant: "destructive" }),
  });
}

export function useClaimTelegramBot() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("telegram-claim");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["telegram-owner"] });
      toast({ title: "Ti je tani pronari i bot-it Telegram", description: "Mesazhet hyrëse do të vijnë te ti." });
    },
    onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
  });
}

export function useTelegramOwner() {
  return useQuery({
    queryKey: ["telegram-owner"],
    queryFn: async () => {
      const { data } = await supabase.from("telegram_bot_owner").select("*").eq("id", 1).single();
      return data;
    },
  });
}

export function useLeads() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        qc.invalidateQueries({ queryKey: ["leads"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

export function useChannelSettings(channel: string) {
  return useQuery({
    queryKey: ["channel-settings", channel],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("channel_settings")
        .select("*")
        .eq("user_id", user.id)
        .eq("channel", channel)
        .maybeSingle();
      return data;
    },
  });
}

export function useUpdateChannelSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (patch: { channel: string; ai_auto_reply?: boolean; system_prompt?: string; enabled?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("channel_settings")
        .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id,channel" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["channel-settings", vars.channel] });
      toast({ title: "Ruajtur" });
    },
    onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
  });
}
