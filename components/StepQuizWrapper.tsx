'use client'

import { useState } from 'react'
import StepQuiz from './StepQuiz'
import type { QuizQuestion, QuizOption } from '@/lib/types'

type Props = {
  stepId: string
  requiresQuiz: boolean
  questions: (QuizQuestion & { quiz_options: QuizOption[] })[]
  alreadyCompleted: boolean
}

export default function StepQuizWrapper({ stepId, requiresQuiz, questions, alreadyCompleted }: Props) {
  const [quizPassed, setQuizPassed] = useState(false)

  if (!requiresQuiz || alreadyCompleted || questions.length === 0) return null
  if (quizPassed) return null

  return (
    <StepQuiz
      stepId={stepId}
      questions={questions}
      onPassed={() => setQuizPassed(true)}
    />
  )
}
