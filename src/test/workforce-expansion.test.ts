import {describe,it,expect} from 'vitest';
import {marketGrowth,safeEvidenceUrl,type MarketObservation} from '@/lib/learning';
import {calibratedScore} from '@/lib/match-scorer';
import pairs from '@/lib/training/pairs.json';
import model from '@/lib/training/model.json';
import {reconcileMatching} from '@/lib/skills';
import {buildWorkforceGraph} from '@/lib/workforce';
import type {GapAnalysis,ResumeProfile} from '@/lib/schemas';
const previous:MarketObservation={skill:'Postgres',source:'Licensed test source',source_url:'https://example.com',geography:'India',taxonomy_version:'v1',coverage_key:'stable',period_start:'2026-08-01',period_end:'2026-08-31',postings:100,total_postings:1000,complete:true,observed_at:'2026-09-01'};
const current={...previous,skill:'PostgreSQL',period_start:'2026-09-01',period_end:'2026-09-30',postings:150,total_postings:1000};
describe('Measured India posting comparisons',()=>{
 it('calculates 50 percent growth and 5 percentage points share change',()=>expect(marketGrowth(current,previous)).toEqual({percent:50,shareChange:4.999999999999999}));
 it('never invents a percentage for a zero baseline',()=>expect(marketGrowth(current,{...previous,postings:0})).toBeNull());
 it('rejects changed coverage',()=>expect(marketGrowth(current,{...previous,coverage_key:'different'})).toBeNull());
 it('rejects incomplete periods',()=>expect(marketGrowth({...current,complete:false},previous)).toBeNull());
 it('rejects sparse counts',()=>expect(marketGrowth({...current,postings:9},previous)).toBeNull());
 it('keeps market regions separate',()=>expect(marketGrowth(current,{...previous,geography:'US'})).toBeNull());
});
describe('Synthetic scorer training',()=>{
 it('holds out full families before creating variants',()=>{const train=new Set(pairs.filter(p=>p.split==='train').map(p=>p.family));const held=pairs.filter(p=>p.split==='test');expect(held).toHaveLength(48);expect(held.some(p=>train.has(p.family))).toBe(false);});
 it('learns rubric weights without claiming a better model',()=>{expect(model.weights).toEqual([100,50,0]);expect(model.accepted).toBe(true);});
 it('scores every held-out labeled case within rounding tolerance',()=>{for(const p of pairs.filter(p=>p.split==='test'))expect(calibratedScore(p.job.requirements as GapAnalysis['requirements'])).toBe(Math.round(p.known_score));});
});
const p:ResumeProfile={candidate_name:null,headline:'Sr. Software Developer',summary:'',skills:[{name:'Postgres',category:'Data',proficiency:'beginner',years:null,evidence:'Completed a Postgres tutorial.'}],experience:[],education:[],total_years_experience:null};
const r:GapAnalysis={match_score:0,verdict:'',strengths:[],requirements:[{skill:'PostgreSQL',importance:'must_have',status:'missing',resume_evidence:null,note:'Requires 5 years professional production experience.'}],learning_path:[]};
describe('Evidence and graph rules',()=>{
 it('keeps required professional depth partial despite an equivalent skill',()=>expect(reconcileMatching(r,p).requirements[0]?.status).toBe('partial'));
 it('never upgrades self-reported learning to matched professional experience',()=>expect(reconcileMatching({...r,requirements:r.requirements.map(q=>({...q,note:''}))},{...p,skills:p.skills.map(s=>({...s,category:'Self-reported learning'}))}).requirements[0]?.status).toBe('partial'));
 it('title-only evidence does not prove PostgreSQL',()=>expect(reconcileMatching(r,{...p,skills:[]}).requirements[0]?.status).toBe('missing'));
 it('connects completed project progress without verifying the skill',()=>{const g=buildWorkforceGraph({snapshots:[],jobs:[],analyses:[]},[],[{id:'1',skill:'Postgres',kind:'project',title:'Data project',status:'completed',evidence_url:null}]);expect(g.edges).toContainEqual({from:'skill:postgresql',to:'activity:1',label:'project · completed'});expect(g.nodes.find(n=>n.id==='skill:postgresql')?.learned).toBeUndefined();});
 it('does not create fake trend nodes without observations',()=>expect(buildWorkforceGraph({snapshots:[],jobs:[],analyses:[]},[]).nodes).toHaveLength(0));
 it('rejects executable credential links',()=>expect(()=>safeEvidenceUrl('javascript:alert(1)')).toThrow());
});
