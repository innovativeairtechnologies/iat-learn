import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const subjectId = formData.get('subject_id') as string | null

  if (!file || !subjectId) {
    return NextResponse.json({ error: 'file and subject_id required' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const path = `${subjectId}/cover.${ext}`

  const { error: uploadErr } = await supabase!.storage
    .from('subject-covers')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 400 })

  const { data: { publicUrl } } = supabase!.storage
    .from('subject-covers')
    .getPublicUrl(path)

  // Update the subject record
  await supabase!.from('subjects').update({ cover_image_url: publicUrl }).eq('id', subjectId)

  return NextResponse.json({ url: publicUrl })
}
