"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/database/client";
import { readQueue, dequeueAll, enqueue } from "@/lib/offline/queue";
import type {
  AIGeneration,
  GenerationStatus,
  NewGeneration,
  NewProject,
  NewTask,
  Project,
  ProjectUpdate,
  Task,
  TaskUpdate,
} from "@/types/task";
import {
  parseAIGenerationRow,
  parseProjectRow,
  parseTaskRow,
  serializeTaskInsert,
  serializeTaskUpdate,
} from "@/lib/database/serialize";

type DataState =
  | { phase: "loading" }
  | { phase: "offline" }
  | { phase: "ready"; projects: Project[]; tasks: Task[]; generations: AIGeneration[] };

interface AppData {
  state: DataState;
  online: boolean;
  queuedCount: number;
  retry: () => void;
  createTask: (task: NewTask) => Promise<Task | null>;
  updateTask: (id: string, update: TaskUpdate) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createProject: (project: NewProject) => Promise<Project | null>;
  updateProject: (id: string, update: ProjectUpdate) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  saveGeneration: (generation: NewGeneration) => Promise<AIGeneration | null>;
  setGenerationStatus: (id: string, status: GenerationStatus, taskCount?: number) => Promise<void>;
  deleteGeneration: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<DataState>({ phase: "loading" });
  const [online, setOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const replaying = useRef(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshQueueCount = useCallback(() => {
    setQueuedCount(readQueue().length);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [projectsRes, tasksRes, generationsRes] = await Promise.all([
        client.from("projects").select("*").order("sort_order"),
        client.from("tasks").select("*").order("sort_order"),
        client.from("ai_generations").select("*").order("created_at", { ascending: false }),
      ]);
      if (projectsRes.error) throw projectsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (generationsRes.error) throw generationsRes.error;
      setState({
        phase: "ready",
        projects: (projectsRes.data ?? []).map(parseProjectRow),
        tasks: (tasksRes.data ?? []).map(parseTaskRow),
        generations: (generationsRes.data ?? []).map(parseAIGenerationRow),
      });
      setOnline(true);
    } catch {
      setOnline(false);
      setState((prev) => (prev.phase === "ready" ? prev : { phase: "offline" }));
    }
  }, [client]);

  const applyChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      setState((prev) => {
        if (prev.phase !== "ready") return prev;
        const { eventType } = payload;
        const table = payload.table as string;
        const row = (payload.new ?? {}) as Record<string, unknown>;
        const old = (payload.old ?? {}) as Partial<Record<string, unknown>>;
        if (table === "projects") {
          if (eventType === "INSERT") {
            const project = parseProjectRow(row);
            return { ...prev, projects: [...prev.projects, project] };
          }
          if (eventType === "UPDATE") {
            const id = String(row.id);
            return {
              ...prev,
              projects: prev.projects.map((p) => (p.id === id ? parseProjectRow(row) : p)),
            };
          }
          const id = String(old.id);
          return {
            ...prev,
            projects: prev.projects.filter((p) => p.id !== id),
            tasks: prev.tasks.filter((t) => t.projectId !== id),
          };
        }
        if (table === "tasks") {
          if (eventType === "INSERT") {
            const task = parseTaskRow(row);
            return prev.tasks.some((t) => t.id === task.id)
              ? prev
              : { ...prev, tasks: [...prev.tasks, task] };
          }
          if (eventType === "UPDATE") {
            const id = String(row.id);
            return {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === id ? parseTaskRow(row) : t)),
            };
          }
          const id = String(old.id);
          return { ...prev, tasks: prev.tasks.filter((t) => t.id !== id && t.parentTaskId !== id) };
        }
        if (table === "ai_generations") {
          if (eventType === "INSERT") {
            const generation = parseAIGenerationRow(row);
            return prev.generations.some((g) => g.id === generation.id)
              ? prev
              : { ...prev, generations: [generation, ...prev.generations] };
          }
          if (eventType === "UPDATE") {
            const id = String(row.id);
            return {
              ...prev,
              generations: prev.generations.map((g) => (g.id === id ? parseAIGenerationRow(row) : g)),
            };
          }
          const id = String(old.id);
          return { ...prev, generations: prev.generations.filter((g) => g.id !== id) };
        }
        return prev;
      });
    },
    [],
  );

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      void loadData();
      refreshQueueCount();
    });

    const channel = client
      .channel("app-data")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        applyChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        applyChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_generations" },
        applyChange,
      )
      .subscribe();

    return () => {
      cancelAnimationFrame(raf);
      void client.removeChannel(channel);
    };
  }, [client, loadData, applyChange, refreshQueueCount]);

  useEffect(() => {
    function updateStatus() {
      setOnline(navigator.onLine);
      if (navigator.onLine) void loadData();
    }
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, [loadData]);

  const scheduleReplay = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      void loadData();
    }, 1000);
  }, [loadData]);

  const replay = useCallback(async () => {
    if (replaying.current || !navigator.onLine) return;
    replaying.current = true;
    const ops = dequeueAll();
    for (const op of ops) {
      try {
        const rowId = op.rowId;
        if (op.table === "projects") {
          if (op.type === "insert")
            await client.from("projects").insert(op.payload as Record<string, unknown>);
          if (op.type === "update")
            await client
              .from("projects")
              .update(op.payload as Record<string, unknown>)
              .eq("id", rowId);
          if (op.type === "delete") await client.from("projects").delete().eq("id", rowId);
        } else if (op.table === "tasks") {
          if (op.type === "insert")
            await client.from("tasks").insert(op.payload as Record<string, unknown>);
          if (op.type === "update")
            await client
              .from("tasks")
              .update(op.payload as Record<string, unknown>)
              .eq("id", rowId);
          if (op.type === "delete") await client.from("tasks").delete().eq("id", rowId);
        }
      } catch {
        enqueue(op);
      }
    }
    replaying.current = false;
    refreshQueueCount();
    scheduleReplay();
  }, [client, refreshQueueCount, scheduleReplay]);

  useEffect(() => {
    if (navigator.onLine && readQueue().length > 0) void replay();
  }, [replay]);

  const retry = useCallback(() => {
    void loadData();
  }, [loadData]);

  const createTask = useCallback(
    async (task: NewTask): Promise<Task | null> => {
      const payload = serializeTaskInsert(task);
      const temp: Task = {
        ...task,
        id: payload.id as string,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setState((prev) =>
        prev.phase === "ready" ? { ...prev, tasks: [...prev.tasks, temp] } : prev,
      );
      const { error } = await client.from("tasks").insert(payload);
      if (error) {
        enqueue({ table: "tasks", type: "insert", rowId: payload.id as string, payload });
        refreshQueueCount();
        setOnline(false);
        return temp;
      }
      return temp;
    },
    [client, refreshQueueCount],
  );

  const updateTask = useCallback(
    async (id: string, update: TaskUpdate): Promise<void> => {
      setState((prev) =>
        prev.phase === "ready"
          ? {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === id ? { ...t, ...update, updatedAt: new Date().toISOString() } : t,
              ),
            }
          : prev,
      );
      const payload = serializeTaskUpdate(update);
      const { error } = await client.from("tasks").update(payload).eq("id", id);
      if (error) {
        enqueue({ table: "tasks", type: "update", rowId: id, payload });
        refreshQueueCount();
        setOnline(false);
      }
    },
    [client, refreshQueueCount],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      setState((prev) =>
        prev.phase === "ready"
          ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== id && t.parentTaskId !== id) }
          : prev,
      );
      const { error } = await client.from("tasks").delete().eq("id", id);
      if (error) {
        enqueue({ table: "tasks", type: "delete", rowId: id, payload: null });
        refreshQueueCount();
        setOnline(false);
      }
    },
    [client, refreshQueueCount],
  );

  const createProject = useCallback(
    async (project: NewProject): Promise<Project | null> => {
      const id = crypto.randomUUID();
      const temp: Project = {
        ...project,
        id,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setState((prev) =>
        prev.phase === "ready" ? { ...prev, projects: [...prev.projects, temp] } : prev,
      );
      const { error } = await client.from("projects").insert({ id, ...project });
      if (error) {
        enqueue({ table: "projects", type: "insert", rowId: id, payload: { id, ...project } });
        refreshQueueCount();
        setOnline(false);
        return temp;
      }
      return temp;
    },
    [client, refreshQueueCount],
  );

  const updateProject = useCallback(
    async (id: string, update: ProjectUpdate): Promise<void> => {
      setState((prev) =>
        prev.phase === "ready"
          ? {
              ...prev,
              projects: prev.projects.map((p) => (p.id === id ? { ...p, ...update } : p)),
            }
          : prev,
      );
      const { error } = await client.from("projects").update(update).eq("id", id);
      if (error) {
        enqueue({ table: "projects", type: "update", rowId: id, payload: update });
        refreshQueueCount();
        setOnline(false);
      }
    },
    [client, refreshQueueCount],
  );

  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      setState((prev) =>
        prev.phase === "ready"
          ? {
              ...prev,
              projects: prev.projects.filter((p) => p.id !== id),
              tasks: prev.tasks.filter((t) => t.projectId !== id),
            }
          : prev,
      );
      const { error } = await client.from("projects").delete().eq("id", id);
      if (error) {
        enqueue({ table: "projects", type: "delete", rowId: id, payload: null });
        refreshQueueCount();
        setOnline(false);
      }
    },
    [client, refreshQueueCount],
  );

  const saveGeneration = useCallback(
    async (generation: NewGeneration): Promise<AIGeneration | null> => {
      const { data, error } = await client
        .from("ai_generations")
        .insert({
          input_text: generation.inputText,
          input_summary: generation.inputSummary,
          attachments: generation.attachments,
          instructions: generation.instructions,
          provider_name: generation.providerName,
          model: generation.model,
          status: generation.status,
          task_count: generation.taskCount,
          result: generation.result,
          error: generation.error,
        })
        .select()
        .single();
      if (error || !data) return null;
      return parseAIGenerationRow(data);
    },
    [client],
  );

  const setGenerationStatus = useCallback(
    async (id: string, status: GenerationStatus, taskCount?: number): Promise<void> => {
      const payload: Record<string, unknown> = { status };
      if (typeof taskCount === "number") payload.task_count = taskCount;
      setState((prev) =>
        prev.phase === "ready"
          ? {
              ...prev,
              generations: prev.generations.map((g) =>
                g.id === id
                  ? {
                      ...g,
                      status,
                      taskCount: typeof taskCount === "number" ? taskCount : g.taskCount,
                    }
                  : g,
              ),
            }
          : prev,
      );
      await client.from("ai_generations").update(payload).eq("id", id);
    },
    [client],
  );

  const deleteGeneration = useCallback(
    async (id: string): Promise<void> => {
      setState((prev) =>
        prev.phase === "ready"
          ? { ...prev, generations: prev.generations.filter((g) => g.id !== id) }
          : prev,
      );
      await client.from("ai_generations").delete().eq("id", id);
    },
    [client],
  );

  const value = useMemo<AppData>(
    () => ({
      state,
      online,
      queuedCount,
      retry,
      createTask,
      updateTask,
      deleteTask,
      createProject,
      updateProject,
      deleteProject,
      saveGeneration,
      setGenerationStatus,
      deleteGeneration,
    }),
    [
      state,
      online,
      queuedCount,
      retry,
      createTask,
      updateTask,
      deleteTask,
      createProject,
      updateProject,
      deleteProject,
      saveGeneration,
      setGenerationStatus,
      deleteGeneration,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
