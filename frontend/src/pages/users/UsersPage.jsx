import { useState, useEffect } from 'react'
import { usersApi } from '@/api/users'
import { formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { Plus, UserCog, X, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_COLORS = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  CASHIER: 'bg-slate-100 text-slate-700',
}

function CreateUserModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', phone: '', role: 'CASHIER' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await usersApi.create(form)
      toast.success('User created')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to create user')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold">New User</h2>
          <button onClick={onClose} className="press-feedback text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
              <input required value={form.fullName} onChange={e => set('fullName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Username *</label>
              <input required value={form.username} onChange={e => set('username', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="johndoe" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+233..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Password *</label>
              <input required type="password" value={form.password} onChange={e => set('password', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {['ADMIN', 'MANAGER', 'CASHIER'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="press-feedback px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="press-feedback px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
              {loading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try { const { data } = await usersApi.getAll(); setUsers(data) }
    catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDeactivate = async (user) => {
    if (!confirm(`Deactivate "${user.fullName}"?`)) return
    try { await usersApi.deactivate(user.id); toast.success('User deactivated'); fetchUsers() }
    catch { toast.error('Failed to deactivate user') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} system users</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="press-feedback flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={15} /> New User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['User', 'Username', 'Email', 'Role', 'Status', 'Created', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading…</td></tr>
            ) : users.map((u, i) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors animate-slide-up"
                style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{u.fullName.charAt(0)}</span>
                    </div>
                    <p className="font-medium text-slate-900">{u.fullName}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{u.username}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600')}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  {u.active && (
                    <button onClick={() => handleDeactivate(u)}
                      className="press-feedback p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <CreateUserModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchUsers() }} />}
    </div>
  )
}
