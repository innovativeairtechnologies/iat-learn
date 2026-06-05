export type UserRole = 'admin' | 'manager' | 'employee'

export type Department = {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export type UserProfile = {
  id: string
  email: string | null
  display_name: string | null
  department_id: string | null
  role: UserRole
  avatar_url: string | null
  points: number
  is_active: boolean
  hired_at: string | null
  created_at: string
  updated_at: string
  departments?: Department
}

export type Invitation = {
  id: string
  email: string
  role: UserRole
  department_id: string | null
  invited_by: string | null
  accepted_at: string | null
  expires_at: string
  created_at: string
  departments?: Department
  inviter?: UserProfile
}

export type Category = {
  id: string
  name: string
  icon: string
  color: string
  sort_order: number
  created_at: string
}

export type Subject = {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  category_id: string | null
  sort_order: number
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Topic = {
  id: string
  subject_id: string
  title: string
  description: string | null
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export type Step = {
  id: string
  topic_id: string
  title: string
  content: Record<string, unknown> | null
  video_url: string | null
  estimated_minutes: number | null
  sort_order: number
  is_published: boolean
  requires_quiz: boolean
  created_at: string
  updated_at: string
}

export type UserStepProgress = {
  id: string
  user_id: string
  step_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  completed_at: string | null
  time_spent_seconds: number
}

export type StepAttachment = {
  id: string
  step_id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  created_at: string
}

export type SubjectAssignment = {
  id: string
  subject_id: string
  user_id: string | null
  department_id: string | null
  assigned_by: string | null
  assigned_at: string
  user_profiles?: UserProfile
  departments?: Department
}

export type Path = {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type PathSubject = {
  id: string
  path_id: string
  subject_id: string
  sort_order: number
  subjects?: Subject
}

export type PathEnrollment = {
  id: string
  path_id: string
  user_id: string
  enrolled_at: string
  completed_at: string | null
}

export type QuizQuestion = {
  id: string
  step_id: string
  question: string
  sort_order: number
  created_at: string
  quiz_options?: QuizOption[]
}

export type QuizOption = {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  sort_order: number
}

export type QuizAttempt = {
  id: string
  user_id: string
  step_id: string
  score: number
  passed: boolean
  attempted_at: string
}
