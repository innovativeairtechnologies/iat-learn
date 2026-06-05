import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminSidebar from '@/components/admin/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use service role to bypass any RLS edge cases on the role lookup
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const name = profile.display_name || user.email?.split('@')[0] || 'Admin'

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <AdminSidebar userName={name} role={profile.role} />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
