"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icons";
import { OfflineIndicator } from "@/components/layout/offline-indicator";
import { SearchDialog } from "@/components/layout/search-dialog";
import { QuickAdd } from "@/components/tasks/quick-add";
import { useSearchShortcut } from "@/hooks/use-search-shortcut";

export function Topbar({ title }: { title: string }) {
  const [searchOpen, setSearchOpen] = useState(false);
  useSearchShortcut(() => setSearchOpen(true));

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-6">
      <h1 className="min-w-0 truncate text-base font-semibold tracking-tight">{title}</h1>
      <div className="ml-auto hidden min-w-0 flex-1 items-center justify-end md:flex">
        <QuickAdd />
      </div>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label="Search tasks"
        className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:ml-3"
      >
        <Icon name="search" className="size-4" />
      </button>
      <OfflineIndicator />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
