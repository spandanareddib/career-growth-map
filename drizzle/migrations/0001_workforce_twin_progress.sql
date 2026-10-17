CREATE TABLE public.workforce_snapshots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, resume_id uuid NOT NULL UNIQUE REFERENCES public.resumes(id) ON DELETE CASCADE, profile jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workforce_snapshots TO authenticated;
GRANT ALL ON public.workforce_snapshots TO service_role;
ALTER TABLE public.workforce_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own twin snapshots" ON public.workforce_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TABLE public.learned_skills (
 user_id uuid NOT NULL, skill text NOT NULL, learned_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id, skill), CONSTRAINT skill_length CHECK (length(skill) BETWEEN 1 AND 150)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learned_skills TO authenticated;
GRANT ALL ON public.learned_skills TO service_role;
ALTER TABLE public.learned_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own learned skills" ON public.learned_skills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE FUNCTION public.capture_workforce_snapshot() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.status = 'done' AND NEW.parsed IS NOT NULL THEN
  INSERT INTO public.workforce_snapshots(user_id, resume_id, profile) VALUES (NEW.user_id, NEW.id, NEW.parsed)
  ON CONFLICT (resume_id) DO UPDATE SET profile = EXCLUDED.profile, updated_at = now();
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.capture_workforce_snapshot() FROM PUBLIC;
CREATE TRIGGER capture_workforce_snapshot AFTER INSERT OR UPDATE OF parsed, status ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.capture_workforce_snapshot();
INSERT INTO public.workforce_snapshots(user_id,resume_id,profile,created_at) SELECT user_id,id,parsed,created_at FROM public.resumes WHERE status='done' AND parsed IS NOT NULL;
CREATE INDEX workforce_snapshots_user_idx ON public.workforce_snapshots(user_id);
