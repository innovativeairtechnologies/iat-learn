'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Loader2 } from 'lucide-react'

export default function InvitePage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Set password
    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      setError(pwError.message)
      setLoading(false)
      return
    }

    // Update display name in profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user && displayName.trim()) {
      await supabase
        .from('user_profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id)
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[10px] bg-[#1a1a2e] flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#089447] uppercase tracking-widest leading-none">
              Innovative Air Technologies
            </p>
            <p className="text-lg font-bold text-[#0a0a0b] leading-tight">IAT Learn</p>
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-black/[0.06] shadow-card p-8">
          <h1 className="text-xl font-bold text-[#0a0a0b] mb-1">Welcome to IAT Learn</h1>
          <p className="text-sm text-gray-500 mb-6">Set up your account to get started</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your name
              </label>
              <input
                type="text"
                className="input"
                placeholder="First Last"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Create a password
              </label>
              <input
                type="password"
                className="input"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Setting up…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
