import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PASS_THRESHOLD = 0.8 // 80% to pass

// POST — submit quiz answers, return score + pass/fail
export async function POST(request: Request, { params }: { params: { stepId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const answers = body.answers as Record<string, string> // { questionId: optionId }

  const adminClient = createAdminClient()

  // Fetch correct answers
  const { data: questions } = await adminClient
    .from('quiz_questions')
    .select('id, quiz_options(id, is_correct)')
    .eq('step_id', params.stepId)

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'No questions found' }, { status: 404 })
  }

  let correct = 0
  for (const q of questions) {
    const selectedId = answers[q.id]
    const correctOption = (q.quiz_options as any[]).find((o: any) => o.is_correct)
    if (correctOption && selectedId === correctOption.id) correct++
  }

  const score = Math.round((correct / questions.length) * 100)
  const passed = score / 100 >= PASS_THRESHOLD

  await supabase
    .from('quiz_attempts')
    .insert({ user_id: user.id, step_id: params.stepId, score, passed })

  return NextResponse.json({
    score,
    passed,
    correct,
    total: questions.length,
  })
}
