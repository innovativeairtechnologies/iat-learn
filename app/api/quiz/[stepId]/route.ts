import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/api-auth'

// GET — fetch questions (with options, correct answers hidden for employees)
export async function GET(request: Request, { params }: { params: { stepId: string } }) {
  const { searchParams } = new URL(request.url)
  const adminView = searchParams.get('admin') === '1'

  if (adminView) {
    const { supabase, error } = await requireAdmin()
    if (error) return error
    const { data, error: dbErr } = await supabase!
      .from('quiz_questions')
      .select('*, quiz_options(*)')
      .eq('step_id', params.stepId)
      .order('sort_order')
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })
    return NextResponse.json(data ?? [])
  }

  // Employee view — hide is_correct
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('quiz_questions')
    .select('id, question, sort_order, quiz_options(id, option_text, sort_order)')
    .eq('step_id', params.stepId)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}

// POST — admin upsert full quiz (replaces all questions/options)
export async function POST(request: Request, { params }: { params: { stepId: string } }) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { questions } = body as {
    questions: Array<{ question: string; sort_order: number; options: Array<{ option_text: string; is_correct: boolean; sort_order: number }> }>
  }

  // Delete all existing questions (cascades to options)
  await supabase!.from('quiz_questions').delete().eq('step_id', params.stepId)

  for (const q of questions) {
    const { data: qRow, error: qErr } = await supabase!
      .from('quiz_questions')
      .insert({ step_id: params.stepId, question: q.question, sort_order: q.sort_order })
      .select()
      .single()
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 400 })

    if (q.options.length) {
      await supabase!.from('quiz_options').insert(
        q.options.map(opt => ({ question_id: qRow.id, ...opt }))
      )
    }
  }

  return NextResponse.json({ ok: true })
}
