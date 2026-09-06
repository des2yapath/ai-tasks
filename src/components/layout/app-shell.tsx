"use client";

import { usePathname } from "next/navigation";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { ToastProvider, ToastViewport } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";

const TITLES: [prefix: string, title: string][] = [
  ["/today", "Today"],
  ["/inbox", "Inbox"],
  ["/projects", "Projects"],
  ["/calendar", "Calendar"],
  ["/generate", "Generate"],
  ["/history", "History"],
  ["/settings", "Settings"],
];

function pageTitle(pathname: string): string {
  const match = TITLES.find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : "Tasks";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AppDataProvider>
      <ToastProvider>
        <div className="flex min-h-dvh">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar title={pageTitle(pathname)} />
            <main className="flex flex-1 flex-col pb-20 lg:pb-6">
              <div className="flex flex-1 flex-col px-4 py-4 lg:px-6">{children}</div>
            </main>
          </div>
          <MobileNav />
          <ToastViewport />
        </div>
      </ToastProvider>
    </AppDataProvider>
  );
}
