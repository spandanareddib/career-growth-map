import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { buildWorkforceGraph, learnedOptions, workforceOptions } from "@/lib/workforce";
import { SKILL_CATALOG } from "@/lib/skills";
import { activitiesOptions, marketOptions } from "@/lib/learning";
import { useMe } from "@/lib/app";

export const Route = createFileRoute("/_authenticated/graph")({
   loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(workforceOptions),context.queryClient.ensureQueryData(activitiesOptions),context.queryClient.ensureQueryData(marketOptions)]); },
  head: () => ({ meta: [
    { title: "Workforce knowledge graph — WorkTwin AI" },
    { name: "description", content: "Explore your evolving workforce twin, skill relationships, job requirements and emerging technology topics." },
    { property: "og:title", content: "Workforce knowledge graph — WorkTwin AI" },
    { property: "og:description", content: "Connected skills, roles and technology topics in your workforce twin." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GraphPage,
});

function GraphPage() {
  const { data: me } = useMe();
  const { data } = useSuspenseQuery(workforceOptions);
  const learned = useQuery(learnedOptions);
  const activities=useSuspenseQuery(activitiesOptions);
  const market=useSuspenseQuery(marketOptions);
  const graph = buildWorkforceGraph(data, (learned.data ?? []).map(s => s.skill),activities.data,market.data);
  return <div className="min-h-screen dot-grid"><AppHeader /><main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase">Career intelligence</p><h1 className="mt-2 text-3xl font-extrabold">Your workforce twin</h1></div><div className="flex gap-6 text-sm"><span><strong className="block text-2xl">{data.snapshots.length}</strong>Resume snapshots</span><span><strong className="block text-2xl">{learned.data?.length ?? 0}</strong>Skills learned</span></div></div>
    {learned.isError && <p className="text-destructive">Learning progress could not be loaded.</p>}
    <KnowledgeGraph {...graph} userId={me?.id} />
    <section className="border-t-2 border-foreground pt-6"><h2 className="text-xl font-bold">India · observed skill demand</h2><p className="mt-1 text-sm text-muted-foreground">Online postings are not all hiring. Changes can reflect source coverage and posting practices.</p>{!graph.nodes.some(n=>n.kind==='trend')&&<p className="mt-4 border-l-4 border-warning pl-4 text-sm">India skill-growth data is unavailable. A licensed source with comparable historical postings has not been connected; no growth figures are shown.</p>}<div className="mt-4 grid gap-4 md:grid-cols-3">{graph.nodes.filter(n=>n.kind==='trend').map(t=><article key={t.id} className="brut-sm bg-warning p-4"><h3 className="font-bold">{t.label}</h3>{t.evidence.map(e=><p key={e} className="my-2 text-xs">{e}</p>)}<a href={t.url} target="_blank" rel="noreferrer" className="text-xs underline">Source ↗</a></article>)}</div></section>
    <section className="border-t-2 border-foreground pt-6"><h2 className="text-xl font-bold">Skill alias catalog</h2><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{SKILL_CATALOG.map(s => <div key={s.name} className="border-b border-foreground/20 py-2"><h3 className="text-sm font-semibold">{s.name}</h3><p className="break-words text-xs text-muted-foreground">{s.aliases.join(" · ")}</p></div>)}</div></section>
    {data.snapshots.length > 0 && <section className="border-t-2 border-foreground pt-6"><h2 className="text-xl font-bold">Twin history</h2><ul className="mt-3 space-y-2 text-sm">{data.snapshots.map((s, i) => <li key={s.id} className="flex justify-between border-b border-foreground/20 py-2"><span>Resume snapshot {data.snapshots.length - i}</span><time>{new Date(s.created_at).toLocaleDateString()}</time></li>)}</ul></section>}
  </main></div>;
}