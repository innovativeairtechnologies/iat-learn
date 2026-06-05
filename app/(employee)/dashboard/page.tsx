import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BookOpen, Trophy, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function EmployeeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createAdminClient()

  const [
    { data: profile },
    { count: subjectCount },
    { count: completedCount },
  ] = await Promise.all([
    adminClient.from('user_profiles').select('display_name, points, departments(name)').eq('id', user!.id).single(),
    adminClient.from('subjects').select('*', { count: 'exact', head: true }).eq('is_published', true),
    adminClient.from('user_step_progress').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'completed'),
  ])

  const firstName = profile?.display_name?.split(' ')[0] ?? 'there'
  const dept = (profile?.departments as { name?: string } | null)?.name

  const stats = [
    {
      icon: BookOpen,
      label: 'Available',
      value: String(subjectCount ?? 0),
      sub: 'subjects',
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.12)',
      cardClass: 'stat-card-purple',
      href: '/learn',
    },
    {
      icon: CheckCircle2,
      label: 'Completed',
      value: String(completedCount ?? 0),
      sub: 'steps',
      color: '#10c060',
      bg: 'rgba(16,192,96,0.12)',
      cardClass: 'stat-card-green',
      href: null,
    },
    {
      icon: Trophy,
      label: 'Points',
      value: (profile?.points ?? 0).toLocaleString(),
      sub: 'earned',
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.12)',
      cardClass: 'stat-card-amber',
      href: null,
    },
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="-mx-4 -mt-8 px-8 pt-8 pb-7 mb-8 border-b" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--brand)' }}>
          {dept ?? 'IAT Learn'}
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
          Hey, {firstName} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Your learning journey starts here
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map(card => {
          const Icon = card.icon
          const inner = (
            <div className={`card p-4 h-full ${card.cardClass}`}>
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-3" style={{ background: card.bg }}>
                <Icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
              <p className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
                {card.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{card.sub}</p>
            </div>
          )
          return card.href ? (
            <Link key={card.label} href={card.href} className="block card-hover">
              {inner}
            </Link>
          ) : (
            <div key={card.label}>{inner}</div>
          )
        })}
      </div>

      {/* Learn CTA */}
      <Link
        href="/learn"
        className="block rounded-xl p-5 border transition-all group"
        style={{ background: 'var(--brand-light)', borderColor: 'rgba(8,148,71,0.2)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'rgba(8,148,71,0.15)' }}>
              <BookOpen className="w-4 h-4" style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-1)' }}>
                Browse the course library
              </p>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                {(subjectCount ?? 0) > 0
                  ? `${subjectCount} subject${subjectCount !== 1 ? 's' : ''} available — pick up where you left off or start something new`
                  : 'Your admin is building the course library — check back soon'
                }
              </p>
            </div>
          </div>
          <ArrowRight
            className="w-4 h-4 shrink-0 ml-4 transition-transform group-hover:translate-x-0.5"
            style={{ color: 'var(--brand)' }}
          />
        </div>
      </Link>
    </div>
  )
}
