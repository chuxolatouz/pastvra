"use client";

import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { ensureSupabaseEnv, supabaseAnonKey, supabaseUrl } from "./env";

let client: SupabaseClient | null = null;

export function createClient() {
  if (client) return client;
  ensureSupabaseEnv();
  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
