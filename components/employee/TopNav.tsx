'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, LayoutDashboard, Library, Route, Trophy, User, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

const nav: { label: string; href: string; icon: React.ElementType; soon?: boolean }[] = [
  { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Learn',       href: '/learn',        icon: Library },
  { label: 'My Paths',    href: '/paths',        icon: Route },
  { label: 'Leaderboard', href: '/leaderboard',  icon: Trophy },
]

export default function EmployeeTopNav({ userName, points }: { userName: string; points: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header
      className="h-14 flex items-center px-5 gap-1 sticky top-0 z-30 border-b"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 mr-5 group">
        <div
          className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ background: 'var(--brand)' }}
        >
          <BookOpen className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
          IAT Learn
        </span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-0.5">
        {nav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          if (item.soon) {
            return (
              <span
                key={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-not-allowed"
                style={{ color: 'var(--text-3)' }}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </span>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: isActive ? 'var(--surface-2)' : 'transparent',
                color: isActive ? 'var(--text-1)' : 'var(--text-3)',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {/* Points */}
        <div
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
        >
          <Trophy className="w-3 h-3" />
          {points.toLocaleString()} pts
        </div>

        <ThemeToggle />

        {/* Avatar menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-2)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-2)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'var(--brand)' }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium" style={{ color: 'var(--text-2)' }}>
              {userName}
            </span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border py-1 z-50 shadow-elevated animate-slide-up"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                  style={{ color: 'var(--text-2)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <User className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
                  My Profile
                </Link>
                <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                  style={{ color: 'var(--text-2)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <LogOut className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
