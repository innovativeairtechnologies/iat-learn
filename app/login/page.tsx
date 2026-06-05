'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowRight, BookOpen } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg)' }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col w-[480px] shrink-0 relative overflow-hidden"
        style={{ background: '#0d1117' }}
      >
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #089447 0%, transparent 70%)' }}
        />

        <div className="relative flex flex-col h-full px-12 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#089447' }}>
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">IAT Learn</span>
          </div>

          {/* Hero copy */}
          <div className="mt-auto mb-auto pt-24">
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(8,148,71,0.15)', color: '#4ade80', border: '1px solid rgba(8,148,71,0.25)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
              Phase 1 — Foundation
            </div>

            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight text-balance">
              Training that actually<br />
              <span style={{ color: '#4ade80' }}>sticks.</span>
            </h1>

            <p className="mt-4 text-base leading-relaxed" style={{ color: '#71717a' }}>
              Beautiful learning paths, quiz-driven accountability, and real-time progress visibility — all in one place.
            </p>
          </div>

          {/* Feature list */}
          <div className="mt-auto space-y-3">
            {[
              'Rich content authoring with media embeds',
              'Quiz engine with scoring & retries',
              'Gamified points, badges & leaderboards',
              'Manager dashboards & CSV reports',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(8,148,71,0.2)' }}>
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: '#71717a' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center" style={{ background: '#089447' }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--text-1)' }}>IAT Learn</span>
          </div>
          <div className="hidden lg:block" />
          <ThemeToggle />
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-[360px]">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
                Welcome back
              </h2>
              <p className="text-sm mt-1.5" style={{ color: 'var(--text-2)' }}>
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Email
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                    Password
                  </label>
                  <a
                    href="/auth/reset"
                    className="text-xs transition-colors"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
                  >
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div
                  className="text-sm px-3.5 py-2.5 rounded-lg"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171',
                  }}
                >
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-1 group">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                  : <><span className="flex-1 text-left">Sign in</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>
                }
              </button>
            </form>

            <p className="text-center text-xs mt-8" style={{ color: 'var(--text-3)' }}>
              No account? Ask your manager to invite you.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
