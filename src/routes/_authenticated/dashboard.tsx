import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Upload, Plus, Sparkles, Trash2, RotateCw, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { ParseProgress, StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMe } from "@/lib/app";
import { processResume, runAnalysis } from "@/lib/pipeline.functions";
import type { ResumeProfile } from "@/lib/schemas";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — WorkTwin AI" },
      { name: "description", content: "Track resume uploads, job matches and learning paths." },
      { property: "og:title", content: "Dashboard — WorkTwin AI" },
      { property: "og:description", content: "Track resume uploads, job matches and learning paths." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const ACCEPT = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
} as const;

function useLiveData(userId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("dash-" + userId)
      .on("postgres_changes", { event: "*", schema: "public", table: "resumes", filter: `user_id=eq.${userId}` }, () =>
        { qc.invalidateQueries({ queryKey: ["resumes"] }); qc.invalidateQueries({ queryKey: ["workforce"] }); },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "analyses" }, () =>
        qc.invalidateQueries({ queryKey: ["analyses"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, qc]);
}

function Dashboard() {
  const { data: me } = useMe();
  useLiveData(me?.id);
  return (
    <div className="min-h-screen dot-grid">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {!me ? null : me.role === "recruiter" ? <RecruiterView userId={me.id} /> : <SeekerView userId={me.id} />}
      </main>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="brut bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function useJobs(filter?: { ownerId: string }) {
  return useQuery({
    queryKey: ["jobs", filter?.ownerId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("jobs").select("*").order("created_at", { ascending: false });
      if (filter) q = q.eq("owner_id", filter.ownerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

function JobForm({ userId, recruiter, onDone }: { userId: string; recruiter: boolean; onDone: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [desc, setDesc] = useState("");
  const [pub, setPub] = useState(recruiter);
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (desc.trim().length < 50) { toast.error("Paste the full job description (at least 50 characters)."); return; }
    setBusy(true);
    const { error } = await supabase.from("jobs").insert({
      owner_id: userId,
      title: title.trim().slice(0, 150),
      company: company.trim().slice(0, 150) || null,
      description: desc.trim().slice(0, 20000),
      is_public: recruiter && pub,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["jobs"] });
    qc.invalidateQueries({ queryKey: ["workforce"] });
    onDone();
  }
  return (
    <form onSubmit={save} className="mb-4 space-y-3 rounded-md border-2 border-dashed border-foreground p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label>Job title</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} className="border-2" /></div>
        <div className="space-y-1"><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} className="border-2" /></div>
      </div>
      <div className="space-y-1"><Label>Job description</Label><Textarea required rows={6} value={desc} onChange={(e) => setDesc(e.target.value)} className="border-2" placeholder="Paste the full posting…" /></div>
      {recruiter && (
        <label className="flex items-center gap-2 text-sm"><Switch checked={pub} onCheckedChange={setPub} /> Visible to job seekers</label>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save job"}</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

function SeekerView({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showJob, setShowJob] = useState(false);
  const [resumeId, setResumeId] = useState<string>("");
  const [running, setRunning] = useState<string | null>(null);
  const process = useServerFn(processResume);
  const analyze = useServerFn(runAnalysis);

  const resumes = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resumes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const jobs = useJobs();
  const analyses = useQuery({
    queryKey: ["analyses", "mine"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, status, score, created_at, job_id, resume_id, error, jobs(title, company)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const ready = (resumes.data ?? []).filter((r) => r.status === "done");
  const activeResume = resumeId || ready[0]?.id || "";

  function startParse(id: string) {
    process({ data: { resumeId: id } })
      .then((r) => (r.ok ? toast.success("Resume parsed") : toast.error(r.error)))
      .catch((e) => toast.error(e.message))
      .finally(() => { qc.invalidateQueries({ queryKey: ["resumes"] }); qc.invalidateQueries({ queryKey: ["workforce"] }); });
  }

  async function upload(file: File) {
    if (!(file.type in ACCEPT)) { toast.error("Please upload a PDF or DOCX file."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max file size is 10 MB."); return; }
    setUploading(true);
    try {
      const path = `${userId}/${crypto.randomUUID()}.${ACCEPT[file.type as keyof typeof ACCEPT]}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data, error } = await supabase
        .from("resumes")
        .insert({ user_id: userId, file_name: file.name.slice(0, 200), file_path: path, mime_type: file.type })
        .select("id")
        .single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["resumes"] });
      startParse(data.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeResume(id: string, path: string) {
    await supabase.storage.from("resumes").remove([path]);
    await supabase.from("resumes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["resumes"] });
    qc.invalidateQueries({ queryKey: ["analyses"] });
    qc.invalidateQueries({ queryKey: ["workforce"] });
  }

  async function compare(jobId: string) {
    if (!activeResume) { toast.error("Upload a resume and wait until it's ready."); return; }
    setRunning(jobId);
    try {
      await analyze({ data: { resumeId: activeResume, jobId } });
      qc.invalidateQueries({ queryKey: ["analyses"] });
      qc.invalidateQueries({ queryKey: ["workforce"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setRunning(null);
    }
  }

  const stats = [
    { label: "Resumes", value: resumes.data?.length ?? 0, tone: "bg-warning" },
    { label: "Jobs tracked", value: jobs.data?.length ?? 0, tone: "bg-info" },
    { label: "Analyses", value: analyses.data?.length ?? 0, tone: "bg-success" },
    {
      label: "Best match",
      value: Math.max(0, ...(analyses.data ?? []).map((a) => a.score ?? 0)) + "%",
      tone: "bg-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`brut p-4 ${s.tone}`}>
            <div className="font-mono text-xs">{s.label}</div>
            <div className="font-display text-3xl font-extrabold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Your resumes"
          action={
            <>
              <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload /> {uploading ? "Uploading…" : "Upload PDF/DOCX"}
              </Button>
            </>
          }
        >
          {resumes.data?.length ? (
            <ul className="space-y-3">
              {resumes.data.map((r) => {
                const p = r.parsed as unknown as ResumeProfile | null;
                return (
                  <li key={r.id} className="brut-sm bg-background p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{r.file_name}</div>
                        <div className="text-xs text-muted-foreground">{r.error || r.progress_note || "Waiting to start"}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <StatusPill status={r.status} />
                        {r.status === "failed" && (
                          <Button size="icon" variant="ghost" onClick={() => startParse(r.id)} aria-label="Retry"><RotateCw /></Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => removeResume(r.id, r.file_path)} aria-label="Delete"><Trash2 /></Button>
                      </div>
                    </div>
                    {r.status !== "done" && r.status !== "failed" && <div className="mt-2"><ParseProgress status={r.status} /></div>}
                    {p && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.skills.slice(0, 12).map((s) => (
                          <span key={s.name} className="rounded border border-foreground bg-secondary px-1.5 py-0.5 text-[11px]">{s.name}</span>
                        ))}
                        {p.skills.length > 12 && <span className="text-[11px] text-muted-foreground">+{p.skills.length - 12} more</span>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Upload a resume to get started. We'll extract your skills automatically.</p>
          )}
        </Panel>

        <Panel title="Jobs" action={<Button size="sm" variant="accent" onClick={() => setShowJob(true)}><Plus /> Add job</Button>}>
          {showJob && <JobForm userId={userId} recruiter={false} onDone={() => setShowJob(false)} />}
          {ready.length > 1 && (
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span className="font-mono text-xs">Compare using:</span>
              <select className="brut-sm bg-card px-2 py-1 text-sm" value={activeResume} onChange={(e) => setResumeId(e.target.value)}>
                {ready.map((r) => <option key={r.id} value={r.id}>{r.file_name}</option>)}
              </select>
            </div>
          )}
          {jobs.data?.length ? (
            <ul className="space-y-3">
              {jobs.data.map((j) => (
                <li key={j.id} className="brut-sm flex items-center justify-between gap-2 bg-background p-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{j.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {j.company || "—"} {j.is_public && j.owner_id !== userId && <span className="ml-1 rounded bg-info px-1 font-mono">posted by recruiter</span>}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => compare(j.id)} disabled={!!running || !activeResume}>
                    <Sparkles /> {running === j.id ? "Analyzing…" : "Analyze gap"}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Add job descriptions you're interested in.</p>
          )}
        </Panel>
      </div>

      <Panel title="Job matches">
        {analyses.data?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analyses.data.map((a) => (
              <Link key={a.id} to="/analysis/$id" params={{ id: a.id }} className="brut-sm block bg-background p-3 transition-transform hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <StatusPill status={a.status} />
                  {a.score != null && <span className="font-display text-2xl font-extrabold">{a.score}%</span>}
                </div>
                <div className="mt-2 font-semibold">{a.jobs?.title}</div>
                <div className="text-xs text-muted-foreground">{a.jobs?.company || "—"} · {new Date(a.created_at).toLocaleDateString()}</div>
                {a.error && <div className="mt-1 text-xs text-destructive">{a.error}</div>}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Run "Analyze gap" on a job to see your match and learning path.</p>
        )}
      </Panel>
    </div>
  );
}

function RecruiterView({ userId }: { userId: string }) {
  const [showJob, setShowJob] = useState(false);
  const jobs = useJobs({ ownerId: userId });
  const applicants = useQuery({
    queryKey: ["analyses", "applicants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, job_id, score, candidate_name, created_at, status")
        .eq("applied", true)
        .order("score", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="space-y-6">
      <Panel title="Your job posts" action={<Button size="sm" variant="accent" onClick={() => setShowJob(true)}><Plus /> Post a job</Button>}>
        {showJob && <JobForm userId={userId} recruiter onDone={() => setShowJob(false)} />}
        {jobs.data?.length ? (
          <div className="space-y-4">
            {jobs.data.map((j) => {
              const list = (applicants.data ?? []).filter((a) => a.job_id === j.id);
              return (
                <div key={j.id} className="brut-sm bg-background p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">{j.title}</div>
                      <div className="text-xs text-muted-foreground">{j.company || "—"} · {j.is_public ? "Public" : "Hidden"}</div>
                    </div>
                    <span className="flex items-center gap-1 font-mono text-xs"><Users className="size-3" /> {list.length} applicants</span>
                  </div>
                  {list.length > 0 && (
                    <ul className="mt-3 divide-y-2 divide-foreground/10">
                      {list.map((a) => (
                        <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                          <span>{a.candidate_name || "Candidate"}</span>
                          <Link to="/analysis/$id" params={{ id: a.id }} className="font-semibold underline">{a.score ?? "–"}% match →</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Post a job. Job seekers can compare their resume to it and apply — you'll see ranked matches here.</p>
        )}
      </Panel>
    </div>
  );
}
