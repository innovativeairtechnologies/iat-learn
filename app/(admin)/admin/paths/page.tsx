import { createAdminClient } from '@/lib/supabase/admin'
import PathsClient from './PathsClient'

export const dynamic = 'force-dynamic'

export default async function AdminPathsPage() {
  const admin = createAdminClient()

  const [{ data: paths }, { data: subjects }] = await Promise.all([
    admin
      .from('paths')
      .select('*, path_subjects(id, sort_order, subjects(id, title))')
      .order('created_at', { ascending: false }),
    admin
      .from('subjects')
      .select('id, title, categories(name)')
      .eq('is_published', true)
      .order('title'),
  ])

  return <PathsClient initialPaths={(paths ?? []) as any} allSubjects={(subjects ?? []) as any} />
}
