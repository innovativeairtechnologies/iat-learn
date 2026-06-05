import { createAdminClient } from '@/lib/supabase/admin'
import { BarChart2, Users, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtTime(secs: number): string {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return m % 60 > 0 ? `${h}h ${m % 60}m` : `${h}h`
}

export default async function AdminReportsPage() {
  const admin = createAdminClient()

  const [
    { data: subjects },
    { data: progress },
    { data: topUsers },
    { data: recentCompletions },
    { count: totalUsers },
  ] = await Promise.all([
    admin.from('subjects').select('id, title, topics(steps(id))').eq('is_published', true),
    admin.from('user_step_progress').select('user_id, step_id, status, time_spent_seconds, completed_at, steps(topic_id, topics(subject_id))').eq('status', 'completed'),
    admin.from('user_profiles').select('id, display_name, points, departments(name)').eq('is_active', true).order('points', { ascending: false }).limit(10),
    admin.from('user_step_progress')
      .select('user_id, completed_at, steps(title, topics(subjects(title))), user_profiles(display_name)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(15),
    admin.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  // Per-subject stats
  const subjectStats = (subjects ?? []).map(sub => {
    const allStepIds = (sub.topics as any[])?.flatMap((t: any) => t.steps?.map((s: any) => s.id) ?? []) ?? []
    const totalSteps = allStepIds.length
    const completedByUser: Record<string, Set<string>> = {}
    for (const row of progress ?? []) {
      const subjectId = (row.steps as any)?.topics?.subject_id
      if (subjectId !== sub.id) continue
      if (!completedByUser[row.user_id]) completedByUser[row.user_id] = new Set()
      completedByUser[row.user_id].add(row.step_id)
    }
    const usersStarted = Object.keys(completedByUser).length
    const usersCompleted = Object.values(completedByUser).filter(s => s.size >= totalSteps && totalSteps > 0).length
    const completionRate = usersStarted > 0 && totalSteps > 0
      ? Math.round((usersCompleted / usersStarted) * 100) : 0

    return { id: sub.id, title: sub.title, totalSteps, usersStarted, usersCompleted, completionRate }
  }).sort((a, b) => b.usersStarted - a.usersStarted)

  const totalCompletions = (progress ?? []).length
  const totalTimeSeconds = (progress ?? []).reduce((s, r) => s + (r.time_spent_seconds ?? 0), 0)
  const uniqueLearners = new Set((progress ?? []).map(r => r.user_id)).size

  return (
    <div className="animate-fade-in px-8 pt-8 pb-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Reports</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Completion rates, engagement, and learner activity</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { icon: Users,        value: String(totalUsers ?? 0),       label: 'Active employees',  color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
          { icon: Users,        value: String(uniqueLearners),         label: 'Active learners',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
          { icon: CheckCircle2, value: String(totalCompletions),       label: 'Step completions',  color: '#10c060', bg: 'rgba(16,192,96,0.12)' },
          { icon: Clock,        value: fmtTime(totalTimeSeconds),      label: 'Total learning time', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-4">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-2" style={{ background: stat.bg }}>
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject completion rates */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <BarChart2 className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Subject engagement</h2>
          </div>
          {subjectStats.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>No activity yet</p>
          ) : (
            <div>
              {subjectStats.map(sub => (
                <div key={sub.id} className="px-4 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-1)' }}>{sub.title}</p>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>
                      {sub.usersStarted} started · {sub.usersCompleted} done
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${sub.completionRate}%`, background: 'var(--brand)' }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                    {sub.completionRate}% completion rate · {sub.totalSteps} steps
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top learners */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Top learners</h2>
          </div>
          {(topUsers ?? []).filter(u => u.points > 0).length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>No points earned yet</p>
          ) : (
            <div>
              {(topUsers ?? []).filter(u => u.points > 0).map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-sm w-5 text-center font-medium tabular-nums" style={{ color: 'var(--text-3)' }}>{i + 1}</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'var(--brand)' }}>
                    {u.display_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{u.display_name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                      {(u.departments as { name?: string } | null)?.name ?? 'No dept'}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>
                    {u.points.toLocaleString()} <span className="text-xs font-normal" style={{ color: 'var(--text-3)' }}>pts</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent completions */}
      {(recentCompletions ?? []).length > 0 && (
        <div className="card overflow-hidden mt-6">
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Recent completions</h2>
          </div>
          {(recentCompletions ?? []).map((row: any, i: number) => {
            const step = row.steps as any
            const subject = step?.topics?.subjects?.title
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--brand)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{step?.title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                    {(row.user_profiles as any)?.display_name}{subject ? ` · ${subject}` : ''}
                  </p>
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
