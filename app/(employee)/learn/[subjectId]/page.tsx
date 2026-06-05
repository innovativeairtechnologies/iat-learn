import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock, FileText, ChevronRight } from 'lucide-react'

export default async function SubjectOverviewPage({ params }: { params: { subjectId: string } }) {
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('*, categories(id, name, icon, color), topics(*, steps(*))')
    .eq('id', params.subjectId)
    .eq('is_published', true)
    .order('sort_order', { referencedTable: 'topics' })
    .order('sort_order', { referencedTable: 'steps' })
    .single()

  if (!subject) notFound()

  const topics = (subject.topics ?? []).map((t: Record<string, unknown>) => ({
    ...(t as object),
    steps: Array.isArray(t.steps) ? t.steps : [],
  })) as Array<{ id: string; title: string; steps: Array<{ id: string; title: string; estimated_minutes: number | null }> }>

  const allSteps = topics.flatMap(t => t.steps)
  const firstStep = allSteps[0] ?? null
  const totalMins = allSteps.reduce((sum, s) => sum + (s.estimated_minutes ?? 0), 0)
  const cat = subject.categories as { id: string; name: string; icon: string; color: string } | null

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Back */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors hover-text-2"
        style={{ color: 'var(--text-3)' }}
      >
        <ChevronLeft className="w-4 h-4" /> Back to Learn
      </Link>

      {/* Header */}
      <div className="mb-8">
        {cat && (
          <span
            className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full mb-3"
            style={{ background: `${cat.color}18`, color: cat.color }}
          >
            {cat.name}
          </span>
        )}
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-1)' }}>
          {subject.title}
        </h1>
        {subject.description && (
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-3)' }}>
            {subject.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm mb-6" style={{ color: 'var(--text-3)' }}>
          <span>{topics.length} topic{topics.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{allSteps.length} step{allSteps.length !== 1 ? 's' : ''}</span>
          {totalMins > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                ~{totalMins}m total
              </span>
            </>
          )}
        </div>

        {firstStep ? (
          <Link
            href={`/learn/${subject.id}/steps/${firstStep.id}`}
            className="btn-primary px-5"
          >
            Start Learning
          </Link>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--text-3)' }}>No content published yet</p>
        )}
      </div>

      {/* Topic / step tree */}
      {topics.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
            Contents
          </h2>
          {topics.map((topic, ti) => (
            <div key={topic.id} className="card overflow-hidden">
              {/* Topic header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span
                  className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded shrink-0"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
                >
                  {ti + 1}
                </span>
                <span className="font-medium text-sm flex-1" style={{ color: 'var(--text-1)' }}>
                  {topic.title}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                  {topic.steps.length} step{topic.steps.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Steps */}
              {topic.steps.map(step => (
                <Link
                  key={step.id}
                  href={`/learn/${subject.id}/steps/${step.id}`}
                  className="flex items-center gap-3 pl-11 pr-4 py-2.5 border-b transition-colors group hover-surface"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-3)' }} />
                  <span className="flex-1 text-sm" style={{ color: 'var(--text-2)' }}>{step.title}</span>
                  {step.estimated_minutes != null && step.estimated_minutes > 0 && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                      <Clock className="w-3 h-3" />
                      {step.estimated_minutes}m
                    </span>
                  )}
                  <ChevronRight
                    className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    style={{ color: 'var(--brand)' }}
                  />
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
