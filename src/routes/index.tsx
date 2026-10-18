import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, GitCompare, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/AppHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkTwin AI — know exactly what to learn next" },
      { name: "description", content: "Upload your resume, add jobs you want, and get a skill gap analysis with a step-by-step learning path." },
      { property: "og:title", content: "WorkTwin AI — know exactly what to learn next" },
      { property: "og:description", content: "Smart resume-to-job matching with an ordered learning path." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: FileText, title: "Upload resume", body: "PDF or DOCX. We pull out your skills and experience while you wait.", tone: "bg-warning" },
  { icon: GitCompare, title: "Compare to jobs", body: "Smart matching knows Postgres is PostgreSQL and Vue is close to React.", tone: "bg-success" },
  { icon: RouteIcon, title: "Follow the path", body: "Missing skills ordered by what to learn first — foundations before tools.", tone: "bg-info" },
];

function Index() {
  return (
    <div className="dot-grid min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <Button asChild variant="outline" size="sm"><Link to="/auth">Sign in</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-12">
        <section className="mx-auto max-w-3xl text-center">
          <span className="brut-sm inline-block bg-accent px-3 py-1 font-mono text-xs">for job seekers & recruiters</span>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] sm:text-6xl">
            WorkTwin AI
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Compare your resume with the jobs you want and get a clear skill gap analysis plus a step-by-step learning path.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg"><Link to="/auth">Get started <ArrowRight /></Link></Button>
          </div>
        </section>

        <section className="relative mx-auto mt-20 grid max-w-4xl gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="brut relative bg-card p-5">
              <div className={`brut-sm mb-4 inline-flex size-10 items-center justify-center ${s.tone}`}>
                <s.icon className="size-5" />
              </div>
              <div className="font-mono text-xs text-muted-foreground">step 0{i + 1}</div>
              <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
