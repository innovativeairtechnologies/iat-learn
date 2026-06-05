import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { data } = await auth.supabase
    .from('step_attachments')
    .select('*')
    .eq('step_id', params.id)
    .order('created_at')

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { file_name, file_url, file_type, file_size } = await request.json()

  const { data, error } = await auth.supabase
    .from('step_attachments')
    .insert({ step_id: params.id, file_name, file_url, file_type, file_size })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
