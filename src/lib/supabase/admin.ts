import { createClient } from '@supabase/supabase-js';

/**
 * Supabase admin client — uses the service_role key.
 *
 * ⚠️  IMPORTANT: This client bypasses all Row Level Security (RLS) policies.
 *    - NEVER import this in Client Components or expose it to the browser.
 *    - ONLY use it in server-side contexts: API Routes, Server Actions, cron jobs.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. ' +
      'The admin client cannot be created without both.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Disable auto-refresh and session persistence — this is a server-only client.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
