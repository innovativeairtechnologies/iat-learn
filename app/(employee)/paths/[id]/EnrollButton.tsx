'use client'

import { useState } from 'react'
import { BookOpen, Loader2 } from 'lucide-react'

export default function EnrollButton({ pathId, enrolled: initialEnrolled }: { pathId: string; enrolled: boolean }) {
  const [enrolled, setEnrolled] = useState(initialEnrolled)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const res = await fetch(`/api/paths/${pathId}/enroll`, {
      method: enrolled ? 'DELETE' : 'POST',
    })
    if (res.ok) setEnrolled(!enrolled)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      style={enrolled
        ? { background: 'var(--surface-2)', color: 'var(--text-2)' }
        : { background: 'var(--brand)', color: 'white' }
      }
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <BookOpen className="w-4 h-4" />
      }
      {enrolled ? 'Unenroll' : 'Enroll in path'}
    </button>
  )
}
