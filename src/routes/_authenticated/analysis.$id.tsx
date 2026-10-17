import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Minus, X, Send, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/app";
import type { GapAnalysis } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { LearningCompletion } from "@/components/LearningCompletion";
import { learnedOptions } from "@/lib/workforce";
import { learningProgress, skillKey } from "@/lib/skills";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({
    meta: [
      { title: "Skill gap analysis — SkillPath" },
      { name: "description", content: "Matched, partial and missing skills with an ordered learning path." },
      { property: "og:title", content: "Skill gap analysis — SkillPath" },
      { property: "og:description", content: "Matched, partial and missing skills with an ordered learning path." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisPage,
});

const STATUS = {
  matched: { icon: Check, cls: "bg-success", label: "Have it" },
  partial: { icon: Minus, cls: "bg-warning", label: "Partly" },
  missing: { icon: X, cls: "bg-danger-soft", label: "Missing" },
};

function AnalysisPage() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const learned = useQuery({ ...learnedOptions, enabled: !!me });
  const q = useQuery({
    queryKey: ["analyses", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("*, jobs(title, company, is_public, owner_id)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: (query) => (query.state.data?.status === "running" ? 3000 : false),
  });
  const a = q.data;
  const r = a?.result as unknown as GapAnalysis | null;
  const isOwner = a && me && a.user_id === me.id;

  async function apply() {
    const { error } = await supabase.from("analyses").update({ applied: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Shared with the recruiter");
    qc.invalidateQueries({ queryKey: ["analyses", id] });
  }

  const learnedNames = isOwner ? (learned.data ?? []).map(s => s.skill) : [];
  const progress = learningProgress(r?.learning_path ?? [], learnedNames);
  const totalWeeks = progress.remainingWeeks;

  return (
    <div className="min-h-screen dot-grid">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold"><ArrowLeft className="size-4" /> Dashboard</Link>
        {!a ? (
          <div className="brut bg-card p-6">{q.isError ? "This analysis isn't available." : "Loading…"}</div>
        ) : (
          <div className="space-y-6">
            <div className="brut flex flex-col gap-4 bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <StatusPill status={a.status} />
                <h1 className="mt-2 text-3xl font-extrabold">{a.jobs?.title}</h1>
                <p className="text-muted-foreground">{a.jobs?.company}{!isOwner && a.candidate_name ? ` · ${a.candidate_name}` : ""}</p>
                {r && <p className="mt-3 max-w-xl text-sm">{r.verdict}</p>}
                {a.error && <p className="mt-3 text-sm text-destructive">{a.error}</p>}
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="brut flex size-28 flex-col items-center justify-center rounded-full bg-primary">
                  <span className="font-display text-4xl font-extrabold">{a.score ?? "–"}</span>
                  <span className="font-mono text-[10px]">% match</span>
                </div>
                {isOwner && a.status === "done" && a.jobs?.is_public && a.jobs.owner_id !== me?.id && (
                  a.applied ? <span className="font-mono text-xs">✓ Shared with recruiter</span> :
                  <Button size="sm" variant="accent" onClick={apply}><Send /> Apply & share</Button>
                )}
              </div>
            </div>

            {a.status === "running" && (
              <div className="brut bg-card p-6 text-sm">Comparing your skills with the job… this usually takes under a minute.</div>
            )}

            {r && (
              <>
                {r.strengths.length > 0 && (
                  <div className="brut bg-success p-5">
                    <h2 className="font-bold">Your strengths for this role</h2>
                    <ul className="mt-2 list-inside list-disc text-sm">{r.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
                  </div>
                )}

                <section className="brut bg-card p-5">
                  <h2 className="mb-4 text-lg font-bold">Skill gap breakdown</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {r.requirements.map((req) => {
                      const s = STATUS[req.status];
                      return (
                        <div key={req.skill} className="brut-sm flex gap-3 bg-background p-3">
                          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-foreground", s.cls)}><s.icon className="size-4" /></span>
                          <div className="min-w-0 text-sm">
                            <div className="flex flex-wrap items-center gap-2 font-semibold">
                              {req.skill}
                              <span className="font-mono text-[10px] text-muted-foreground">{req.importance === "must_have" ? "MUST" : "NICE"}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{req.note}</div>
                            {req.resume_evidence && <div className="mt-1 text-xs italic">“{req.resume_evidence}”</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="brut bg-card p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Your learning path</h2>
                    <span className="font-mono text-xs">{isOwner ? `${progress.completed}/${r.learning_path.length} completed · ` : `${r.learning_path.length} steps · `}~{totalWeeks} weeks{isOwner ? " remaining" : ""}</span>
                  </div>
                  {isOwner && learned.isError && <p className="mb-3 text-sm text-destructive">Learning progress could not be loaded.</p>}
                  {isOwner && r.learning_path.length > 0 && <progress aria-label="Learning progress" value={progress.completed} max={r.learning_path.length} className="mb-5 h-2 w-full accent-primary" />}
                  {r.learning_path.length === 0 ? (
                    <p className="text-sm">No gaps — you cover everything this job asks for.</p>
                  ) : (
                    <ol className="relative space-y-5 border-l-2 border-dashed border-foreground pl-8">
                      {r.learning_path.map((step, i) => (
                        <li key={step.skill} className="relative">
                          <span className="brut-sm absolute -left-[2.85rem] flex size-9 items-center justify-center rounded-full bg-accent font-display font-extrabold">{i + 1}</span>
                          <div className={cn("brut-sm p-4", learnedNames.some(s => skillKey(s) === skillKey(step.skill)) ? "bg-success" : "bg-background")}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-base font-bold">{step.skill}</h3>
                              <span className="rounded-full border-2 border-foreground bg-info px-2 font-mono text-[11px]">~{step.estimated_weeks} wk</span>
                            </div>
                            <p className="mt-1 text-sm">{step.why_now}</p>
                            {step.builds_on.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                                <span className="font-mono text-muted-foreground">builds on:</span>
                                {step.builds_on.map((b) => <span key={b} className="rounded border border-foreground bg-secondary px-1.5">{b}</span>)}
                              </div>
                            )}
                            <div className="mt-3 rounded-md border-2 border-dashed border-foreground/40 p-2 text-sm">
                              <span className="font-mono text-[11px]">PROJECT →</span> {step.milestone_project}
                            </div>
                            <ul className="mt-2 space-y-0.5 text-xs">
                              {step.resources.map((res) => (
                                <li key={res.title} className="flex items-center gap-1"><BookOpen className="size-3" /> {res.title} <span className="text-muted-foreground">({res.kind})</span></li>
                              ))}
                            </ul>
                            {isOwner && me && <LearningCompletion skill={step.skill} userId={me.id} />}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
