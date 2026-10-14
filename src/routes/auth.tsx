import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/AppHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SkillPath" },
      { name: "description", content: "Sign in or create a SkillPath account as a job seeker or recruiter." },
      { property: "og:title", content: "Sign in — SkillPath" },
      { property: "og:description", content: "Sign in or create a SkillPath account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"job_seeker" | "recruiter">("job_seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/dashboard" }));
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name, account_type: role } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="dot-grid flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center"><Logo /></div>
        <div className="brut bg-card p-6">
          {sent ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold">Check your inbox</h1>
              <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to {email}. Open it to finish signing up.</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
              <form onSubmit={submit} className="mt-5 space-y-4">
                {mode === "signup" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        ["job_seeker", "Job seeker", GraduationCap],
                        ["recruiter", "Recruiter", Briefcase],
                      ] as const).map(([v, l, Icon]) => (
                        <button
                          type="button"
                          key={v}
                          onClick={() => setRole(v)}
                          className={cn("brut-sm flex flex-col items-center gap-1 p-3 text-sm font-semibold", role === v ? "bg-primary" : "bg-card")}
                        >
                          <Icon className="size-5" /> {l}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="border-2" />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-2" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw">Password</Label>
                  <Input id="pw" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required className="border-2" />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>
              <div className="my-4 flex items-center gap-3 font-mono text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-foreground/30" /> OR <div className="h-px flex-1 bg-foreground/30" />
              </div>
              <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
              {mode === "signup" && <p className="mt-2 text-center text-xs text-muted-foreground">Google sign-ups start as job seekers.</p>}
              <p className="mt-5 text-center text-sm">
                {mode === "signin" ? "New here? " : "Have an account? "}
                <button className="font-semibold underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
