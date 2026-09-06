"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icons";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/utils/cn";
import { formatDueLabel, isOverdue } from "@/lib/utils/date";
import type { Task } from "@/types/task";

interface SearchItem {
  task: Task;
  projectName: string;
}

function matches(task: Task, projectName: string, query: string): boolean {
  const q = query.toLowerCase();
  return (
    task.title.toLowerCase().includes(q) ||
    task.description.toLowerCase().includes(q) ||
    projectName.toLowerCase().includes(q) ||
    task.tags.some((t) => t.toLowerCase().includes(q))
  );
}

function SearchInput({
  onSearch,
  onKeyDown,
  autoFocusRef,
}: {
  onSearch: (query: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  autoFocusRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="flex items-center gap-3 border-b px-4">
      <Icon name="search" className="size-4 shrink-0 text-muted-foreground" />
      <input
        ref={autoFocusRef}
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onSearch(e.target.value);
        }}
        onKeyDown={onKeyDown}
        placeholder="Search tasks…"
        className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <kbd className="rounded border px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">Esc</kbd>
    </div>
  );
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { state } = useAppData();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<SearchItem[]>(() => {
    if (state.phase !== "ready" || query.trim() === "") return [];
    const projectNames = new Map(state.projects.map((p) => [p.id, p.name]));
    return state.tasks
      .filter(
        (t) =>
          t.status !== "archived" &&
          matches(t, projectNames.get(t.projectId ?? "") ?? "Inbox", query.trim()),
      )
      .slice(0, 12)
      .map((task) => ({ task, projectName: projectNames.get(task.projectId ?? "") ?? "Inbox" }));
  }, [state, query]);

  function openTask(item: SearchItem) {
    onClose();
    if (item.task.projectId) {
      router.push(`/projects/${item.task.projectId}?task=${item.task.id}`);
    } else {
      router.push(`/inbox?task=${item.task.id}`);
    }
  }

  const clampedIndex = activeIndex < results.length ? activeIndex : 0;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[clampedIndex]) {
      openTask(results[clampedIndex]);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-xl p-0">
      {open ? (
        <SearchInput onSearch={setQuery} onKeyDown={onKeyDown} autoFocusRef={inputRef} />
      ) : null}
      <div className="max-h-80 overflow-y-auto p-2">
        {query.trim() === "" ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Search across task titles, descriptions, tags, and projects.
          </p>
        ) : results.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No results.</p>
        ) : (
          results.map((item, i) => (
            <button
              key={item.task.id}
              type="button"
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => openTask(item)}
              className={cn(
                "flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors",
                i === clampedIndex ? "bg-accent" : "",
              )}
            >
              <span className="truncate text-sm font-medium">{item.task.title}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{item.projectName}</span>
                {item.task.dueDate ? (
                  <span
                    className={
                      isOverdue(item.task.dueDate) && item.task.status !== "done"
                        ? "text-destructive"
                        : ""
                    }
                  >
                    · {formatDueLabel(item.task.dueDate)}
                  </span>
                ) : null}
                {item.task.tags.length > 0 ? <span>· #{item.task.tags.join(" #")}</span> : null}
              </span>
            </button>
          ))
        )}
      </div>
    </Dialog>
  );
}
