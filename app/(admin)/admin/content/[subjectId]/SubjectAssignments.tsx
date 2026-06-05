'use client'

import { useState } from 'react'
import { Users, Building2, Plus, X, Loader2, Lock, Globe } from 'lucide-react'

type UserOption = { id: string; display_name: string | null; email: string | null }
type DeptOption = { id: string; name: string }
type Assignment = {
  id: string
  user_id: string | null
  department_id: string | null
  user_profiles: UserOption | null
  departments: DeptOption | null
}

export default function SubjectAssignments({
  subjectId,
  initialAssignments,
  allUsers,
  allDepts,
}: {
  subjectId: string
  initialAssignments: Assignment[]
  allUsers: UserOption[]
  allDepts: DeptOption[]
}) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
  const [mode, setMode] = useState<'user' | 'dept'>('dept')
  const [selectedId, setSelectedId] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const isRestricted = assignments.length > 0

  const assignedUserIds = new Set(assignments.map(a => a.user_id).filter(Boolean))
  const assignedDeptIds = new Set(assignments.map(a => a.department_id).filter(Boolean))

  const availableUsers = allUsers.filter(u => !assignedUserIds.has(u.id))
  const availableDepts = allDepts.filter(d => !assignedDeptIds.has(d.id))

  async function add() {
    if (!selectedId) return
    setAdding(true)
    const body = mode === 'user'
      ? { subject_id: subjectId, user_id: selectedId }
      : { subject_id: subjectId, department_id: selectedId }

    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      setAssignments(prev => [...prev, data])
      setSelectedId('')
    }
    setAdding(false)
  }

  async function remove(id: string) {
    setRemoving(id)
    await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' })
    setAssignments(prev => prev.filter(a => a.id !== id))
    setRemoving(null)
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Visibility</h3>
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={isRestricted
            ? { background: 'rgba(251,191,36,0.12)', color: '#d97706' }
            : { background: 'var(--brand-light)', color: 'var(--brand)' }
          }
        >
          {isRestricted ? <><Lock className="w-2.5 h-2.5" /> Restricted</> : <><Globe className="w-2.5 h-2.5" /> Everyone</>}
        </span>
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
        {isRestricted
          ? 'Only assigned users/departments can see this subject.'
          : 'No restrictions — all employees can see this subject. Add an assignment to restrict it.'}
      </p>

      {/* Current assignments */}
      {assignments.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {assignments.map(a => {
            const isUser = !!a.user_id
            const label = isUser
              ? (a.user_profiles?.display_name ?? a.user_profiles?.email ?? 'Unknown user')
              : (a.departments?.name ?? 'Unknown dept')
            return (
              <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                {isUser
                  ? <Users className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-3)' }} />
                  : <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-3)' }} />
                }
                <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-1)' }}>{label}</span>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>{isUser ? 'User' : 'Dept'}</span>
                <button
                  onClick={() => remove(a.id)}
                  disabled={removing === a.id}
                  className="w-5 h-5 flex items-center justify-center rounded transition-colors shrink-0"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                >
                  {removing === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add assignment */}
      <div className="flex gap-2">
        <div className="flex rounded-lg overflow-hidden border text-xs" style={{ borderColor: 'var(--border-2)' }}>
          {(['dept', 'user'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelectedId('') }}
              className="px-3 py-1.5 font-medium transition-colors"
              style={{
                background: mode === m ? 'var(--brand)' : 'transparent',
                color: mode === m ? 'white' : 'var(--text-3)',
              }}
            >
              {m === 'dept' ? 'Dept' : 'User'}
            </button>
          ))}
        </div>

        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="input flex-1 text-sm"
        >
          <option value="">Select {mode === 'dept' ? 'department' : 'user'}…</option>
          {mode === 'dept'
            ? availableDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
            : availableUsers.map(u => <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>)
          }
        </select>

        <button
          onClick={add}
          disabled={adding || !selectedId}
          className="btn-primary px-3 text-sm gap-1.5"
        >
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}
