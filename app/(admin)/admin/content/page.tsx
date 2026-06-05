import { createAdminClient } from '@/lib/supabase/admin'
import ContentHome from './ContentHome'

export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  const admin = createAdminClient()

  const [{ data: categories }, { data: subjects }] = await Promise.all([
    admin.from('categories').select('*').order('sort_order'),
    admin.from('subjects').select('*, categories(id, name, icon, color), topics(id)').order('sort_order'),
  ])

  return (
    <ContentHome
      initialCategories={categories ?? []}
      initialSubjects={(subjects ?? []).map(s => ({
        ...s,
        topic_count: Array.isArray(s.topics) ? s.topics.length : 0,
        topics: undefined,
      }))}
    />
  )
}
