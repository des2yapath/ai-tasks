import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

function getEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.includes("YOUR_PROJECT_REF")) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill in your project URL and anon key.",
    );
  }
  return { url, anonKey };
}

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const { url, anonKey } = getEnv();
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
