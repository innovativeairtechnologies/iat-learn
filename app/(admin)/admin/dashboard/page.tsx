import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createTicketingClient } from '@/lib/supabase/ticketing'
import { Users, BookOpen, ArrowUpRight, Building2, Ticket, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const ticketing = createTicketingClient()

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: profile },
    { count: userCount },
    { count: subjectCount },
    { count: openTicketCount },
    { count: weekTicketCount },
  ] = await Promise.all([
    admin.from('user_profiles').select('display_name').eq('id', user!.id).single(),
    admin.from('user_profiles').select('*', { count: 'exact', head: true }),
    admin.from('subjects').select('*', { count: 'exact', head: true }).eq('is_published', true),
    ticketing.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    ticketing.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
  ])

  const firstName = profile?.display_name?.split(' ')[0] ?? 'there'

  const stats = [
    { label: 'Total Members',      value: String(userCount ?? 0),        icon: Users,    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',   cardClass: 'stat-card-blue'   },
    { label: 'Published Subjects', value: String(subjectCount ?? 0),     icon: BookOpen, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', cardClass: 'stat-card-purple' },
    { label: 'Open Tickets',       value: String(openTicketCount ?? 0),  icon: Ticket,   color: '#f87171', bg: 'rgba(248,113,113,0.12)', cardClass: 'stat-card-red'    },
    { label: 'Tickets This Week',  value: String(weekTicketCount ?? 0),  icon: Clock,    color: '#34d399', bg: 'rgba(52,211,153,0.12)',  cardClass: 'stat-card-green'  },
  ]

  const roadmap = [
    { label: 'Auth, users & departments',     done: true,  week: 'Wk 1–2' },
    { label: 'Content hierarchy & CRUD',      done: true,  week: 'Wk 3'   },
    { label: 'Tiptap rich-text step editor',  done: true,  week: 'Wk 4'   },
    { label: 'Employee subject browser',      done: true,  week: 'Wk 5'   },
    { label: 'Step progress & completion',    done: true,  week: 'Wk 6'   },
    { label: 'File attachments & storage',    done: true,  week: 'Wk 6'   },
  ]

  const doneCount = roadmap.filter(r => r.done).length
  const pct = Math.round((doneCount / roadmap.length) * 100)

  const quickActions = [
    { label: 'Invite a team member', sub: 'Send an email invite',       href: '/admin/users',       icon: Users     },
    { label: 'Manage departments',   sub: 'Add or edit departments',    href: '/admin/departments', icon: Building2 },
    { label: 'Create a subject',     sub: 'Build your content library', href: '/admin/content',     icon: BookOpen  },
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero header */}
      <div className="px-8 pt-8 pb-7 border-b" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--brand)' }}>
          Admin Dashboard
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
          Good to see you, {firstName}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          IAT Learn is in active development — Phase 1 Foundation
        </p>
      </div>

      <div className="p-8 max-w-5xl space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className={`card p-4 relative overflow-hidden ${stat.cardClass}`}>
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-3" style={{ background: stat.bg }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <p className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-3)' }}>{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Two column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Roadmap */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Phase 1 — Foundation</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{doneCount} of {roadmap.length} complete</p>
              </div>
              <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--brand)' }}>{pct}%</span>
            </div>

            <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ background: 'var(--surface-3)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'var(--brand)' }} />
            </div>

            <div className="space-y-2">
              {roadmap.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: item.done ? 'var(--brand)' : 'var(--surface-3)' }}>
                    {item.done && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm flex-1" style={{ color: item.done ? 'var(--text-2)' : 'var(--text-3)' }}>{item.label}</span>
                  <span className="text-[10px] font-medium tabular-nums" style={{ color: item.done ? 'var(--brand)' : 'var(--text-3)', opacity: item.done ? 0.7 : 0.5 }}>{item.week}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Quick actions</h2>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group hover-surface"
                  >
                    <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                      <Icon className="w-4 h-4" style={{ color: 'var(--text-2)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{action.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{action.sub}</p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-3)' }} />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
