import { useCallback, useEffect, useState } from 'react'
import { salesApi } from '@/api/sales'
import { formatCurrency, formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { RotateCcw, Search, Download } from 'lucide-react'

export default function RefundsPage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState({ saleId: '', userId: '', from: '', to: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        size: 20,
        saleId: filters.saleId || undefined,
        userId: filters.userId || undefined,
        from: filters.from ? new Date(filters.from).toISOString() : undefined,
        to: filters.to ? new Date(filters.to).toISOString() : undefined,
      }
      const { data } = await salesApi.getRefundHistory(params)
      setRows(data.content ?? [])
      setTotal(data.totalElements ?? 0)
    } catch {
      toast.error('Failed to load refund history')
    } finally {
      setLoading(false)
    }
  }, [filters.from, filters.saleId, filters.to, filters.userId, page])

  useEffect(() => { fetchData() }, [fetchData])

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))

  const toLocalInputValue = (date) => {
    const pad = (n) => String(n).padStart(2, '0')
    const y = date.getFullYear()
    const m = pad(date.getMonth() + 1)
    const d = pad(date.getDate())
    const h = pad(date.getHours())
    const min = pad(date.getMinutes())
    return `${y}-${m}-${d}T${h}:${min}`
  }

  const applyPreset = (preset) => {
    const now = new Date()
    let fromDate = null
    let toDate = now

    if (preset === 'today') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    } else if (preset === 'week') {
      const day = now.getDay() || 7 // Sunday -> 7
      const monday = new Date(now)
      monday.setDate(now.getDate() - (day - 1))
      monday.setHours(0, 0, 0, 0)
      fromDate = monday
    } else if (preset === 'month') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    } else if (preset === 'clear') {
      setPage(0)
      setFilters((prev) => ({ ...prev, from: '', to: '' }))
      return
    }

    setPage(0)
    setFilters((prev) => ({
      ...prev,
      from: fromDate ? toLocalInputValue(fromDate) : '',
      to: toLocalInputValue(toDate),
    }))
  }

  const currentFilterParams = () => ({
    saleId: filters.saleId || undefined,
    userId: filters.userId || undefined,
    from: filters.from ? new Date(filters.from).toISOString() : undefined,
    to: filters.to ? new Date(filters.to).toISOString() : undefined,
  })

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await salesApi.exportRefundHistoryCsv(currentFilterParams())
      const contentDisposition = res.headers['content-disposition'] || ''
      const filenameMatch = /filename="([^"]+)"/i.exec(contentDisposition)
      const filename = filenameMatch?.[1] || 'refund-history.csv'

      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success('Refund history exported')
    } catch {
      toast.error('Failed to export refund history CSV')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Refund History</h1>
        <p className="text-sm text-slate-500 mt-0.5">Audit trail of returned/refunded sale items</p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={exportCsv}
          disabled={exporting}
          className="press-feedback inline-flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm rounded-lg"
        >
          <Download size={14} />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Quick Range</span>
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'clear', label: 'Clear' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className="press-feedback px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            value={filters.saleId}
            onChange={(e) => { setPage(0); setFilter('saleId', e.target.value) }}
            placeholder="Sale ID"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <input
            value={filters.userId}
            onChange={(e) => { setPage(0); setFilter('userId', e.target.value) }}
            placeholder="User ID"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <input
            type="datetime-local"
            value={filters.from}
            onChange={(e) => { setPage(0); setFilter('from', e.target.value) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <input
            type="datetime-local"
            value={filters.to}
            onChange={(e) => { setPage(0); setFilter('to', e.target.value) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <button
            onClick={fetchData}
            className="press-feedback inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
          >
            <Search size={14} />
            Apply
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Date', 'Sale', 'Product', 'Qty', 'Amount', 'By', 'Reason'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <RotateCcw size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-400 text-sm">No refunds found</p>
                </td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-3 text-slate-700">#{row.saleId} ({row.saleNumber})</td>
                <td className="px-4 py-3 text-slate-800">{row.productName}</td>
                <td className="px-4 py-3 font-medium">{row.quantity}</td>
                <td className="px-4 py-3 font-semibold text-red-600">-{formatCurrency(row.refundAmount)}</td>
                <td className="px-4 py-3 text-slate-700">{row.refundedByName}</td>
                <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{row.reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {page * 20 + 1}-{Math.min((page + 1) * 20, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={(page + 1) * 20 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
