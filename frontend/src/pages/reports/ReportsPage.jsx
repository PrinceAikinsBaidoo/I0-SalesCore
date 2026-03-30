import { useState, useEffect } from 'react'
import { reportsApi } from '@/api/sales'
import { formatCurrency, formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, ShoppingBag, DollarSign, Package, Truck } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('daily')
  const [summary, setSummary] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [cashiers, setCashiers] = useState([])
  const [invReport, setInvReport] = useState(null)
  const [supplierSummary, setSupplierSummary] = useState(null)
  const [topSuppliers, setTopSuppliers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const summaryFn = period === 'daily' ? reportsApi.daily : reportsApi.weekly
    Promise.all([
      summaryFn(),
      reportsApi.topProducts({ limit: 8 }),
      reportsApi.cashiers({}),
      reportsApi.inventory(),
      reportsApi.supplierSummary({}),
      reportsApi.topSuppliers({ limit: 8 }),
    ]).then(([s, tp, c, inv, supSummary, supTop]) => {
      setSummary(s.data)
      setTopProducts(tp.data.map(row => ({ name: row[1], qty: Number(row[2]), revenue: Number(row[3]) })))
      setCashiers(c.data.map(row => ({ name: row[1], sales: Number(row[2]), revenue: Number(row[3]) })))
      setInvReport(inv.data)
      setSupplierSummary(supSummary.data)
      setTopSuppliers(supTop.data.map((row) => ({
        id: Number(row[0]),
        name: row[1],
        restocks: Number(row[2]),
        qty: Number(row[3]),
        value: Number(row[4]),
        lastRestock: row[5],
      })))
    }).catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Business performance overview</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {['daily', 'weekly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`press-feedback px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {p === 'daily' ? 'Today' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading reports…</div>
      ) : summary && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={formatCurrency(summary.totalRevenue)} icon={DollarSign} color="bg-green-100 text-green-600" />
            <StatCard label="Total Sales" value={summary.totalSales} icon={ShoppingBag} color="bg-blue-100 text-blue-600" />
            <StatCard label="Avg. Sale Value" value={formatCurrency(summary.averageSale)} icon={TrendingUp} color="bg-purple-100 text-purple-600" />
            <StatCard label="Low Stock Items" value={invReport?.lowStockCount ?? 0} icon={Package} color="bg-amber-100 text-amber-600" />
          </div>

          {/* Top products chart */}
          {topProducts.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Top Selling Products</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(v, name) => [name === 'revenue' ? formatCurrency(v) : v, name === 'qty' ? 'Units Sold' : 'Revenue']}
                  />
                  <Bar dataKey="qty" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Cashier performance */}
          {cashiers.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Cashier Performance</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Cashier', 'Sales', 'Revenue'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cashiers.map((c, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-900">{c.name}</td>
                      <td className="px-5 py-3 text-slate-600">{c.sales}</td>
                      <td className="px-5 py-3 font-semibold text-green-600">{formatCurrency(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Supplier analytics */}
          {supplierSummary && (
            <>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Supplier Restocking (30 Days)</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard label="Active Suppliers" value={supplierSummary.supplierCount ?? 0} icon={Truck} color="bg-indigo-100 text-indigo-600" />
                  <StatCard label="Units Restocked" value={supplierSummary.totalRestockedQty ?? 0} icon={Package} color="bg-blue-100 text-blue-600" />
                  <StatCard label="Restock Value" value={formatCurrency(supplierSummary.totalRestockedValue)} icon={DollarSign} color="bg-emerald-100 text-emerald-600" />
                </div>
              </div>

              {topSuppliers.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900">Top Suppliers</h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {['Supplier', 'Restocks', 'Units', 'Value', 'Last Delivery'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topSuppliers.map((s) => (
                        <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-900">{s.name}</td>
                          <td className="px-5 py-3 text-slate-600">{s.restocks}</td>
                          <td className="px-5 py-3 text-slate-600">{s.qty}</td>
                          <td className="px-5 py-3 font-semibold text-emerald-600">{formatCurrency(s.value)}</td>
                          <td className="px-5 py-3 text-slate-500">{s.lastRestock ? formatDate(s.lastRestock) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
