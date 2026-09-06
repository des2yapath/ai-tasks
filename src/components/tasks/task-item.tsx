"use client";

import { useEffect, useRef, useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Icon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils/cn";
import { formatDueLabel, isOverdue } from "@/lib/utils/date";
import { PRIORITY_LABELS, type Task, type TaskStatus } from "@/types/task";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "archived", label: "Archived" },
];

export function StatusMenu({
  status,
  onMove,
  buttonClassName,
}: {
  status: TaskStatus;
  onMove: (status: TaskStatus) => void;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Move task"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "flex items-center gap-1 rounded-md text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          buttonClassName,
        )}
      >
        Move to
        <Icon name="chevronDown" className="size-3" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 flex w-40 flex-col gap-0.5 rounded-lg border bg-card p-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_OPTIONS.filter((o) => o.value !== status).map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onMove(option.value);
              }}
              className="flex h-8 items-center rounded-md px-2 text-left text-sm transition-colors hover:bg-accent"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const priorityDot: Record<Task["priority"], string> = {
  none: "bg-transparent",
  low: "bg-sky-500",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export function TaskItem({
  task,
  onOpen,
  depth = 0,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  task: Task;
  onOpen: () => void;
  depth?: number;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  const { updateTask, state, deleteTask } = useAppData();
  const [checking, setChecking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const subtasks = state.phase === "ready" ? state.tasks.filter((t) => t.parentTaskId === task.id) : [];
  const doneSubtasks = subtasks.filter((t) => t.status === "done").length;

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function toggleDone() {
    if (checking) return;
    setChecking(true);
    await updateTask(task.id, { status: task.status === "done" ? "todo" : "done" });
    setChecking(false);
  }

  const showSubtaskProgress = subtasks.length > 0;

  return (
    <li
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5 shadow-sm transition-colors hover:bg-accent/40",
        task.status === "done" && "opacity-60",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
      style={{ marginLeft: depth > 0 ? Math.min(depth, 3) * 20 : undefined }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      data-task-id={task.id}
    >
      <Checkbox
        checked={task.status === "done"}
        onChange={toggleDone}
        disabled={checking}
        aria-label={task.status === "done" ? "Mark as not done" : "Mark as done"}
        className="mt-0.5"
        onClick={(e) => e.stopPropagation()}
      />
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span
          className={cn(
            "block truncate text-sm font-medium",
            task.status === "done" && "line-through",
          )}
        >
          {task.priority !== "none" ? (
            <span
              aria-hidden="true"
              className={cn("mr-1.5 inline-block size-1.5 rounded-full align-middle", priorityDot[task.priority])}
            />
          ) : null}
          {task.title}
        </span>
        {showSubtaskProgress ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {doneSubtasks}/{subtasks.length} subtasks
          </span>
        ) : null}
        <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {task.dueDate ? (
            <Badge
              variant="outline"
              className={
                isOverdue(task.dueDate) && task.status !== "done" ? "text-destructive" : ""
              }
            >
              <Icon name="calendar" className="size-3" />
              {formatDueLabel(task.dueDate)}
            </Badge>
          ) : null}
          {task.priority !== "none" ? (
            <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
          ) : null}
          {task.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              #{tag}
            </Badge>
          ))}
        </span>
      </button>
      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          aria-label="Task actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-accent-foreground focus-visible:opacity-100 group-hover:opacity-100 max-lg:opacity-100"
        >
          <Icon name="more" className="size-4" />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 z-40 mt-1 flex w-44 flex-col gap-0.5 rounded-lg border bg-card p-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {STATUS_OPTIONS.filter((o) => o.value !== task.status).map((option) => (
              <button
                key={option.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  void updateTask(task.id, { status: option.value });
                }}
                className="flex h-8 items-center rounded-md px-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <Icon name="chevronRight" className="mr-2 size-3.5 text-muted-foreground" />
                Move to {option.label}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                void deleteTask(task.id);
              }}
              className="flex h-8 items-center rounded-md px-2 text-left text-sm text-destructive transition-colors hover:bg-accent"
            >
              <Icon name="trash" className="mr-2 size-3.5" />
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}
