import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { title, description, subject_id } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  if (!subject_id)     return NextResponse.json({ error: 'subject_id required' }, { status: 400 })

  const { data: existing } = await auth.supabase.from('topics').select('sort_order').eq('subject_id', subject_id).order('sort_order', { ascending: false }).limit(1).single()
  const sort_order = (existing?.sort_order ?? -1) + 1

  const { data, error } = await auth.supabase
    .from('topics')
    .insert({ title: title.trim(), description: description || null, subject_id, sort_order })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
