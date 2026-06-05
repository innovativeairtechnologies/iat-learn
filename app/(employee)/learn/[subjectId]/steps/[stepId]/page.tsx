import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Clock, FileText, BookOpen,
  CheckCircle2, Paperclip, Download,
} from 'lucide-react'
import StepContentRenderer from '@/components/StepContentRenderer'
import StepProgressTracker from '@/components/StepProgressTracker'
import StepQuizWrapper from '@/components/StepQuizWrapper'
import type { UserStepProgress, StepAttachment } from '@/lib/types'

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').pop()
      if (id) return `https://player.vimeo.com/video/${id}`
    }
  } catch {}
  return url
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function StepReaderPage({
  params,
}: {
  params: { subjectId: string; stepId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: step },
    { data: subject },
    progressResult,
    allProgressResult,
    attachmentsResult,
  ] = await Promise.all([
    supabase.from('steps').select('*').eq('id', params.stepId).single(),
    supabase
      .from('subjects')
      .select('id, title, categories(id, name, color), topics(id, title, sort_order, steps(id, title, sort_order, estimated_minutes))')
      .eq('id', params.subjectId)
      .eq('is_published', true)
      .order('sort_order', { referencedTable: 'topics' })
      .order('sort_order', { referencedTable: 'steps' })
      .single(),
    // Progress queries — gracefully handle if migration hasn't run yet
    user
      ? supabase.from('user_step_progress').select('*').eq('user_id', user.id).eq('step_id', params.stepId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    user
      ? supabase.from('user_step_progress').select('step_id, status').eq('user_id', user.id)
      : Promise.resolve({ data: null, error: null }),
    supabase.from('step_attachments').select('*').eq('step_id', params.stepId).order('created_at'),
  ])

  const adminClient = createAdminClient()
  const { data: quizQuestions } = step?.requires_quiz
    ? await adminClient.from('quiz_questions').select('*, quiz_options(*)').eq('step_id', params.stepId).order('sort_order')
    : { data: null }

  if (!step || !subject) notFound()

  const topics = (subject.topics ?? []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    title: t.title as string,
    steps: Array.isArray(t.steps)
      ? t.steps as Array<{ id: string; title: string; estimated_minutes: number | null }>
      : [],
  }))

  const flatSteps = topics.flatMap(t => t.steps)
  const currentIdx = flatSteps.findIndex(s => s.id === params.stepId)
  const prevStep = currentIdx > 0 ? flatSteps[currentIdx - 1] : null
  const nextStep = currentIdx < flatSteps.length - 1 ? flatSteps[currentIdx + 1] : null
  const currentTopic = topics.find(t => t.steps.some(s => s.id === params.stepId))
  const catRaw = subject.categories as unknown
  const cat = (Array.isArray(catRaw) ? catRaw[0] : catRaw) as { id: string; name: string; color: string } | null

  const stepProgress = progressResult.error ? null : progressResult.data as UserStepProgress | null
  const completedIds = new Set(
    (allProgressResult.error ? [] : (allProgressResult.data ?? []) as Array<{ step_id: string; status: string }>)
      .filter(p => p.status === 'completed')
      .map(p => p.step_id),
  )
  const attachments = (attachmentsResult.data ?? []) as StepAttachment[]

  return (
    <div
      className="-mx-4 -mt-8 -mb-12 flex items-start"
      style={{ minHeight: 'calc(100vh - 3.5rem)' }}
    >
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 border-r sticky overflow-y-auto hidden md:block"
        style={{
          top: '3.5rem',
          height: 'calc(100vh - 3.5rem)',
          borderColor: 'var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div className="p-4">
          <Link
            href={`/learn/${subject.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium mb-4 transition-colors hover-text-2"
            style={{ color: 'var(--text-3)' }}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {subject.title}
          </Link>

          <div className="space-y-4">
            {topics.map(topic => (
              <div key={topic.id}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 px-1" style={{ color: 'var(--text-3)' }}>
                  {topic.title}
                </p>
                <div className="space-y-0.5">
                  {topic.steps.map(s => {
                    const isActive = s.id === params.stepId
                    const isDone = completedIds.has(s.id)
                    return (
                      <Link
                        key={s.id}
                        href={`/learn/${subject.id}/steps/${s.id}`}
                        className="flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors"
                        style={{
                          background: isActive ? 'var(--brand-light)' : 'transparent',
                          color: isActive ? 'var(--brand-text)' : isDone ? 'var(--text-2)' : 'var(--text-3)',
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        {isDone
                          ? <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'var(--brand)' }} />
                          : <FileText className="w-3 h-3 mt-0.5 shrink-0" style={{ color: isActive ? 'var(--brand)' : 'var(--text-3)' }} />
                        }
                        <span className="leading-relaxed">{s.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs mb-8" style={{ color: 'var(--text-3)' }}>
            <Link href="/learn" className="transition-colors hover-text-2" style={{ color: 'var(--text-3)' }}>
              Learn
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/learn/${subject.id}`} className="transition-colors hover-text-2" style={{ color: 'var(--text-3)' }}>
              {subject.title}
            </Link>
            {currentTopic && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span>{currentTopic.title}</span>
              </>
            )}
          </div>

          {/* Step title */}
          <h1 className="text-2xl font-bold tracking-tight leading-snug mb-3" style={{ color: 'var(--text-1)' }}>
            {step.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-8 pb-8 border-b" style={{ borderColor: 'var(--border)' }}>
            {(step.estimated_minutes ?? 0) > 0 && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
                <Clock className="w-3.5 h-3.5" />
                {step.estimated_minutes} min read
              </span>
            )}
            {cat && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${cat.color}18`, color: cat.color }}>
                {cat.name}
              </span>
            )}
          </div>

          {/* Rich text content */}
          <div className="mb-8">
            <StepContentRenderer content={step.content as Record<string, unknown> | null} />
          </div>

          {/* Featured video */}
          {step.video_url && (
            <div className="mb-8">
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)', aspectRatio: '16/9' }}>
                <iframe
                  src={toEmbedUrl(step.video_url)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={step.title}
                />
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="mb-8 card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  Attachments
                </span>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>({attachments.length})</span>
              </div>
              <div className="space-y-1">
                {attachments.map(att => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={att.file_name}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group hover-surface"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0 transition-colors" style={{ color: 'var(--text-3)' }} />
                    <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-2)' }}>
                      {att.file_name}
                    </span>
                    {att.file_size != null && (
                      <span className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>
                        {fmtBytes(att.file_size)}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Quiz (if required and not yet completed) */}
          <StepQuizWrapper
            stepId={params.stepId}
            requiresQuiz={step.requires_quiz}
            questions={(quizQuestions ?? []) as any}
            alreadyCompleted={stepProgress?.status === 'completed'}
          />

          {/* Progress tracker — Mark Complete */}
          <StepProgressTracker stepId={params.stepId} initialProgress={stepProgress} />

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            {prevStep ? (
              <Link href={`/learn/${subject.id}/steps/${prevStep.id}`} className="flex items-center gap-2 text-sm group" style={{ color: 'var(--text-3)' }}>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider mb-0.5">Previous</div>
                  <div className="font-medium transition-colors group-hover:text-[var(--text-1)] line-clamp-1 max-w-[180px]" style={{ color: 'var(--text-2)' }}>
                    {prevStep.title}
                  </div>
                </div>
              </Link>
            ) : <div />}

            {nextStep ? (
              <Link href={`/learn/${subject.id}/steps/${nextStep.id}`} className="flex items-center gap-2 text-sm text-right group ml-auto" style={{ color: 'var(--text-3)' }}>
                <div>
                  <div className="text-[10px] uppercase tracking-wider mb-0.5">Next</div>
                  <div className="font-medium transition-colors group-hover:text-[var(--text-1)] line-clamp-1 max-w-[180px]" style={{ color: 'var(--text-2)' }}>
                    {nextStep.title}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <Link href={`/learn/${subject.id}`} className="btn-primary text-sm px-4 ml-auto flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Subject complete
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
