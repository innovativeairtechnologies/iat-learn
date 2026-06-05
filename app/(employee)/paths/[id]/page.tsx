import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookOpen, Clock, ChevronRight, CheckCircle2 } from 'lucide-react'
import EnrollButton from './EnrollButton'

export const dynamic = 'force-dynamic'

export default async function PathDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()

  const [{ data: path }, { data: completedProgress }] = await Promise.all([
    adminClient
      .from('paths')
      .select(`
        *,
        path_subjects(id, sort_order, subjects(id, title, description, cover_image_url, topics(id, title, sort_order, steps(id, title, sort_order, estimated_minutes)))),
        path_enrollments(id, enrolled_at, completed_at)
      `)
      .eq('id', params.id)
      .eq('is_published', true)
      .single(),
    adminClient
      .from('user_step_progress')
      .select('step_id')
      .eq('user_id', user.id)
      .eq('status', 'completed'),
  ])

  if (!path) notFound()

  const completedStepIds = new Set((completedProgress ?? []).map(r => r.step_id))
  const enrollment = (path.path_enrollments as any[]).find((e: any) => e !== null)
  const subjects = [...(path.path_subjects as any[])].sort((a: any, b: any) => a.sort_order - b.sort_order)

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Back */}
      <Link href="/paths" className="inline-flex items-center gap-1.5 text-sm mb-5 transition-colors"
        style={{ color: 'var(--text-3)' }}
        onMouseOver={(e: any) => e.currentTarget.style.color = 'var(--text-1)'}
        onMouseOut={(e: any) => e.currentTarget.style.color = 'var(--text-3)'}
      >
        ← Learning Paths
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-1)' }}>
          {path.title}
        </h1>
        {path.description && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>{path.description}</p>
        )}
        <div className="flex items-center gap-3 mt-4">
          <EnrollButton pathId={path.id} enrolled={!!enrollment} />
        </div>
      </div>

      {/* Subjects */}
      <div className="space-y-3">
        {subjects.map((ps: any, si: number) => {
          const sub = ps.subjects
          const topics = [...(sub.topics ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
          const allSteps = topics.flatMap((t: any) => t.steps ?? [])
          const completedCount = allSteps.filter((s: any) => completedStepIds.has(s.id)).length
          const isStarted = completedCount > 0
          const isDone = completedCount === allSteps.length && allSteps.length > 0
          const totalMins = allSteps.reduce((a: number, s: any) => a + (s.estimated_minutes ?? 0), 0)

          return (
            <div key={ps.id} className="card overflow-hidden">
              <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: isDone ? 'rgba(16,192,96,0.12)' : 'var(--surface-2)',
                      color: isDone ? 'var(--brand)' : 'var(--text-3)',
                    }}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : si + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{sub.title}</h3>
                    {sub.description && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-3)' }}>{sub.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
                      <span>{allSteps.length} steps</span>
                      {totalMins > 0 && <><span>·</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />~{totalMins}m</span></>}
                      {isStarted && !isDone && (
                        <span style={{ color: 'var(--brand)' }}>{completedCount}/{allSteps.length} done</span>
                      )}
                      {isDone && <span style={{ color: 'var(--brand)' }}>Complete ✓</span>}
                    </div>
                  </div>
                  <Link
                    href={`/learn/${sub.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
                    style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                  >
                    {isDone ? 'Review' : isStarted ? 'Continue' : 'Start'}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Topic list */}
              {topics.map((topic: any) => {
                const steps = [...(topic.steps ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
                return (
                  <div key={topic.id} className="px-4 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>{topic.title}</p>
                    <div className="space-y-1">
                      {steps.map((step: any) => {
                        const done = completedStepIds.has(step.id)
                        return (
                          <div key={step.id} className="flex items-center gap-2 text-xs">
                            {done
                              ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--brand)' }} />
                              : <div className="w-3.5 h-3.5 rounded-full border shrink-0" style={{ borderColor: 'var(--border-2)' }} />
                            }
                            <span style={{ color: done ? 'var(--text-2)' : 'var(--text-3)' }}>{step.title}</span>
                            {step.estimated_minutes && (
                              <span className="ml-auto" style={{ color: 'var(--text-3)' }}>{step.estimated_minutes}m</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
