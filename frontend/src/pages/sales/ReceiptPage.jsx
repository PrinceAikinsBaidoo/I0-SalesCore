import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { salesApi } from '@/api/sales'
import { formatCurrency, formatDate } from '@/utils/format'
import { ArrowLeft, Printer } from 'lucide-react'
import { toast } from 'sonner'

export default function ReceiptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sale, setSale] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refundBusy, setRefundBusy] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refundQty, setRefundQty] = useState({})

  const loadReceipt = async (currentId = id, silent = false) => {
    if (!currentId) return
    if (!silent) setLoading(true)
    try {
      const [saleRes, paymentsRes] = await Promise.all([
        salesApi.getReceipt(currentId),
        salesApi.getPayments(currentId),
      ])
      setSale(saleRes.data)
      setPayments(paymentsRes.data ?? [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load receipt')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    let active = true

    setLoading(true)
    Promise.all([salesApi.getReceipt(id), salesApi.getPayments(id)])
      .then(([saleRes, paymentsRes]) => {
        if (!active) return
        setSale(saleRes.data)
        setPayments(paymentsRes.data ?? [])
      })
      .catch((err) => {
        if (!active) return
        setError(err.response?.data?.message ?? 'Failed to load receipt')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  const paymentSummary = useMemo(() => {
    if (!payments.length) return null
    const first = payments[0]
    return {
      method: first.paymentMethod,
      paid: first.amountPaid,
      change: first.changeAmount,
      reference: first.referenceNumber,
    }
  }, [payments])

  const refundableItems = useMemo(() => {
    return (sale?.items ?? [])
      .map((item) => {
        const returned = item.returnedQuantity ?? 0
        const refundable = Math.max(0, item.quantity - returned)
        return { ...item, returnedQuantity: returned, refundableQuantity: refundable }
      })
      .filter((item) => item.refundableQuantity > 0)
  }, [sale])

  const processRefund = async (full = false) => {
    if (!sale?.id) return
    const selectedItems = full
      ? refundableItems.map((item) => ({ saleItemId: item.id, quantity: item.refundableQuantity }))
      : refundableItems
          .map((item) => ({ saleItemId: item.id, quantity: Number(refundQty[item.id] || 0) }))
          .filter((i) => i.quantity > 0)

    if (selectedItems.length === 0) {
      toast.error('Select at least one item quantity to refund')
      return
    }

    setRefundBusy(true)
    try {
      const { data } = await salesApi.refund(sale.id, {
        items: selectedItems,
        reason: refundReason || null,
      })
      toast.success(`Refunded ${formatCurrency(data.refundAmount)}`)
      setRefundQty({})
      setRefundReason('')
      await loadReceipt(sale.id, true)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Refund failed')
    } finally {
      setRefundBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500">Loading receipt...</p>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-600 text-sm">{error || 'Receipt not found'}</p>
        <button
          onClick={() => navigate('/pos')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Back to POS
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .receipt-container { box-shadow: none !important; border: 0 !important; }
        }
      `}</style>

      <div className="max-w-xl mx-auto no-print mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <Printer size={14} />
          Print Receipt
        </button>
      </div>

      <div className="receipt-container max-w-xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="text-center border-b border-dashed border-slate-300 pb-4">
          <p className="text-lg font-bold text-slate-900">I0 SalesCore</p>
          <p className="text-xs text-slate-500">I0 LABS</p>
        </div>

        <div className="py-4 text-sm text-slate-700 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Receipt #</span>
            <span className="font-medium">{sale.saleNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date</span>
            <span>{formatDate(sale.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cashier</span>
            <span>{sale.user?.fullName ?? '-'}</span>
          </div>
          {sale.customer && (
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span>{sale.customer.name}</span>
            </div>
          )}
        </div>

        <div className="border-y border-dashed border-slate-300 py-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs">
                <th className="text-left font-medium pb-2">Item</th>
                <th className="text-right font-medium pb-2">Qty</th>
                <th className="text-right font-medium pb-2">Price</th>
                <th className="text-right font-medium pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(sale.items ?? []).map((item) => (
                <tr key={item.id} className="text-slate-800">
                  <td className="py-1.5 pr-2">{item.productName}</td>
                  <td className="py-1.5 text-right">{item.quantity}</td>
                  <td className="py-1.5 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-1.5 text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Discount</span>
            <span>-{formatCurrency(sale.discountAmount)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tax</span>
            <span>{formatCurrency(sale.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200 mt-2">
            <span>Total</span>
            <span>{formatCurrency(sale.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Payment Status</span>
            <span>{sale.paymentStatus}</span>
          </div>
        </div>

        {paymentSummary && (
          <div className="pt-4 mt-4 border-t border-dashed border-slate-300 text-sm text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method</span>
              <span>{paymentSummary.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid</span>
              <span>{formatCurrency(paymentSummary.paid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Change</span>
              <span>{formatCurrency(paymentSummary.change)}</span>
            </div>
            {paymentSummary.reference && (
              <div className="flex justify-between">
                <span className="text-slate-500">Reference</span>
                <span>{paymentSummary.reference}</span>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-dashed border-slate-300 no-print">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Refund / Return</h3>
          {sale.paymentStatus === 'REFUNDED' ? (
            <p className="text-sm text-green-700">This sale is fully refunded.</p>
          ) : refundableItems.length === 0 ? (
            <p className="text-sm text-slate-500">No refundable items remaining.</p>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {refundableItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 truncate">{item.productName}</p>
                      <p className="text-xs text-slate-500">
                        Sold: {item.quantity} | Returned: {item.returnedQuantity} | Refundable: {item.refundableQuantity}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={item.refundableQuantity}
                      value={refundQty[item.id] ?? ''}
                      onChange={(e) => setRefundQty((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Optional refund reason"
                className="w-full mb-3 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <button
                  disabled={refundBusy}
                  onClick={() => processRefund(false)}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
                >
                  {refundBusy ? 'Processing...' : 'Refund Selected'}
                </button>
                <button
                  disabled={refundBusy}
                  onClick={() => processRefund(true)}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
                >
                  {refundBusy ? 'Processing...' : 'Refund All Remaining'}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Thank you for your purchase.
        </p>
      </div>
    </div>
  )
}
