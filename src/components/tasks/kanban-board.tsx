"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { StatusMenu } from "@/components/tasks/task-item";
import { cn } from "@/lib/utils/cn";
import type { TaskStatus } from "@/types/task";

const COLUMNS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: "todo", label: "Todo", dot: "bg-sky-500" },
  { status: "in_progress", label: "In Progress", dot: "bg-amber-500" },
  { status: "done", label: "Done", dot: "bg-emerald-500" },
];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { state, updateTask } = useAppData();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const tasks = useMemo(
    () =>
      state.phase === "ready"
        ? state.tasks.filter((t) => t.projectId === projectId && t.parentTaskId === null && t.status !== "archived")
        : [],
    [state, projectId],
  );

  if (state.phase !== "ready") {
    return <p className="text-sm text-muted-foreground">Loading board…</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);
        return (
          <section
            key={col.status}
            aria-label={col.label}
            className={cn(
              "flex min-h-40 flex-col gap-2 rounded-xl border bg-muted/40 p-3 transition-colors",
              dragOver === col.status && "border-primary/50 bg-accent/40",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(col.status);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => {
              if (dragId) void updateTask(dragId, { status: col.status });
              setDragId(null);
              setDragOver(null);
            }}
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className={cn("size-2 rounded-full", col.dot)} />
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {col.label}
              </h2>
              <span className="ml-auto text-xs text-muted-foreground">{columnTasks.length}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {columnTasks.map((task) => (
                <li
                  key={task.id}
                  draggable
                  onDragStart={() => setDragId(task.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setDragOver(null);
                  }}
                  className="cursor-grab rounded-lg border bg-card px-3 py-2 shadow-sm transition-transform active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 text-sm font-medium">
                      {task.status === "done" ? <s>{task.title}</s> : task.title}
                    </span>
                    <StatusMenu
                      status={task.status}
                      onMove={(status) => void updateTask(task.id, { status })}
                      buttonClassName="px-1.5 py-1"
                    />
                  </div>
                  {task.tags.length > 0 ? (
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      #{task.tags.join(" #")}
                    </span>
                  ) : null}
                </li>
              ))}
              {columnTasks.length === 0 ? (
                <li className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                  Drop tasks here
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
