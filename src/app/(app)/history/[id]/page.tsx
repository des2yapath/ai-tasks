"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

function GenerationDetail({ id }: { id: string }) {
  const { state, deleteGeneration, setGenerationStatus } = useAppData();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (state.phase !== "ready") {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const gen = state.generations.find((g) => g.id === id);
  if (!gen) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">This generation doesn&apos;t exist.</p>
        <Link href="/history" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Back to history
        </Link>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {gen.inputSummary || "Generation"}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {new Date(gen.createdAt).toLocaleString()} · {gen.providerName} · {gen.model}
          </p>
        </div>
        <div className="flex gap-2">
          {gen.status === "pending_review" ? (
            <Link href={`/generate?reopen=${gen.id}`}>
              <Button>Re-open review</Button>
            </Link>
          ) : null}
          {confirmDelete ? (
            <>
              <Button
                variant="destructive"
                onClick={() => void deleteGeneration(gen.id)}
              >
                Confirm delete
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" className="size-4" />
              Delete
            </Button>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Input</h3>
        {gen.attachments.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {gen.attachments.map((a, i) => (
              <li
                key={`${a.name}-${i}`}
                className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-xs"
              >
                <Icon name={a.type.startsWith("image/") ? "image" : "file"} className="size-3.5 text-muted-foreground" />
                <span className="max-w-48 truncate">{a.name}</span>
                <span className="text-muted-foreground">{Math.ceil(a.size / 1024)} KB</span>
              </li>
            ))}
          </ul>
        ) : null}
        {gen.instructions ? (
          <p className="rounded-lg border bg-muted/50 px-3 py-2 text-xs">
            <span className="font-medium">Instructions:</span> {gen.instructions}
          </p>
        ) : null}
        <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs whitespace-pre-wrap">
          {gen.inputText || "(no text input)"}
        </pre>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Generated tasks ({gen.result.tasks.length})
          {gen.result.projectName ? ` · suggested project: ${gen.result.projectName}` : ""}
        </h3>
        <ul className="flex flex-col gap-2">
          {gen.result.tasks.map((task, i) => (
            <li key={i} className="rounded-lg border bg-card px-4 py-3 text-sm shadow-sm">
              <p className="font-medium">{task.title}</p>
              {task.description ? <p className="mt-1 text-xs text-muted-foreground">{task.description}</p> : null}
              <p className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                <span>Priority: {task.priority}</span>
                {task.dueDate ? <span>· Due {task.dueDate}</span> : null}
                {task.estimatedMinutes ? <span>· ~{task.estimatedMinutes} min</span> : null}
                {task.tags.length > 0 ? <span>· #{task.tags.join(" #")}</span> : null}
                {task.subtasks.length > 0 ? <span>· {task.subtasks.length} subtasks</span> : null}
              </p>
            </li>
          ))}
          {gen.result.tasks.length === 0 ? (
            <li className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              No tasks in this generation.
            </li>
          ) : null}
        </ul>
      </section>

      {gen.status === "discarded" ? (
        <p className="text-xs text-muted-foreground">This generation was discarded.</p>
      ) : null}
      {gen.error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {gen.error}
        </p>
      ) : null}
      {gen.status === "pending_review" ? (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => void setGenerationStatus(gen.id, "discarded")}
        >
          Mark as discarded
        </Button>
      ) : null}
    </article>
  );
}

export default function GenerationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <GenerationDetail id={id} />;
}
