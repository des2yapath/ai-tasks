"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/database/client";
import { Icon } from "@/components/ui/icons";

export function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth
      .getSession()
      .then(({ data }) => setEmail(data.session?.user.email ?? data.session?.user.phone ?? null));
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon name="user" className="size-4" />
        </span>
        <span className="max-w-28 truncate text-muted-foreground">{email ?? "Account"}</span>
        <Icon name="chevronDown" className="size-3.5 shrink-0 text-muted-foreground" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-50 mb-1 flex w-48 flex-col gap-0.5 rounded-lg border bg-card p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex h-9 items-center gap-2 rounded-md px-2 text-left text-sm text-destructive transition-colors hover:bg-accent"
          >
            <Icon name="logOut" className="size-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
