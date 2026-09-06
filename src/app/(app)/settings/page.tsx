"use client";

import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/database/client";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setMessage("New password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Password updated.");
    setNewPassword("");
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Account</h2>
        <form onSubmit={changePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !newPassword}>
              {busy ? "Updating…" : "Update password"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => void signOut()}>
              <Icon name="logOut" className="size-4" />
              Sign out
            </Button>
          </div>
        </form>
      </section>
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">AI Providers</h2>
          <Link href="/settings/providers">
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          API keys live only in this browser (localStorage) and are sent directly to your chosen provider.
          Configure Gemini or any OpenAI-compatible endpoint.
        </p>
      </section>
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <p className="text-xs text-muted-foreground">
          Use the sun/moon toggle in the sidebar (desktop) or settings to switch between light and dark themes.
          Your choice is remembered per device.
        </p>
      </section>
    </div>
  );
}
