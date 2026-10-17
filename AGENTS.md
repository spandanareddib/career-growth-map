<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Resume parsing and gap analysis run in `src/lib/pipeline.functions.ts` (auth server fns) with AI helpers in `src/lib/ai.server.ts`; status is written to `resumes`/`analyses` rows and the UI follows via realtime. Why: one place for the pipeline, live status without polling.
- Roles (`job_seeker`/`recruiter`) live in `user_roles`, set by the signup trigger from an allow-listed metadata value. Why: no privilege beyond account type is derivable from metadata.
- Canonical skill identity and alias equivalence live in a client-safe catalog shared by matching, progress and graph construction. Why: the same skill must retain one identity across app surfaces without conflating related technologies.
- Workforce snapshots are captured by a resume-completion trigger and scoped to their owner; graph edges derive from snapshot evidence, visible job requirements and explicitly curated reference topics. Why: the twin evolves across uploads without exposing private candidate history or inventing live market forecasts.
- Learned skills are owner-scoped, self-reported records separate from generated analyses; new analyses use them as learning evidence, and completed steps reduce remaining duration. Why: progress survives analyses without misrepresenting verified professional experience.
