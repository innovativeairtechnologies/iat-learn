'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import type { UserStepProgress } from '@/lib/types'

export default function StepProgressTracker({
  stepId,
  initialProgress,
}: {
  stepId: string
  initialProgress: UserStepProgress | null
}) {
  const [progress, setProgress] = useState(initialProgress)
  const [loading, setLoading] = useState(false)
  const startRef = useRef(Date.now())
  const progressRef = useRef(initialProgress)

  useEffect(() => { progressRef.current = progress }, [progress])

  const doSave = useCallback(async (status: string) => {
    const elapsed = Math.round((Date.now() - startRef.current) / 1000)
    const total = (progressRef.current?.time_spent_seconds ?? 0) + elapsed
    startRef.current = Date.now()

    const res = await fetch(`/api/progress/${stepId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, time_spent_seconds: total }),
    })
    if (res.ok) {
      const data = await res.json()
      setProgress(data)
      progressRef.current = data
    }
  }, [stepId])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const alreadyDone = progressRef.current?.status === 'completed'

    // Start in_progress if not already done
    if (!alreadyDone) doSave('in_progress')

    // Periodic time save every 30s
    const tick = setInterval(() => {
      if (progressRef.current?.status !== 'completed') doSave('in_progress')
    }, 30_000)

    // Save on page hide (tab close / navigate away)
    const onHide = () => {
      if (progressRef.current?.status === 'completed') return
      const elapsed = Math.round((Date.now() - startRef.current) / 1000)
      const total = (progressRef.current?.time_spent_seconds ?? 0) + elapsed
      navigator.sendBeacon(
        `/api/progress/${stepId}`,
        new Blob(
          [JSON.stringify({ status: 'in_progress', time_spent_seconds: total })],
          { type: 'application/json' },
        ),
      )
    }
    window.addEventListener('pagehide', onHide)

    return () => {
      clearInterval(tick)
      window.removeEventListener('pagehide', onHide)
    }
  }, []) // intentionally mount-only

  async function markComplete() {
    setLoading(true)
    await doSave('completed')
    setLoading(false)
  }

  const isCompleted = progress?.status === 'completed'
  const secs = progress?.time_spent_seconds ?? 0

  return (
    <div className="flex items-center gap-3 py-6 border-t" style={{ borderColor: 'var(--border)' }}>
      {isCompleted ? (
        <div
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
        >
          <CheckCircle2 className="w-4 h-4" />
          Step complete
        </div>
      ) : (
        <button onClick={markComplete} disabled={loading} className="btn-primary px-5">
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <CheckCircle2 className="w-4 h-4" />
          }
          Mark Complete
        </button>
      )}
      {secs > 0 && (
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {fmtTime(secs)} spent
        </span>
      )}
    </div>
  )
}

function fmtTime(secs: number): string {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return m % 60 > 0 ? `${h}h ${m % 60}m` : `${h}h`
}
