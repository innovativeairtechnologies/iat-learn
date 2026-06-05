import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET() {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const [
    { data: subjects },
    { data: progress },
    { data: topUsers },
    { data: recentCompletions },
  ] = await Promise.all([
    // All published subjects with step counts
    supabase!
      .from('subjects')
      .select('id, title, topics(steps(id))')
      .eq('is_published', true),

    // All completed progress rows with user + step info
    supabase!
      .from('user_step_progress')
      .select('user_id, step_id, status, time_spent_seconds, completed_at, steps(topic_id, topics(subject_id))')
      .eq('status', 'completed'),

    // Top earners
    supabase!
      .from('user_profiles')
      .select('id, display_name, points, departments(name)')
      .eq('is_active', true)
      .order('points', { ascending: false })
      .limit(10),

    // Recent 20 completions
    supabase!
      .from('user_step_progress')
      .select('user_id, completed_at, steps(title, topics(subjects(title))), user_profiles(display_name)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(20),
  ])

  // Build per-subject completion rates
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

    return {
      id: sub.id,
      title: sub.title,
      totalSteps,
      usersStarted,
      usersCompleted,
      completionRate: usersStarted > 0 && totalSteps > 0
        ? Math.round((usersCompleted / usersStarted) * 100)
        : 0,
    }
  })

  // Total stats
  const totalCompletions = (progress ?? []).length
  const totalTimeSeconds = (progress ?? []).reduce((s, r) => s + (r.time_spent_seconds ?? 0), 0)
  const uniqueLearners = new Set((progress ?? []).map(r => r.user_id)).size

  return NextResponse.json({
    subjectStats,
    topUsers: topUsers ?? [],
    recentCompletions: recentCompletions ?? [],
    totals: {
      completions: totalCompletions,
      timeSeconds: totalTimeSeconds,
      uniqueLearners,
    },
  })
}
