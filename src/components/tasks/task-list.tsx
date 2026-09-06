"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppData } from "@/components/providers/app-data-provider";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskEditor } from "@/components/tasks/task-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icons";
import { PRIORITY_ORDER, type Task } from "@/types/task";

type SortMode = "manual" | "priority" | "due";

function subtasksOf(tasks: Task[], parentTaskId: string | null): Task[] {
  return tasks.filter((t) => t.parentTaskId === parentTaskId);
}

function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  const copy = [...tasks];
  if (mode === "priority") {
    copy.sort(
      (a, b) =>
        PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority] ||
        b.sortOrder - a.sortOrder,
    );
  } else if (mode === "due") {
    copy.sort((a, b) => {
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : b.sortOrder - a.sortOrder;
    });
  } else {
    copy.sort((a, b) => b.sortOrder - a.sortOrder || a.createdAt.localeCompare(b.createdAt));
  }
  return copy;
}

export function TaskList({
  filter,
  title,
  emptyHint = "No tasks here yet.",
  showSubtasks = true,
}: {
  filter: (task: Task) => boolean;
  title?: string;
  emptyHint?: string;
  showSubtasks?: boolean;
}) {
  const { state, updateTask } = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [dragId, setDragId] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (state.phase !== "ready") return [];
    const topLevel = state.tasks.filter((t) => t.parentTaskId === null && filter(t));
    return sortTasks(topLevel, sortMode);
  }, [state, filter, sortMode]);

  const editingTask =
    state.phase === "ready" ? state.tasks.find((t) => t.id === editingId) ?? null : null;

  function openTask(id: string) {
    setEditingId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("task", id);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function closeEditor() {
    setEditingId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("task");
    router.replace(params.size > 0 ? `?${params.toString()}` : "?", { scroll: false });
  }

  if (state.phase === "loading") {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (state.phase === "offline") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <Icon name="offline" className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Can&apos;t reach the server. Reconnect and refresh to load your tasks.
        </p>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {title ? (
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {title} · {visible.length}
          </h2>
          <div className="flex gap-1" role="group" aria-label="Sort tasks">
            {(
              [
                ["manual", "Manual"],
                ["priority", "Priority"],
                ["due", "Due date"],
              ] as [SortMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                className={
                  sortMode === mode
                    ? "rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground"
                    : "rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <ul className="flex flex-col gap-2">
        {visible.map((task) => (
          <div key={task.id} className="contents">
            <TaskItem
              task={task}
              onOpen={() => openTask(task.id)}
              draggable
              onDragStart={() => setDragId(task.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId && dragId !== task.id) {
                  void updateTask(dragId, { sortOrder: task.sortOrder + 1 });
                }
                setDragId(null);
              }}
            />
            {showSubtasks
              ? subtasksOf(state.tasks, task.id)
                  .filter((s) => s.status !== "archived")
                  .map((sub) => (
                    <TaskItem key={sub.id} task={sub} onOpen={() => openTask(sub.id)} depth={1} />
                  ))
              : null}
          </div>
        ))}
      </ul>
      {editingTask ? <TaskEditor task={editingTask} onClose={closeEditor} /> : null}
    </div>
  );
}
