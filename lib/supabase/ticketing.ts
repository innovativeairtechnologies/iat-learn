import { createClient } from '@supabase/supabase-js'

export function createTicketingClient() {
  const url = process.env.TICKETING_SUPABASE_URL!
  // Prefer service role key (bypasses RLS) if provided, fall back to anon
  const key = process.env.TICKETING_SUPABASE_SERVICE_ROLE_KEY ?? process.env.TICKETING_SUPABASE_ANON_KEY!
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}
