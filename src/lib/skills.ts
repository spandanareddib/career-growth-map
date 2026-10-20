import type { GapAnalysis, ResumeProfile } from "./schemas";

export const SKILL_CATALOG = [
  { name: "PostgreSQL", aliases: ["Postgres", "Postgre SQL", "Postgre-SQL", "pgsql"], category: "Data" },
  { name: "Kubernetes", aliases: ["k8s", "kube"], category: "Cloud" },
  { name: "JavaScript", aliases: ["JS", "Java Script", "ECMAScript"], category: "Development" },
  { name: "TypeScript", aliases: ["TS", "Type Script"], category: "Development" },
  { name: "React", aliases: ["ReactJS", "React.js", "React JS"], category: "Development" },
  { name: "Node.js", aliases: ["NodeJS", "Node JS", "Node"], category: "Development" },
  { name: "Vue", aliases: ["Vue.js", "VueJS"], category: "Development" },
  { name: "Python", aliases: ["Python3", "Python 3"], category: "Development" },
  { name: "Docker", aliases: ["Docker containers"], category: "Cloud" },
  { name: "AWS", aliases: ["Amazon Web Services"], category: "Cloud" },
  { name: "Azure", aliases: ["Microsoft Azure"], category: "Cloud" },
  { name: "Google Cloud", aliases: ["GCP", "Google Cloud Platform"], category: "Cloud" },
  { name: "Machine Learning", aliases: ["ML", "Machine-Learning"], category: "AI" },
  { name: "Natural Language Processing", aliases: ["NLP"], category: "AI" },
  { name: "Large Language Models", aliases: ["LLM", "LLMs", "Large Language Model"], category: "AI" },
  { name: "Retrieval-Augmented Generation", aliases: ["RAG", "Retrieval Augmented Generation"], category: "AI" },
  { name: "CI/CD", aliases: ["CICD", "CI CD", "Continuous Integration and Continuous Delivery"], category: "Cloud" },
  { name: "C#", aliases: ["C Sharp", "CSharp"], category: "Development" },
  { name: "C++", aliases: ["CPP", "C Plus Plus"], category: "Development" },
  { name: ".NET", aliases: ["Dotnet", "Dot Net"], category: "Development" },
  { name: "MySQL", aliases: ["My SQL"], category: "Data" },
  { name: "GitHub Actions", aliases: ["GithubActions"], category: "Cloud" },
  { name: "scikit-learn", aliases: ["sklearn", "scikit learn"], category: "AI" },
] as const;

const key = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[\s._-]+/g, "").trim();
const aliases = new Map<string, string>(SKILL_CATALOG.flatMap(s => [s.name, ...s.aliases].map(a => [key(a), s.name] as [string, string])));
export const canonicalSkill = (s: string) => aliases.get(key(s)) ?? s.trim().replace(/\s+/g, " ");
export const skillKey = (s: string) => key(canonicalSkill(s));
export const catalogInstructions = SKILL_CATALOG.map(s => `${s.name}: ${s.aliases.join(", ")}`).join("\n");

export function canonicalProfile(profile: ResumeProfile): ResumeProfile {
  const skills = new Map<string, ResumeProfile["skills"][number]>();
  for (const skill of profile.skills) {
    const normalized = { ...skill, name: canonicalSkill(skill.name) };
    const previous = skills.get(skillKey(skill.name));
    skills.set(skillKey(skill.name), previous ? { ...previous, evidence: `${previous.evidence}; ${skill.evidence}` } : normalized);
  }
  return { ...profile, skills: [...skills.values()] };
}

export function reconcileMatching(result: GapAnalysis, profile: ResumeProfile): GapAnalysis {
  let corrected = false;
  const requirements = result.requirements.map(req => {
    const evidence = profile.skills.find(s => skillKey(s.name) === skillKey(req.skill));
    if (req.status === "missing" && evidence) {
      corrected = true;
      const needsDepth=/years?|senior|expert|advanced|production|professional|speciali[sz]|depth/i.test(req.note+' '+req.skill)||evidence.category==='Self-reported learning';
      return { ...req, skill: canonicalSkill(req.skill), status: needsDepth ? "partial" as const : "matched" as const, resume_evidence: evidence.evidence,
        note: needsDepth ? "Equivalent skill evidence found. Required depth or specialization still needs review." : "Equivalent skill supported by resume evidence." };
    }
    return { ...req, skill: canonicalSkill(req.skill) };
  });
  const total = requirements.reduce((n, r) => n + (r.importance === "must_have" ? 2 : 1), 0);
  const points = requirements.reduce((n, r) => n + (r.importance === "must_have" ? 2 : 1) * (r.status === "matched" ? 1 : r.status === "partial" ? 0.5 : 0), 0);
  return { ...result, requirements, match_score: corrected && total ? Math.round(points / total * 100) : result.match_score,
    learning_path: result.learning_path.filter(s=>!requirements.some(r=>skillKey(r.skill)===skillKey(s.skill)&&r.status==='matched')).map(s => ({ ...s, skill: canonicalSkill(s.skill), builds_on: s.builds_on.map(canonicalSkill) })) };
}

export function learningProgress(path: GapAnalysis["learning_path"], learned: string[]) {
  const keys = new Set(learned.map(skillKey));
  const completed = path.filter(s => keys.has(skillKey(s.skill))).length;
  return { completed, remainingWeeks: path.filter(s => !keys.has(skillKey(s.skill))).reduce((n, s) => n + s.estimated_weeks, 0) };
}

export const TECH_TOPICS = [
  { name: "Retrieval-Augmented Generation", skills: ["Python", "Large Language Models", "PostgreSQL"], source: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview", summary: "Connect language models to retrievable knowledge and vector search." },
  { name: "Cloud-native delivery", skills: ["Docker", "Kubernetes", "CI/CD"], source: "CNCF", url: "https://www.cncf.io/projects/", summary: "Container orchestration and repeatable delivery across cloud environments." },
  { name: "Responsible AI", skills: ["Machine Learning", "Python", "Natural Language Processing"], source: "NIST AI RMF", url: "https://www.nist.gov/itl/ai-risk-management-framework", summary: "Evaluate, monitor and manage risks in AI systems." },
];