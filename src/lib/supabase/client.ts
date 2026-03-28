// M4 (Auth Specialist) & M3 (DB Specialist) Logic:
// This file creates the Supabase client for client-side usage (in browser).
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
