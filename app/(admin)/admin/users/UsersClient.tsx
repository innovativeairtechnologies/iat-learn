'use client'

import { useState } from 'react'
import { UserPlus, Loader2, X, Mail, Clock } from 'lucide-react'
import type { UserProfile, Department, Invitation } from '@/lib/types'
import { format } from 'date-fns'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700',
  employee: 'bg-gray-100 text-gray-600',
}

type Props = {
  users: (UserProfile & { departments: { name: string } | null })[]
  departments: Pick<Department, 'id' | 'name'>[]
  invitations: (Invitation & { departments: { name: string } | null })[]
}

export default function UsersClient({ users, departments, invitations }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'employee' | 'manager' | 'admin'>('employee')
  const [inviteDept, setInviteDept] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        role: inviteRole,
        department_id: inviteDept || null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to send invite.')
      return
    }

    setSuccess(`Invite sent to ${inviteEmail}`)
    setInviteEmail('')
    setInviteRole('employee')
    setInviteDept('')
    setTimeout(() => {
      setInviteOpen(false)
      setSuccess(null)
    }, 2000)
  }

  function getInitials(name: string | null, email: string | null) {
    if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    return (email ?? '?').charAt(0).toUpperCase()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0a0a0b]">Users</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} member{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setInviteOpen(true)} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden mb-6">
        {users.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-sm">No users yet. Invite someone to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Department</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#089447]/15 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#089447]">
                          {getInitials(user.display_name, user.email)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[#0a0a0b]">
                          {user.display_name ?? <span className="text-gray-400 italic">No name</span>}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-gray-600">
                    {user.departments?.name ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-gray-500">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                      user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-[#0a0a0b] mb-3">
            Pending Invitations ({invitations.length})
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-gray-300 shrink-0" />
                        <span className="text-gray-700">{inv.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[inv.role]}`}>
                        {ROLE_LABELS[inv.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-gray-500">
                      {inv.departments?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(inv.expires_at), 'MMM d')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setInviteOpen(false)} />
          <div className="relative bg-white rounded-[16px] border border-black/[0.06] shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0a0a0b]">Invite User</h2>
              <button
                onClick={() => setInviteOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="employee@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  className="input"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Department <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  className="input"
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value)}
                >
                  <option value="">No department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-[8px] px-3 py-2">
                  {success}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {loading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
