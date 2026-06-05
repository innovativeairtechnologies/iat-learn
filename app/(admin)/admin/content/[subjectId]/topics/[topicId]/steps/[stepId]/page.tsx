import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import StepEditorClient from './StepEditorClient'
import QuizEditor from './QuizEditor'

export default async function StepEditorPage({
  params,
}: {
  params: { subjectId: string; topicId: string; stepId: string }
}) {
  const admin = createAdminClient()

  const [{ data: step }, { data: topic }, { data: subject }, { data: quizQuestions }] = await Promise.all([
    admin.from('steps').select('*').eq('id', params.stepId).single(),
    admin.from('topics').select('id, title, subject_id').eq('id', params.topicId).single(),
    admin.from('subjects').select('id, title').eq('id', params.subjectId).single(),
    admin.from('quiz_questions').select('*, quiz_options(*)').eq('step_id', params.stepId).order('sort_order'),
  ])

  if (!step || !topic || !subject) notFound()

  return (
    <div>
      <StepEditorClient step={step} topic={topic} subject={subject} />
      <div className="max-w-4xl mx-auto px-8 pb-12">
        <QuizEditor
          stepId={params.stepId}
          requiresQuiz={step.requires_quiz}
          initialQuestions={(quizQuestions ?? []) as any}
        />
      </div>
    </div>
  )
}
