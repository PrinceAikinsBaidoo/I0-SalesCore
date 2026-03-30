import { useCallback, useEffect, useMemo, useState } from 'react'
import { purchaseOrdersApi } from '@/api/purchaseOrders'
import { suppliersApi } from '@/api/suppliers'
import { productsApi } from '@/api/products'
import { formatCurrency, formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { ClipboardList, Plus, CheckCircle2, Inbox, X, Sparkles, Download, Ban, Archive } from 'lucide-react'

const STATUS_BADGE = {
  DRAFT: 'bg-slate-100 text-slate-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  PARTIALLY_RECEIVED: 'bg-amber-100 text-amber-700',
  RECEIVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-violet-100 text-violet-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
}

function CreatePOModal({ onClose, onSaved }) {
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    supplierId: '',
    expectedDate: '',
    notes: '',
    items: [{ productId: '', quantity: '', unitCost: '' }],
  })

  useEffect(() => {
    Promise.all([
      suppliersApi.getAll({ includeInactive: false }),
      productsApi.getAll({ size: 200 }),
    ]).then(([s, p]) => {
      setSuppliers(s.data ?? [])
      setProducts(p.data.content ?? [])
    }).catch(() => toast.error('Failed to load suppliers/products'))
  }, [])

  const setItem = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))
  }

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { productId: '', quantity: '', unitCost: '' }] }))
  const removeItem = (index) => setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        supplierId: parseInt(form.supplierId),
        expectedDate: form.expectedDate || null,
        notes: form.notes || null,
        items: form.items.map((item) => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          unitCost: item.unitCost ? parseFloat(item.unitCost) : null,
        })),
      }
      await purchaseOrdersApi.create(payload)
      toast.success('Purchase order created')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to create purchase order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold">Create Purchase Order</h2>
          <button onClick={onClose} className="press-feedback text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Supplier *</label>
              <select required value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                <option value="">Select supplier...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expected Date</label>
              <input
                type="date"
                value={form.expectedDate}
                onChange={(e) => setForm((f) => ({ ...f, expectedDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Optional order note"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items</p>
              <button type="button" onClick={addItem} className="press-feedback px-2.5 py-1 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">
                Add Item
              </button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <label className="block text-xs text-slate-500 mb-1">Product *</label>
                  <select required value={item.productId} onChange={(e) => setItem(i, { productId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="">Select product...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Qty *</label>
                  <input required min="1" type="number" value={item.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Unit Cost</label>
                  <input min="0" step="0.01" type="number" value={item.unitCost} onChange={(e) => setItem(i, { unitCost: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="col-span-1">
                  <button type="button" disabled={form.items.length === 1} onClick={() => removeItem(i)}
                    className="press-feedback w-full px-2 py-2 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">
                    <X size={14} className="mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="press-feedback px-4 py-2 text-sm text-slate-600">Cancel</button>
            <button disabled={saving} type="submit"
              className="press-feedback px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg disabled:opacity-60">
              {saving ? 'Saving...' : 'Create PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ReceiveModal({ order, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ referenceNumber: '', notes: '', items: {} })

  const receivableItems = useMemo(
    () => (order?.items ?? []).filter((item) => item.remainingQuantity > 0),
    [order],
  )

  const submit = async (e) => {
    e.preventDefault()
    const items = receivableItems
      .map((item) => ({
        purchaseOrderItemId: item.id,
        quantityReceived: parseInt(form.items[item.id] || '0'),
      }))
      .filter((item) => item.quantityReceived > 0)

    if (items.length === 0) {
      toast.error('Enter at least one receive quantity')
      return
    }

    setSaving(true)
    try {
      await purchaseOrdersApi.receive(order.id, {
        referenceNumber: form.referenceNumber || null,
        notes: form.notes || null,
        items,
      })
      toast.success('Stock received successfully')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to receive stock')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold">Receive Stock - {order.poNumber}</h2>
          <button onClick={onClose} className="press-feedback text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reference Number</label>
              <input
                value={form.referenceNumber}
                onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            {receivableItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7">
                  <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                  <p className="text-xs text-slate-500">
                    Ordered: {item.orderedQuantity} | Received: {item.receivedQuantity} | Remaining: {item.remainingQuantity}
                  </p>
                </div>
                <div className="col-span-3">
                  <p className="text-xs text-slate-500 mb-1">Unit Cost</p>
                  <p className="text-sm text-slate-700">{item.unitCost != null ? formatCurrency(item.unitCost) : '—'}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Receive</label>
                  <input
                    min="0"
                    max={item.remainingQuantity}
                    type="number"
                    value={form.items[item.id] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, items: { ...f.items, [item.id]: e.target.value } }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="press-feedback px-4 py-2 text-sm text-slate-600">Cancel</button>
            <button disabled={saving} type="submit"
              className="press-feedback px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg disabled:opacity-60">
              {saving ? 'Saving...' : 'Receive Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GenerateLowStockPOModal({ onClose, onSaved }) {
  const [suppliers, setSuppliers] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ supplierId: '', expectedDate: '', notes: '', selections: {} })

  useEffect(() => {
    Promise.all([
      suppliersApi.getAll({ includeInactive: false }),
      purchaseOrdersApi.getReorderSuggestions(),
    ]).then(([s, r]) => {
      const list = r.data ?? []
      setSuppliers(s.data ?? [])
      setSuggestions(list)
      setForm((prev) => ({
        ...prev,
        selections: Object.fromEntries(list.map((item) => [
          item.productId,
          { selected: true, quantity: String(item.suggestedOrderQuantity) },
        ])),
      }))
    }).catch(() => toast.error('Failed to load low-stock suggestions'))
      .finally(() => setLoading(false))
  }, [])

  const setSelection = (productId, patch) => {
    setForm((prev) => ({
      ...prev,
      selections: {
        ...prev.selections,
        [productId]: { ...(prev.selections[productId] ?? { selected: false, quantity: '' }), ...patch },
      },
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const selectedItems = suggestions
      .map((s) => ({ productId: s.productId, ...(form.selections[s.productId] ?? {}) }))
      .filter((i) => i.selected)
      .map((i) => ({ productId: i.productId, quantity: parseInt(i.quantity || '0') }))
      .filter((i) => i.quantity > 0)

    if (!form.supplierId) {
      toast.error('Select a supplier')
      return
    }
    if (selectedItems.length === 0) {
      toast.error('Select at least one low-stock item')
      return
    }

    setSaving(true)
    try {
      await purchaseOrdersApi.generateFromLowStock({
        supplierId: parseInt(form.supplierId),
        expectedDate: form.expectedDate || null,
        notes: form.notes || null,
        items: selectedItems,
      })
      toast.success('Draft PO generated from low-stock list')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to generate draft PO')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold">Generate Draft PO from Low Stock</h2>
          <button onClick={onClose} className="press-feedback text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading suggestions...</div>
        ) : suggestions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 text-sm">No low-stock suggestions available right now.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Supplier *</label>
                <select
                  required
                  value={form.supplierId}
                  onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Expected Date</label>
                <input
                  type="date"
                  value={form.expectedDate}
                  onChange={(e) => setForm((f) => ({ ...f, expectedDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="Optional note for generated draft PO"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Suggested Items</p>
              {suggestions.map((s) => {
                const selection = form.selections[s.productId] ?? { selected: false, quantity: '' }
                return (
                  <div key={s.productId} className="grid grid-cols-12 gap-2 items-end border border-slate-100 rounded-lg p-3">
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selection.selected}
                        onChange={(e) => setSelection(s.productId, { selected: e.target.checked })}
                      />
                    </div>
                    <div className="col-span-6">
                      <p className="text-sm font-medium text-slate-900">{s.productName}</p>
                      <p className="text-xs text-slate-500">
                        Stock: {s.currentStock} | Threshold: {s.lowStockThreshold}
                      </p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs text-slate-500 mb-1">Est. Unit Cost</p>
                      <p className="text-sm text-slate-700">{s.estimatedUnitCost != null ? formatCurrency(s.estimatedUnitCost) : '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Order Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={selection.quantity}
                        onChange={(e) => setSelection(s.productId, { quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="press-feedback px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button disabled={saving} type="submit"
                className="press-feedback px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg disabled:opacity-60">
                {saving ? 'Generating...' : 'Generate Draft PO'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function CancelPOModal({ order, onClose, onSaved }) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await purchaseOrdersApi.cancel(order.id, notes.trim() ? { notes: notes.trim() } : {})
      toast.success('Purchase order cancelled')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to cancel purchase order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold">Cancel {order.poNumber}</h2>
          <button type="button" onClick={onClose} className="press-feedback text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">This cannot be undone. Draft or approved orders with no received stock can be cancelled.</p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Reason for cancellation"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="press-feedback px-4 py-2 text-sm text-slate-600">Back</button>
            <button
              type="submit"
              disabled={saving}
              className="press-feedback px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg disabled:opacity-60"
            >
              {saving ? 'Cancelling...' : 'Cancel order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [filterSupplierId, setFilterSupplierId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showGenerateLowStock, setShowGenerateLowStock] = useState(false)
  const [receiveOrder, setReceiveOrder] = useState(null)
  const [cancelOrder, setCancelOrder] = useState(null)

  useEffect(() => {
    suppliersApi.getAll({ includeInactive: false })
      .then((r) => setSuppliers(r.data ?? []))
      .catch(() => {})
  }, [])

  const listParams = useMemo(() => {
    const p = {}
    if (filterSupplierId) p.supplierId = parseInt(filterSupplierId, 10)
    if (filterStatus) p.status = filterStatus
    if (overdueOnly) p.overdueOnly = true
    return p
  }, [filterSupplierId, filterStatus, overdueOnly])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await purchaseOrdersApi.getAll(listParams)
      setOrders(data ?? [])
    } catch {
      toast.error('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }, [listParams])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const approve = async (id) => {
    try {
      await purchaseOrdersApi.approve(id)
      toast.success('Purchase order approved')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to approve purchase order')
    }
  }

  const closeOrder = async (id) => {
    try {
      await purchaseOrdersApi.close(id)
      toast.success('Purchase order closed')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to close purchase order')
    }
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await purchaseOrdersApi.exportCsv(listParams)
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cd = res.headers['content-disposition']
      const match = typeof cd === 'string' ? cd.match(/filename="?([^";\n]+)"?/i) : null
      a.download = match?.[1]?.trim() || 'purchase-orders.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV export downloaded')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create, approve, and receive supplier orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGenerateLowStock(true)}
            className="press-feedback inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg"
          >
            <Sparkles size={14} /> Generate from Low Stock
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="press-feedback inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
          >
            <Plus size={14} /> New Purchase Order
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end bg-slate-50/80 rounded-xl border border-slate-200 p-4">
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">Supplier</label>
          <select
            value={filterSupplierId}
            onChange={(e) => setFilterSupplierId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="">All statuses</option>
            {Object.keys(STATUS_BADGE).map((st) => (
              <option key={st} value={st}>{st.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer select-none pt-0 sm:pt-6">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">Overdue only</span>
        </label>
        <div className="flex-1 sm:flex-none sm:ml-auto pt-0 sm:pt-6">
          <button
            type="button"
            disabled={exporting}
            onClick={exportCsv}
            className="press-feedback inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm rounded-lg disabled:opacity-60"
          >
            <Download size={14} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['PO Number', 'Supplier', 'Status', 'Items', 'Expected', 'Created', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <ClipboardList size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-400 text-sm">No purchase orders yet</p>
                </td>
              </tr>
            ) : orders.map((po) => (
              <tr key={po.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{po.poNumber}</td>
                <td className="px-4 py-3 text-slate-700">{po.supplierName}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[po.status] ?? 'bg-slate-100 text-slate-700'}`}>
                      {po.status.replaceAll('_', ' ')}
                    </span>
                    {po.overdue && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Overdue
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{po.items.length}</td>
                <td className={`px-4 py-3 ${po.overdue ? 'text-red-700 font-medium' : 'text-slate-600'}`}>{po.expectedDate || '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(po.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {po.status === 'DRAFT' && (
                      <button onClick={() => approve(po.id)} className="press-feedback inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 text-white">
                        <CheckCircle2 size={12} /> Approve
                      </button>
                    )}
                    {(po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') && (
                      <button onClick={() => setReceiveOrder(po)} className="press-feedback inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white">
                        <Inbox size={12} /> Receive
                      </button>
                    )}
                    {(po.status === 'RECEIVED' || po.status === 'PARTIALLY_RECEIVED') && (
                      <button
                        type="button"
                        onClick={() => closeOrder(po.id)}
                        className="press-feedback inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"
                      >
                        <Archive size={12} /> Close
                      </button>
                    )}
                    {(po.status === 'DRAFT' || po.status === 'APPROVED') && (
                      <button
                        type="button"
                        onClick={() => setCancelOrder(po)}
                        className="press-feedback inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                      >
                        <Ban size={12} /> Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && <CreatePOModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchOrders() }} />}
      {showGenerateLowStock && (
        <GenerateLowStockPOModal
          onClose={() => setShowGenerateLowStock(false)}
          onSaved={() => { setShowGenerateLowStock(false); fetchOrders() }}
        />
      )}
      {receiveOrder && <ReceiveModal order={receiveOrder} onClose={() => setReceiveOrder(null)} onSaved={() => { setReceiveOrder(null); fetchOrders() }} />}
      {cancelOrder && (
        <CancelPOModal
          order={cancelOrder}
          onClose={() => setCancelOrder(null)}
          onSaved={() => { setCancelOrder(null); fetchOrders() }}
        />
      )}
    </div>
  )
}
