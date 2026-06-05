import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Route, BookOpen, Clock, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PathsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data: paths } = await adminClient
    .from('paths')
    .select(`
      *,
      path_subjects(id, sort_order, subjects(id, title, description, cover_image_url, topics(id, steps(id, estimated_minutes)))),
      path_enrollments(id, enrolled_at, completed_at)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  // Attach enrollment data for current user
  const enriched = (paths ?? []).map(path => {
    const enrollment = (path.path_enrollments as any[]).find((e: any) => e !== null)
    const subjects = [...(path.path_subjects as any[])].sort((a: any, b: any) => a.sort_order - b.sort_order)
    const totalSteps = subjects.flatMap((ps: any) => ps.subjects?.topics?.flatMap((t: any) => t.steps ?? []) ?? []).length
    const totalMins = subjects.flatMap((ps: any) => ps.subjects?.topics?.flatMap((t: any) => t.steps?.map((s: any) => s.estimated_minutes ?? 0) ?? []) ?? []).reduce((a: number, b: number) => a + b, 0)
    return { ...path, path_subjects: subjects, enrollment, totalSteps, totalMins }
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-1)' }}>
          Learning Paths
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Follow a curated sequence of subjects to build skills step by step
        </p>
      </div>

      {enriched.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--surface-2)' }}>
            <Route className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-2)' }}>No paths yet</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            Your admin is building learning paths — check back soon
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {enriched.map((path: any) => (
            <Link
              key={path.id}
              href={`/paths/${path.id}`}
              className="card-hover block p-5 group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-base leading-snug" style={{ color: 'var(--text-1)' }}>
                    {path.title}
                  </h3>
                  {path.description && (
                    <p className="text-sm mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-3)' }}>
                      {path.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--brand)' }} />
              </div>

              {/* Subject list preview */}
              <div className="flex flex-wrap gap-1 mb-3">
                {path.path_subjects.slice(0, 4).map((ps: any, i: number) => (
                  <span key={ps.id} className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                    {i + 1}. {ps.subjects?.title}
                  </span>
                ))}
                {path.path_subjects.length > 4 && (
                  <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
                    +{path.path_subjects.length - 4} more
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {path.path_subjects.length} subjects · {path.totalSteps} steps
                </span>
                {path.totalMins > 0 && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{path.totalMins}m
                    </span>
                  </>
                )}
                {path.enrollment && (
                  <>
                    <span>·</span>
                    <span className="font-medium" style={{ color: 'var(--brand)' }}>Enrolled</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
