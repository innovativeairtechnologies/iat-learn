'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, HelpCircle } from 'lucide-react'
import type { QuizQuestion, QuizOption } from '@/lib/types'

type Props = {
  stepId: string
  questions: (QuizQuestion & { quiz_options: QuizOption[] })[]
  onPassed: () => void
}

export default function StepQuiz({ stepId, questions, onPassed }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const allAnswered = questions.every(q => answers[q.id])

  async function submit() {
    setSubmitting(true)
    const res = await fetch(`/api/quiz/${stepId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
    const data = await res.json()
    setResult(data)
    setSubmitting(false)
    if (data.passed) {
      setTimeout(onPassed, 1200)
    }
  }

  if (result) {
    return (
      <div
        className="rounded-xl p-5 border mb-6"
        style={{
          background: result.passed ? 'var(--brand-light)' : 'rgba(239,68,68,0.06)',
          borderColor: result.passed ? 'rgba(8,148,71,0.2)' : 'rgba(239,68,68,0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          {result.passed
            ? <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--brand)' }} />
            : <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
          }
          <span className="font-semibold text-sm" style={{ color: result.passed ? 'var(--brand)' : '#ef4444' }}>
            {result.passed ? 'Quiz passed!' : 'Not quite — try again'}
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          {result.correct}/{result.total} correct — {result.score}%
          {result.passed ? ' — marking step complete…' : ''}
        </p>
        {!result.passed && (
          <button
            onClick={() => { setResult(null); setAnswers({}) }}
            className="mt-3 text-sm font-medium"
            style={{ color: '#ef4444' }}
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
          Knowledge check — complete to mark step done
        </h3>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={q.id} className="card p-4">
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-1)' }}>
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {[...q.quiz_options].sort((a, b) => a.sort_order - b.sort_order).map(opt => (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: answers[q.id] === opt.id ? 'var(--brand-light)' : 'var(--surface-2)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: answers[q.id] === opt.id ? 'rgba(8,148,71,0.3)' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.id}
                    checked={answers[q.id] === opt.id}
                    onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: answers[q.id] === opt.id ? 'var(--brand)' : 'var(--border-2)',
                    }}
                  >
                    {answers[q.id] === opt.id && (
                      <div className="w-2 h-2 rounded-full" style={{ background: 'var(--brand)' }} />
                    )}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-1)' }}>{opt.option_text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={!allAnswered || submitting}
        className="btn-primary mt-4 gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Submit answers
      </button>
    </div>
  )
}
