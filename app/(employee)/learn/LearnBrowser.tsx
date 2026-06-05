'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, ChevronRight } from 'lucide-react'

type StepMeta = { id: string; estimated_minutes: number | null }
type TopicMeta = { id: string; steps: StepMeta[] }
type CatMeta = { id: string; name: string; icon: string; color: string }

type SubjectCard = {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  category_id: string | null
  categories: CatMeta | null
  topics: TopicMeta[]
}

type Props = {
  subjects: SubjectCard[]
  categories: CatMeta[]
}

export default function LearnBrowser({ subjects, categories }: Props) {
  const [activeCat, setActiveCat] = useState<string | null>(null)

  const usedCatIds = new Set(subjects.map(s => s.category_id).filter(Boolean))
  const visibleCategories = categories.filter(c => usedCatIds.has(c.id))

  const filtered = activeCat ? subjects.filter(s => s.category_id === activeCat) : subjects

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-1)' }}>
          Learn
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          {subjects.length} subject{subjects.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Category filter tabs */}
      {visibleCategories.length > 0 && (
        <div className="flex items-center gap-1.5 mb-6 flex-wrap">
          <button
            onClick={() => setActiveCat(null)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: activeCat === null ? 'var(--surface-2)' : 'transparent',
              color: activeCat === null ? 'var(--text-1)' : 'var(--text-3)',
            }}
          >
            All
          </button>
          {visibleCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: activeCat === cat.id ? `${cat.color}18` : 'transparent',
                color: activeCat === cat.id ? cat.color : 'var(--text-3)',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Subject grid */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'var(--surface-2)' }}
          >
            <BookOpen className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-2)' }}>No subjects yet</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            Your admin is building the course library — check back soon
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(subject => {
            const topics = subject.topics ?? []
            const steps = topics.flatMap(t => t.steps ?? [])
            const totalMins = steps.reduce((sum, s) => sum + (s.estimated_minutes ?? 0), 0)
            const cat = subject.categories

            return (
              <Link
                key={subject.id}
                href={`/learn/${subject.id}`}
                className="card-hover block overflow-hidden relative group"
              >
                {/* Category color top bar */}
                <div
                  className="h-1 w-full"
                  style={{ background: cat?.color ?? 'var(--surface-3)' }}
                />
                <div className="p-5">
                  {cat && (
                    <span
                      className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full mb-2.5"
                      style={{ background: `${cat.color}18`, color: cat.color }}
                    >
                      {cat.name}
                    </span>
                  )}
                  <h3
                    className="font-semibold text-base leading-snug mb-1.5 transition-colors"
                    style={{ color: 'var(--text-1)' }}
                  >
                    {subject.title}
                  </h3>
                  {subject.description && (
                    <p
                      className="text-sm leading-relaxed mb-4 line-clamp-2"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {subject.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
                    <span>{topics.length} topic{topics.length !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
                    {totalMins > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ~{totalMins}m
                        </span>
                      </>
                    )}
                    <ChevronRight
                      className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--brand)' }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
