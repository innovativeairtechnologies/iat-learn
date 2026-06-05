'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TiptapLink from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import type { Editor } from '@tiptap/react'
import {
  ChevronLeft, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Link as LinkIcon, Image as ImageIcon, Minus,
  Loader2, Check, Clock, Video, Paperclip, Trash2, Upload,
} from 'lucide-react'
import type { Step, Topic, Subject, StepAttachment } from '@/lib/types'

type Props = {
  step: Step
  topic: Pick<Topic, 'id' | 'title'>
  subject: Pick<Subject, 'id' | 'title'>
}

function ToolbarBtn({
  onClick, active, title, children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-md transition-colors"
      style={{
        background: active ? 'var(--brand-light)' : 'transparent',
        color: active ? 'var(--brand)' : 'var(--text-2)',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px mx-0.5 self-stretch my-1" style={{ background: 'var(--border-2)' }} />
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null
  const e = editor

  function insertLink() {
    const url = window.prompt('URL:')
    if (!url) return
    e.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  function insertImage() {
    const url = window.prompt('Image URL:')
    if (!url) return
    e.chain().focus().setImage({ src: url }).run()
  }

  function insertYoutube() {
    const url = window.prompt('YouTube URL:')
    if (!url) return
    e.chain().focus().setYoutubeVideo({ src: url }).run()
  }

  return (
    <div
      className="flex items-center gap-0.5 px-3 py-2 border-b flex-wrap"
      style={{ borderColor: 'var(--border)' }}
    >
      <ToolbarBtn onClick={() => e.chain().focus().toggleBold().run()} active={e.isActive('bold')} title="Bold (Ctrl+B)">
        <Bold className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleItalic().run()} active={e.isActive('italic')} title="Italic (Ctrl+I)">
        <Italic className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleUnderline().run()} active={e.isActive('underline')} title="Underline (Ctrl+U)">
        <UnderlineIcon className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleStrike().run()} active={e.isActive('strike')} title="Strikethrough">
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <ToolbarDivider />

      <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 1 }).run()} active={e.isActive('heading', { level: 1 })} title="Heading 1">
        <span className="text-xs font-bold">H1</span>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 2 }).run()} active={e.isActive('heading', { level: 2 })} title="Heading 2">
        <span className="text-xs font-bold">H2</span>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 3 }).run()} active={e.isActive('heading', { level: 3 })} title="Heading 3">
        <span className="text-xs font-bold">H3</span>
      </ToolbarBtn>

      <ToolbarDivider />

      <ToolbarBtn onClick={() => e.chain().focus().toggleBulletList().run()} active={e.isActive('bulletList')} title="Bullet List">
        <List className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleOrderedList().run()} active={e.isActive('orderedList')} title="Ordered List">
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <ToolbarDivider />

      <ToolbarBtn onClick={() => e.chain().focus().toggleBlockquote().run()} active={e.isActive('blockquote')} title="Blockquote">
        <Quote className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleCode().run()} active={e.isActive('code')} title="Inline Code">
        <Code className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleCodeBlock().run()} active={e.isActive('codeBlock')} title="Code Block">
        <span className="text-xs font-mono font-bold">{'{}'}</span>
      </ToolbarBtn>

      <ToolbarDivider />

      <ToolbarBtn onClick={() => e.chain().focus().setHorizontalRule().run()} active={false} title="Horizontal Rule">
        <Minus className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={insertLink} active={e.isActive('link')} title="Insert Link">
        <LinkIcon className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={insertImage} active={false} title="Insert Image">
        <ImageIcon className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={insertYoutube} active={false} title="Embed YouTube Video">
        <Video className="w-3.5 h-3.5" />
      </ToolbarBtn>
    </div>
  )
}

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1)
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').pop()
      if (id) return `https://player.vimeo.com/video/${id}`
    }
  } catch {}
  return url
}

export default function StepEditorClient({ step: initialStep, topic, subject }: Props) {
  const [step, setStep] = useState(initialStep)
  const [title, setTitle] = useState(initialStep.title)
  const [videoUrl, setVideoUrl] = useState(initialStep.video_url ?? '')
  const [estMins, setEstMins] = useState(String(initialStep.estimated_minutes ?? ''))
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const [attachments, setAttachments] = useState<StepAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const doSave = useCallback(async (updates: Record<string, unknown>) => {
    setSaveStatus('saving')
    clearTimeout(saveTimer.current)
    const res = await fetch(`/api/content/steps/${initialStep.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const data = await res.json()
      setStep(prev => ({ ...prev, ...data }))
      setSaveStatus('saved')
    }
  }, [initialStep.id])

  const scheduleContentSave = useCallback((content: Record<string, unknown>) => {
    setSaveStatus('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => doSave({ content }), 1500)
  }, [doSave])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage,
      Placeholder.configure({ placeholder: 'Start writing step content…' }),
      Youtube.configure({ nocookie: true }),
    ],
    content: initialStep.content ?? undefined,
    editorProps: {
      attributes: { class: 'tiptap-editor' },
    },
    onUpdate: ({ editor }) => scheduleContentSave(editor.getJSON()),
    immediatelyRender: false,
  })

  async function togglePublish() {
    await doSave({ is_published: !step.is_published })
  }

  function handleTitleBlur() {
    if (title.trim() && title !== step.title) doSave({ title })
  }

  function handleVideoBlur() {
    const v = videoUrl.trim() || null
    if (v !== step.video_url) doSave({ video_url: v })
  }

  function handleMinsBlur() {
    const mins = estMins ? Number(estMins) : null
    if (mins !== step.estimated_minutes) doSave({ estimated_minutes: mins })
  }

  useEffect(() => {
    fetch(`/api/content/steps/${initialStep.id}/attachments`)
      .then(r => r.json())
      .then(d => setAttachments(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [initialStep.id])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `steps/${initialStep.id}/${Date.now()}-${safeName}`
      const { data: upload, error: upErr } = await supabase.storage
        .from('step-attachments')
        .upload(path, file)
      if (upErr || !upload) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('step-attachments').getPublicUrl(upload.path)
      const res = await fetch(`/api/content/steps/${initialStep.id}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: file.name, file_url: publicUrl, file_type: file.type, file_size: file.size }),
      })
      if (res.ok) { const att = await res.json(); setAttachments(prev => [...prev, att]) }
    } catch {}
    setUploading(false)
    e.target.value = ''
  }

  async function deleteAttachment(id: string) {
    await fetch(`/api/content/attachments/${id}`, { method: 'DELETE' })
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="animate-fade-in">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <Link
          href={`/admin/content/${subject.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <ChevronLeft className="w-4 h-4" />
          {subject.title}
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
            {saveStatus === 'saving' && (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            )}
            {saveStatus === 'saved' && (
              <><Check className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} /> Saved</>
            )}
            {saveStatus === 'unsaved' && 'Unsaved changes'}
          </div>

          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={step.is_published
              ? { background: 'rgba(16,192,96,0.1)', color: 'var(--brand)' }
              : { background: 'var(--surface-2)', color: 'var(--text-3)' }
            }
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: step.is_published ? 'var(--brand)' : 'var(--text-3)' }}
            />
            {step.is_published ? 'Live' : 'Draft'}
          </span>

          <button onClick={togglePublish} className="btn-secondary text-xs px-3 py-1.5">
            {step.is_published ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-8" style={{ color: 'var(--text-3)' }}>
          <Link
            href="/admin/content"
            className="transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            {subject.title}
          </Link>
          <span>/</span>
          <span>{topic.title}</span>
        </div>

        {/* Title */}
        <input
          className="w-full text-3xl font-bold bg-transparent outline-none mb-4 leading-tight placeholder:font-bold"
          style={{ color: 'var(--text-1)', caretColor: 'var(--brand)' }}
          placeholder="Step title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
        />

        {/* Meta row */}
        <div
          className="flex items-center gap-4 mb-8 pb-8 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
            <input
              type="number"
              min="1"
              placeholder="—"
              value={estMins}
              onChange={e => setEstMins(e.target.value)}
              onBlur={handleMinsBlur}
              className="w-12 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-2)' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>min read</span>
          </div>
        </div>

        {/* Rich text editor */}
        <div className="card overflow-hidden mb-6">
          <Toolbar editor={editor} />
          <div className="p-5">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Featured video */}
        <div className="card p-5 mb-6">
          <label className="flex items-center gap-1.5 text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
            <Video className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
            Featured Video
          </label>
          <input
            className="input"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            onBlur={handleVideoBlur}
            placeholder="https://www.youtube.com/watch?v=…"
          />
          {videoUrl && (
            <div className="mt-4 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <iframe
                src={toEmbedUrl(videoUrl)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title="Featured video"
              />
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              <Paperclip className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
              Attachments
              {attachments.length > 0 && (
                <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-3)' }}>({attachments.length})</span>
              )}
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {uploading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                : <><Upload className="w-3.5 h-3.5" /> Upload file</>
              }
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
          </div>

          {attachments.length === 0 ? (
            <p className="text-xs py-3 text-center" style={{ color: 'var(--text-3)' }}>
              No attachments yet — upload PDFs, images, or any supporting files
            </p>
          ) : (
            <div className="space-y-1">
              {attachments.map(att => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg group"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <Paperclip className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-3)' }} />
                  <a
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm truncate transition-colors hover-brand"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {att.file_name}
                  </a>
                  {att.file_size != null && (
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>
                      {att.file_size < 1024 * 1024
                        ? `${(att.file_size / 1024).toFixed(0)} KB`
                        : `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteAttachment(att.id)}
                    className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
