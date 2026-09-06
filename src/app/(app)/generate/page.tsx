"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppData } from "@/components/providers/app-data-provider";
import { useToast } from "@/hooks/use-toast";
import { AIErrorPanel } from "@/components/ai/ai-error-panel";
import { CaptureFiles, type CapturedFile } from "@/components/ai/capture-files";
import { ProviderPicker } from "@/components/ai/provider-picker";
import { ReviewPanel, type EditableGeneratedTask } from "@/components/ai/review-panel";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Textarea } from "@/components/ui/textarea";
import { generateTasks } from "@/lib/ai/generate";
import { AIError } from "@/lib/ai/errors";
import { getDefaultProvider, loadProviders } from "@/lib/storage/providers";

type Phase = "capture" | "generating" | "review" | "error";

function toEditable(result: { projectName: string | null; tasks: { title: string; description: string; priority: string; dueDate: string | null; estimatedMinutes: number | null; tags: string[]; subtasks: string[] }[] }): EditableGeneratedTask[] {
  return result.tasks.map((task, index) => ({
    key: `task-${index}`,
    selected: true,
    title: task.title,
    description: task.description,
    priority: task.priority as EditableGeneratedTask["priority"],
    dueDate: task.dueDate,
    estimatedMinutes: task.estimatedMinutes,
    tags: task.tags,
    subtasks: task.subtasks,
  }));
}

function GenerateFlow() {
  const { saveGeneration, setGenerationStatus } = useAppData();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>("capture");
  const [text, setText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [files, setFiles] = useState<CapturedFile[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<EditableGeneratedTask[]>([]);
  const [suggestedProjectName, setSuggestedProjectName] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const providers = useMemo(() => (typeof window === "undefined" ? [] : loadProviders()), []);
  const provider = providers.find((p) => p.id === providerId) ?? getDefaultProvider(providers);

  const images = files.filter((f) => f.kind === "image" && f.base64);
  const docFiles = files.filter((f) => f.kind === "doc");

  const visionMismatch = images.length > 0 && (provider === null || !provider.supportsVision);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function buildUserText(): string {
    const blocks: string[] = [];
    if (text.trim()) blocks.push(text.trim());
    for (const doc of docFiles) {
      blocks.push(`--- ${doc.name} ---\n${doc.textContent ?? ""}`);
    }
    return blocks.join("\n\n");
  }

  async function runGeneration() {
    if (!provider || provider.apiKey === "") {
      toast("Add an API key for the selected provider in Settings → AI Providers.", {
        variant: "destructive",
        action: { label: "Settings", onClick: () => router.push("/settings/providers") },
      });
      return;
    }
    if (text.trim() === "" && files.length === 0) {
      toast("Add some text or attach a file first.", { variant: "destructive" });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("generating");
    setError(null);

    const message = {
      text: buildUserText(),
      instructions,
    };
    const imagePayload = visionMismatch
      ? []
      : images.map((f) => ({ mimeType: f.type, base64: f.base64 as string, name: f.name }));

    try {
      const result = await generateTasks(provider, message, imagePayload, controller.signal);
      const editable = toEditable(result);
      setTasks(editable);
      setSuggestedProjectName(result.projectName);

      const summary =
        text.trim().slice(0, 70) ||
        (files[0] ? `${files[0].name}` : "") ||
        "Generation";
      const saved = await saveGeneration({
        inputText: message.text,
        inputSummary: summary,
        attachments: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
        instructions,
        providerName: provider.name,
        model: provider.model,
        status: "pending_review",
        taskCount: editable.length,
        result,
        error: null,
      });
      setGenerationId(saved?.id ?? null);
      setPhase("review");
    } catch (err) {
      if (err instanceof AIError && err.kind === "timeout" && controller.signal.aborted) {
        setPhase("capture");
        return;
      }
      setError(err);
      setPhase("error");
    }
  }

  async function discard() {
    if (generationId) await setGenerationStatus(generationId, "discarded");
    resetAll();
  }

  function resetAll() {
    setPhase("capture");
    setText("");
    setInstructions("");
    setFiles([]);
    setTasks([]);
    setSuggestedProjectName(null);
    setGenerationId(null);
    setError(null);
    router.replace("/generate");
  }

  async function retry() {
    setPhase("capture");
    await runGeneration();
  }

  const reopened = searchParams.get("reopen");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {phase !== "review" ? (
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div>
            <label htmlFor="capture-input" className="text-sm font-medium">
              What do you need to get done?
            </label>
            <Textarea
              id="capture-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={(e) => {
                const pastedFiles = Array.from(e.clipboardData.files);
                if (pastedFiles.length > 0) {
                  e.preventDefault();
                  const input = document.createElement("input") as HTMLInputElement & { files: FileList };
                  Object.defineProperty(input, "files", { value: pastedFiles });
                  const add = new DataTransfer();
                  for (const f of pastedFiles) add.items.add(f);
                  void ingestFromDataTransfer(add, pastedFiles);
                }
              }}
              placeholder="Paste messy notes, a chat log, a syllabus — anything. The AI will turn it into a structured task list you can review."
              className="mt-2 min-h-32"
            />
          </div>
          <CaptureFiles
            files={files}
            onAdd={(added) => setFiles((prev) => [...prev, ...added])}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onError={(msg) => toast(msg, { variant: "destructive" })}
          />
          <details className="text-sm">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              Extra instructions for the AI (optional)
            </summary>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Break large tasks into manageable subtasks and prioritize anything due this week."
              className="mt-2 min-h-16 text-sm"
              aria-label="Extra instructions"
            />
          </details>
          <div className="flex flex-col gap-3 border-t pt-4">
            <ProviderPicker
              providerId={providerId}
              onChange={setProviderId}
              hasImages={images.length > 0}
            />
            <Button
              onClick={() => void runGeneration()}
              disabled={phase === "generating"}
              size="lg"
            >
              <Icon name="sparkles" className="size-4" />
              {phase === "generating"
                ? `Generating with ${provider?.name ?? "AI"}…`
                : "Generate tasks"}
            </Button>
            {phase === "error" && error ? <AIErrorPanel error={error} onRetry={() => void retry()} /> : null}
          </div>
        </section>
      ) : null}

      {phase === "review" && provider ? (
        <ReviewPanel
          tasks={tasks}
          onTasksChange={setTasks}
          suggestedProjectName={suggestedProjectName}
          providerLabel={`${provider.name} · ${provider.model}`}
          generationId={generationId}
          onDiscard={() => void discard()}
          onDone={resetAll}
          message={{ text: buildUserText(), instructions }}
          providerConfig={provider}
        />
      ) : null}

      {reopened && phase !== "review" ? (
        <p className="text-xs text-muted-foreground">
          Re-opening a generation from history — re-run Generate to continue where you left off.
        </p>
      ) : null}
    </div>
  );

  async function ingestFromDataTransfer(transfer: DataTransfer, list: File[]): Promise<void> {
    const next: CapturedFile[] = [];
    const { validateFile } = await import("@/components/ai/capture-files");
    for (const file of list) {
      const check = validateFile(file, [...files, ...next]);
      if (!check.ok) {
        toast(check.error, { variant: "destructive" });
        continue;
      }
      const isImage = file.type.startsWith("image/");
      const base64 = await file.arrayBuffer().then((buf) => {
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        }
        return btoa(binary);
      });
      next.push({
        id: `paste-${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name || "pasted image",
        type: file.type,
        size: file.size,
        kind: isImage ? "image" : "doc",
        base64: isImage ? base64 : undefined,
        textContent: isImage ? undefined : await file.text(),
      });
    }
    void transfer;
    if (next.length > 0) setFiles((prev) => [...prev, ...next]);
  }
}

export default function GeneratePage() {
  return (
    <Suspense>
      <GenerateFlow />
    </Suspense>
  );
}
