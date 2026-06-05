import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { items } = await request.json() as { items: { id: string; sort_order: number }[] }
  await Promise.all(items.map(({ id, sort_order }) =>
    auth.supabase.from('steps').update({ sort_order }).eq('id', id)
  ))
  return NextResponse.json({ ok: true })
}
