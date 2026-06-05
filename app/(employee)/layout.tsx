import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EmployeeTopNav from '@/components/employee/TopNav'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, points, role')
    .eq('id', user.id)
    .single()

  const name = profile?.display_name || user.email?.split('@')[0] || 'User'
  const points = profile?.points ?? 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <EmployeeTopNav userName={name} points={points} />
      <main className="max-w-4xl mx-auto px-4 pt-8 pb-12">
        {children}
      </main>
    </div>
  )
}
