import model from './training/model.json';
import type { GapAnalysis } from './schemas';
export const SCORER_VERSION = model.accepted ? model.version : 'weighted-baseline-v1';
export function calibratedScore(requirements: GapAnalysis['requirements']) {
  const total = requirements.reduce((n,r)=>n+(r.importance==='must_have'?2:1),0);
  if (!total) return 0;
  const weights = model.accepted ? model.weights : [100,50,0];
  const value = requirements.reduce((n,r)=>n+(r.importance==='must_have'?2:1)*(weights[r.status==='matched'?0:r.status==='partial'?1:2] ?? 0),0)/total;
  return Math.max(0,Math.min(100,Math.round(value)));
}
