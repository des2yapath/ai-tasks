"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { MONTH_NAMES, WEEKDAY_NAMES, monthGrid, todayISO } from "@/lib/utils/date";
import type { Task } from "@/types/task";

export default function CalendarPage() {
  const { state } = useAppData();
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const weeks = useMemo(() => monthGrid(year, month), [year, month]);
  const tasks = state.phase === "ready" ? state.tasks.filter((t) => t.status !== "archived") : [];

  const tasksOn = (iso: string) => tasks.filter((t) => t.dueDate === iso);
  const dayTaskTotal = (iso: string) => tasksOn(iso).length;

  const selectedTasks = selectedDay !== null ? tasksOn(selectedDay) : [];

  function openTask(task: Task) {
    if (task.projectId) router.push(`/projects/${task.projectId}?task=${task.id}`);
    else router.push(`/inbox?task=${task.id}`);
  }

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDay(null);
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous month">
              <Icon name="chevronLeft" className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const t = new Date();
                setYear(t.getFullYear());
                setMonth(t.getMonth());
                setSelectedDay(null);
              }}
            >
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next month">
              <Icon name="chevronRight" className="size-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAY_NAMES.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((cell) => (
            <button
              key={cell.iso}
              type="button"
              onClick={() => setSelectedDay(cell.isToday ? null : cell.iso)}
              className={cn(
                "flex min-h-16 flex-col items-start gap-1 rounded-lg border p-2 text-left transition-colors md:min-h-20",
                cell.inMonth ? "bg-card" : "bg-muted/30 opacity-50",
                (selectedDay === cell.iso || (cell.isToday && selectedDay === null)) &&
                  "border-primary/60 ring-1 ring-primary/40",
                cell.isToday && "bg-primary/5",
              )}
            >
              <span className={cn("text-xs font-medium tabular-nums", cell.isToday && "text-primary")}>
                {Number(cell.iso.slice(-2))}
              </span>
              {dayTaskTotal(cell.iso) > 0 ? (
                <span className="mt-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[0.6rem] font-semibold text-primary">
                  {dayTaskTotal(cell.iso)}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <aside className="w-full shrink-0 lg:w-72">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          {selectedDay === null
            ? todayISO()
            : selectedDay}
        </h2>
        <ul className="flex flex-col gap-2">
          {selectedTasks.length === 0 ? (
            <li className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              No tasks due.
            </li>
          ) : (
            selectedTasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => openTask(task)}
                  className="w-full rounded-lg border bg-card px-3 py-2 text-left shadow-sm transition-colors hover:bg-accent/40"
                >
                  <span className={cn("block truncate text-sm", task.status === "done" && "line-through opacity-60")}>
                    {task.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {task.projectId
                      ? (state.phase === "ready" ? state.projects.find((p) => p.id === task.projectId)?.name ?? "Project" : "Project")
                      : "Inbox"}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>
    </div>
  );
}
