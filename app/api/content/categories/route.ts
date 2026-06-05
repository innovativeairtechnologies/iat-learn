import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { name, icon, color } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data: existing } = await auth.supabase.from('categories').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
  const sort_order = (existing?.sort_order ?? -1) + 1

  const { data, error } = await auth.supabase
    .from('categories')
    .insert({ name: name.trim(), icon: icon ?? 'BookOpen', color: color ?? '#6366f1', sort_order })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  revalidatePath('/admin/content')
  return NextResponse.json(data)
}
