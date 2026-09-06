"use client";

import { Icon } from "@/components/ui/icons";
import { useAppData } from "@/components/providers/app-data-provider";

export function OfflineIndicator() {
  const { online, queuedCount, retry, state } = useAppData();
  if (online && queuedCount === 0) return null;
  if (!online) {
    return (
      <button
        type="button"
        onClick={retry}
        className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
      >
        <Icon name="offline" className="size-3.5" />
        Offline{queuedCount > 0 ? ` — ${queuedCount} queued` : ""}
        {state.phase === "offline" ? " — tap to retry" : ""}
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
      Syncing {queuedCount} change{queuedCount === 1 ? "" : "s"}…
    </span>
  );
}
