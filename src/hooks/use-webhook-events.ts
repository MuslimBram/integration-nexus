import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useWebhookEvents() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("webhook-events-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "webhook_events" }, () => {
        qc.invalidateQueries({ queryKey: ["webhook-events"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ["webhook-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}
