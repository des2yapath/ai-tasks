"use client";

import { useMemo, useState } from "react";
import { loadProviders, getDefaultProvider } from "@/lib/storage/providers";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

export function ProviderPicker({
  providerId,
  onChange,
  hasImages,
}: {
  providerId: string | null;
  onChange: (id: string) => void;
  hasImages: boolean;
}) {
  const [providers, setProviders] = useState(() => (typeof window === "undefined" ? [] : loadProviders()));
  const changeEventHook = useMemo(
    () =>
      typeof window === "undefined"
        ? null
        : () => setProviders(loadProviders()),
    [],
  );

  if (typeof window !== "undefined" && changeEventHook) {
    window.addEventListener("providers-change", changeEventHook, { once: false });
  }

  const selected = providers.find((p) => p.id === providerId) ?? getDefaultProvider(providers);
  const warn =
    hasImages && (selected === null || !selected.supportsVision);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="AI provider and model"
          value={selected?.id ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-auto min-w-56 text-xs"
        >
          {providers
            .filter((p) => p.enabled)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.model}
              </option>
            ))}
        </Select>
        {selected ? (
          <Badge variant={selected.supportsVision ? "default" : "secondary"}>
            {selected.supportsVision ? "vision" : "text-only"}
          </Badge>
        ) : null}
      </div>
      {warn ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          ⚠ {selected ? `${selected.name} / ${selected.model}` : "The selected provider"} does not
          support images. Image attachments will be ignored — pick a vision-capable provider or
          remove the images.
        </p>
      ) : null}
    </div>
  );
}
