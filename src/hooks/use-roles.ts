import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AppRole = "super_admin" | "admin" | "business_owner" | "freelancer" | "ambassador" | "manager";

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_by: string | null;
  created_at: string;
}

export function useUserRole() {
  return useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      if (!data || data.length === 0) return { role: "business_owner" as AppRole, roles: [] as UserRole[] };

      // Return highest priority role
      const roleOrder: AppRole[] = ["super_admin", "admin", "business_owner", "manager", "freelancer", "ambassador"];
      const sorted = data.sort((a, b) => {
        const ai = roleOrder.indexOf(a.role as AppRole);
        const bi = roleOrder.indexOf(b.role as AppRole);
        return ai - bi;
      });

      return {
        role: sorted[0].role as AppRole,
        roles: data as UserRole[],
      };
    },
  });
}

export function useIsAdmin() {
  const { data } = useUserRole();
  return data?.role === "super_admin" || data?.role === "admin";
}

export function useCanManageIntegrations() {
  const { data } = useUserRole();
  if (!data) return false;
  return ["super_admin", "admin", "business_owner", "manager"].includes(data.role);
}

export function useCanViewOnly() {
  const { data } = useUserRole();
  if (!data) return true;
  return ["freelancer", "ambassador"].includes(data.role);
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-role"] });
      toast({ title: "Sukses", description: "Roli u caktua." });
    },
    onError: (e) => toast({ title: "Gabim", description: String(e), variant: "destructive" }),
  });
}
