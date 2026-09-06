"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  BUILTIN_GEMINI_ID,
  getDefaultProvider,
  loadProviders,
  newProviderDraft,
  saveProviders,
} from "@/lib/storage/providers";
import { toProvider } from "@/lib/ai/registry";
import { describeError } from "@/lib/ai/errors";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils/cn";
import type { StoredProvider } from "@/types/provider";

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function ProviderRow({
  provider,
  isDefault,
  onSetDefault,
  onEdit,
  onToggleEnabled,
  onDelete,
}: {
  provider: StoredProvider;
  isDefault: boolean;
  onSetDefault: () => void;
  onEdit: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          {provider.name || "Unnamed provider"}
          {isDefault ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
              Default
            </span>
          ) : null}
          {!provider.enabled ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] text-muted-foreground">
              Disabled
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {provider.type === "gemini" ? "Gemini" : provider.baseUrl} · {provider.model}
          {provider.supportsVision ? " · vision" : ""}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Key: {provider.apiKey ? "••••••••" + provider.apiKey.slice(-4) : "not set"}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {!isDefault ? (
          <Button variant="outline" size="sm" onClick={onSetDefault}>
            Set default
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={onToggleEnabled}>
          {provider.enabled ? "Disable" : "Enable"}
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        {provider.id !== BUILTIN_GEMINI_ID ? (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
            Delete
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export default function ProvidersPage() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<StoredProvider[]>(() => []);
  const [editing, setEditing] = useState<StoredProvider | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState<"text" | "vision" | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    setLoaded(true);
    setProviders(loadProviders());
  }

  function commit(next: StoredProvider[]): void {
    setProviders(next);
    saveProviders(next);
  }

  function handleSave(): void {
    if (!editing) return;
    if (editing.name.trim() === "") {
      toast("Give the provider a name.", { variant: "destructive" });
      return;
    }
    if (editing.type === "openai-compatible" && !/^https?:\/\//.test(editing.baseUrl)) {
      toast("Enter a valid base URL (https://…).", { variant: "destructive" });
      return;
    }
    let next = providers.map((p) => (p.id === editing.id ? editing : p));
    if (!next.some((p) => p.id === editing.id)) next = [...next, editing];
    if (editing.isDefault) {
      next = next.map((p) => (p.id === editing.id ? { ...p, isDefault: true } : { ...p, isDefault: false }));
    }
    if (!next.some((p) => p.isDefault && p.enabled)) {
      const fallback = next.find((p) => p.enabled);
      if (fallback) next = next.map((p) => (p.id === fallback.id ? { ...p, isDefault: true } : p));
    }
    commit(next);
    setEditing(null);
    setShowKey(false);
    setTestResult(null);
  }

  async function runTest(kind: "text" | "vision"): Promise<void> {
    if (!editing) return;
    if (!editing.apiKey) {
      toast("Enter the API key first.", { variant: "destructive" });
      return;
    }
    setTesting(kind);
    setTestResult(null);
    try {
      const provider = toProvider(editing);
      const result = await provider.testConnection(
        kind === "vision"
          ? { prompt: "What color is this image? Answer in one word.", image: { mimeType: "image/png", base64: TINY_PNG_BASE64 } }
          : { prompt: "Reply with OK" },
      );
      setTestResult(result.message || (result.ok ? "OK" : "Empty response"));
      toast(result.ok ? "Connection OK" : "Provider responded but returned nothing.", {
        variant: result.ok ? "default" : "destructive",
      });
    } catch (err) {
      setTestResult(describeError(err));
      toast(describeError(err), { variant: "destructive" });
    } finally {
      setTesting(null);
    }
  }

  const defaultId = getDefaultProvider(providers)?.id;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Keys are stored only in this browser (localStorage) and sent directly to the provider —
          never to this app&apos;s server.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {providers.map((p) => (
          <ProviderRow
            key={p.id}
            provider={p}
            isDefault={p.id === defaultId}
            onSetDefault={() =>
              commit(providers.map((x) => ({ ...x, isDefault: x.id === p.id })))
            }
            onToggleEnabled={() =>
              commit(providers.map((x) => (x.id === p.id ? { ...x, enabled: !x.enabled } : x)))
            }
            onEdit={() => {
              setEditing({ ...p, extraHeaders: [...p.extraHeaders] });
              setShowKey(false);
              setTestResult(null);
            }}
            onDelete={() => {
              if (window.confirm(`Delete provider "${p.name}"?`)) {
                commit(providers.filter((x) => x.id !== p.id));
              }
            }}
          />
        ))}
      </ul>

      {editing ? (
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold">
            {providers.some((p) => p.id === editing.id) ? "Edit provider" : "Add provider"}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. OpenRouter"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-type">Type</Label>
              <Select
                id="p-type"
                value={editing.type}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    type: e.target.value as StoredProvider["type"],
                    supportsVision: e.target.value === "gemini" ? true : editing.supportsVision,
                    supportsJson: e.target.value === "gemini" ? true : editing.supportsJson,
                  })
                }
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai-compatible">OpenAI-compatible</option>
              </Select>
            </div>
          </div>

          {editing.type === "openai-compatible" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-baseurl">Base URL</Label>
              <Input
                id="p-baseurl"
                value={editing.baseUrl}
                onChange={(e) => setEditing({ ...editing, baseUrl: e.target.value.trim() })}
                placeholder="https://openrouter.ai/api/v1"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                OpenRouter, Groq, Together, Ollama (http://localhost:11434/v1), or any
                OpenAI-compatible endpoint. /chat/completions is appended automatically.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="p-model">Model</Label>
            <Input
              id="p-model"
              value={editing.model}
              onChange={(e) => setEditing({ ...editing, model: e.target.value.trim() })}
              placeholder={editing.type === "gemini" ? "gemini-2.5-flash" : "meta-llama/…"}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="p-key">API key</Label>
            <div className="flex gap-2">
              <Input
                id="p-key"
                type={showKey ? "text" : "password"}
                value={editing.apiKey}
                onChange={(e) => setEditing({ ...editing, apiKey: e.target.value })}
                autoComplete="off"
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={() => setShowKey((v) => !v)} aria-label={showKey ? "Hide key" : "Show key"}>
                {showKey ? "Hide" : <Icon name="search" className="size-3.5" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.supportsVision}
                onChange={(e) => setEditing({ ...editing, supportsVision: e.target.checked })}
                className="size-4"
              />
              Vision (images)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.supportsJson}
                onChange={(e) => setEditing({ ...editing, supportsJson: e.target.checked })}
                className="size-4"
              />
              JSON mode
            </label>
          </div>

          {testResult ? (
            <p className="rounded-lg border bg-muted/50 px-3 py-2 font-mono text-xs">{testResult}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => void runTest("text")} disabled={testing !== null}>
              {testing === "text" ? "Testing…" : "Test connection"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void runTest("vision")} disabled={testing !== null}>
              {testing === "vision" ? "Testing…" : "Test vision"}
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setShowKey(false);
                  setTestResult(null);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save provider
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => setEditing(newProviderDraft())}
        >
          <Icon name="plus" className="size-4" />
          Add provider
        </Button>
      )}

      <p className={cn("text-xs text-muted-foreground")}>
        Tip: for Ollama, start it with <code className="font-mono">OLLAMA_ORIGINS=*</code> (or your
        app origin) so the browser is allowed to call it. See the{" "}
        <Link href="/settings" className="underline underline-offset-2">
          settings page
        </Link>{" "}
        for your account options.
      </p>
    </div>
  );
}
