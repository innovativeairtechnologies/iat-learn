'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, X, BookOpen, FileText, Settings2, Wrench, TrendingUp,
  Building2, Users, Zap, Shield, Globe, Package, BarChart2,
  Layers, ChevronRight, MoreHorizontal, Pencil, Trash2, Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { Category, Subject } from '@/lib/types'

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, FileText, Settings2, Wrench, TrendingUp,
  Building2, Users, Zap, Shield, Globe, Package, BarChart2, Layers,
}

const ICON_OPTIONS = Object.keys(ICON_MAP)

const COLOR_OPTIONS = [
  '#6366f1', '#f59e0b', '#3b82f6', '#10b981', '#ec4899',
  '#f97316', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16',
]

function CategoryIcon({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' }) {
  const Icon = ICON_MAP[name] ?? BookOpen
  const s = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
  const i = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  return (
    <div className={`${s} rounded-[8px] flex items-center justify-center shrink-0`} style={{ background: `${color}18` }}>
      <Icon className={i} style={{ color }} />
    </div>
  )
}

type SubjectRow = Subject & {
  topic_count: number
  categories: Pick<Category, 'id' | 'name' | 'icon' | 'color'> | null
}

type Props = {
  initialCategories: Category[]
  initialSubjects: SubjectRow[]
}

export default function ContentHome({ initialCategories, initialSubjects }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [subjects, setSubjects] = useState(initialSubjects)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Category modal
  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('BookOpen')
  const [catColor, setCatColor] = useState('#6366f1')

  // Subject modal
  const [subModal, setSubModal] = useState(false)
  const [subTitle, setSubTitle] = useState('')
  const [subDesc, setSubDesc] = useState('')
  const [subCat, setSubCat] = useState('')

  // Overflow menu
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = selectedCat
    ? subjects.filter(s => s.category_id === selectedCat)
    : subjects

  function openCatModal(cat?: Category) {
    if (cat) {
      setEditingCat(cat)
      setCatName(cat.name)
      setCatIcon(cat.icon)
      setCatColor(cat.color)
    } else {
      setEditingCat(null)
      setCatName('')
      setCatIcon('BookOpen')
      setCatColor('#6366f1')
    }
    setCatModal(true)
  }

  async function saveCat(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = { name: catName.trim(), icon: catIcon, color: catColor }

    if (editingCat) {
      const res = await fetch(`/api/content/categories/${editingCat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (res.ok) setCategories(prev => prev.map(c => c.id === editingCat.id ? data : c))
    } else {
      const res = await fetch('/api/content/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (res.ok) setCategories(prev => [...prev, data])
    }
    setLoading(false)
    setCatModal(false)
  }

  async function deleteCat(id: string) {
    await fetch(`/api/content/categories/${id}`, { method: 'DELETE' })
    setCategories(prev => prev.filter(c => c.id !== id))
    if (selectedCat === id) setSelectedCat(null)
  }

  async function createSubject(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/content/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: subTitle, description: subDesc, category_id: subCat || null }),
    })
    const data = await res.json()
    if (res.ok) {
      setSubjects(prev => [...prev, { ...data, topic_count: 0 }])
      setSubModal(false)
      setSubTitle('')
      setSubDesc('')
      setSubCat('')
      router.push(`/admin/content/${data.id}`)
    }
    setLoading(false)
  }

  async function deleteSubject(id: string) {
    await fetch(`/api/content/subjects/${id}`, { method: 'DELETE' })
    setSubjects(prev => prev.filter(s => s.id !== id))
    setOpenMenu(null)
  }

  async function togglePublish(subject: SubjectRow) {
    const res = await fetch(`/api/content/subjects/${subject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !subject.is_published }),
    })
    const data = await res.json()
    if (res.ok) setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, ...data } : s))
    setOpenMenu(null)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-8 pt-8 pb-7 border-b flex items-end justify-between" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--brand)' }}>Admin</p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Content</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            {subjects.length} subject{subjects.length !== 1 ? 's' : ''} across {categories.length} categories
          </p>
        </div>
        <button onClick={() => setSubModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Subject
        </button>
      </div>

      <div className="p-8">
        {/* Category filter tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedCat(null)}
            className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all', !selectedCat ? 'text-white' : '')}
            style={{
              background: !selectedCat ? 'var(--brand)' : 'var(--surface)',
              color: !selectedCat ? '#fff' : 'var(--text-2)',
              border: '1px solid',
              borderColor: !selectedCat ? 'var(--brand)' : 'var(--border)',
            }}
          >
            All
            <span className="text-xs opacity-70">{subjects.length}</span>
          </button>

          {categories.map(cat => {
            const active = selectedCat === cat.id
            const count = subjects.filter(s => s.category_id === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(active ? null : cat.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? `${cat.color}18` : 'var(--surface)',
                  color: active ? cat.color : 'var(--text-2)',
                  border: '1px solid',
                  borderColor: active ? `${cat.color}40` : 'var(--border)',
                }}
              >
                <CategoryIcon name={cat.icon} color={cat.color} size="sm" />
                {cat.name}
                <span className="text-xs opacity-60">{count}</span>
              </button>
            )
          })}

          <button
            onClick={() => openCatModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-3)', border: '1px dashed var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
        </div>

        {/* Subject list */}
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--surface-2)' }}>
              <BookOpen className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>No subjects yet</p>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-3)' }}>Create your first subject to get started</p>
            <button onClick={() => setSubModal(true)} className="btn-primary text-xs px-3 py-2">
              <Plus className="w-3.5 h-3.5" /> New Subject
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['Subject', 'Category', 'Topics', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr
                    key={sub.id}
                    className="border-b transition-colors group"
                    style={{ borderColor: 'var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/content/${sub.id}`} className="font-medium hover:underline" style={{ color: 'var(--text-1)' }}>
                        {sub.title}
                      </Link>
                      {sub.description && (
                        <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: 'var(--text-3)' }}>{sub.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {sub.categories ? (
                        <div className="flex items-center gap-1.5">
                          <CategoryIcon name={sub.categories.icon} color={sub.categories.color} size="sm" />
                          <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{sub.categories.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-2)' }}>
                        {sub.topic_count} topic{sub.topic_count !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={sub.is_published
                          ? { background: 'rgba(16,192,96,0.1)', color: 'var(--brand)' }
                          : { background: 'var(--surface-2)', color: 'var(--text-3)' }
                        }
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sub.is_published ? 'bg-[var(--brand)]' : 'bg-[var(--text-3)]'}`} />
                        {sub.is_published ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/content/${sub.id}`}
                          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-2)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          Edit <ChevronRight className="w-3 h-3" />
                        </Link>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === sub.id ? null : sub.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--text-3)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenu === sub.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                              <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border py-1 z-50 shadow-elevated animate-slide-up" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <button onClick={() => togglePublish(sub)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors" style={{ color: 'var(--text-2)' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                  {sub.is_published ? 'Unpublish' : 'Publish'}
                                </button>
                                <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
                                <button onClick={() => deleteSubject(sub.id)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 transition-colors"
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Subject modal */}
      {subModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSubModal(false)} />
          <div className="relative rounded-2xl border w-full max-w-md p-6 animate-slide-up" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>New Subject</h2>
              <button onClick={() => setSubModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={createSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Title</label>
                <input className="input" placeholder="e.g. Using DryWare" value={subTitle} onChange={e => setSubTitle(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Description <span style={{ color: 'var(--text-3)' }}>(optional)</span></label>
                <input className="input" placeholder="Brief description" value={subDesc} onChange={e => setSubDesc(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Category</label>
                <select className="input" value={subCat} onChange={e => setSubCat(e.target.value)}>
                  <option value="">Uncategorized</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setSubModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading || !subTitle.trim()} className="btn-primary flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category modal */}
      {catModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCatModal(false)} />
          <div className="relative rounded-2xl border w-full max-w-md p-6 animate-slide-up" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>{editingCat ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setCatModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveCat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Name</label>
                <input className="input" placeholder="Category name" value={catName} onChange={e => setCatName(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-2)' }}>Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} type="button" onClick={() => setCatColor(c)}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{ background: c, outline: catColor === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-2)' }}>Icon</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {ICON_OPTIONS.map(name => {
                    const Icon = ICON_MAP[name]
                    return (
                      <button key={name} type="button" onClick={() => setCatIcon(name)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
                        style={{
                          background: catIcon === name ? `${catColor}20` : 'var(--surface-2)',
                          color: catIcon === name ? catColor : 'var(--text-3)',
                          border: catIcon === name ? `1px solid ${catColor}40` : '1px solid transparent',
                        }}>
                        <Icon className="w-4 h-4" />
                      </button>
                    )
                  })}
                </div>
              </div>
              {editingCat && (
                <button type="button" onClick={() => { deleteCat(editingCat.id); setCatModal(false) }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 rounded-lg transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete Category
                </button>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setCatModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading || !catName.trim()} className="btn-primary flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingCat ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
