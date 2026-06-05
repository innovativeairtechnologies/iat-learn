import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LearnBrowser from './LearnBrowser'

export default async function LearnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createAdminClient()

  const [{ data: subjects }, { data: categories }, { data: profile }, { data: allAssignments }] = await Promise.all([
    adminClient
      .from('subjects')
      .select('id, title, description, cover_image_url, category_id, categories(id, name, icon, color), topics(id, steps(id, estimated_minutes))')
      .eq('is_published', true)
      .order('sort_order'),
    adminClient
      .from('categories')
      .select('id, name, icon, color')
      .order('sort_order'),
    adminClient
      .from('user_profiles')
      .select('department_id')
      .eq('id', user!.id)
      .single(),
    adminClient
      .from('subject_assignments')
      .select('subject_id, user_id, department_id'),
  ])

  const userDeptId = profile?.department_id

  // Group assignments by subject_id
  const assignmentsBySubject = new Map<string, { userIds: Set<string>; deptIds: Set<string> }>()
  for (const row of allAssignments ?? []) {
    if (!assignmentsBySubject.has(row.subject_id)) {
      assignmentsBySubject.set(row.subject_id, { userIds: new Set(), deptIds: new Set() })
    }
    const entry = assignmentsBySubject.get(row.subject_id)!
    if (row.user_id) entry.userIds.add(row.user_id)
    if (row.department_id) entry.deptIds.add(row.department_id)
  }

  // Filter: show if no assignments OR user/dept is explicitly assigned
  const visibleSubjects = (subjects ?? []).filter(sub => {
    const entry = assignmentsBySubject.get(sub.id)
    if (!entry) return true // no restrictions — visible to all
    if (entry.userIds.has(user!.id)) return true
    if (userDeptId && entry.deptIds.has(userDeptId)) return true
    return false
  })

  return <LearnBrowser subjects={visibleSubjects as any} categories={categories ?? []} />
}
