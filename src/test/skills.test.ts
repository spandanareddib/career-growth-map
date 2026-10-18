import { describe, expect, it } from "vitest";
import { canonicalProfile, canonicalSkill, learningProgress, reconcileMatching, skillKey } from "@/lib/skills";
import { buildWorkforceGraph } from "@/lib/workforce";
import type { GapAnalysis, ResumeProfile } from "@/lib/schemas";

const profile: ResumeProfile = { candidate_name: "Test", headline: "Engineer", summary: "", total_years_experience: 2,
  skills: [{ name: "Postgres", category: "Data", proficiency: "intermediate", years: 2, evidence: "Built Postgres services" }], experience: [], education: [] };
const result: GapAnalysis = { match_score: 0, verdict: "", strengths: [], requirements: [
  { skill: "PostgreSQL", importance: "must_have", status: "missing", resume_evidence: null, note: "" },
], learning_path: [{ skill: "Postgre SQL", why_now: "", builds_on: [], estimated_weeks: 3, milestone_project: "", resources: [] },
  { skill: "k8s", why_now: "", builds_on: ["Docker"], estimated_weeks: 4, milestone_project: "", resources: [] }] };

describe("Canonical skill matching", () => {
  it("maps Postgres and alternate spellings to PostgreSQL", () => {
    expect(canonicalSkill("Postgres")).toBe("PostgreSQL");
    expect(canonicalSkill("Postgre SQL")).toBe("PostgreSQL");
    expect(skillKey("POSTGRE-SQL")).toBe(skillKey("Postgres"));
  });
  it("maps k8s to Kubernetes, not PostgreSQL", () => {
    expect(canonicalSkill("k8s")).toBe("Kubernetes");
    expect(skillKey("k8s")).not.toBe(skillKey("Postgres"));
  });
  it("does not equate related tools or different languages", () => {
    expect(skillKey("MySQL")).not.toBe(skillKey("PostgreSQL"));
    expect(skillKey("Vue")).not.toBe(skillKey("React"));
    expect(skillKey("Java")).not.toBe(skillKey("JavaScript"));
    expect(skillKey("GitHub Actions")).not.toBe(skillKey("CI/CD"));
    expect(skillKey("C#")).not.toBe(skillKey("C++"));
  });
  it("merges duplicate equivalent resume skills", () => {
    expect(canonicalProfile({ ...profile, skills: [...profile.skills, { ...profile.skills[0], name: "PostgreSQL" }] }).skills).toHaveLength(1);
  });
  it("never leaves an evidenced equivalent skill missing and conservatively checks depth", () => {
    const fixed = reconcileMatching(result, profile);
    expect(fixed.requirements[0].status).toBe("partial");
    expect(fixed.requirements[0].resume_evidence).toBe("Built Postgres services");
    expect(fixed.match_score).toBe(50);
  });
  it("does not infer a competency from a similar job title", () => {
    const titleOnly = { ...profile, skills: [], experience: [{ title: "Senior Software Developer", company: "Test", duration: "2 years", highlights: [] }] };
    expect(reconcileMatching(result, titleOnly).requirements[0].status).toBe("missing");
  });
});
describe("Learning progress and workforce evolution", () => {
  it("counts alias-completed steps and removes their remaining weeks", () => {
    expect(learningProgress(result.learning_path, ["Postgres"])).toEqual({ completed: 1, remainingWeeks: 4 });
    expect(learningProgress(result.learning_path, ["Postgres", "Kubernetes"])).toEqual({ completed: 2, remainingWeeks: 0 });
    expect(learningProgress(result.learning_path, [])).toEqual({ completed: 0, remainingWeeks: 7 });
  });
  it("keeps evidence across uploads while merging aliases in the graph", () => {
    const graph = buildWorkforceGraph({ snapshots: [{ profile }, { profile: { ...profile, skills: [{ ...profile.skills[0], name: "PostgreSQL", evidence: "New project evidence" }] } }], jobs: [], analyses: [] }, []);
    const postgres = graph.nodes.filter(n => n.label === "PostgreSQL");
    expect(postgres).toHaveLength(1);
    expect(postgres[0].evidence).toEqual(["Built Postgres services", "New project evidence"]);
  });
  it("connects real job requirements, learning prerequisites and learned aliases", () => {
    const graph = buildWorkforceGraph({ snapshots: [], jobs: [{ id: "j1", title: "Engineer", description: "Postgres" }], analyses: [{ job_id: "j1", result }] }, ["Postgres"]);
    expect(graph.nodes.find(n => n.label === "PostgreSQL")?.learned).toBe(true);
    expect(graph.edges).toContainEqual({ from: "skill:postgresql", to: "job:j1", label: "requires · missing" });
    expect(graph.edges).toContainEqual({ from: "skill:docker", to: "skill:kubernetes", label: "builds toward" });
  });
});