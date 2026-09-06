"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "@/components/ui/icons";

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
  { href: "/settings", label: "Settings", icon: "settings" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/projects") return pathname.startsWith("/projects");
  if (href === "/settings") return pathname.startsWith("/settings");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/generate"
        aria-label="Generate tasks with AI"
        className="fixed bottom-[4.75rem] left-1/2 z-40 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 lg:hidden"
      >
        <Icon name="sparkles" className="size-6" />
      </Link>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-1 text-muted-foreground"
            >
              <Icon name={item.icon} className={cn("size-5", active && "text-primary")} />
              <span className={cn("text-[0.65rem] font-medium", active && "text-primary")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
