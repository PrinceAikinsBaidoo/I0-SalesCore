import { useState, useEffect } from 'react'
import { reportsApi } from '@/api/sales'
import { productsApi } from '@/api/products'
import { formatCurrency } from '@/utils/format'
import { useAuth } from '@/contexts/AuthContext'
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, Package, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

function StatCard({ label, value, sublabel, icon: Icon, color, onClick, delay = 0 }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-slate-200 p-5 animate-slide-up',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 press-feedback'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon size={18} />
        </div>
        {onClick && <ArrowRight size={14} className="text-slate-300" />}
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-0.5">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [daily, setDaily] = useState(null)
  const [weekly, setWeekly] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([reportsApi.daily(), reportsApi.weekly(), productsApi.getLowStock()])
      .then(([d, w, ls]) => {
        setDaily(d.data)
        setWeekly(w.data)
        setLowStock(ls.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{greeting}, {user?.fullName?.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's what's happening with your store today.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Today's stats */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Today</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Revenue" value={formatCurrency(daily?.totalRevenue)} sublabel="Today's sales" icon={DollarSign} color="bg-green-100 text-green-600" delay={0} />
              <StatCard label="Transactions" value={daily?.totalSales ?? 0} sublabel="Completed sales" icon={ShoppingBag} color="bg-blue-100 text-blue-600" delay={50} />
              <StatCard label="Avg. Sale" value={formatCurrency(daily?.averageSale)} sublabel="Per transaction" icon={TrendingUp} color="bg-purple-100 text-purple-600" delay={100} />
              <StatCard label="Low Stock" value={lowStock.length} sublabel="Items need restock" icon={AlertTriangle} color="bg-amber-100 text-amber-600"
                onClick={lowStock.length > 0 ? () => navigate('/inventory') : undefined} delay={150} />
            </div>
          </div>

          {/* Weekly stats */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">This Week</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Revenue" value={formatCurrency(weekly?.totalRevenue)} icon={DollarSign} color="bg-green-50 text-green-500" delay={0} />
              <StatCard label="Transactions" value={weekly?.totalSales ?? 0} icon={ShoppingBag} color="bg-blue-50 text-blue-500" delay={50} />
              <StatCard label="Avg. Sale" value={formatCurrency(weekly?.averageSale)} icon={TrendingUp} color="bg-purple-50 text-purple-500" delay={100} />
            </div>
          </div>

          {/* Low stock alerts */}
          {lowStock.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">Low Stock Alerts</p>
                </div>
                <button onClick={() => navigate('/inventory')}
                  className="press-feedback text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {lowStock.slice(0, 10).map(p => (
                  <div key={p.id} className="bg-white rounded-lg px-3 py-2 border border-amber-100">
                    <p className="text-xs font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs font-bold text-amber-600">{p.quantity} left</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'New Sale', icon: ShoppingBag, to: '/pos', color: 'bg-green-500 hover:bg-green-600 text-white' },
                { label: 'Add Product', icon: Package, to: '/products', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
                { label: 'View Reports', icon: TrendingUp, to: '/reports', color: 'bg-purple-500 hover:bg-purple-600 text-white' },
                { label: 'Inventory', icon: AlertTriangle, to: '/inventory', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
              ].map(({ label, icon: Icon, to, color }, i) => (
                <button key={to} onClick={() => navigate(to)}
                  className={cn('press-feedback flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors animate-slide-up', color)}
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
