"use client";

import { useTheme } from "@/hooks/use-theme";
import { Icon } from "@/components/ui/icons";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} className="size-4" />
    </button>
  );
}
