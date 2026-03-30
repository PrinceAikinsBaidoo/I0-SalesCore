import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse,
  Users, BarChart2, Settings, LogOut, UserCog, RotateCcw, Truck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_GROUPS } from '@/constants/roles'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ROLE_GROUPS.adminManager },
  { to: '/pos', label: 'Point of Sale', icon: ShoppingCart, roles: ROLE_GROUPS.allOperational },
  { to: '/products', label: 'Products', icon: Package, roles: ROLE_GROUPS.adminManager },
  { to: '/suppliers', label: 'Suppliers', icon: Truck, roles: ROLE_GROUPS.adminManager },
  { to: '/inventory', label: 'Inventory', icon: Warehouse, roles: ROLE_GROUPS.adminManager },
  { to: '/customers', label: 'Customers', icon: Users, roles: ROLE_GROUPS.allOperational },
  { to: '/refunds', label: 'Refund History', icon: RotateCcw, roles: ROLE_GROUPS.allOperational },
  { to: '/reports', label: 'Reports', icon: BarChart2, roles: ROLE_GROUPS.adminManager },
  { to: '/users', label: 'Users', icon: UserCog, roles: ROLE_GROUPS.adminOnly },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ROLE_GROUPS.adminOnly },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-950 flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">I0</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">SalesCore</p>
            <p className="text-slate-500 text-xs">I0 LABS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'press-feedback flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.fullName?.charAt(0) ?? '?'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.fullName}</p>
              <p className="text-slate-500 text-xs">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="press-feedback w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors duration-150"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
