import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { title, topic_id, estimated_minutes } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  if (!topic_id)      return NextResponse.json({ error: 'topic_id required' }, { status: 400 })

  const { data: existing } = await auth.supabase.from('steps').select('sort_order').eq('topic_id', topic_id).order('sort_order', { ascending: false }).limit(1).single()
  const sort_order = (existing?.sort_order ?? -1) + 1

  const { data, error } = await auth.supabase
    .from('steps')
    .insert({ title: title.trim(), topic_id, sort_order, estimated_minutes: estimated_minutes || null })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
