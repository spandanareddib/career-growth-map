import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import { canonicalSkill, skillKey } from "./skills";
import { marketGrowth, type MarketObservation } from "./learning";
import { resumeProfileSchema, gapAnalysisSchema } from "./schemas";

export const learnedOptions = queryOptions({ queryKey: ["learned-skills"], queryFn: async () => {
  const { data, error } = await supabase.from("learned_skills").select("skill, learned_at");
  if (error) throw error;
  return data;
} });

export const workforceOptions = queryOptions({ queryKey: ["workforce"], queryFn: async () => {
  const [snapshots, jobs, analyses] = await Promise.all([
    supabase.from("workforce_snapshots").select("id, resume_id, profile, created_at, updated_at").order("created_at", { ascending: false }),
    supabase.from("jobs").select("id, title, description, company, is_public, created_at"),
    supabase.from("analyses").select("id, job_id, result").eq("status", "done"),
  ]);
  for (const response of [snapshots, jobs, analyses]) if (response.error) throw response.error;
  return { snapshots: snapshots.data ?? [], jobs: jobs.data ?? [], analyses: analyses.data ?? [] };
} });

export type GraphNode = { id: string; label: string; kind: "skill" | "job" | "trend" | "project" | "certification" | "course"; evidence: string[]; learned?: boolean; url?: string };
export type GraphEdge = { from: string; to: string; label: string };

export function buildWorkforceGraph(data: { snapshots: { profile: unknown }[]; jobs: { id: string; title: string; description: string }[]; analyses: { job_id: string; result: unknown }[] }, learned: string[], activities: { id:string;skill:string;kind:string;title:string;status:string;evidence_url:string|null }[] = [], market:MarketObservation[] = []) {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const edge = (from: string, to: string, label: string) => { if (!edges.some(e => e.from === from && e.to === to && e.label === label)) edges.push({ from, to, label }); };
  const skill = (name: string, evidence?: string) => {
    const id = `skill:${skillKey(name)}`;
    const node = nodes.get(id) ?? { id, label: canonicalSkill(name), kind: "skill" as const, evidence: [] };
    if (evidence && !node.evidence.includes(evidence)) node.evidence.push(evidence);
    nodes.set(id, node);
    return id;
  };
  for (const snapshot of data.snapshots) {
    const profile = resumeProfileSchema.safeParse(snapshot.profile);
    if (!profile.success) continue;
    for (const s of profile.data.skills) skill(s.name, s.evidence);
    for (const role of profile.data.experience) {
      const id = `role:${role.title.toLowerCase()}`;
      nodes.set(id, { id, label: role.title, kind: "job", evidence: [`${role.company} · ${role.duration}`] });
      // Only link competencies explicitly named in a highlight, never infer them from a title.
      for (const s of profile.data.skills) if (role.highlights.some(h => h.toLowerCase().includes(s.name.toLowerCase()))) edge(skill(s.name), id, "experience");
    }
  }
  for (const name of learned) { const id = skill(name, "Marked learned by you"); const n = nodes.get(id); if (n) n.learned = true; }
  for (const job of data.jobs) nodes.set(`job:${job.id}`, { id: `job:${job.id}`, label: job.title, kind: "job", evidence: [job.description] });
  for (const analysis of data.analyses) {
    const parsed = gapAnalysisSchema.safeParse(analysis.result);
    if (!parsed.success || !nodes.has(`job:${analysis.job_id}`)) continue;
    for (const r of parsed.data.requirements) edge(skill(r.skill), `job:${analysis.job_id}`, `requires · ${r.status}`);
    for (const step of parsed.data.learning_path) for (const base of step.builds_on) edge(skill(base), skill(step.skill), "builds toward");
  }
  for (const activity of activities) {
    if(activity.kind !== 'project' && activity.kind !== 'certification' && activity.kind !== 'course') continue;
    const id=`activity:${activity.id}`;
    nodes.set(id,{id,label:activity.title,kind:activity.kind,evidence:[`${activity.status} · self-reported, not independently verified`],learned:activity.status==='completed',...(activity.evidence_url?{url:activity.evidence_url}:{})});
    edge(skill(activity.skill),id,`${activity.kind} · ${activity.status}`);
  }
  for (const current of market) {
    const previous=market.find(p=>p!==current&&p.period_end<current.period_start&&marketGrowth(current,p));
    if(!previous)continue;
    const growth=marketGrowth(current,previous);if(!growth)continue;
    const id=`trend:${skillKey(current.skill)}`;if(nodes.has(id))continue;
    nodes.set(id,{id,label:`${current.skill} · ${growth.percent.toFixed(1)}%`,kind:'trend',url:current.source_url,evidence:[`${current.geography} · ${current.source}`,`${previous.period_start}–${previous.period_end}: ${previous.postings} of ${previous.total_postings} postings`,`${current.period_start}–${current.period_end}: ${current.postings} of ${current.total_postings} postings`,`Posting share change: ${growth.shareChange.toFixed(2)} percentage points`,`Updated ${current.observed_at}`]});
    edge(skill(current.skill),id,'observed posting change');
  }
  return { nodes: [...nodes.values()], edges };
}