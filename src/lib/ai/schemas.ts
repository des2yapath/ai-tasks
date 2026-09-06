import { AIError } from "@/lib/ai/errors";
import type { GeneratedTask, ParsedGenerationResult, TaskPriority } from "@/types/task";
import { isValidDateString } from "@/lib/utils/date";

const PRIORITIES: TaskPriority[] = ["none", "low", "medium", "high", "urgent"];
const MAX_TASKS = 50;

function stripFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1].trim() : trimmed;
}

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) return raw.slice(start, end + 1);
  return raw;
}

function coerceTitle(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 500);
}

function coercePriority(value: unknown): TaskPriority {
  return typeof value === "string" && (PRIORITIES as string[]).includes(value)
    ? (value as TaskPriority)
    : "medium";
}

function coerceDueDate(value: unknown): string | null {
  if (typeof value !== "string" || !isValidDateString(value)) return null;
  return value;
}

function coerceMinutes(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return null;
}

function coerceStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed.slice(0, 200));
    if (out.length >= max) break;
  }
  return out;
}

function coerceTask(value: unknown): GeneratedTask | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const title = coerceTitle(v.title);
  if (!title) return null;
  return {
    title,
    description:
      typeof v.description === "string" ? v.description.trim().slice(0, 2000) : "",
    priority: coercePriority(v.priority),
    dueDate: coerceDueDate(v.dueDate),
    estimatedMinutes: coerceMinutes(v.estimatedMinutes),
    tags: coerceStringArray(v.tags, 3).map((t) => t.toLowerCase()),
    subtasks: coerceStringArray(v.subtasks, 8),
  };
}

export function parseGeneration(rawText: string): ParsedGenerationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(rawText));
  } catch {
    try {
      parsed = JSON.parse(extractJsonObject(stripFences(rawText)));
    } catch (err) {
      throw new AIError("invalid_json", `The model returned malformed output (${String(err)})`);
    }
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new AIError("invalid_json", "The model returned malformed output (not a JSON object)");
  }

  const obj = parsed as Record<string, unknown>;
  const projectName =
    typeof obj.projectName === "string" && obj.projectName.trim() !== ""
      ? obj.projectName.trim().slice(0, 80)
      : null;

  if (!Array.isArray(obj.tasks)) {
    throw new AIError("invalid_json", "The model returned malformed output (missing tasks array)");
  }

  const tasks: GeneratedTask[] = [];
  for (const item of obj.tasks.slice(0, MAX_TASKS)) {
    const task = coerceTask(item);
    if (task) tasks.push(task);
  }

  return { projectName, tasks };
}

export function parseSingleTask(rawText: string): GeneratedTask {
  const generation = parseGeneration(rawText);
  if (generation.tasks.length === 0) {
    throw new AIError("invalid_json", "The model did not return a task object");
  }
  return generation.tasks[0];
}
