import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { BookOpen, ArrowRight } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { ActivityEditor,ActivityForm } from '@/components/ActivityEditor';
import { activitiesOptions } from '@/lib/learning';
import { workforceOptions } from '@/lib/workforce';
import { gapAnalysisSchema } from '@/lib/schemas';
import { useMe } from '@/lib/app';
import { pageHead } from '@/lib/page-head';
export const Route=createFileRoute('/_authenticated/learning')({head:()=>pageHead('Learning portal','Courses, practice projects and certification progress for your workforce twin.'),loader:async({context})=>{await Promise.all([context.queryClient.ensureQueryData(activitiesOptions),context.queryClient.ensureQueryData(workforceOptions)]);},component:Learning});
function Learning(){const {data:activities}=useSuspenseQuery(activitiesOptions);const {data}=useSuspenseQuery(workforceOptions);const {data:me}=useMe();
 return <div className="min-h-screen dot-grid"><AppHeader/><main className="mx-auto max-w-6xl space-y-8 px-4 py-8"><div><BookOpen className="size-8"/><h1 className="mt-3 text-3xl font-extrabold">Learning portal</h1><p className="mt-2 text-muted-foreground">{activities.filter(a=>a.status==='completed').length} completed · {activities.filter(a=>a.status==='in_progress').length} in progress</p></div><section><h2 className="mb-3 text-xl font-bold">Job learning paths</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.analyses.map(a=>{const r=gapAnalysisSchema.safeParse(a.result);if(!r.success)return null;return r.data.learning_path.map((s,i)=><Link key={`${a.id}-${i}`} to="/learn/$analysisId/$step" params={{analysisId:a.id,step:String(i)}} className="brut-sm flex items-center justify-between gap-3 bg-info p-4"><div><p className="text-xs">{data.jobs.find(j=>j.id===a.job_id)?.title}</p><h3 className="font-bold">{s.skill}</h3><p className="text-xs">Step {i+1} · {s.estimated_weeks} weeks</p></div><ArrowRight className="size-4 shrink-0"/></Link>);})}</div>{data.analyses.length===0&&<p className="text-sm text-muted-foreground">No job learning paths yet.</p>}</section><section><h2 className="text-xl font-bold">Projects, courses & certifications</h2>{me&&<ActivityForm userId={me.id}/>}<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{activities.map(a=><ActivityEditor key={a.id} activity={a}/>)}</div></section></main></div>;
}
