import { useCallback, useEffect, useMemo, useState } from 'react'
import { purchaseOrdersApi } from '@/api/purchaseOrders'
import { suppliersApi } from '@/api/suppliers'
import { productsApi } from '@/api/products'
import { formatCurrency, formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { ClipboardList, Plus, CheckCircle2, Inbox, X } from 'lucide-react'

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

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [receiveOrder, setReceiveOrder] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await purchaseOrdersApi.getAll({})
      setOrders(data ?? [])
    } catch {
      toast.error('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }, [])

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create, approve, and receive supplier orders</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="press-feedback inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
        >
          <Plus size={14} /> New Purchase Order
        </button>
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
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[po.status] ?? 'bg-slate-100 text-slate-700'}`}>
                    {po.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{po.items.length}</td>
                <td className="px-4 py-3 text-slate-600">{po.expectedDate || '—'}</td>
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && <CreatePOModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchOrders() }} />}
      {receiveOrder && <ReceiveModal order={receiveOrder} onClose={() => setReceiveOrder(null)} onSaved={() => { setReceiveOrder(null); fetchOrders() }} />}
    </div>
  )
}
