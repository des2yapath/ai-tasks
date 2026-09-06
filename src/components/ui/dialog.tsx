import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, className, children }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={cn(
          "relative max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-xl border bg-card p-5 shadow-lg",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
