import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { canonicalSkill } from './skills';
export const activitiesOptions=queryOptions({queryKey:['learning-activities'],queryFn:async()=>{
 const r=await supabase.from('learning_activities').select('*').order('created_at',{ascending:false}); if(r.error) throw r.error; return r.data;
}});
export const readinessOptions=queryOptions({queryKey:['readiness'],queryFn:async()=>{
 const r=await supabase.from('readiness_history').select('*,jobs(title)').order('created_at',{ascending:false}); if(r.error) throw r.error; return r.data;
}});
export const marketOptions=queryOptions({queryKey:['market'],queryFn:async()=>{
 const r=await supabase.from('market_observations').select('*').eq('geography','India').order('period_end',{ascending:false}); if(r.error) throw r.error; return r.data;
}});
export function safeEvidenceUrl(value:string){ if(!value.trim())return null; const url=new URL(value); if(url.protocol!=='https:'&&url.protocol!=='http:')throw new Error('Use an HTTPS or HTTP evidence link.'); return url.href; }
export function learningResources(name:string){
 const skill=canonicalSkill(name);
 const docs:Record<string,string>={PostgreSQL:'https://www.postgresql.org/docs/current/tutorial.html',Kubernetes:'https://kubernetes.io/docs/tutorials/',Docker:'https://docs.docker.com/get-started/',Python:'https://www.python.org/about/gettingstarted/'};
 return {course:{title:`${skill} courses`,url:`https://www.coursera.org/search?query=${encodeURIComponent(skill)}`},docs:docs[skill]??null,certification:skill==='Kubernetes'?{title:'Certified Kubernetes Administrator',issuer:'Linux Foundation',url:'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/'}:{title:`${skill} certification search`,issuer:'Provider to be selected',url:`https://www.coursera.org/search?query=${encodeURIComponent(skill+' certification')}`}};
}
export type MarketObservation={skill:string;source:string;source_url:string;geography:string;taxonomy_version:string;coverage_key:string;period_start:string;period_end:string;postings:number;total_postings:number;complete:boolean;observed_at:string};
export function marketGrowth(current:MarketObservation,previous:MarketObservation){
 if(!current.complete||!previous.complete||current.source!==previous.source||current.geography!==previous.geography||current.taxonomy_version!==previous.taxonomy_version||current.coverage_key!==previous.coverage_key||canonicalSkill(current.skill)!==canonicalSkill(previous.skill)||previous.period_end>=current.period_start||current.postings<10||previous.postings<10||!current.total_postings||!previous.total_postings)return null;
 const days=(a:string,b:string)=>(Date.parse(b)-Date.parse(a))/86400000+1;
 if(Math.abs(days(current.period_start,current.period_end)-days(previous.period_start,previous.period_end))>3)return null;
 return {percent:(current.postings-previous.postings)/previous.postings*100,shareChange:(current.postings/current.total_postings-previous.postings/previous.total_postings)*100};
}
