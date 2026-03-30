import { useState, useEffect, useCallback } from 'react'
import { customersApi } from '@/api/customers'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { Plus, Search, Edit2, Users, X, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

function CustomerModal({ customer, onClose, onSaved }) {
  const isEdit = !!customer
  const [form, setForm] = useState({
    name: customer?.name ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    address: customer?.address ?? '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) { await customersApi.update(customer.id, form); toast.success('Customer updated') }
      else { await customersApi.create(form); toast.success('Customer registered') }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to save customer')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold">{isEdit ? 'Edit Customer' : 'New Customer'}</h2>
          <button onClick={onClose} className="press-feedback text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[
            { key: 'name', label: 'Full Name *', required: true, placeholder: 'John Doe' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
            { key: 'phone', label: 'Phone', placeholder: '+233 24 000 0000' },
            { key: 'address', label: 'Address', placeholder: 'Street, City' },
          ].map(({ key, label, required, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
              <input required={required} type={type ?? 'text'} value={form[key]}
                onChange={e => set(key, e.target.value)} placeholder={placeholder}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="press-feedback px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="press-feedback px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
              {loading ? 'Saving…' : isEdit ? 'Save' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(false)
  const debouncedSearch = useDebounce(search)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await customersApi.getAll({ search: debouncedSearch || undefined, page, size: 20 })
      setCustomers(data.content)
      setTotal(data.totalElements)
    } catch { toast.error('Failed to load customers') }
    finally { setLoading(false) }
  }, [debouncedSearch, page])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} registered</p>
        </div>
        <button onClick={() => setModal('new')}
          className="press-feedback flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={15} /> New Customer
        </button>
      </div>

      <div className="relative max-w-sm mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search customers…" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Customer', 'Phone', 'Email', 'Loyalty Points', 'Since', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading…</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12">
                <Users size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm">No customers found</p>
              </td></tr>
            ) : customers.map((c, i) => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors animate-slide-up"
                style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xs font-bold">{c.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c.email ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Star size={12} fill="currentColor" /> {c.loyaltyPoints}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setModal(c)}
                    className="press-feedback p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <CustomerModal
          customer={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchCustomers() }}
        />
      )}
    </div>
  )
}
