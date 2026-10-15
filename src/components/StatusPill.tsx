import { Loader2, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; cls: string; spin?: boolean }> = {
  queued: { label: "Queued", cls: "bg-muted" },
  extracting: { label: "Reading file", cls: "bg-info", spin: true },
  analyzing: { label: "Extracting skills", cls: "bg-warning", spin: true },
  running: { label: "Analyzing", cls: "bg-warning", spin: true },
  done: { label: "Ready", cls: "bg-success" },
  failed: { label: "Failed", cls: "bg-danger-soft" },
};

export function StatusPill({ status }: { status: string }) {
  const s = MAP[status] ?? MAP["queued"]!;
  const Icon = s.spin ? Loader2 : status === "done" ? Check : status === "failed" ? X : Clock;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border-2 border-foreground px-2 py-0.5 font-mono text-[11px]", s.cls)}>
      <Icon className={cn("size-3", s.spin && "animate-spin")} /> {s.label}
    </span>
  );
}

const STEPS = ["queued", "extracting", "analyzing", "done"];
export function ParseProgress({ status }: { status: string }) {
  const idx = STEPS.indexOf(status);
  return (
    <div className="flex gap-1">
      {STEPS.slice(1).map((s, i) => (
        <div
          key={s}
          className={cn(
            "h-1.5 flex-1 rounded-full border border-foreground",
            status === "failed" ? "bg-danger-soft" : i + 1 <= idx ? "bg-primary" : i + 1 === idx + 1 ? "animate-pulse bg-secondary" : "bg-card",
          )}
        />
      ))}
    </div>
  );
}
