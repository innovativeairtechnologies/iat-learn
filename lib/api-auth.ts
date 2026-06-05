import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function requireAdmin() {
  // Use the user client only for session/JWT validation
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  // Use the admin client for role lookup — bypasses the circular RLS
  // dependency in user_profiles and matches the project pattern
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  // Return the admin client so all downstream operations bypass RLS reliably
  return { supabase, user }
}
