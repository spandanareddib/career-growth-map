import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gapAnalysisSchema, resumeProfileSchema, type ResumeProfile } from "./schemas";
import { docxToText } from "./docx";
import { canonicalProfile, canonicalSkill, catalogInstructions, reconcileMatching } from "./skills";

const RESUME_SYSTEM = `You are an expert technical recruiter. Extract a structured candidate profile from the resume.
- List every concrete skill (languages, frameworks, tools, methods, domain and soft skills). Normalize names (e.g. "ReactJS" -> "React").
- Include skills that are clearly implied by the work described (e.g. "built REST services in Express" implies Node.js, REST API design).
- proficiency reflects depth shown in the resume; years is your best estimate or null.
- evidence is a short quote or paraphrase from the resume.
- Normalize aliases using this catalog, but never infer a skill from a job title alone:
${catalogInstructions}`;

const GAP_SYSTEM = `You compare a candidate profile to a job description and produce a skill gap analysis and learning path.
Matching rules (semantic, not keyword):
- Treat synonyms, alternate spellings and abbreviations as the SAME skill, not a gap. Use this canonical catalog:
${catalogInstructions}
- For a plain skill requirement, explicit equivalent skill evidence is matched. If a required depth, years or specialization is not shown, use partial, never missing.
- GitHub Actions is a CI/CD tool, not an alias for the whole discipline. MySQL is NOT an alias for PostgreSQL; Vue is NOT React; Java is NOT JavaScript.
- Recognize title variations (Sr./Senior, Software Developer/Software Engineer, Front-end/Frontend), but a related title alone does not prove any skill. Compare the described work and evidence.
- User-marked learned skills are self-reported, not verified experience; use partial when professional depth is required.
- Use "partial" when the candidate has a related or transferable skill (e.g. Vue for a React role, MySQL for PostgreSQL) or too little depth.
- Only use "missing" when nothing related appears.
- Extract 6-15 requirements from the job, marking must_have vs nice_to_have.
match_score: 0-100, weighting must_have items roughly twice as much as nice_to_have.
Learning path rules:
- Include only partial and missing skills, as an ordered sequence of steps.
- Order by prerequisites first (foundations before tools that depend on them), then by importance to the job.
- builds_on names skills the candidate already has or earlier steps that make this step easier.
- Give a realistic estimated_weeks (part-time study), one concrete milestone project, and 2-3 well-known resources (official docs, courses, books).`;

export const processResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ resumeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const setStatus = (patch: Record<string, unknown>) =>
      supabase.from("resumes").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", data.resumeId);

    const { data: resume, error } = await supabase.from("resumes").select("*").eq("id", data.resumeId).single();
    if (error || !resume) throw new Error("Resume not found");

    try {
      await setStatus({ status: "extracting", progress_note: "Reading your file", error: null });
      const { data: blob, error: dlErr } = await supabase.storage.from("resumes").download(resume.file_path);
      if (dlErr || !blob) throw new Error("Could not read the uploaded file.");
      const bytes = new Uint8Array(await blob.arrayBuffer());

      let content: Array<Record<string, unknown>>;
      if (resume.mime_type === "application/pdf") {
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        content = [
          { type: "text", text: "Extract the candidate profile from this resume." },
          { type: "file", filename: resume.file_name, data: btoa(bin), mediaType: "application/pdf" },
        ];
      } else {
        const text = docxToText(bytes);
        if (text.length < 40) throw new Error("We couldn't find enough text in this document.");
        content = [{ type: "text", text: `Extract the candidate profile from this resume:\n\n${text.slice(0, 60000)}` }];
      }

      await setStatus({ status: "analyzing", progress_note: "Identifying skills and experience" });
      const { structuredCall } = await import("./ai.server");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = canonicalProfile(await structuredCall(resumeProfileSchema, RESUME_SYSTEM, [{ role: "user", content: content as any }]));

      await setStatus({
        status: "done",
        progress_note: `Found ${profile.skills.length} skills`,
        parsed: profile as unknown as never,
      });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Parsing failed";
      await setStatus({ status: "failed", error: msg, progress_note: null });
      return { ok: false, error: msg };
    }
  });

export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ resumeId: z.string().uuid(), jobId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: resume }, { data: job }] = await Promise.all([
      supabase.from("resumes").select("id, parsed, status").eq("id", data.resumeId).single(),
      supabase.from("jobs").select("id, title, company, description").eq("id", data.jobId).single(),
    ]);
    if (!resume || resume.status !== "done" || !resume.parsed) throw new Error("Resume is not ready yet.");
    if (!job) throw new Error("Job not found");
    const profile = canonicalProfile(resume.parsed as unknown as ResumeProfile);
    const { data: learned, error: learnedError } = await supabase.from("learned_skills").select("skill");
    if (learnedError) throw learnedError;
    for (const item of learned ?? []) {
      const name = canonicalSkill(item.skill);
      if (!profile.skills.some(s => canonicalSkill(s.name) === name)) profile.skills.push({ name, category: "Self-reported learning", proficiency: "beginner", years: null, evidence: "User marked this skill learned; professional experience not verified." });
    }

    const { data: row, error } = await supabase
      .from("analyses")
      .insert({ user_id: userId, resume_id: resume.id, job_id: job.id, status: "running", candidate_name: profile.candidate_name })
      .select("id")
      .single();
    if (error || !row) throw new Error("Could not start analysis");

    try {
      const { structuredCall } = await import("./ai.server");
      const rawResult = await structuredCall(gapAnalysisSchema, GAP_SYSTEM, [
        {
          role: "user",
          content: `CANDIDATE PROFILE (JSON):\n${JSON.stringify(profile)}\n\nJOB: ${job.title}${job.company ? ` at ${job.company}` : ""}\n${job.description.slice(0, 20000)}`,
        },
      ]);
      const result = reconcileMatching(rawResult, profile);
      const score = Math.max(0, Math.min(100, Math.round(result.match_score)));
      await supabase.from("analyses").update({ status: "done", score, result: result as unknown as never }).eq("id", row.id);
    } catch (e) {
      await supabase
        .from("analyses")
        .update({ status: "failed", error: e instanceof Error ? e.message : "Analysis failed" })
        .eq("id", row.id);
    }
    return { id: row.id };
  });
