'use client'

import { useState } from 'react'
import { Plus, Route, Pencil, Trash2, X, Loader2, GripVertical, Eye, EyeOff } from 'lucide-react'

type SubjectOption = { id: string; title: string; categories: { name: string } | null }
type PathSubject = { id: string; sort_order: number; subjects: { id: string; title: string } }
type PathRow = { id: string; title: string; description: string | null; is_published: boolean; path_subjects: PathSubject[] }

type Props = {
  initialPaths: PathRow[]
  allSubjects: SubjectOption[]
}

export default function PathsClient({ initialPaths, allSubjects }: Props) {
  const [paths, setPaths] = useState<PathRow[]>(initialPaths)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<PathRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

  function openCreate() {
    setEditing(null)
    setTitle('')
    setDescription('')
    setIsPublished(false)
    setSelectedSubjects([])
    setModal(true)
  }

  function openEdit(path: PathRow) {
    setEditing(path)
    setTitle(path.title)
    setDescription(path.description ?? '')
    setIsPublished(path.is_published)
    setSelectedSubjects(
      [...path.path_subjects].sort((a, b) => a.sort_order - b.sort_order).map(ps => ps.subjects.id)
    )
    setModal(true)
  }

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    const body = { title: title.trim(), description: description.trim() || null, is_published: isPublished, subjects: selectedSubjects }

    if (editing) {
      const res = await fetch(`/api/paths/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const updated = await res.json()
        const subjectRows = selectedSubjects.map((sid, i) => ({
          id: `tmp-${i}`, sort_order: i,
          subjects: { id: sid, title: allSubjects.find(s => s.id === sid)?.title ?? '' },
        }))
        setPaths(ps => ps.map(p => p.id === editing.id ? { ...updated, path_subjects: subjectRows } : p))
      }
    } else {
      const res = await fetch('/api/paths', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const created = await res.json()
        const subjectRows = selectedSubjects.map((sid, i) => ({
          id: `tmp-${i}`, sort_order: i,
          subjects: { id: sid, title: allSubjects.find(s => s.id === sid)?.title ?? '' },
        }))
        setPaths(ps => [{ ...created, path_subjects: subjectRows }, ...ps])
      }
    }
    setSaving(false)
    setModal(false)
  }

  async function deletePath(id: string) {
    setDeleting(id)
    await fetch(`/api/paths/${id}`, { method: 'DELETE' })
    setPaths(ps => ps.filter(p => p.id !== id))
    setDeleting(null)
  }

  async function togglePublish(path: PathRow) {
    const res = await fetch(`/api/paths/${path.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: path.title, description: path.description, is_published: !path.is_published }),
    })
    if (res.ok) {
      setPaths(ps => ps.map(p => p.id === path.id ? { ...p, is_published: !p.is_published } : p))
    }
  }

  function toggleSubject(id: string) {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Learning Paths</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Curate ordered sequences of subjects for employees to follow
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-1.5">
          <Plus className="w-4 h-4" /> New Path
        </button>
      </div>

      {/* Paths list */}
      {paths.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--surface-2)' }}>
            <Route className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-2)' }}>No paths yet</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>Create a path to guide employees through a sequence of subjects</p>
          <button onClick={openCreate} className="btn-primary gap-1.5 text-sm">
            <Plus className="w-3.5 h-3.5" /> Create first path
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paths.map(path => {
            const subjects = [...path.path_subjects].sort((a, b) => a.sort_order - b.sort_order)
            return (
              <div key={path.id} className="card p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{path.title}</h3>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={path.is_published
                        ? { background: 'rgba(16,192,96,0.1)', color: 'var(--brand)' }
                        : { background: 'var(--surface-2)', color: 'var(--text-3)' }
                      }
                    >
                      {path.is_published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  {path.description && (
                    <p className="text-xs mb-2 line-clamp-1" style={{ color: 'var(--text-3)' }}>{path.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {subjects.map((ps, i) => (
                      <span key={ps.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                        <span style={{ color: 'var(--text-3)' }}>{i + 1}.</span> {ps.subjects.title}
                      </span>
                    ))}
                    {subjects.length === 0 && (
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>No subjects added yet</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePublish(path)}
                    className="p-1.5 rounded-lg transition-colors"
                    title={path.is_published ? 'Unpublish' : 'Publish'}
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {path.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(path)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePath(path.id)}
                    disabled={deleting === path.id}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                  >
                    {deleting === path.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border p-6 shadow-xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
                  {editing ? 'Edit path' : 'New learning path'}
                </h2>
                <button onClick={() => setModal(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-3)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>Title</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. New Employee Onboarding"
                    className="input w-full"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What will employees learn in this path?"
                    className="input w-full resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-2)' }}>
                    Subjects ({selectedSubjects.length} selected, in order)
                  </label>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {allSubjects.map(sub => {
                      const idx = selectedSubjects.indexOf(sub.id)
                      const checked = idx !== -1
                      return (
                        <button
                          key={sub.id}
                          onClick={() => toggleSubject(sub.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
                          style={{
                            background: checked ? 'var(--brand-light)' : 'var(--surface-2)',
                            color: 'var(--text-1)',
                          }}
                        >
                          <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                            style={{
                              background: checked ? 'var(--brand)' : 'transparent',
                              borderColor: checked ? 'var(--brand)' : 'var(--border-2)',
                            }}>
                            {checked && <span className="text-white text-[10px] font-bold">{idx + 1}</span>}
                          </div>
                          <span className="text-sm">{sub.title}</span>
                          {sub.categories && (
                            <span className="text-xs ml-auto" style={{ color: 'var(--text-3)' }}>{sub.categories.name}</span>
                          )}
                        </button>
                      )
                    })}
                    {allSubjects.length === 0 && (
                      <p className="text-xs py-2 text-center" style={{ color: 'var(--text-3)' }}>
                        No published subjects yet — publish subjects first
                      </p>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={e => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--brand)]"
                  />
                  <span className="text-sm" style={{ color: 'var(--text-2)' }}>Publish immediately</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={save} disabled={saving || !title.trim()} className="btn-primary gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editing ? 'Save changes' : 'Create path'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
