import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ensureSupabaseEnv, supabaseAnonKey, supabaseUrl } from "./env";

export async function createClient() {
  ensureSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // In Server Components, Next.js can block cookie writes.
          // The proxy handles refresh/session cookie updates.
        }
      },
    },
  });
}
