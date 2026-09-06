"use client";

import { useAppData } from "@/components/providers/app-data-provider";
import { TaskList } from "@/components/tasks/task-list";
import { Skeleton } from "@/components/ui/skeleton";
import { todayISO } from "@/lib/utils/date";
import type { Task } from "@/types/task";

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const circumference = 2 * Math.PI * 15;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 40 40" className="size-16 -rotate-90" role="img" aria-label={`${pct}% complete today`}>
        <circle cx="20" cy="20" r="15" fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="20"
          cy="20"
          r="15"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className="stroke-primary transition-all duration-300"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div>
        <p className="text-2xl font-semibold tabular-nums">{pct}%</p>
        <p className="text-xs text-muted-foreground">
          {done}/{total} done
        </p>
      </div>
    </div>
  );
}

export default function TodayPage() {
  const { state } = useAppData();
  const today = todayISO();

  if (state.phase === "loading") {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  const tasks = state.phase === "ready" ? state.tasks : [];
  const dueToday = tasks.filter(
    (t) =>
      t.parentTaskId === null &&
      t.status !== "done" &&
      t.status !== "archived" &&
      t.dueDate !== null &&
      t.dueDate <= today,
  );
  const inProgress = tasks.filter((t) => t.parentTaskId === null && t.status === "in_progress");
  const doneToday = tasks.filter(
    (t) => t.parentTaskId === null && t.status === "done" && t.completedAt !== null && t.completedAt.slice(0, 10) === today,
  );
  const total = dueToday.length + doneToday.length;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold">Today&apos;s progress</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {dueToday.length === 0
              ? "Nothing due today. Enjoy the calm — or plan ahead."
              : `${dueToday.length} task${dueToday.length === 1 ? "" : "s"} due or overdue.`}
          </p>
        </div>
        <ProgressRing done={doneToday.length} total={total} />
      </section>
      {inProgress.length > 0 ? (
        <TaskList
          title="In progress"
          emptyHint="No tasks in progress."
          filter={(t: Task) => t.parentTaskId === null && t.status === "in_progress"}
        />
      ) : null}
      <TaskList
        title="Due today & overdue"
        emptyHint="Nothing due today."
        filter={(t: Task) =>
          t.parentTaskId === null &&
          t.status !== "done" &&
          t.status !== "archived" &&
          t.dueDate !== null &&
          t.dueDate <= today
        }
      />
    </div>
  );
}
