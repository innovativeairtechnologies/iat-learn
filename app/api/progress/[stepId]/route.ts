import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const POINTS_PER_STEP = 10

export async function GET(_: Request, { params }: { params: { stepId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('user_step_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('step_id', params.stepId)
    .maybeSingle()

  return NextResponse.json(data ?? null)
}

export async function POST(request: Request, { params }: { params: { stepId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { status, time_spent_seconds } = body

  // Check if already completed before upserting (to avoid double-awarding points)
  const { data: existing } = await supabase
    .from('user_step_progress')
    .select('status')
    .eq('user_id', user.id)
    .eq('step_id', params.stepId)
    .maybeSingle()

  const wasAlreadyCompleted = existing?.status === 'completed'
  const isNowCompleting = status === 'completed'

  const payload: Record<string, unknown> = {
    user_id: user.id,
    step_id: params.stepId,
    status,
  }
  if (time_spent_seconds !== undefined) payload.time_spent_seconds = time_spent_seconds
  if (isNowCompleting) payload.completed_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('user_step_progress')
    .upsert(payload, { onConflict: 'user_id,step_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Award points on first-time completion only
  if (isNowCompleting && !wasAlreadyCompleted) {
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('points')
      .eq('id', user.id)
      .single()

    if (profile) {
      await adminClient
        .from('user_profiles')
        .update({ points: profile.points + POINTS_PER_STEP })
        .eq('id', user.id)
    }
  }

  return NextResponse.json(data)
}
