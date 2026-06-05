import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Verify caller is authenticated and is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: callerProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || !['admin', 'manager'].includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, role, department_id } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }
  if (!['employee', 'manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback?type=invite`,
    data: { role, department_id: department_id ?? null },
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  // Record the invitation
  await supabase.from('invitations').insert({
    email,
    role,
    department_id: department_id || null,
    invited_by: user.id,
  })

  return NextResponse.json({ ok: true })
}
