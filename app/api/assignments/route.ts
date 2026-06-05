import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { sendSubjectAssignedEmail } from '@/lib/email'

// GET /api/assignments?subject_id=xxx — list assignments for a subject
export async function GET(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const subjectId = searchParams.get('subject_id')
  if (!subjectId) return NextResponse.json({ error: 'subject_id required' }, { status: 400 })

  const { data, error: dbErr } = await supabase!
    .from('subject_assignments')
    .select('*, user_profiles(id, display_name, email), departments(id, name)')
    .eq('subject_id', subjectId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST /api/assignments — create an assignment
export async function POST(request: Request) {
  const { supabase, user, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { subject_id, user_id, department_id } = body

  if (!subject_id || (!user_id && !department_id)) {
    return NextResponse.json({ error: 'subject_id and one of user_id/department_id required' }, { status: 400 })
  }

  const { data, error: dbErr } = await supabase!
    .from('subject_assignments')
    .insert({ subject_id, user_id: user_id ?? null, department_id: department_id ?? null, assigned_by: user!.id })
    .select('*, user_profiles(id, display_name, email), departments(id, name)')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

  // Send email notification to directly-assigned user (fire-and-forget)
  if (user_id && (data as any).user_profiles?.email) {
    const { data: subject } = await supabase!.from('subjects').select('id, title').eq('id', subject_id).single()
    if (subject) {
      sendSubjectAssignedEmail({
        to: (data as any).user_profiles.email,
        displayName: (data as any).user_profiles.display_name ?? (data as any).user_profiles.email,
        subjectTitle: subject.title,
        subjectId: subject.id,
      }).catch(() => {})
    }
  }

  return NextResponse.json(data)
}

// DELETE /api/assignments?id=xxx — remove an assignment
export async function DELETE(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error: dbErr } = await supabase!.from('subject_assignments').delete().eq('id', id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
