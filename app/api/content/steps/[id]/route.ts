import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await request.json()
  const { data, error } = await auth.supabase
    .from('steps').update(body).eq('id', params.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { error } = await auth.supabase.from('steps').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
