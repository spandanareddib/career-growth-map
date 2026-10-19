# WorkTwin AI: learning, measured trends and persistent career history

## What will change

### 1. Learning portal
- Each analysis learning step opens a dedicated learning page containing relevant courses, its practice project and certification options, with checked source links rather than invented destinations.
- Track not started, in progress and completed learning activities. Save project titles, related skills, evidence links and completion dates; save certification issuer, credential link and dates.
- Reflect progress and project/certification relationships on the graph. Keep self-reported completion distinct from independently verified experience; completing a course does not automatically verify a certification.

### 2. Persistent workforce twin
- Reuse the existing account profile and associate each resume and its evidence snapshot with that identity. Preserve upload history rather than replacing earlier evidence.
- Add a profile view showing skills, experience, projects, certifications and timeline.
- Capture readiness assessments over time for a selected target job, including remaining gaps, learning progress and scorer version. Label readiness as an evidence-based estimate, not an employment guarantee; do not compare different jobs as though they were one continuous score.

### 3. Train and evaluate matching
- Create a versioned fictional resume–job dataset with explicit skill evidence and known matched, partial and missing labels. Include Postgres/PostgreSQL, k8s/Kubernetes, spelling variants, title variants, seniority/depth requirements and deliberately non-equivalent technologies.
- Split by template/job family before generating variants to prevent near-duplicate leakage. Reserve held-out cases for final evaluation.
- Train a small supervised scoring/calibration model offline, compare it with the existing weighted baseline and publish evaluation metrics plus limitations. Use it in new analyses only if it passes the baseline and equivalence regression checks.
- Keep canonical skill matching and evidence rules separate from score calibration: a similar title alone never proves a competency. Record scorer versions with results, and leave historical analyses unchanged.
- This trains the app's match scorer, not the underlying general-purpose LLM. Synthetic benchmark performance is not real-world validation; representative expert-reviewed data remains a later research requirement.

### 4. India labor-market trends
- Remove curated topic nodes from the measured-trends view. Display skills connected to observed posting statistics, with source, geography, comparison dates, counts, shares and refresh date.
- Calculate growth only between comparable complete periods from the same source/taxonomy/coverage; suppress unsupported or sparse comparisons and handle a zero baseline without inventing a percentage.
- Cache observations and show unavailable/stale states honestly. Never fabricate growth or substitute news/forecasts for measured skill demand.
- **Dependency:** choose and obtain access to an India-capable historical postings provider, confirming aggregate-display and retention rights. Lightcast is a candidate, but India coverage and licensing are not yet verified. The app can prepare ingestion and display, but cannot truthfully show current India-wide growth until that source is connected and verified. App-posted jobs alone are not representative of India.

### 5. Full end-to-end verification
- Use a fictional PDF resume and authorized job-seeker/recruiter test accounts; post a clearly labeled test job, parse the PDF, run matching, apply and confirm the recruiter sees the exact shared analysis.
- Verify that the recruiter cannot see it before application, another recruiter cannot see it afterwards, and private resume files and learning records remain private.
- Verify learning/project/certification changes persist after reload and appear on the graph and readiness timeline.
- Run focused automated tests for equivalence, learned versus professional evidence, training split/calibration, trend math, ownership and sharing. Check narrow and desktop layouts and current error logs.
- If a second authorized account or provider access is unavailable, report that exact blocked check rather than claiming end-to-end success.

## Technical approach
- Extend the existing Lovable Cloud schema additively, with explicit grants and owner-scoped access rules. Apply schema changes through the managed migration tool.
- Keep authenticated operations in the existing TanStack server-function pattern, preserve realtime pipeline status and retain the current AI provider/model.
- Extend the shared canonical catalog and workforce graph rather than introducing a second skill identity system. Add normalized learning/evidence records and append-only assessment provenance.
- Perform training outside the hosted request runtime; ship versioned coefficients/artifacts for lightweight inference. Include a reproducible training command, dataset rubric and evaluation results.
- Labor-market ingestion runs server-side with licensed source access, cached history and provenance; no credentials enter browser code.

## Delivery boundary
The learning portal, persistent twin, synthetic training/evaluation and available end-to-end checks can be built without a paid market feed. Real India skill-growth results depend on verified data access and rights; no market numbers or model-training claims will be invented to fill that gap.