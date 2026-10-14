import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "job_seeker" | "recruiter";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      supabase.from("profiles").select("full_name").eq("id", u.user.id).maybeSingle(),
    ]);
    const role: Role = roles?.some((r) => r.role === "recruiter") ? "recruiter" : "job_seeker";
    return { id: u.user.id, email: u.user.email ?? "", name: profile?.full_name ?? null, role };
  },
});

export const useMe = () => useQuery(meQuery);
