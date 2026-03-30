import { useState, useEffect, useCallback } from 'react'
import { inventoryApi } from '@/api/inventory'
import { productsApi } from '@/api/products'
import { suppliersApi } from '@/api/suppliers'
import { formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { Warehouse, Plus, X, AlertTriangle, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

const BADGE = {
  SALE: 'bg-red-100 text-red-700',
  RESTOCK: 'bg-green-100 text-green-700',
  ADJUSTMENT: 'bg-blue-100 text-blue-700',
  RETURN: 'bg-purple-100 text-purple-700',
}

function AdjustModal({ onClose, onSaved }) {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ productId: '', quantityChange: '', adjustmentType: 'RESTOCK', reason: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    productsApi.getAll({ size: 100 }).then(r => setProducts(r.data.content)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await inventoryApi.adjust({ ...form, productId: parseInt(form.productId), quantityChange: parseInt(form.quantityChange) })
      toast.success('Stock adjusted')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to adjust stock')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold">Adjust Stock</h2>
          <button onClick={onClose} className="press-feedback text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Product *</label>
            <select required value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.quantity})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
            <select value={form.adjustmentType} onChange={e => setForm(f => ({ ...f, adjustmentType: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {['RESTOCK', 'ADJUSTMENT', 'RETURN'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Quantity Change *</label>
            <input required type="number" value={form.quantityChange} onChange={e => setForm(f => ({ ...f, quantityChange: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+50 to add, -10 to remove" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
            <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. New supplier delivery" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="press-feedback px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="press-feedback px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
              {loading ? 'Saving…' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RestockModal({ onClose, onSaved }) {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    productId: '',
    supplierId: '',
    quantity: '',
    unitCost: '',
    referenceNumber: '',
    notes: '',
  })

  useEffect(() => {
    Promise.all([
      productsApi.getAll({ size: 100 }),
      suppliersApi.getAll({ includeInactive: false }),
    ]).then(([p, s]) => {
      setProducts(p.data.content ?? [])
      setSuppliers(s.data ?? [])
    }).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await inventoryApi.restock({
        ...form,
        productId: parseInt(form.productId),
        supplierId: parseInt(form.supplierId),
        quantity: parseInt(form.quantity),
        unitCost: form.unitCost ? parseFloat(form.unitCost) : null,
      })
      toast.success('Supplier restock recorded')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to record restock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold">Supplier Restock</h2>
          <button onClick={onClose} className="press-feedback text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Supplier *</label>
            <select required value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="">Select supplier...</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Product *</label>
            <select required value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="">Select product...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.quantity})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quantity *</label>
              <input required type="number" min="1" value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Unit Cost</label>
              <input type="number" min="0" step="0.01" value={form.unitCost}
                onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reference Number</label>
            <input value={form.referenceNumber} onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="press-feedback px-4 py-2 text-sm text-slate-600">Cancel</button>
            <button disabled={loading} type="submit"
              className="press-feedback px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg disabled:opacity-60">
              {loading ? 'Saving...' : 'Record Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [logs, setLogs] = useState([])
  const [restocks, setRestocks] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, restocksRes, lowRes] = await Promise.all([
        inventoryApi.getLogs({ page, size: 20 }),
        inventoryApi.getRestocks({ size: 10 }),
        productsApi.getLowStock(),
      ])
      setLogs(logsRes.data.content)
      setTotal(logsRes.data.totalElements)
      setRestocks(restocksRes.data.content ?? [])
      setLowStock(lowRes.data)
    } catch { toast.error('Failed to load inventory') }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Stock levels and adjustment history</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRestockModal(true)}
            className="press-feedback flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
            <Truck size={15} /> Supplier Restock
          </button>
          <button onClick={() => setShowModal(true)}
            className="press-feedback flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={15} /> Adjust Stock
          </button>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-slide-down">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">{lowStock.length} Low Stock Alert{lowStock.length > 1 ? 's' : ''}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {lowStock.map(p => (
              <div key={p.id} className="bg-white rounded-lg px-3 py-2 border border-amber-100">
                <p className="text-xs font-medium text-slate-900 truncate">{p.name}</p>
                <p className="text-xs text-amber-600 font-bold">{p.quantity} left</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory log */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Adjustment History</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Product', 'Type', 'Change', 'Stock After', 'Reason', 'By', 'Date'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10">
                <Warehouse size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm">No adjustments yet</p>
              </td></tr>
            ) : logs.map((log, i) => (
              <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors animate-slide-up"
                style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                <td className="px-4 py-3 font-medium text-slate-900">{log.product?.name}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', BADGE[log.adjustmentType] ?? 'bg-slate-100 text-slate-600')}>
                    {log.adjustmentType}
                  </span>
                </td>
                <td className={cn('px-4 py-3 font-semibold', log.quantityChange > 0 ? 'text-green-600' : 'text-red-600')}>
                  {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                </td>
                <td className="px-4 py-3 text-slate-600">{log.newQuantity}</td>
                <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.reason ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{log.user?.fullName}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Recent Supplier Restocks</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Product', 'Supplier', 'Qty', 'Unit Cost', 'By', 'Date'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {restocks.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">No supplier restocks yet</td></tr>
            ) : restocks.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{r.productName}</td>
                <td className="px-4 py-3 text-slate-600">{r.supplierName}</td>
                <td className="px-4 py-3 text-green-600 font-semibold">+{r.quantity}</td>
                <td className="px-4 py-3 text-slate-600">{r.unitCost != null ? r.unitCost : '—'}</td>
                <td className="px-4 py-3 text-slate-600">{r.restockedByName}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <AdjustModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchData() }} />}
      {showRestockModal && <RestockModal onClose={() => setShowRestockModal(false)} onSaved={() => { setShowRestockModal(false); fetchData() }} />}
    </div>
  )
}
