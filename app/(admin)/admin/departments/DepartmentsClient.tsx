'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, Trash2, Building2 } from 'lucide-react'
import type { Department } from '@/lib/types'

export default function DepartmentsClient({ departments: initial }: { departments: Department[] }) {
  const router = useRouter()
  const [departments, setDepartments] = useState(initial)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('departments')
      .insert({ name: newName.trim(), sort_order: departments.length })
      .select()
      .single()

    setLoading(false)
    if (error) { setError(error.message); return }
    setDepartments([...departments, data])
    setNewName('')
    router.refresh()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (!error) {
      setDepartments(departments.filter((d) => d.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0a0a0b]">Departments</h1>
        <p className="text-sm text-gray-500 mt-1">Organize users by department</p>
      </div>

      <div className="card p-6 max-w-lg">
        {/* Add form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="text"
            className="input flex-1"
            placeholder="Department name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" disabled={loading || !newName.trim()} className="btn-primary shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {/* Department list */}
        {departments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No departments yet.</p>
        ) : (
          <ul className="space-y-2">
            {departments.map((dept) => (
              <li
                key={dept.id}
                className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 rounded-[8px] group"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-[#0a0a0b]">{dept.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
