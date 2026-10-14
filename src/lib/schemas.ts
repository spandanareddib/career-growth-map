import { z } from "zod";

// Strict-compatible: every field required, nullable instead of optional, no bounds.
export const resumeProfileSchema = z.object({
  candidate_name: z.string().nullable(),
  headline: z.string(),
  summary: z.string(),
  total_years_experience: z.number().nullable(),
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
      years: z.number().nullable(),
      evidence: z.string(),
    }),
  ),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      duration: z.string(),
      highlights: z.array(z.string()),
    }),
  ),
  education: z.array(z.string()),
});
export type ResumeProfile = z.infer<typeof resumeProfileSchema>;

export const gapAnalysisSchema = z.object({
  match_score: z.number(),
  verdict: z.string(),
  strengths: z.array(z.string()),
  requirements: z.array(
    z.object({
      skill: z.string(),
      importance: z.enum(["must_have", "nice_to_have"]),
      status: z.enum(["matched", "partial", "missing"]),
      resume_evidence: z.string().nullable(),
      note: z.string(),
    }),
  ),
  learning_path: z.array(
    z.object({
      skill: z.string(),
      why_now: z.string(),
      builds_on: z.array(z.string()),
      estimated_weeks: z.number(),
      milestone_project: z.string(),
      resources: z.array(z.object({ title: z.string(), kind: z.string() })),
    }),
  ),
});
export type GapAnalysis = z.infer<typeof gapAnalysisSchema>;

export type ResumeStatus = "queued" | "extracting" | "analyzing" | "done" | "failed";
