"""Fictional, rule-labeled benchmark. No personal data or LLM labels."""
import json
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[1]
out=root/'src/lib/training'
rows=[]
families={'train':['backend','frontend','data','platform'],'test':['ml','mobile']}
catalog={'backend':(['PostgreSQL','Node.js','Docker'],['Postgres','NodeJS','Docker containers']), 'frontend':(['React','JavaScript','TypeScript'],['ReactJS','Java Script','TS']), 'data':(['Python','PostgreSQL','scikit-learn'],['Python3','Postgre SQL','sklearn']), 'platform':(['Kubernetes','Docker','CI/CD'],['k8s','Docker containers','CICD']), 'ml':(['Machine Learning','Natural Language Processing','Large Language Models'],['ML','NLP','LLMs']), 'mobile':(['JavaScript','React','TypeScript'],['ECMAScript','React.js','Type Script'])}
for split, groups in families.items():
 for family in groups:
  for variant in range(24):
   statuses=[['matched','partial','missing'][(variant//(3**j))%3] for j in range(3)]
   weights=[2,2,1]
   vals={'matched':1,'partial':.5,'missing':0}
   score=sum(w*vals[s] for w,s in zip(weights,statuses))/sum(weights)*100
   skills,aliases=catalog[family]
   requirements=[{'skill':s,'importance':'must_have' if j<2 else 'nice_to_have','status':statuses[j],'depth':'professional' if statuses[j]=='partial' else 'plain','evidence':None if statuses[j]=='missing' else f'Built a fictional project using {aliases[j]}.'} for j,s in enumerate(skills)]
   rows.append({'id':f'{family}-{variant}','family':family,'split':split,'resume':{'headline':'Sr. Software Developer' if variant%2 else 'Senior Software Engineer','skills':[aliases[j] for j,s in enumerate(statuses) if s!='missing'],'text':'Fictional candidate. '+ ' '.join(r['evidence'] or '' for r in requirements)},'job':{'title':'Senior Software Engineer','description':'Fictional '+family+' role requiring '+', '.join(skills)+'.','requirements':requirements},'known_score':score})
def features(row):
 r=row['job']['requirements']; total=sum(2 if x['importance']=='must_have' else 1 for x in r)
 return [sum((2 if x['importance']=='must_have' else 1) for x in r if x['status']==status)/total for status in ['matched','partial','missing']]
train=[r for r in rows if r['split']=='train']; test=[r for r in rows if r['split']=='test']
x=np.array([features(r) for r in train]); y=np.array([r['known_score'] for r in train])
coef=np.linalg.lstsq(x,y,rcond=None)[0]
pred=np.array([features(r) for r in test])@coef
truth=np.array([r['known_score'] for r in test]); baseline=np.array([features(r) for r in test])@np.array([100,50,0])
report={'version':'synthetic-calibration-v1','train_pairs':len(train),'held_out_pairs':len(test),'train_families':families['train'],'held_out_families':families['test'],'held_out_mae':float(np.abs(pred-truth).mean()),'baseline_mae':float(np.abs(baseline-truth).mean()),'limitations':'Synthetic rubric calibration only. Not real hiring accuracy; extraction and gap detection are not evaluated by score MAE.'}
(out/'pairs.json').write_text(json.dumps(rows,indent=2)+'\n')
(out/'model.json').write_text(json.dumps({'version':report['version'],'weights':coef.round(8).tolist(),'accepted':report['held_out_mae']<=report['baseline_mae']+1e-8},indent=2)+'\n')
(out/'evaluation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
