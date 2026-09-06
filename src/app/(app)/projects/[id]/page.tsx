"use client";

import { use } from "react";
import { Suspense } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { TaskList } from "@/components/tasks/task-list";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { Task } from "@/types/task";

function ProjectDetail({ id }: { id: string }) {
  const { state } = useAppData();
  const [view, setView] = useViewMode();

  if (state.phase === "loading") {
    return <Skeleton className="h-64 w-full" />;
  }

  const project = state.phase === "ready" ? state.projects.find((p) => p.id === id) : undefined;
  if (!project) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">This project doesn&apos;t exist (or was deleted).</p>
      </div>
    );
  }

  const projectFilter = (t: Task) => t.parentTaskId === null && t.projectId === project.id && t.status !== "archived";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="size-3 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <p className="text-sm text-muted-foreground">
            {project.description || "No description"}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-0.5" role="tablist" aria-label="View">
          {(["list", "kanban"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={view === mode}
              onClick={() => setView(mode)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                view === mode ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      {view === "list" ? (
        <TaskList
          filter={projectFilter}
          emptyHint="No tasks in this project yet. Generate some with AI, or add them manually."
        />
      ) : (
        <KanbanBoard projectId={project.id} />
      )}
    </div>
  );
}

import { useState } from "react";

function useViewMode(): [
  view: "list" | "kanban",
  setView: (v: "list" | "kanban") => void,
] {
  const [view, setView] = useState<"list" | "kanban">("list");
  return [view, setView];
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense>
      <ProjectDetail id={id} />
    </Suspense>
  );
}
