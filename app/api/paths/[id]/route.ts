import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('paths')
    .select(`
      *,
      path_subjects(id, sort_order, subjects(id, title, description, cover_image_url, topics(id, title, sort_order, steps(id, title, sort_order, estimated_minutes)))),
      path_enrollments(id, enrolled_at, completed_at)
    `)
    .eq('id', params.id)
    .eq('path_enrollments.user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { title, description, is_published, subjects } = body

  const { data: path, error: dbErr } = await supabase!
    .from('paths')
    .update({ title, description, is_published })
    .eq('id', params.id)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

  if (subjects !== undefined) {
    await supabase!.from('path_subjects').delete().eq('path_id', params.id)
    if (subjects.length) {
      await supabase!.from('path_subjects').insert(
        subjects.map((sid: string, i: number) => ({
          path_id: params.id,
          subject_id: sid,
          sort_order: i,
        }))
      )
    }
  }

  return NextResponse.json(path)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { error: dbErr } = await supabase!.from('paths').delete().eq('id', params.id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
