import type {
  AIGeneration,
  GeneratedTask,
  NewTask,
  Project,
  Task,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TaskUpdate,
} from "@/types/task";

type Row = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asTags(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((t): t is string => typeof t === "string") : [];
}

export function parseTaskRow(row: Row): Task {
  return {
    id: asString(row.id),
    projectId: asStringOrNull(row.project_id),
    parentTaskId: asStringOrNull(row.parent_task_id),
    title: asString(row.title),
    description: asString(row.description),
    status: asString(row.status, "todo") as TaskStatus,
    priority: asString(row.priority, "none") as TaskPriority,
    dueDate: asStringOrNull(row.due_date),
    completedAt: asStringOrNull(row.completed_at),
    estimatedMinutes: asNumberOrNull(row.estimated_minutes),
    tags: asTags(row.tags),
    source: asString(row.source, "manual") as TaskSource,
    aiGenerated: row.ai_generated === true,
    generationId: asStringOrNull(row.generation_id),
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
  };
}

export function parseProjectRow(row: Row): Project {
  return {
    id: asString(row.id),
    name: asString(row.name),
    description: asString(row.description),
    color: asString(row.color, "#6366f1"),
    icon: asString(row.icon, "folder"),
    archived: row.archived === true,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
  };
}

function parseGeneratedTasks(value: unknown): GeneratedTask[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is Row => typeof t === "object" && t !== null)
    .map((t) => ({
      title: asString(t.title),
      description: asString(t.description),
      priority: asString(t.priority, "medium") as TaskPriority,
      dueDate: asStringOrNull(t.dueDate),
      estimatedMinutes: asNumberOrNull(t.estimatedMinutes),
      tags: asTags(t.tags),
      subtasks: Array.isArray(t.subtasks)
        ? t.subtasks.filter((s): s is string => typeof s === "string")
        : [],
    }))
    .filter((t) => t.title !== "");
}

export function parseAIGenerationRow(row: Row): AIGeneration {
  const result = (typeof row.result === "object" && row.result !== null ? row.result : {}) as Row;
  const attachments = Array.isArray(row.attachments)
    ? row.attachments.filter((a): a is Row => typeof a === "object" && a !== null)
    : [];
  return {
    id: asString(row.id),
    inputText: asString(row.input_text),
    inputSummary: asString(row.input_summary),
    attachments: attachments.map((a) => ({
      name: asString(a.name),
      type: asString(a.type),
      size: typeof a.size === "number" ? a.size : 0,
    })),
    instructions: asString(row.instructions),
    providerName: asString(row.provider_name),
    model: asString(row.model),
    status: asString(row.status, "pending_review") as AIGeneration["status"],
    taskCount: typeof row.task_count === "number" ? row.task_count : 0,
    result: {
      projectName: asStringOrNull(result.projectName),
      tasks: parseGeneratedTasks(result.tasks),
    },
    error: asStringOrNull(row.error),
    createdAt: asString(row.created_at),
  };
}

export function serializeTaskInsert(task: NewTask): Row {
  return {
    id: crypto.randomUUID(),
    project_id: task.projectId,
    parent_task_id: task.parentTaskId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate,
    completed_at: task.status === "done" ? new Date().toISOString() : null,
    estimated_minutes: task.estimatedMinutes,
    tags: task.tags,
    source: task.source,
    ai_generated: task.aiGenerated,
    generation_id: task.generationId,
    sort_order: task.sortOrder,
  };
}

export function serializeTaskUpdate(update: TaskUpdate): Row {
  const payload: Row = {};
  if (update.projectId !== undefined) payload.project_id = update.projectId;
  if (update.parentTaskId !== undefined) payload.parent_task_id = update.parentTaskId;
  if (update.title !== undefined) payload.title = update.title;
  if (update.description !== undefined) payload.description = update.description;
  if (update.status !== undefined) {
    payload.status = update.status;
    payload.completed_at = update.status === "done" ? new Date().toISOString() : null;
  }
  if (update.priority !== undefined) payload.priority = update.priority;
  if (update.dueDate !== undefined) payload.due_date = update.dueDate;
  if (update.estimatedMinutes !== undefined) payload.estimated_minutes = update.estimatedMinutes;
  if (update.tags !== undefined) payload.tags = update.tags;
  if (update.sortOrder !== undefined) payload.sort_order = update.sortOrder;
  return payload;
}
