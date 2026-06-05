import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { title, description, category_id } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const { data: existing } = await auth.supabase.from('subjects').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
  const sort_order = (existing?.sort_order ?? -1) + 1

  const { data, error } = await auth.supabase
    .from('subjects')
    .insert({ title: title.trim(), description: description || null, category_id: category_id || null, sort_order, created_by: auth.user.id })
    .select('*, categories(id, name, icon, color)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  revalidatePath('/admin/content')
  return NextResponse.json(data)
}
