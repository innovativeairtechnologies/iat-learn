import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Trophy, Medal, Crown } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createAdminClient()
  const { data: users } = await adminClient
    .from('user_profiles')
    .select('id, display_name, points, departments(name)')
    .eq('is_active', true)
    .order('points', { ascending: false })
    .limit(50)

  const currentUserRank = users?.findIndex(u => u.id === user?.id) ?? -1

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'rgba(251,191,36,0.12)' }}
        >
          <Trophy className="w-6 h-6" style={{ color: '#fbbf24' }} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
          Leaderboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Top learners ranked by points earned
        </p>
      </div>

      {/* Current user callout (if not in top 3) */}
      {currentUserRank >= 3 && user && users && (
        <div
          className="card p-4 mb-4 flex items-center gap-3"
          style={{ borderColor: 'var(--brand)', background: 'var(--brand-light)' }}
        >
          <span className="text-sm font-semibold w-8 text-center" style={{ color: 'var(--text-3)' }}>
            #{currentUserRank + 1}
          </span>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'var(--brand)' }}
          >
            {users[currentUserRank].display_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              You — {users[currentUserRank].display_name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              {(users[currentUserRank].departments as { name?: string } | null)?.name ?? 'No department'}
            </p>
          </div>
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--brand)' }}>
            {users[currentUserRank].points.toLocaleString()} pts
          </span>
        </div>
      )}

      {/* Leaderboard list */}
      <div className="card overflow-hidden">
        {users?.length === 0 && (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--text-3)' }}>
            No activity yet — complete some steps to earn points!
          </p>
        )}
        {users?.map((u, i) => {
          const isCurrentUser = u.id === user?.id
          const rank = i + 1
          const dept = (u.departments as { name?: string } | null)?.name

          return (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors"
              style={{
                borderColor: 'var(--border)',
                background: isCurrentUser ? 'var(--brand-light)' : 'transparent',
              }}
            >
              {/* Rank */}
              <div className="w-8 shrink-0 flex justify-center">
                {rank === 1 ? (
                  <Crown className="w-5 h-5" style={{ color: '#fbbf24' }} />
                ) : rank === 2 ? (
                  <Medal className="w-4 h-4" style={{ color: '#94a3b8' }} />
                ) : rank === 3 ? (
                  <Medal className="w-4 h-4" style={{ color: '#cd7f32' }} />
                ) : (
                  <span className="text-sm tabular-nums font-medium" style={{ color: 'var(--text-3)' }}>
                    {rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: isCurrentUser ? 'var(--brand)' : 'var(--surface-3)' }}
              >
                <span style={{ color: isCurrentUser ? 'white' : 'var(--text-2)' }}>
                  {u.display_name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              </div>

              {/* Name + dept */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                  {u.display_name ?? 'Unknown'}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-xs" style={{ color: 'var(--brand)' }}>(you)</span>
                  )}
                </p>
                {dept && (
                  <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{dept}</p>
                )}
              </div>

              {/* Points */}
              <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: 'var(--text-1)' }}>
                {u.points.toLocaleString()}
                <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-3)' }}>pts</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
