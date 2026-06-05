'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, Plus, GripVertical, ChevronDown, ChevronRight,
  Pencil, Trash2, X, Loader2, Clock, BookOpen, FileText,
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import type { Subject, Topic, Step, Category } from '@/lib/types'

type TopicWithSteps = Topic & { steps: Step[] }
type SubjectWithCat = Subject & { categories: Pick<Category, 'id' | 'name' | 'icon' | 'color'> | null }

type Props = {
  subject: SubjectWithCat
  categories: Pick<Category, 'id' | 'name'>[]
  initialTopics: TopicWithSteps[]
}

function PublishBadge({ published }: { published: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={published
        ? { background: 'rgba(16,192,96,0.1)', color: 'var(--brand)' }
        : { background: 'var(--surface-2)', color: 'var(--text-3)' }
      }
    >
      <span className={`w-1.5 h-1.5 rounded-full`} style={{ background: published ? 'var(--brand)' : 'var(--text-3)' }} />
      {published ? 'Live' : 'Draft'}
    </span>
  )
}

export default function SubjectEditor({ subject: initialSubject, categories, initialTopics }: Props) {
  const router = useRouter()
  const [subject, setSubject] = useState(initialSubject)
  const [topics, setTopics] = useState<TopicWithSteps[]>(initialTopics)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initialTopics.map(t => t.id)))
  const [loading, setLoading] = useState(false)

  // Subject edit modal
  const [editSubModal, setEditSubModal] = useState(false)
  const [subTitle, setSubTitle] = useState(subject.title)
  const [subDesc, setSubDesc] = useState(subject.description ?? '')
  const [subCat, setSubCat] = useState(subject.category_id ?? '')

  // New topic modal
  const [topicModal, setTopicModal] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [topicTitle, setTopicTitle] = useState('')

  // New step modal
  const [stepModal, setStepModal] = useState(false)
  const [stepForTopic, setStepForTopic] = useState<string>('')
  const [stepTitle, setStepTitle] = useState('')
  const [stepMins, setStepMins] = useState('')

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function saveSubject(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/content/subjects/${subject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: subTitle, description: subDesc || null, category_id: subCat || null }),
    })
    const data = await res.json()
    if (res.ok) setSubject(prev => ({ ...prev, ...data }))
    setLoading(false)
    setEditSubModal(false)
  }

  async function toggleSubjectPublish() {
    const res = await fetch(`/api/content/subjects/${subject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !subject.is_published }),
    })
    const data = await res.json()
    if (res.ok) setSubject(prev => ({ ...prev, is_published: data.is_published }))
  }

  async function saveTopic(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    if (editingTopic) {
      const res = await fetch(`/api/content/topics/${editingTopic.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: topicTitle }),
      })
      const data = await res.json()
      if (res.ok) setTopics(prev => prev.map(t => t.id === editingTopic.id ? { ...t, ...data } : t))
    } else {
      const res = await fetch('/api/content/topics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: topicTitle, subject_id: subject.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setTopics(prev => [...prev, { ...data, steps: [] }])
        setExpanded(prev => new Set([...prev, data.id]))
      }
    }
    setLoading(false)
    setTopicModal(false)
    setTopicTitle('')
    setEditingTopic(null)
  }

  async function deleteTopic(id: string) {
    await fetch(`/api/content/topics/${id}`, { method: 'DELETE' })
    setTopics(prev => prev.filter(t => t.id !== id))
  }

  async function toggleTopicPublish(topic: TopicWithSteps) {
    const res = await fetch(`/api/content/topics/${topic.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !topic.is_published }),
    })
    const data = await res.json()
    if (res.ok) setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, is_published: data.is_published } : t))
  }

  async function saveStep(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/content/steps', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: stepTitle, topic_id: stepForTopic, estimated_minutes: stepMins ? Number(stepMins) : null }),
    })
    const data = await res.json()
    if (res.ok) setTopics(prev => prev.map(t => t.id === stepForTopic ? { ...t, steps: [...t.steps, data] } : t))
    setLoading(false)
    setStepModal(false)
    setStepTitle('')
    setStepMins('')
  }

  async function deleteStep(topicId: string, stepId: string) {
    await fetch(`/api/content/steps/${stepId}`, { method: 'DELETE' })
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, steps: t.steps.filter(s => s.id !== stepId) } : t))
  }

  async function toggleStepPublish(topicId: string, step: Step) {
    const res = await fetch(`/api/content/steps/${step.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !step.is_published }),
    })
    const data = await res.json()
    if (res.ok) setTopics(prev => prev.map(t => t.id === topicId
      ? { ...t, steps: t.steps.map(s => s.id === step.id ? { ...s, is_published: data.is_published } : s) }
      : t
    ))
  }

  async function onTopicDragEnd(result: DropResult) {
    if (!result.destination || result.source.index === result.destination.index) return
    const reordered = [...topics]
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    setTopics(reordered)
    await fetch('/api/content/topics/reorder', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: reordered.map((t, i) => ({ id: t.id, sort_order: i * 10 })) }),
    })
  }

  async function onStepDragEnd(result: DropResult, topicId: string) {
    if (!result.destination || result.source.index === result.destination.index) return
    setTopics(prev => prev.map(t => {
      if (t.id !== topicId) return t
      const steps = [...t.steps]
      const [moved] = steps.splice(result.source.index, 1)
      steps.splice(result.destination!.index, 0, moved)
      fetch('/api/content/steps/reorder', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: steps.map((s, i) => ({ id: s.id, sort_order: i * 10 })) }),
      })
      return { ...t, steps }
    }))
  }

  const totalSteps = topics.reduce((sum, t) => sum + t.steps.length, 0)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
          <ChevronLeft className="w-4 h-4" /> Back to Content
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {subject.categories && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${subject.categories.color}18`, color: subject.categories.color }}>
                  {subject.categories.name}
                </span>
              )}
              <PublishBadge published={subject.is_published} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>{subject.title}</h1>
            {subject.description && <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{subject.description}</p>}
            <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
              {topics.length} topic{topics.length !== 1 ? 's' : ''} · {totalSteps} step{totalSteps !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={toggleSubjectPublish} className="btn-secondary text-xs px-3 py-2">
              {subject.is_published ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={() => setEditSubModal(true)} className="btn-secondary text-xs px-3 py-2">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Topics</h2>
          <button onClick={() => { setEditingTopic(null); setTopicTitle(''); setTopicModal(true) }} className="btn-primary text-xs px-3 py-2">
            <Plus className="w-3.5 h-3.5" /> Add Topic
          </button>
        </div>

        {topics.length === 0 ? (
          <div className="card flex flex-col items-center py-14 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--surface-2)' }}>
              <FileText className="w-4.5 h-4.5" style={{ color: 'var(--text-3)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>No topics yet</p>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-3)' }}>Add topics to organize your steps</p>
            <button onClick={() => { setEditingTopic(null); setTopicTitle(''); setTopicModal(true) }} className="btn-primary text-xs px-3 py-2">
              <Plus className="w-3.5 h-3.5" /> Add Topic
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={onTopicDragEnd}>
            <Droppable droppableId="topics">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {topics.map((topic, index) => (
                    <Draggable key={topic.id} draggableId={topic.id} index={index}>
                      {(drag, snapshot) => (
                        <div ref={drag.innerRef} {...drag.draggableProps}
                          className="card overflow-hidden"
                          style={{
                            ...drag.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.9 : 1,
                            boxShadow: snapshot.isDragging ? 'var(--card-shadow-hover)' : undefined,
                          }}>
                          {/* Topic header */}
                          <div className="flex items-center gap-2 px-4 py-3 group">
                            <span {...drag.dragHandleProps} className="cursor-grab text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <button onClick={() => toggleExpand(topic.id)} className="flex items-center gap-2 flex-1 text-left">
                              {expanded.has(topic.id)
                                ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--text-3)' }} />
                                : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-3)' }} />
                              }
                              <span className="font-medium text-sm" style={{ color: 'var(--text-1)' }}>{topic.title}</span>
                              <span className="text-xs" style={{ color: 'var(--text-3)' }}>{topic.steps.length} step{topic.steps.length !== 1 ? 's' : ''}</span>
                            </button>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <PublishBadge published={topic.is_published} />
                              <button onClick={() => toggleTopicPublish(topic)} className="text-xs px-2 py-1 rounded-lg transition-colors" style={{ color: 'var(--text-3)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                {topic.is_published ? 'Unpublish' : 'Publish'}
                              </button>
                              <button onClick={() => { setEditingTopic(topic); setTopicTitle(topic.title); setTopicModal(true) }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors" style={{ color: 'var(--text-3)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteTopic(topic.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-red-400"
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Steps */}
                          {expanded.has(topic.id) && (
                            <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                              <DragDropContext onDragEnd={r => onStepDragEnd(r, topic.id)}>
                                <Droppable droppableId={`steps-${topic.id}`}>
                                  {(sp) => (
                                    <div {...sp.droppableProps} ref={sp.innerRef}>
                                      {topic.steps.map((step, si) => (
                                        <Draggable key={step.id} draggableId={step.id} index={si}>
                                          {(sd, ss) => (
                                            <div ref={sd.innerRef} {...sd.draggableProps}
                                              className="flex items-center gap-2 pl-10 pr-4 py-2.5 border-b group transition-colors"
                                              style={{
                                                ...sd.draggableProps.style,
                                                borderColor: 'var(--border)',
                                                background: ss.isDragging ? 'var(--surface-2)' : 'transparent',
                                              }}
                                              onMouseEnter={e => { if (!ss.isDragging) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                                              onMouseLeave={e => { if (!ss.isDragging) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                                            >
                                              <span {...sd.dragHandleProps} className="cursor-grab" style={{ color: 'var(--text-3)' }}>
                                                <GripVertical className="w-3.5 h-3.5" />
                                              </span>
                                              <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-3)' }} />
                                              <Link
                                                href={`/admin/content/${subject.id}/topics/${topic.id}/steps/${step.id}`}
                                                className="flex-1 text-sm truncate transition-colors"
                                                style={{ color: 'var(--text-2)' }}
                                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}
                                              >
                                                {step.title}
                                              </Link>
                                              {step.estimated_minutes && (
                                                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                                                  <Clock className="w-3 h-3" />
                                                  {step.estimated_minutes}m
                                                </div>
                                              )}
                                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                <PublishBadge published={step.is_published} />
                                                <button onClick={() => toggleStepPublish(topic.id, step)}
                                                  className="text-xs px-2 py-1 rounded-lg transition-colors" style={{ color: 'var(--text-3)' }}
                                                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                  {step.is_published ? 'Unpublish' : 'Publish'}
                                                </button>
                                                <Link
                                                  href={`/admin/content/${subject.id}/topics/${topic.id}/steps/${step.id}`}
                                                  className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                                                  style={{ color: 'var(--text-3)' }}
                                                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                  title="Edit step content"
                                                >
                                                  <Pencil className="w-3 h-3" />
                                                </Link>
                                                <button onClick={() => deleteStep(topic.id, step.id)}
                                                  className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors text-red-400"
                                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {sp.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </DragDropContext>
                              <button
                                onClick={() => { setStepTitle(''); setStepMins(''); setStepForTopic(topic.id); setStepModal(true) }}
                                className="w-full flex items-center gap-2 pl-10 pr-4 py-2.5 text-sm transition-colors"
                                style={{ color: 'var(--text-3)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Step
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Edit Subject modal */}
      {editSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditSubModal(false)} />
          <div className="relative rounded-2xl border w-full max-w-md p-6 animate-slide-up" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Edit Subject</h2>
              <button onClick={() => setEditSubModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Title</label>
                <input className="input" value={subTitle} onChange={e => setSubTitle(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Description</label>
                <input className="input" value={subDesc} onChange={e => setSubDesc(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Category</label>
                <select className="input" value={subCat} onChange={e => setSubCat(e.target.value)}>
                  <option value="">Uncategorized</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditSubModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topic modal */}
      {topicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setTopicModal(false)} />
          <div className="relative rounded-2xl border w-full max-w-sm p-6 animate-slide-up" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>{editingTopic ? 'Edit Topic' : 'New Topic'}</h2>
              <button onClick={() => setTopicModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveTopic} className="space-y-4">
              <input className="input" placeholder="Topic title" value={topicTitle} onChange={e => setTopicTitle(e.target.value)} required autoFocus />
              <div className="flex gap-3">
                <button type="button" onClick={() => setTopicModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading || !topicTitle.trim()} className="btn-primary flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingTopic ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Step modal */}
      {stepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setStepModal(false)} />
          <div className="relative rounded-2xl border w-full max-w-sm p-6 animate-slide-up" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>New Step</h2>
              <button onClick={() => setStepModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Title</label>
                <input className="input" placeholder="Step title" value={stepTitle} onChange={e => setStepTitle(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Estimated time <span style={{ color: 'var(--text-3)' }}>(optional)</span></label>
                <div className="relative">
                  <input className="input pr-10" type="number" placeholder="5" min="1" value={stepMins} onChange={e => setStepMins(e.target.value)} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-3)' }}>min</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStepModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading || !stepTitle.trim()} className="btn-primary flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
