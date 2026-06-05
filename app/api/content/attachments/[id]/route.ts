import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { data: attachment } = await auth.supabase
    .from('step_attachments')
    .select('file_url')
    .eq('id', params.id)
    .single()

  const { error } = await auth.supabase
    .from('step_attachments')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Remove from storage (fire-and-forget — path is after the bucket segment)
  if (attachment?.file_url) {
    try {
      const url = new URL(attachment.file_url)
      const parts = url.pathname.split('/step-attachments/')
      if (parts[1]) {
        await auth.supabase.storage.from('step-attachments').remove([parts[1]])
      }
    } catch {}
  }

  return NextResponse.json({ ok: true })
}
