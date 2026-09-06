"use client";

import Link from "next/link";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDueLabel } from "@/lib/utils/date";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending_review: { label: "Pending review", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  applied: { label: "Applied", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  discarded: { label: "Discarded", className: "bg-muted text-muted-foreground" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

export default function HistoryPage() {
  const { state } = useAppData();

  if (state.phase === "loading") {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (state.phase !== "ready" || state.generations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No AI generations yet. Head to Generate to turn messy notes into structured tasks.
        </p>
        <Link href="/generate" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Open the generator
        </Link>
      </div>
    );
  }

  const byDay = new Map<string, typeof state.generations>();
  for (const gen of state.generations) {
    const day = gen.createdAt.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(gen);
    byDay.set(day, list);
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(byDay.entries()).map(([day, gens]) => (
        <section key={day} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {formatDueLabel(day)}
          </h2>
          <ul className="flex flex-col gap-2">
            {gens.map((gen) => (
              <li key={gen.id}>
                <Link
                  href={`/history/${gen.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{gen.inputSummary || gen.inputText.slice(0, 80) || "Untitled generation"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {gen.providerName} · {gen.model} · {gen.taskCount} task{gen.taskCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge className={STATUS_BADGE[gen.status]?.className}>
                    {STATUS_BADGE[gen.status]?.label ?? gen.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
