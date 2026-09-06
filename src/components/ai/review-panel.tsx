"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/providers/app-data-provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { regenerateTask } from "@/lib/ai/generate";
import { AIError } from "@/lib/ai/errors";
import { PRIORITY_LABELS, TASK_PRIORITIES, type TaskPriority } from "@/types/task";
import type { StoredProvider } from "@/types/provider";

export type EditableGeneratedTask = {
  key: string;
  selected: boolean;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  estimatedMinutes: number | null;
  tags: string[];
  subtasks: string[];
};

type Target =
  | { kind: "inbox" }
  | { kind: "existing"; projectId: string }
  | { kind: "new"; name: string };

function TaskCard({
  task,
  index,
  onChange,
  onDelete,
  onRegenerate,
  regenerating,
  dragHandlers,
}: {
  task: EditableGeneratedTask;
  index: number;
  onChange: (patch: Partial<EditableGeneratedTask>) => void;
  onDelete: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
  dragHandlers: React.HTMLAttributes<HTMLLIElement>;
}) {
  const [newSubtask, setNewSubtask] = useState("");
  const [newTag, setNewTag] = useState("");

  return (
    <li
      {...dragHandlers}
      draggable
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm"
      data-generated-task={index}
    >
      {regenerating ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.selected}
              onChange={() => onChange({ selected: !task.selected })}
              aria-label={`Include "${task.title}" in applied tasks`}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <textarea
                value={task.title}
                onChange={(e) => onChange({ title: e.target.value })}
                rows={1}
                aria-label="Task title"
                className="w-full resize-none rounded-md border-none bg-transparent p-0 text-sm font-medium outline-none focus:ring-0"
              />
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={onRegenerate}
                disabled={regenerating}
                aria-label="Regenerate this task"
                title="Regenerate this task"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon name="sparkles" className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label="Remove this task"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
              >
                <Icon name="trash" className="size-3.5" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`desc-${index}`} className="sr-only">
              Description
            </Label>
            <textarea
              id={`desc-${index}`}
              value={task.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={2}
              placeholder="Description"
              className="w-full resize-y rounded-md border bg-transparent px-2 py-1.5 text-xs outline-none focus-visible:border-ring"
            />
          </div>
          <div className="flex flex-wrap items-end gap-2 text-xs">
            <div>
              <Label htmlFor={`prio-${index}`} className="mb-1 block">
                Priority
              </Label>
              <Select
                id={`prio-${index}`}
                value={task.priority}
                onChange={(e) => onChange({ priority: e.target.value as TaskPriority })}
                className="h-8 w-28 text-xs"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor={`due-${index}`} className="mb-1 block">
                Due
              </Label>
              <Input
                id={`due-${index}`}
                type="date"
                value={task.dueDate ?? ""}
                onChange={(e) => onChange({ dueDate: e.target.value || null })}
                className="h-8 w-36 text-xs"
              />
            </div>
            <div>
              <Label htmlFor={`est-${index}`} className="mb-1 block">
                Est. min
              </Label>
              <Input
                id={`est-${index}`}
                type="number"
                min={1}
                value={task.estimatedMinutes ?? ""}
                onChange={(e) =>
                  onChange({ estimatedMinutes: e.target.value ? Number(e.target.value) : null })
                }
                className="h-8 w-20 text-xs"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
                >
                  #{tag}
                  <button
                    type="button"
                    aria-label={`Remove tag ${tag}`}
                    onClick={() => onChange({ tags: task.tags.filter((t) => t !== tag) })}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Icon name="x" className="size-3" />
                  </button>
                </span>
              ))}
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const tag = newTag.trim().toLowerCase();
                    if (tag && !task.tags.includes(tag)) {
                      onChange({ tags: [...task.tags, tag].slice(0, 3) });
                    }
                    setNewTag("");
                  }
                }}
                placeholder="+ tag"
                aria-label="Add tag"
                className="h-6 w-16 rounded-full border bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
              />
            </div>
          </div>
          {task.subtasks.length > 0 || true ? (
            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground">Subtasks</Label>
              <ul className="flex flex-col gap-1">
                {task.subtasks.map((sub, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      aria-label="Remove subtask"
                      onClick={() =>
                        onChange({ subtasks: task.subtasks.filter((_, idx) => idx !== i) })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Icon name="x" className="size-3" />
                    </button>
                    <span className="min-w-0 flex-1">{sub}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-1.5">
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const sub = newSubtask.trim();
                      if (sub) {
                        onChange({ subtasks: [...task.subtasks, sub] });
                      }
                      setNewSubtask("");
                    }
                  }}
                  placeholder="Add a subtask and press Enter"
                  aria-label="Add subtask"
                  className="h-7 flex-1 rounded-md border bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
                />
              </div>
            </div>
          ) : null}
        </>
      )}
    </li>
  );
}

export function ReviewPanel({
  tasks,
  onTasksChange,
  suggestedProjectName,
  providerLabel,
  generationId,
  onDiscard,
  onDone,
  message,
  providerConfig,
}: {
  tasks: EditableGeneratedTask[];
  onTasksChange: (tasks: EditableGeneratedTask[]) => void;
  suggestedProjectName: string | null;
  providerLabel: string;
  generationId: string | null;
  onDiscard: () => void;
  onDone: () => void;
  message: { text: string; instructions: string };
  providerConfig: StoredProvider;
}) {
  const { state, createTask, createProject, setGenerationStatus } = useAppData();
  const { toast } = useToast();
  const router = useRouter();
  const [target, setTarget] = useState<Target>(
    suggestedProjectName ? { kind: "new", name: suggestedProjectName } : { kind: "inbox" },
  );
  const [applying, setApplying] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const selectedCount = tasks.filter((t) => t.selected).length;

  function updateTask(key: string, patch: Partial<EditableGeneratedTask>): void {
    onTasksChange(tasks.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  }

  async function handleRegenerateOne(key: string): Promise<void> {
    const task = tasks.find((t) => t.key === key);
    if (!task || regeneratingKey) return;
    setRegeneratingKey(key);
    try {
      const regenerated = await regenerateTask(providerConfig, message, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedMinutes: task.estimatedMinutes,
        tags: task.tags,
        subtasks: task.subtasks,
      });
      updateTask(key, {
        title: regenerated.title,
        description: regenerated.description,
        priority: regenerated.priority,
        dueDate: regenerated.dueDate,
        estimatedMinutes: regenerated.estimatedMinutes,
        tags: regenerated.tags,
        subtasks: regenerated.subtasks,
      });
    } catch (err) {
      toast(err instanceof AIError ? err.message : "Could not regenerate this task.", {
        variant: "destructive",
      });
    } finally {
      setRegeneratingKey(null);
    }
  }

  async function handleRegenerateAll(): Promise<void> {
    for (const task of tasks) {
      await handleRegenerateOne(task.key);
    }
  }

  async function apply(): Promise<void> {
    const selected = tasks.filter((t) => t.selected && t.title.trim() !== "");
    if (selected.length === 0 || applying) {
      if (selected.length === 0) toast("Select at least one task to apply.", { variant: "destructive" });
      return;
    }
    setApplying(true);

    let projectId: string | null = null;
    try {
      if (target.kind === "new") {
        const name = target.name.trim();
        if (!name) {
          toast("Enter a name for the new project.", { variant: "destructive" });
          setApplying(false);
          return;
        }
        const project = await createProject({
          name,
          description: "",
          color: "#6366f1",
          icon: "folder",
          sortOrder: Date.now(),
        });
        projectId = project?.id ?? null;
      } else if (target.kind === "existing") {
        projectId = target.projectId;
      }
    } catch {
      toast("Could not create the target project.", { variant: "destructive" });
      setApplying(false);
      return;
    }

    let applied = 0;
    const baseSort = Date.now();
    for (const [i, task] of selected.entries()) {
      const parent = await createTask({
        projectId,
        parentTaskId: null,
        title: task.title.trim(),
        description: task.description,
        status: projectId ? "todo" : "inbox",
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedMinutes: task.estimatedMinutes,
        tags: task.tags,
        source: "ai",
        aiGenerated: true,
        generationId,
        sortOrder: baseSort + selected.length - i,
      });
      if (!parent) continue;
      applied++;
      for (const [j, sub] of task.subtasks.entries()) {
        await createTask({
          projectId,
          parentTaskId: parent.id,
          title: sub,
          description: "",
          status: "todo",
          priority: "none",
          dueDate: null,
          estimatedMinutes: null,
          tags: [],
          source: "ai",
          aiGenerated: true,
          generationId,
          sortOrder: task.subtasks.length - j,
        });
      }
    }

    if (generationId) {
      await setGenerationStatus(generationId, "applied", applied);
    }
    setApplying(false);
    toast(`Applied ${applied} task${applied === 1 ? "" : "s"}.`);
    onDone();
    router.push(projectId ? `/projects/${projectId}` : "/inbox");
  }

  const projects = state.phase === "ready" ? state.projects.filter((p) => !p.archived) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Review generated tasks</h2>
          <p className="text-xs text-muted-foreground">
            {providerLabel} · {selectedCount}/{tasks.length} selected — nothing is added until you
            apply.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void handleRegenerateAll()} disabled={regeneratingKey !== null}>
            <Icon name="sparkles" className="size-3.5" />
            Regenerate all
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onDiscard}>
            Discard all
          </Button>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {tasks.map((task, index) => (
          <TaskCard
            key={task.key}
            task={task}
            index={index}
            onChange={(patch) => updateTask(task.key, patch)}
            onDelete={() => onTasksChange(tasks.filter((t) => t.key !== task.key))}
            onRegenerate={() => void handleRegenerateOne(task.key)}
            regenerating={regeneratingKey === task.key}
            dragHandlers={{
              onDragStart: () => setDragIndex(index),
              onDragOver: (e) => e.preventDefault(),
              onDrop: () => {
                if (dragIndex !== null && dragIndex !== index) {
                  const next = [...tasks];
                  const [moved] = next.splice(dragIndex, 1);
                  next.splice(index, 0, moved);
                  onTasksChange(next);
                }
                setDragIndex(null);
              },
            }}
          />
        ))}
      </ul>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Label className="text-sm">Apply to</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={target.kind === "inbox" ? "default" : "outline"}
            size="sm"
            onClick={() => setTarget({ kind: "inbox" })}
          >
            Inbox
          </Button>
          <Button
            variant={target.kind === "new" ? "default" : "outline"}
            size="sm"
            onClick={() => setTarget({ kind: "new", name: suggestedProjectName ?? "" })}
          >
            New project
          </Button>
          {projects.length > 0 ? (
            <Select
              aria-label="Existing project"
              value={target.kind === "existing" ? target.projectId : ""}
              onChange={(e) =>
                e.target.value
                  ? setTarget({ kind: "existing", projectId: e.target.value })
                  : setTarget({ kind: "inbox" })
              }
              className="h-8 w-auto min-w-40 text-xs"
            >
              <option value="">Existing project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
        {target.kind === "new" ? (
          <Input
            value={target.name}
            onChange={(e) => setTarget({ ...target, name: e.target.value })}
            placeholder="Project name"
            aria-label="New project name"
          />
        ) : null}
        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-xs text-muted-foreground">
            {selectedCount} task{selectedCount === 1 ? "" : "s"} will be added
            {tasks.some((t) => t.selected && t.subtasks.length > 0)
              ? ` (plus subtasks)`
              : ""}
            .
          </p>
          <Button onClick={() => void apply()} disabled={applying || selectedCount === 0}>
            <Icon name="check" className="size-4" />
            {applying ? "Applying…" : `Apply ${selectedCount} task${selectedCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
