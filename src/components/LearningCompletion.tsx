import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { learnedOptions } from "@/lib/workforce";
import { canonicalSkill, skillKey } from "@/lib/skills";

export function LearningCompletion({ skill, userId }: { skill: string; userId: string }) {
  const qc = useQueryClient();
  const q = useQuery(learnedOptions);
  const learned = q.data?.some(s => skillKey(s.skill) === skillKey(skill)) ?? false;
  const change = useMutation({ mutationFn: async (checked: boolean) => {
    const response = checked
      ? await supabase.from("learned_skills").upsert({ user_id: userId, skill: canonicalSkill(skill) })
      : await supabase.from("learned_skills").delete().eq("user_id", userId).eq("skill", canonicalSkill(skill));
    if (response.error) throw response.error;
  }, onSuccess: async () => { await Promise.all([qc.invalidateQueries({ queryKey: ["learned-skills"] }), qc.invalidateQueries({ queryKey: ["workforce"] })]); }, onError: (e) => toast.error(e.message) });
  return <label className="mt-3 inline-flex items-center gap-2 text-sm font-semibold"><Checkbox aria-label={`Mark ${skill} learned`} checked={learned} disabled={change.isPending || q.isPending || q.isError} onCheckedChange={v => change.mutate(v === true)} />{change.isPending ? "Saving…" : learned ? "Completed · learned" : "Mark as learned"}</label>;
}