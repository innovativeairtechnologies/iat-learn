'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, LayoutDashboard, Users, Library,
  Route, BarChart2, Building2, LogOut, ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import ThemeToggle from '@/components/ThemeToggle'

type NavItem =
  | { type: 'link'; label: string; href: string; icon: React.ElementType; soon?: boolean }
  | { type: 'divider'; label?: string }

const nav: NavItem[] = [
  { type: 'link', label: 'Dashboard',   href: '/admin/dashboard',   icon: LayoutDashboard },
  { type: 'link', label: 'Users',       href: '/admin/users',       icon: Users },
  { type: 'link', label: 'Departments', href: '/admin/departments', icon: Building2 },
  { type: 'divider', label: 'Content' },
  { type: 'link', label: 'Subjects',    href: '/admin/content',     icon: Library },
  { type: 'link', label: 'Paths',       href: '/admin/paths',       icon: Route },
  { type: 'link', label: 'Reports',     href: '/admin/reports',     icon: BarChart2 },
]

export default function AdminSidebar({ userName, role }: { userName: string; role: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r"
      style={{
        background: 'var(--sidebar-bg)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div className="px-4 h-14 flex items-center border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: 'var(--brand)' }}
          >
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
              IAT Learn
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {nav.map((item, i) => {
          if (item.type === 'divider') {
            return (
              <div key={i} className="px-2.5 pt-4 pb-1.5">
                {item.label && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                    {item.label}
                  </p>
                )}
              </div>
            )
          }

          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          if (item.soon) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-not-allowed select-none"
                style={{ color: 'var(--text-3)' }}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-40" />
                <span className="text-sm font-medium opacity-40">{item.label}</span>
                <span
                  className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}
                >
                  Soon
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 group',
              )}
              style={{
                background: isActive ? 'var(--sidebar-active)' : 'transparent',
                color: isActive ? 'var(--brand)' : 'var(--sidebar-text)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2.5 py-3 border-t space-y-1" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center justify-between px-2.5 py-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
              style={{ background: 'var(--brand)' }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{userName}</p>
              <p className="text-[10px] capitalize" style={{ color: 'var(--text-3)' }}>{role}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-2)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-3)'
          }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
