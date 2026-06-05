import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import SubjectEditor from './SubjectEditor'
import CoverImageUpload from './CoverImageUpload'
import SubjectAssignments from './SubjectAssignments'

export default async function SubjectPage({ params }: { params: { subjectId: string } }) {
  const admin = createAdminClient()

  const [{ data: subject }, { data: categories }, { data: topics }, { data: assignments }, { data: allUsers }, { data: allDepts }] = await Promise.all([
    admin.from('subjects').select('*, categories(id, name, icon, color)').eq('id', params.subjectId).single(),
    admin.from('categories').select('id, name').order('sort_order'),
    admin.from('topics').select('*, steps(*)').eq('subject_id', params.subjectId).order('sort_order').order('sort_order', { referencedTable: 'steps' }),
    admin.from('subject_assignments').select('*, user_profiles(id, display_name, email), departments(id, name)').eq('subject_id', params.subjectId),
    admin.from('user_profiles').select('id, display_name, email').eq('is_active', true).order('display_name'),
    admin.from('departments').select('id, name').order('name'),
  ])

  if (!subject) notFound()

  return (
    <div>
      <SubjectEditor
        subject={subject}
        categories={categories ?? []}
        initialTopics={(topics ?? []).map(t => ({
          ...t,
          steps: Array.isArray(t.steps) ? t.steps : [],
        }))}
      />
      <div className="px-8 pb-8 max-w-3xl space-y-4">
        <CoverImageUpload subjectId={params.subjectId} initialUrl={subject.cover_image_url} />
        <SubjectAssignments
          subjectId={params.subjectId}
          initialAssignments={(assignments ?? []) as any}
          allUsers={(allUsers ?? []) as any}
          allDepts={(allDepts ?? []) as any}
        />
      </div>
    </div>
  )
}
