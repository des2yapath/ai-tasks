"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: "today" },
  { href: "/inbox", label: "Inbox", icon: "inbox" },
  { href: "/projects", label: "Projects", icon: "folder" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/projects") return pathname.startsWith("/projects");
  if (href === "/settings") return pathname.startsWith("/settings");
  if (href === "/history") return pathname.startsWith("/history");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isClientSafe(value: boolean): boolean {
  return value;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Icon name="check" className="size-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">Tasks</span>
      </div>
      <div className="p-3">
        <Link
          href="/generate"
          className={cn(
            "flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
            pathname.startsWith("/generate") && "ring-2 ring-ring ring-offset-2 ring-offset-sidebar",
          )}
        >
          <Icon name="sparkles" className="size-4" />
          Generate tasks
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              isClientSafe(isActive(pathname, item.href)) && "bg-accent text-accent-foreground",
            )}
          >
            <Icon name={item.icon} className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center justify-between border-t px-4 py-3">
        <UserMenu />
        <ThemeToggle />
      </div>
    </aside>
  );
}
