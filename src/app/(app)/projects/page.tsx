"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const PROJECT_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#64748b"];

export default function ProjectsPage() {
  const { state, createProject, deleteProject, updateProject } = useAppData();
  const { toast } = useToast();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    const project = await createProject({
      name: trimmed,
      description,
      color,
      icon: "folder",
      sortOrder: Date.now(),
    });
    setBusy(false);
    if (project) {
      setCreateOpen(false);
      setName("");
      setDescription("");
      router.push(`/projects/${project.id}`);
    } else {
      toast("Project created — it will sync when you're back online.");
    }
  }

  if (state.phase === "loading") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (state.phase === "offline") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <Icon name="offline" className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Reconnect to load your projects.</p>
      </div>
    );
  }

  const active = state.projects.filter((p) => !p.archived);
  const archived = state.projects.filter((p) => p.archived);
  const taskCount = (id: string) =>
    state.tasks.filter((t) => t.projectId === id && t.status !== "archived" && t.status !== "done").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {active.length} active project{active.length === 1 ? "" : "s"}
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Icon name="plus" className="size-4" />
          New project
        </Button>
      </div>
      {active.length === 0 && archived.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <Icon name="folder" className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No projects yet. Create one to organize related tasks — or let the AI suggest one when you generate tasks.
          </p>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            <Icon name="plus" className="size-4" />
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((project) => (
            <Card
              key={project.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/projects/${project.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/projects/${project.id}`);
              }}
              className="cursor-pointer p-5 transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold tracking-tight">{project.name}</h2>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {project.description || "No description"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{taskCount(project.id)} open tasks</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void updateProject(project.id, { archived: true })}
                >
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (window.confirm(`Delete "${project.name}" and all its tasks?`)) {
                      void deleteProject(project.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {archived.length > 0 ? (
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Archived ({archived.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {archived.map((project) => (
              <li key={project.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm">{project.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void updateProject(project.id, { archived: false })}
                >
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (window.confirm(`Delete "${project.name}" and all its tasks?`)) {
                      void deleteProject(project.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <h2 className="mb-4 text-base font-semibold tracking-tight">New project</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-description">Description (optional)</Label>
            <Input
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Color</Label>
            <div className="flex gap-2" role="radiogroup" aria-label="Project color">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={`size-7 rounded-full transition-transform ${color === c ? "ring-2 ring-ring ring-offset-2 ring-offset-card" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={!name.trim() || busy}>
              {busy ? "Creating…" : "Create project"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
