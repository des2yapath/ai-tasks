"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/providers/app-data-provider";
import { Icon } from "@/components/ui/icons";

export function QuickAdd() {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const { createTask } = useAppData();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setTitle("");
    const task = await createTask({
      projectId: null,
      parentTaskId: null,
      title: trimmed,
      description: "",
      status: "inbox",
      priority: "none",
      dueDate: null,
      estimatedMinutes: null,
      tags: [],
      source: "quick_add",
      aiGenerated: false,
      generationId: null,
      sortOrder: Date.now(),
    });
    setBusy(false);
    if (task) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="relative ml-3 w-full max-w-xs">
      <Icon
        name="plus"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick add to Inbox… (N)"
        aria-label="Quick add task to inbox"
        data-quick-add
        className="h-9 w-full rounded-lg border bg-card pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
      />
    </form>
  );
}
