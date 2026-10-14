import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/app";

export function Logo() {
  return (
    <Link to="/" className="font-display text-xl font-extrabold tracking-tight">
      Skill<span className="text-primary [-webkit-text-stroke:1px_var(--foreground)]">Path</span>
    </Link>
  );
}

export function AppHeader() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <header className="border-b-2 border-foreground bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-3">
          {me && (
            <span className="hidden rounded-full border-2 border-foreground bg-secondary px-3 py-0.5 font-mono text-xs sm:inline">
              {me.role === "recruiter" ? "Recruiter" : "Job seeker"} · {me.name || me.email}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut /> Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
