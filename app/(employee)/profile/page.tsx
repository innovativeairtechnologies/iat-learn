import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Trophy, CheckCircle2, Clock, BookOpen, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('*, departments(name)')
    .eq('id', user.id)
    .single()

  const [
    { count: completedSteps },
    { count: inProgressSteps },
    { data: recentActivity },
    { count: totalRank },
  ] = await Promise.all([
    adminClient
      .from('user_step_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed'),
    adminClient
      .from('user_step_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'in_progress'),
    adminClient
      .from('user_step_progress')
      .select('completed_at, steps(title, topics(subjects(title)))')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5),
    // Count how many active users have more points (rank = this + 1)
    adminClient
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gt('points', profile?.points ?? 0),
  ])

  const dept = (profile?.departments as { name?: string } | null)?.name
  const rank = (totalRank ?? 0) + 1
  const totalTimeQuery = await adminClient
    .from('user_step_progress')
    .select('time_spent_seconds')
    .eq('user_id', user.id)
  const totalSeconds = totalTimeQuery.data?.reduce((s, r) => s + (r.time_spent_seconds ?? 0), 0) ?? 0
  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMins = Math.floor((totalSeconds % 3600) / 60)

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Profile card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{ background: 'var(--brand)' }}
          >
            {profile?.display_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
              {profile?.display_name ?? 'Unknown'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
              {profile?.email}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {dept && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                  <Building2 className="w-3 h-3" />
                  {dept}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                {profile?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Trophy,       value: profile?.points.toLocaleString() ?? '0', label: 'Points',           color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
          { icon: Trophy,       value: `#${rank}`,                               label: 'Rank',             color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
          { icon: CheckCircle2, value: String(completedSteps ?? 0),              label: 'Steps completed',  color: '#10c060', bg: 'rgba(16,192,96,0.12)' },
          { icon: Clock,        value: totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`, label: 'Time learning', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-4">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-2" style={{ background: stat.bg }}>
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
                {stat.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* In progress */}
      {(inProgressSteps ?? 0) > 0 && (
        <div className="card p-4 mb-4 flex items-center gap-3">
          <BookOpen className="w-4 h-4 shrink-0" style={{ color: 'var(--brand)' }} />
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{inProgressSteps}</span>{' '}
            step{inProgressSteps !== 1 ? 's' : ''} in progress
          </p>
        </div>
      )}

      {/* Recent completions */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Recent completions</h2>
          </div>
          {recentActivity.map((row: any) => {
            const step = row.steps as any
            const subject = step?.topics?.subjects?.title
            return (
              <div key={row.completed_at} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--brand)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{step?.title}</p>
                  {subject && <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{subject}</p>}
                </div>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>
                  {new Date(row.completed_at).toLocaleDateString()}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
