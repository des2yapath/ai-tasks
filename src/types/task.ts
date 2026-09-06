export const TASK_STATUSES = ["inbox", "todo", "in_progress", "done", "archived"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["none", "low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type TaskSource = "manual" | "ai" | "quick_add";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  inbox: "Inbox",
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
  archived: "Archived",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export type QueuedOp = {
  id: string;
  table: "projects" | "tasks";
  type: "insert" | "update" | "delete";
  rowId: string;
  payload: unknown;
  queuedAt: string;
};

export interface Task {
  id: string;
  projectId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  estimatedMinutes: number | null;
  tags: string[];
  source: TaskSource;
  aiGenerated: boolean;
  generationId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type NewTask = {
  projectId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  estimatedMinutes: number | null;
  tags: string[];
  source: TaskSource;
  aiGenerated: boolean;
  generationId: string | null;
  sortOrder: number;
};

export type TaskUpdate = Partial<
  Omit<Task, "id" | "createdAt" | "updatedAt" | "source" | "aiGenerated" | "generationId">
>;

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  archived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type NewProject = {
  name: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
};

export type ProjectUpdate = Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>;

export type GenerationStatus = "pending_review" | "applied" | "discarded" | "failed";

export type GenerationAttachment = { name: string; type: string; size: number };

export interface GeneratedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  estimatedMinutes: number | null;
  tags: string[];
  subtasks: string[];
}

export interface ParsedGenerationResult {
  projectName: string | null;
  tasks: GeneratedTask[];
}

export interface AIGeneration {
  id: string;
  inputText: string;
  inputSummary: string;
  attachments: GenerationAttachment[];
  instructions: string;
  providerName: string;
  model: string;
  status: GenerationStatus;
  taskCount: number;
  result: ParsedGenerationResult;
  error: string | null;
  createdAt: string;
}

export type NewGeneration = {
  inputText: string;
  inputSummary: string;
  attachments: GenerationAttachment[];
  instructions: string;
  providerName: string;
  model: string;
  status: GenerationStatus;
  taskCount: number;
  result: ParsedGenerationResult;
  error: string | null;
};

export type GenerationUpdate = Partial<
  Omit<AIGeneration, "id" | "createdAt" | "inputText" | "inputSummary" | "attachments" | "instructions" | "providerName" | "model" | "result">
>;
