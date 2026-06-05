'use client'

import { useState, useRef } from 'react'
import { ImageIcon, Loader2, X } from 'lucide-react'

export default function CoverImageUpload({
  subjectId,
  initialUrl,
}: {
  subjectId: string
  initialUrl: string | null
}) {
  const [url, setUrl] = useState(initialUrl)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('subject_id', subjectId)
    const res = await fetch('/api/upload/cover', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json()
      setUrl(data.url)
    }
    setUploading(false)
  }

  async function removeCover() {
    await fetch(`/api/content/subjects/${subjectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_image_url: null }),
    })
    setUrl(null)
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Cover Image</h3>

      {url ? (
        <div className="relative group w-full max-w-xs">
          <img src={url} alt="Cover" className="w-full h-32 object-cover rounded-xl border" style={{ borderColor: 'var(--border)' }} />
          <button
            onClick={removeCover}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
          >
            <X className="w-3 h-3" />
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-2 text-xs font-medium transition-colors"
            style={{ color: 'var(--brand)' }}
          >
            Replace image
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full max-w-xs flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed transition-colors"
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
          {uploading
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <ImageIcon className="w-5 h-5" />
          }
          <span className="text-xs font-medium">{uploading ? 'Uploading...' : 'Upload cover image'}</span>
          <span className="text-xs">PNG, JPG up to 5MB</span>
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
