import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { canonicalSkill } from '@/lib/skills';
import { safeEvidenceUrl } from '@/lib/learning';
export type Activity=Tables<'learning_activities'>;
export function ActivityEditor({activity}:{activity:Activity}) {
 const qc=useQueryClient(); const [evidence,setEvidence]=useState(activity.evidence_url??'');
 const change=useMutation({mutationFn:async(patch:Partial<Activity>)=>{const r=await supabase.from('learning_activities').update(patch).eq('id',activity.id);if(r.error)throw r.error;},onSuccess:()=>{qc.invalidateQueries({queryKey:['learning-activities']});qc.invalidateQueries({queryKey:['workforce']});},onError:e=>toast.error(e.message)});
 const remove=useMutation({mutationFn:async()=>{const r=await supabase.from('learning_activities').delete().eq('id',activity.id);if(r.error)throw r.error;},onSuccess:()=>qc.invalidateQueries({queryKey:['learning-activities']}),onError:e=>toast.error(e.message)});
 return <article className="brut-sm space-y-3 bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-xs uppercase text-muted-foreground">{activity.kind} · {activity.skill}</p><h3 className="break-words font-bold">{activity.title}</h3>{activity.issuer&&<p className="text-xs">{activity.issuer}</p>}</div><Button variant="ghost" size="icon" aria-label={`Delete ${activity.title}`} disabled={remove.isPending} onClick={()=>remove.mutate()}><Trash2/></Button></div>
 <label className="block text-sm">Status<select aria-label={`Status for ${activity.title}`} className="mt-1 w-full rounded border-2 border-foreground bg-background p-2" value={activity.status} disabled={change.isPending} onChange={e=>change.mutate({status:e.target.value,completed_at:e.target.value==='completed'?new Date().toISOString():null})}><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="completed">Completed · self-reported</option></select></label>
 {activity.resource_url&&<a className="inline-flex items-center gap-1 text-sm underline" href={activity.resource_url} target="_blank" rel="noreferrer">Open resource <ExternalLink className="size-3"/></a>}
 <label className="block text-sm">{activity.kind==='certification'?'Credential link':'Project or completion evidence'}<Input type="url" value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="https://…" /></label><Button size="sm" variant="outline" disabled={change.isPending} onClick={()=>{try{change.mutate({evidence_url:safeEvidenceUrl(evidence)});}catch(e){toast.error(e instanceof Error?e.message:'Invalid link');}}}>Save evidence</Button>
 {activity.completed_at&&<p className="text-xs text-muted-foreground">Completed {new Date(activity.completed_at).toLocaleDateString()} · not independently verified</p>}</article>;
}
export function ActivityForm({userId,initialSkill=''}:{userId:string;initialSkill?:string}) {
 const qc=useQueryClient(); const [title,setTitle]=useState(''); const [skill,setSkill]=useState(initialSkill);const [kind,setKind]=useState('project');const [issuer,setIssuer]=useState('');const [url,setUrl]=useState('');
 const add=useMutation({mutationFn:async()=>{const r=await supabase.from('learning_activities').insert({user_id:userId,skill:canonicalSkill(skill),title:title.trim(),kind,issuer:issuer.trim()||null,evidence_url:safeEvidenceUrl(url)});if(r.error)throw r.error;},onSuccess:()=>{setTitle('');setUrl('');qc.invalidateQueries({queryKey:['learning-activities']});},onError:e=>toast.error(e.message)});
 return <form className="grid gap-3 border-y-2 border-foreground py-5 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();add.mutate();}}><label className="text-sm">Record type<select aria-label="Record type" className="mt-1 block w-full rounded border-2 border-foreground bg-card p-2" value={kind} onChange={e=>setKind(e.target.value)}><option value="project">Practice project</option><option value="certification">Certification</option><option value="course">Course</option></select></label><label className="text-sm">Skill<Input aria-label="Record skill" required value={skill} onChange={e=>setSkill(e.target.value)} maxLength={120}/></label><label className="text-sm">Title<Input aria-label="Record title" required value={title} onChange={e=>setTitle(e.target.value)} maxLength={200}/></label><label className="text-sm">Issuer / provider<Input aria-label="Record issuer" value={issuer} onChange={e=>setIssuer(e.target.value)} maxLength={200}/></label><label className="text-sm">Evidence / credential link<Input type="url" aria-label="Record evidence" value={url} onChange={e=>setUrl(e.target.value)}/></label><Button className="self-end" disabled={add.isPending}>Add record</Button></form>;
}
