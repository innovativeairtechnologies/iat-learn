import { createClient } from '@/lib/supabase/server'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const supabase = await createClient()

  const [{ data: users }, { data: departments }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*, departments(name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('departments')
      .select('id, name')
      .order('sort_order'),
  ])

  // Fetch pending invitations via API to use service role for emails
  const { data: invitations } = await supabase
    .from('invitations')
    .select('*, departments(name)')
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return (
    <UsersClient
      users={users ?? []}
      departments={departments ?? []}
      invitations={invitations ?? []}
    />
  )
}
