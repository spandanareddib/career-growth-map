import { useState } from "react";
import { Network, Search, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GraphEdge, GraphNode } from "@/lib/workforce";
import { LearningCompletion } from "@/components/LearningCompletion";

export function KnowledgeGraph({ nodes, edges, userId }: { nodes: GraphNode[]; edges: GraphEdge[]; userId?: string | undefined }) {
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const filtered = nodes.filter(n => (kind === "all" || n.kind === kind) && n.label.toLowerCase().includes(search.toLowerCase()));
  const focus = filtered.find(n => n.id === selected) ?? filtered.find(n => edges.some(e => e.from === n.id || e.to === n.id)) ?? filtered[0];
  const connections = focus ? edges.filter(e => e.from === focus.id || e.to === focus.id) : [];
  const neighborIds = new Set(connections.flatMap(e => [e.from, e.to]));
  const neighbors = nodes.filter(n => neighborIds.has(n.id) && n.id !== focus?.id).slice(0, 10);
  const colors = { skill: "bg-success", job: "bg-info", trend: "bg-warning" };
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-3">
        <div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search graph" placeholder="Find a skill or role…" value={search} onChange={e => setSearch(e.target.value)} className="bg-card pl-9" /></div>
        <div className="flex flex-wrap gap-1">{["all", "skill", "job", "trend"].map(k => <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>{k === "all" ? "All" : k === "job" ? "Roles" : k === "skill" ? "Skills" : "Topics"}</Button>)}</div>
        <div className="max-h-96 space-y-1 overflow-y-auto">{filtered.map(n => <Button key={n.id} variant={focus?.id === n.id ? "secondary" : "ghost"} className="h-auto w-full justify-start whitespace-normal py-2 text-left" onClick={() => setSelected(n.id)}><span className={`size-2 shrink-0 rounded-full ${colors[n.kind]}`} />{n.label}{n.learned && <Check className="ml-auto size-3" />}</Button>)}{!filtered.length && <p className="text-sm text-muted-foreground">No matching nodes.</p>}</div>
      </aside>
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-mono">{Object.entries(colors).map(([k, color]) => <span key={k} className="flex items-center gap-1"><span className={`size-2 rounded-full ${color}`} />{k === "job" ? "JOB / ROLE" : k.toUpperCase()}</span>)}<span className="ml-auto">{nodes.length} nodes · {edges.length} links</span></div>
        <svg viewBox="0 0 760 490" className="w-full border-y-2 border-foreground bg-card" aria-label="Skill relationship graph">
          {focus && neighbors.map((n, i) => {
            const angle = 2 * Math.PI * i / neighbors.length - Math.PI / 2;
            const x = 380 + 255 * Math.cos(angle), y = 245 + 175 * Math.sin(angle);
            return <line key={n.id} x1="380" y1="245" x2={x} y2={y} className="stroke-foreground/30" strokeWidth="2" />;
          })}
          {focus && [{ n: focus, x: 380, y: 245 }, ...neighbors.map((n, i) => ({ n, x: 380 + 255 * Math.cos(2 * Math.PI * i / neighbors.length - Math.PI / 2), y: 245 + 175 * Math.sin(2 * Math.PI * i / neighbors.length - Math.PI / 2) }))].map(({ n, x, y }) => <foreignObject key={n.id} x={x - 77} y={y - 28} width="154" height="56"><Button onClick={() => setSelected(n.id)} variant="outline" className={`h-full w-full whitespace-normal border-2 px-2 text-xs ${colors[n.kind]}`}>{n.label}</Button></foreignObject>)}
          {!focus && <text x="380" y="245" textAnchor="middle" className="fill-muted-foreground">No connections yet</text>}
        </svg>
        {focus && <section className="mt-5 border-l-4 border-foreground pl-4">
          <div className="flex items-center gap-2"><Network className="size-5" /><h2 className="text-xl font-bold">{focus.label}</h2></div>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">{focus.evidence.map((e, i) => <p key={i} className="break-words">{e.length > 600 ? e.slice(0, 600) + "…" : e}</p>)}{!focus.evidence.length && <p>Connected through job requirements or technology topics.</p>}</div>
          {focus.url && <a href={focus.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline">Source <ExternalLink className="size-3" /></a>}
          {focus.kind === "skill" && userId && <div><LearningCompletion skill={focus.label} userId={userId} /></div>}
          <ul className="mt-3 flex flex-wrap gap-2">{connections.map((e, i) => <li key={i} className="rounded border border-foreground bg-secondary px-2 py-1 text-xs">{nodes.find(n => n.id === (e.from === focus.id ? e.to : e.from))?.label} · {e.label}</li>)}</ul>
        </section>}
      </div>
    </div>
  );
}