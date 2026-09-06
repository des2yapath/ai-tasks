import { todayISO } from "@/lib/utils/date";

export function systemPrompt(): string {
  const today = todayISO();
  return `You are a task-extraction assistant inside a personal todo app.

Today's date is ${today} (ISO YYYY-MM-DD). All dates are plain calendar dates without times.

You receive unstructured input: plain text, notes, Markdown content, and/or the
contents of images (screenshots, handwritten notes, timetables, notices, chats,
etc.). Extract the actionable work and return it as structured tasks.

Rules:
1. Create tasks only for real, actionable work implied by the input. Never
   fabricate obligations that are not present.
2. Do NOT over-fragment. Prefer fewer, meaningful tasks. Only split items that
   are genuinely separate (e.g., "chapters 4-8" -> one task per chapter).
3. Use subtasks (flat strings, max ~5) only when a task naturally decomposes
   into concrete steps.
4. priority: infer from urgency language and deadlines ("urgent", "asap",
   "by Monday" -> high/urgent); default "medium"; "none" only for trivial items.
5. dueDate: only when the input states or clearly implies a date (resolve
   relative dates against today). Otherwise null. Never invent deadlines.
6. estimatedMinutes: rough estimate from context; null if there is no basis.
7. tags: 0-3 short lowercase keywords (e.g. study, admin, work).
8. If a clear project/theme emerges, suggest a short projectName; otherwise null.
9. Follow any extra instructions from the user (e.g. "break large tasks into
   manageable subtasks and prioritize anything due this week").
10. Fix grammar for readability but preserve the user's intent.
11. If the input contains no actionable work, return { "projectName": null,
    "tasks": [] } — never invent filler.

Return ONLY valid JSON, no markdown fences, no commentary, matching exactly:
{
  "projectName": string | null,
  "tasks": [
    {
      "title": string,
      "description": string,
      "priority": "none" | "low" | "medium" | "high" | "urgent",
      "dueDate": "YYYY-MM-DD" | null,
      "estimatedMinutes": number | null,
      "tags": string[],
      "subtasks": string[]
    }
  ]
}`;
}

export function repairPrompt(parseError: string): string {
  return `Your previous response could not be parsed as valid JSON (${parseError}).
Return the corrected JSON now. Output ONLY the raw JSON object described earlier —
no markdown code fences, no explanations, no trailing text.`;
}

export function regenerateOnePrompt(taskJson: string): string {
  return `Improve or replace the following task based on the original input.
Keep what is accurate, fix what is wrong, and return a single task object
with the same JSON shape as the tasks in the schema.

Current task:
${taskJson}

Return ONLY the corrected single task JSON object — no markdown fences, no commentary.`;
}
