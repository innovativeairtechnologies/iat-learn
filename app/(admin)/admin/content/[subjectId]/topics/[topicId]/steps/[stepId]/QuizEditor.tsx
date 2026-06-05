'use client'

import { useState } from 'react'
import { Plus, Trash2, Check, Loader2, HelpCircle, Save } from 'lucide-react'
import type { QuizQuestion, QuizOption } from '@/lib/types'

type EditableOption = { id?: string; option_text: string; is_correct: boolean }
type EditableQuestion = { id?: string; question: string; options: EditableOption[] }

export default function QuizEditor({
  stepId,
  requiresQuiz: initialRequiresQuiz,
  initialQuestions,
}: {
  stepId: string
  requiresQuiz: boolean
  initialQuestions: (QuizQuestion & { quiz_options: QuizOption[] })[]
}) {
  const [enabled, setEnabled] = useState(initialRequiresQuiz)
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    initialQuestions.length > 0
      ? initialQuestions.map(q => ({
          id: q.id,
          question: q.question,
          options: [...q.quiz_options].sort((a, b) => a.sort_order - b.sort_order).map(o => ({
            id: o.id,
            option_text: o.option_text,
            is_correct: o.is_correct,
          })),
        }))
      : []
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function addQuestion() {
    setQuestions(prev => [
      ...prev,
      { question: '', options: [{ option_text: '', is_correct: false }, { option_text: '', is_correct: false }] },
    ])
  }

  function removeQuestion(qi: number) {
    setQuestions(prev => prev.filter((_, i) => i !== qi))
  }

  function updateQuestion(qi: number, val: string) {
    setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, question: val } : q))
  }

  function addOption(qi: number) {
    setQuestions(prev => prev.map((q, i) => i === qi
      ? { ...q, options: [...q.options, { option_text: '', is_correct: false }] }
      : q
    ))
  }

  function removeOption(qi: number, oi: number) {
    setQuestions(prev => prev.map((q, i) => i === qi
      ? { ...q, options: q.options.filter((_, j) => j !== oi) }
      : q
    ))
  }

  function updateOption(qi: number, oi: number, val: string) {
    setQuestions(prev => prev.map((q, i) => i === qi
      ? { ...q, options: q.options.map((o, j) => j === oi ? { ...o, option_text: val } : o) }
      : q
    ))
  }

  function setCorrect(qi: number, oi: number) {
    setQuestions(prev => prev.map((q, i) => i === qi
      ? { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oi })) }
      : q
    ))
  }

  async function save() {
    setSaving(true)

    // Toggle requires_quiz on the step
    await fetch(`/api/content/steps/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requires_quiz: enabled }),
    })

    // Save quiz questions + options
    await fetch(`/api/quiz/${stepId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questions: questions.map((q, qi) => ({
          question: q.question,
          sort_order: qi,
          options: q.options.map((o, oi) => ({
            option_text: o.option_text,
            is_correct: o.is_correct,
            sort_order: oi,
          })),
        })),
      }),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="border-t pt-6 mt-6" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Knowledge Check</h3>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--brand)]"
          />
          <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Require quiz to complete</span>
        </label>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="card p-4">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-xs font-bold mt-2 w-5 text-center shrink-0" style={{ color: 'var(--text-3)' }}>
                {qi + 1}
              </span>
              <input
                value={q.question}
                onChange={e => updateQuestion(qi, e.target.value)}
                placeholder="Enter question…"
                className="input flex-1 text-sm"
              />
              <button
                onClick={() => removeQuestion(qi)}
                className="w-8 h-8 flex items-center justify-center rounded-lg mt-0.5 shrink-0 transition-colors text-red-400"
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 ml-7">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() => setCorrect(qi, oi)}
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                    title="Mark as correct answer"
                    style={{
                      borderColor: opt.is_correct ? 'var(--brand)' : 'var(--border-2)',
                      background: opt.is_correct ? 'var(--brand)' : 'transparent',
                    }}
                  >
                    {opt.is_correct && <Check className="w-2.5 h-2.5 text-white" />}
                  </button>
                  <input
                    value={opt.option_text}
                    onChange={e => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className="input flex-1 text-sm py-1.5"
                  />
                  {q.options.length > 2 && (
                    <button
                      onClick={() => removeOption(qi, oi)}
                      className="w-6 h-6 flex items-center justify-center rounded shrink-0 transition-colors"
                      style={{ color: 'var(--text-3)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addOption(qi)}
                className="text-xs mt-1 transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}
              >
                + Add option
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--brand)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-3)'
          }}
        >
          <Plus className="w-4 h-4" /> Add question
        </button>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary gap-1.5 text-sm"
        >
          {saving
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : saved
            ? <Check className="w-3.5 h-3.5" />
            : <Save className="w-3.5 h-3.5" />
          }
          {saved ? 'Saved' : 'Save quiz'}
        </button>
      </div>
    </div>
  )
}
