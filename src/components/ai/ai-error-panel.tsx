"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { describeError } from "@/lib/ai/errors";

export function AIErrorPanel({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4"
    >
      <div className="flex items-start gap-2">
        <Icon name="offline" className="mt-0.5 size-4 shrink-0 text-destructive" />
        <p className="text-sm text-destructive">{describeError(error)}</p>
      </div>
      <Button variant="outline" size="sm" className="self-start" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
