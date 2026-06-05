import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/paths — list all published paths (employee) or all (admin)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const adminView = searchParams.get('admin') === '1'

  if (adminView) {
    const { supabase, error } = await requireAdmin()
    if (error) return error
    const { data, error: dbErr } = await supabase!
      .from('paths')
      .select('*, path_subjects(id, sort_order, subjects(id, title, description))')
      .order('created_at', { ascending: false })
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })
    return NextResponse.json(data)
  }

  // Employee: published paths only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error: dbErr } = await adminClient
    .from('paths')
    .select(`
      *,
      path_subjects(id, sort_order, subjects(id, title, description, cover_image_url)),
      path_enrollments(id, enrolled_at, completed_at)
    `)
    .eq('is_published', true)
    .eq('path_enrollments.user_id', user.id)
    .order('created_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST /api/paths — create a path (admin)
export async function POST(request: Request) {
  const { supabase, user, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { title, description, is_published, subjects } = body

  const { data: path, error: dbErr } = await supabase!
    .from('paths')
    .insert({ title, description, is_published: is_published ?? false, created_by: user!.id })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

  if (subjects?.length) {
    await supabase!.from('path_subjects').insert(
      subjects.map((sid: string, i: number) => ({
        path_id: path.id,
        subject_id: sid,
        sort_order: i,
      }))
    )
  }

  return NextResponse.json(path)
}
