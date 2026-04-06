import { useState, useRef, useEffect, useCallback } from 'react'
import { CartProvider, useCart } from '@/contexts/CartContext'
import { productsApi } from '@/api/products'
import { customersApi } from '@/api/customers'
import { salesApi } from '@/api/sales'
import { formatCurrency } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'
import BarcodeScannerModal from '@/components/BarcodeScannerModal'
import {
  Search, Trash2, Plus, Minus, ShoppingCart,
  CreditCard, Banknote, Smartphone, User, X, CheckCircle, Printer, ScanBarcode, Camera
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Paystack helper ────────────────────────────────────────────────────────
const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? ''
const PAYSTACK_FALLBACK_EMAIL = import.meta.env.VITE_PAYSTACK_FALLBACK_EMAIL ?? 'payments@iosalescore.com'

function resolvePaystackEmail(rawEmail) {
  const email = String(rawEmail ?? '').trim()
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (isValid) return email
  return PAYSTACK_FALLBACK_EMAIL
}

function openPaystack({ email, amount, onSuccess, onClose }) {
  if (!PAYSTACK_KEY) {
    toast.error('Paystack public key not configured (VITE_PAYSTACK_PUBLIC_KEY).')
    return
  }
  // Paystack expects amount in kobo/pesewas (smallest unit)
  const amountInPesewas = Math.round(amount * 100)
  const reference = `IO-${Date.now()}`

  // Dynamically load Paystack inline JS if not already present
  const load = () => {
    const paystackEmail = resolvePaystackEmail(email)
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: paystackEmail,
      amount: amountInPesewas,
      currency: 'GHS',
      ref: reference,
      label: 'I0 SalesCore',
      onClose,
      callback: (response) => onSuccess(response.reference),
    })
    handler.openIframe()
  }

  if (window.PaystackPop) {
    load()
  } else {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v2/inline.js'
    script.onload = load
    script.onerror = () => toast.error('Could not load Paystack. Check your internet connection.')
    document.head.appendChild(script)
  }
}

// ─── Payment Modal ───────────────────────────────────────────────────────────
function PaymentModal({ total, customer, onClose, onSuccess }) {
  const [method, setMethod] = useState('CASH')
  const [amountPaid, setAmountPaid] = useState(total.toFixed(2))
  const [loading, setLoading] = useState(false)
  const change = Math.max(0, parseFloat(amountPaid || 0) - total)

  const methods = [
    { id: 'CASH',         label: 'Cash',         icon: Banknote,    online: false },
    { id: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone,  online: true  },
    { id: 'CARD',         label: 'Card',         icon: CreditCard,  online: true  },
  ]

  const handleConfirm = () => {
    const isOnline = methods.find(m => m.id === method)?.online
    if (isOnline) {
      setLoading(true)
      openPaystack({
        email: customer?.email,
        amount: total,
        onSuccess: (ref) => {
          setLoading(false)
          onSuccess(method, total, 0, ref)
        },
        onClose: () => setLoading(false),
      })
    } else {
      onSuccess(method, parseFloat(amountPaid), change, null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Process Payment</h2>
          <button onClick={onClose} className="press-feedback text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-500 mb-1">Total Due</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
          </div>

          {/* Payment methods */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {methods.map(({ id, label, icon: Icon, online }) => (
                <button
                  key={id}
                  onClick={() => setMethod(id)}
                  className={cn(
                    'press-feedback flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-medium transition-all duration-150',
                    method === id
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  <Icon size={18} />
                  {label}
                  {online && (
                    <span className={cn('text-[9px] rounded-full px-1.5 py-0.5 font-semibold',
                      method === id ? 'bg-blue-100 text-blue-500' : 'bg-slate-100 text-slate-400')}>
                      Paystack
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Amount paid — only for cash */}
          {method === 'CASH' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Amount Tendered</label>
                <input
                  type="number" step="0.01" min={total}
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                <span className="text-sm font-medium text-green-700">Change</span>
                <span className="text-lg font-bold text-green-700">{formatCurrency(change)}</span>
              </div>
            </>
          )}

          {/* Paystack notice */}
          {method !== 'CASH' && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-3">
              <CreditCard size={16} className="text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                You will be redirected to Paystack to complete the payment securely.
              </p>
            </div>
          )}

          <button
            disabled={loading || (method === 'CASH' && parseFloat(amountPaid || 0) < total)}
            onClick={handleConfirm}
            className="press-feedback w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? 'Opening Paystack…' : method === 'CASH' ? 'Confirm Payment' : `Pay ${formatCurrency(total)} via Paystack`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ sale, onClose }) {
  const receiptId = sale?.id ?? sale?.saleId ?? sale?.sale?.id

  const openReceipt = () => {
    if (!receiptId) {
      toast.error('Receipt is not ready yet. Please refresh sales history and try again.')
      return
    }
    window.open(`/receipt/${receiptId}`, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Sale Complete!</h2>
        <p className="text-slate-500 text-sm mb-1">Sale #{sale.saleNumber}</p>
        <p className="text-2xl font-bold text-slate-900 mb-6">{formatCurrency(sale.totalAmount)}</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="press-feedback flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
            New Sale
          </button>
          <button
            onClick={openReceipt}
            disabled={!receiptId}
            className="press-feedback flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Printer size={14} /> Receipt
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main POS ─────────────────────────────────────────────────────────────────
function POSContent() {
  const { cart, dispatch, subtotal, total } = useCart()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState([])
  const [showPayment, setShowPayment] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [completedSale, setCompletedSale] = useState(null)
  const [processing, setProcessing] = useState(false)
  const searchRef = useRef(null)
  const debouncedSearch = useDebounce(search, 300)
  const debouncedCustomer = useDebounce(customerSearch, 300)

  // -------------------------------------------------------------------
  // Hardware USB/Bluetooth barcode scanner support.
  // Hardware scanners type very fast (< 30ms between chars) and end
  // with Enter. We detect this pattern and trigger a lookup directly.
  // -------------------------------------------------------------------
  const hwBuffer = useRef('')
  const hwTimer = useRef(null)
  const SCANNER_THRESHOLD_MS = 30

  useEffect(() => {
    const onKeyDown = (e) => {
      // Ignore if user is typing in an input / textarea that isn't the search bar
      const tag = document.activeElement?.tagName
      const isOtherInput = (tag === 'INPUT' || tag === 'TEXTAREA') && document.activeElement !== searchRef.current
      if (isOtherInput) return

      if (e.key === 'Enter') {
        clearTimeout(hwTimer.current)
        const code = hwBuffer.current.trim()
        hwBuffer.current = ''
        if (code.length >= 4) {
          // Hardware scanner fired — bypass debounce
          e.preventDefault()
          handleBarcodeInput(code)
        }
        return
      }

      if (e.key.length === 1) { // printable character
        clearTimeout(hwTimer.current)
        hwBuffer.current += e.key
        hwTimer.current = setTimeout(() => {
          // User typed slowly — not a scanner, clear buffer
          hwBuffer.current = ''
        }, SCANNER_THRESHOLD_MS)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  const handleBarcodeInput = useCallback((code) => {
    setSearch(code) // show scanned code in the search bar
    setSearching(true)
    productsApi.getByBarcode(code)
      .then(r => {
        const product = r.data
        if (product) {
          addProduct(product)
          setSearch('')
          setSearchResults([])
          toast.success(`Added: ${product.name}`)
        } else {
          toast.warning('No product found for barcode: ' + code)
        }
      })
      .catch(() => {
        toast.warning('No product found for barcode: ' + code)
      })
      .finally(() => setSearching(false))
  }, [])

  // Camera scan callback
  const handleCameraScan = useCallback((code) => {
    setShowCamera(false)
    handleBarcodeInput(code)
  }, [handleBarcodeInput])

  useEffect(() => { searchRef.current?.focus() }, [])

  // Product text search
  useEffect(() => {
    if (!debouncedSearch) { setSearchResults([]); return }
    setSearching(true)
    const isBarcode = /^\d+$/.test(debouncedSearch) && debouncedSearch.length >= 6
    const req = isBarcode
      ? productsApi.getByBarcode(debouncedSearch)
          .then(r => ({ data: { content: [r.data].filter(Boolean) } }))
          .catch(() => ({ data: { content: [] } }))
      : productsApi.getAll({ search: debouncedSearch, size: 8 })
    req.then(r => setSearchResults(r.data.content ?? []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false))
  }, [debouncedSearch])

  // Customer search
  useEffect(() => {
    if (!debouncedCustomer) { setCustomerResults([]); return }
    customersApi.getAll({ search: debouncedCustomer, size: 5 })
      .then(r => setCustomerResults(r.data.content ?? []))
      .catch(() => {})
  }, [debouncedCustomer])

  const addProduct = (product) => {
    if (product.quantity <= 0) { toast.warning(`${product.name} is out of stock`); return }
    dispatch({ type: 'ADD_ITEM', product })
    setSearch('')
    setSearchResults([])
    searchRef.current?.focus()
  }

  const handleCheckout = async (method, amountPaid, paystackRef) => {
    setProcessing(true)
    try {
      const payload = {
        customerId: cart.customer?.id ?? null,
        items: cart.items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          discount: i.discount,
        })),
        discountAmount: cart.discount,
        taxAmount: 0,
        paymentMethod: method,
        amountPaid,
        referenceNumber: paystackRef ?? null,
      }
      const { data } = await salesApi.create(payload)
      const normalizedSale = data?.id ? data : (data?.sale?.id ? data.sale : data)
      if (!normalizedSale?.id) {
        toast.warning('Sale completed, but receipt ID was not returned. Check Sales/Reports.')
      }
      setShowPayment(false)
      setCompletedSale(normalizedSale)
      dispatch({ type: 'CLEAR' })
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Sale failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 gap-0">
      {/* Left — Product search */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Search bar + camera button */}
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              placeholder="Search products, type barcode, or scan…"
            />
            {searching && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          {/* Camera scan button */}
          <button
            onClick={() => setShowCamera(true)}
            className="press-feedback flex items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            title="Scan barcode with camera"
          >
            <Camera size={16} />
            <span className="hidden sm:inline">Scan</span>
          </button>
        </div>

        {/* Hardware scanner hint */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ScanBarcode size={12} />
          <span>USB/Bluetooth scanner: just scan — it will auto-add the product</span>
        </div>

        {/* Search results grid */}
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {searchResults.map((p, i) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                disabled={p.quantity <= 0}
                className={cn(
                  'press-feedback bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-blue-300 hover:shadow-md transition-all duration-150 animate-slide-up disabled:opacity-50 disabled:cursor-not-allowed',
                )}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                  <ShoppingCart size={14} className="text-blue-500" />
                </div>
                <p className="text-xs font-semibold text-slate-900 leading-tight line-clamp-2">{p.name}</p>
                <p className="text-sm font-bold text-blue-600 mt-1">{formatCurrency(p.price)}</p>
                <p className={cn('text-xs mt-0.5', p.quantity <= 5 ? 'text-amber-500' : 'text-slate-400')}>
                  {p.quantity} in stock
                </p>
              </button>
            ))}
          </div>
        ) : search && !searching ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <ShoppingCart size={32} className="opacity-30" />
            <p className="text-sm">No products found</p>
          </div>
        ) : !search ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Search size={32} className="opacity-30" />
            <p className="text-sm">Search or scan a product barcode to add it to the cart</p>
          </div>
        ) : null}
      </div>

      {/* Right — Cart */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-lg">
        {/* Cart header */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <ShoppingCart size={16} />
              Cart
              {cart.items.length > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.items.length}
                </span>
              )}
            </h2>
            {cart.items.length > 0 && (
              <button onClick={() => dispatch({ type: 'CLEAR' })}
                className="press-feedback text-xs text-red-400 hover:text-red-600 transition-colors">
                Clear all
              </button>
            )}
          </div>

          {/* Customer picker */}
          <div className="relative">
            <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            {cart.customer ? (
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-xs text-blue-700 font-medium flex-1">{cart.customer.name}</span>
                <button onClick={() => dispatch({ type: 'SET_CUSTOMER', customer: null })}
                  className="text-blue-400 hover:text-blue-600"><X size={12} /></button>
              </div>
            ) : (
              <input
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="Search customer (optional)…"
              />
            )}
            {customerResults.length > 0 && !cart.customer && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 z-10">
                {customerResults.map(c => (
                  <button key={c.id}
                    onClick={() => { dispatch({ type: 'SET_CUSTOMER', customer: c }); setCustomerSearch(''); setCustomerResults([]) }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-slate-400">{c.phone ?? c.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
              <ShoppingCart size={40} />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : cart.items.map(item => (
            <div key={item.product.id} className="bg-slate-50 rounded-xl p-3 animate-slide-up">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-slate-900 leading-tight flex-1">{item.product.name}</p>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_ITEM', productId: item.product.id })}
                  className="press-feedback text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => item.quantity > 1
                      ? dispatch({ type: 'UPDATE_QTY', productId: item.product.id, quantity: item.quantity - 1 })
                      : dispatch({ type: 'REMOVE_ITEM', productId: item.product.id })}
                    className="press-feedback w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors">
                    <Minus size={10} />
                  </button>
                  <span className="text-xs font-semibold text-slate-900 w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_QTY', productId: item.product.id, quantity: item.quantity + 1 })}
                    className="press-feedback w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-500 transition-colors">
                    <Plus size={10} />
                  </button>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(item.product.price * item.quantity - item.discount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals & checkout */}
        <div className="px-4 py-4 border-t border-slate-100 space-y-3">
          {/* Cart-level discount */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-20 flex-shrink-0">Discount</label>
            <input
              type="number" min="0" step="0.01"
              value={cart.discount || ''}
              onChange={e => dispatch({ type: 'SET_DISCOUNT', discount: parseFloat(e.target.value) || 0 })}
              className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="text-red-500">-{formatCurrency(cart.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-slate-100 pt-1.5">
              <span className="text-slate-900">Total</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            disabled={cart.items.length === 0 || processing}
            onClick={() => setShowPayment(true)}
            className="press-feedback w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Charge {formatCurrency(total)}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showCamera && (
        <BarcodeScannerModal onScan={handleCameraScan} onClose={() => setShowCamera(false)} />
      )}

      {showPayment && (
        <PaymentModal
          total={total}
          customer={cart.customer}
          onClose={() => setShowPayment(false)}
          onSuccess={(method, amountPaid, _change, ref) => handleCheckout(method, amountPaid, ref)}
        />
      )}

      {completedSale && (
        <SuccessModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  )
}

export default function POSPage() {
  return (
    <CartProvider>
      <POSContent />
    </CartProvider>
  )
}
