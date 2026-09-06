import { STORAGE_KEYS } from "@/lib/constants";
import { newId } from "@/lib/utils/id";

export type QueuedOp = {
  id: string;
  table: "projects" | "tasks";
  type: "insert" | "update" | "delete";
  rowId: string;
  payload: unknown;
  queuedAt: string;
};

function isQueuedOp(value: unknown): value is QueuedOp {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    (v.table === "projects" || v.table === "tasks") &&
    (v.type === "insert" || v.type === "update" || v.type === "delete") &&
    typeof v.rowId === "string" &&
    typeof v.queuedAt === "string"
  );
}

export function readQueue(): QueuedOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.offlineQueue);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isQueuedOp);
  } catch {
    return [];
  }
}

function writeQueue(ops: QueuedOp[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.offlineQueue, JSON.stringify(ops));
  } catch {
    /* storage full or unavailable — op stays in memory only */
  }
}

export function enqueue(op: Omit<QueuedOp, "id" | "queuedAt">): void {
  if (typeof window === "undefined") return;
  const queue = readQueue().filter(
    (existing) => !(existing.table === op.table && existing.rowId === op.rowId && existing.type === op.type),
  );
  writeQueue([...queue, { ...op, id: newId(), queuedAt: new Date().toISOString() }]);
}

export function dequeueAll(): QueuedOp[] {
  const ops = readQueue();
  writeQueue([]);
  return ops;
}
