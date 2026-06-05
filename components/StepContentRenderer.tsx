'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TiptapLink from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'

export default function StepContentRenderer({
  content,
}: {
  content: Record<string, unknown> | null
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TiptapLink.configure({ openOnClick: true }),
      TiptapImage,
      Youtube.configure({ nocookie: true }),
    ],
    content: content ?? undefined,
    editable: false,
    immediatelyRender: false,
  })

  if (!content) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--text-3)' }}>
        No content has been added to this step yet.
      </p>
    )
  }

  return <EditorContent editor={editor} />
}
