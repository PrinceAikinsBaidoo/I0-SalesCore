import { useState, useEffect, useCallback } from 'react'
import { productsApi, categoriesApi } from '@/api/products'
import { formatCurrency } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'
import { Plus, Search, Edit2, Trash2, AlertTriangle, X, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import ProductThumbnail from '@/components/ProductThumbnail'


function ProductFormModal({ product, categories, onClose, onSaved }) {
  const isEdit = !!product
  const [form, setForm] = useState({
    name: product?.name ?? '',
    categoryId: product?.category?.id ?? '',
    price: product?.price ?? '',
    costPrice: product?.costPrice ?? '',
    quantity: product?.quantity ?? 0,
    barcode: product?.barcode ?? '',
    description: product?.description ?? '',
    lowStockThreshold: product?.lowStockThreshold ?? 10,
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId || null,
        barcode: form.barcode || null,
        price: parseFloat(form.price),
        costPrice: parseFloat(form.costPrice),
        quantity: parseInt(form.quantity),
        lowStockThreshold: parseInt(form.lowStockThreshold),
      }
      if (isEdit) {
        await productsApi.update(product.id, payload)
        toast.success('Product updated')
      } else {
        await productsApi.create(payload)
        toast.success('Product created')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{isEdit ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="press-feedback text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Product Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Coca-Cola 500ml" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Selling Price *</label>
              <input required type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cost Price *</label>
              <input required type="number" step="0.01" min="0" value={form.costPrice} onChange={e => set('costPrice', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
              <input type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Barcode</label>
              <input value={form.barcode} onChange={e => set('barcode', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Low Stock Alert</label>
              <input type="number" min="0" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Optional description" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="press-feedback px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="press-feedback px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // null | 'create' | product object

  const debouncedSearch = useDebounce(search)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await productsApi.getAll({
        search: debouncedSearch || undefined,
        categoryId: selectedCategory || undefined,
        page,
        size: 20,
      })
      setProducts(data.content)
      setTotal(data.totalElements)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, selectedCategory, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => {
    categoriesApi.getAll().then(r => setCategories(r.data)).catch(() => {})
  }, [])

  const handleDeactivate = async (product) => {
    if (!confirm(`Deactivate "${product.name}"?`)) return
    try {
      await productsApi.deactivate(product.id)
      toast.success('Product deactivated')
      fetchProducts()
    } catch {
      toast.error('Failed to deactivate product')
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} products total</p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="press-feedback flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search products or barcode…"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => { setSelectedCategory(e.target.value); setPage(0) }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-14">Image</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Category</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Price</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Stock</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Barcode</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Package size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-400 text-sm">No products found</p>
                </td>
              </tr>
            ) : products.map((p, i) => (
              <tr
                key={p.id}
                className={cn(
                  'border-b border-slate-50 hover:bg-slate-50 transition-colors duration-100',
                  'animate-slide-up'
                )}
                style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
              >
                <td className="px-4 py-3 align-middle">
                  <ProductThumbnail imageUrl={p.imageUrl} alt={p.name} size={44} fallback={Package} fallbackClassName="bg-slate-50 text-slate-300" />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{p.name}</p>
                  {p.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{p.description}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(p.price)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium',
                    p.quantity <= p.lowStockThreshold ? 'text-amber-600' : 'text-slate-900'
                  )}>
                    {p.quantity <= p.lowStockThreshold && <AlertTriangle size={12} />}
                    {p.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.barcode ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setModal(p)}
                      className="press-feedback p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeactivate(p)}
                      className="press-feedback p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {page * 20 + 1}–{Math.min((page + 1) * 20, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="press-feedback px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                Previous
              </button>
              <button disabled={(page + 1) * 20 >= total} onClick={() => setPage(p => p + 1)}
                className="press-feedback px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <ProductFormModal
          product={modal === 'create' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchProducts() }}
        />
      )}
    </div>
  )
}
