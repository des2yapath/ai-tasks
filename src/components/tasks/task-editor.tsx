"use client";

import { useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
} from "@/types/task";

function EditorFields({ task, onClose }: { task: Task; onClose: () => void }) {
  const { state, updateTask, deleteTask, createTask } = useAppData();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [tagsInput, setTagsInput] = useState(task.tags.join(", "));
  const [estimated, setEstimated] = useState(
    task.estimatedMinutes !== null ? String(task.estimatedMinutes) : "",
  );
  const [newSubtask, setNewSubtask] = useState("");
  const [saved, setSaved] = useState(false);

  const subtasks = state.phase === "ready" ? state.tasks.filter((t) => t.parentTaskId === task.id) : [];

  async function save() {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    await updateTask(task.id, {
      title: title.trim(),
      description,
      status,
      priority,
      dueDate: dueDate || null,
      estimatedMinutes: estimated ? Number(estimated) : null,
      tags,
    });
    setSaved(true);
    setTimeout(onClose, 400);
  }

  async function addSubtask() {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    setNewSubtask("");
    await createTask({
      projectId: task.projectId,
      parentTaskId: task.id,
      title: trimmed,
      description: "",
      status: "todo",
      priority: "none",
      dueDate: null,
      estimatedMinutes: null,
      tags: [],
      source: "manual",
      aiGenerated: false,
      generationId: null,
      sortOrder: subtasks.length,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Edit task">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l bg-card p-5 shadow-xl max-lg:mx-auto max-lg:max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Edit task</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Icon name="x" className="size-4" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-status">Status</Label>
              <Select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-estimate">Estimate (min)</Label>
              <Input
                id="task-estimate"
                type="number"
                min={1}
                value={estimated}
                onChange={(e) => setEstimated(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-tags">Tags (comma-separated)</Label>
            <Input
              id="task-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="study, admin"
            />
          </div>
          {task.parentTaskId === null ? (
            <div className="flex flex-col gap-2">
              <Label>Subtasks</Label>
              <ul className="flex flex-col gap-1.5">
                {subtasks.map((sub) => (
                  <li key={sub.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <button
                      type="button"
                      className="flex-1 truncate text-left text-sm"
                      style={{ textDecoration: sub.status === "done" ? "line-through" : undefined }}
                      onClick={() => void updateTask(sub.id, { status: sub.status === "done" ? "todo" : "done" })}
                    >
                      {sub.title}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete subtask ${sub.title}`}
                      onClick={() => void deleteTask(sub.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Icon name="x" className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input
                  aria-label="New subtask"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addSubtask();
                    }
                  }}
                  placeholder="Add a subtask…"
                />
                <Button variant="outline" size="icon" onClick={() => void addSubtask()} aria-label="Add subtask">
                  <Icon name="plus" className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-5 flex items-center gap-2 border-t pt-4">
          <Button variant="destructive" onClick={() => void deleteTask(task.id).then(onClose)}>
            <Icon name="trash" className="size-4" />
            Delete
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={!title.trim()}>
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskEditor({ task, onClose }: { task: Task; onClose: () => void }) {
  return <EditorFields key={task.id} task={task} onClose={onClose} />;
}
