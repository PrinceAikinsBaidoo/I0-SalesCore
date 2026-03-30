import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ProductsPage from '@/pages/products/ProductsPage'
import SuppliersPage from '@/pages/suppliers/SuppliersPage'
import POSPage from '@/pages/sales/POSPage'
import ReceiptPage from '@/pages/sales/ReceiptPage'
import RefundsPage from '@/pages/sales/RefundsPage'
import CustomersPage from '@/pages/customers/CustomersPage'
import InventoryPage from '@/pages/inventory/InventoryPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import UsersPage from '@/pages/users/UsersPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import { ROLE_GROUPS, roleHomeRoute } from '@/constants/roles'

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to={roleHomeRoute(user?.role)} replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated) {
    return <Navigate to={roleHomeRoute(user?.role)} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/receipt/:id" element={
        <ProtectedRoute roles={ROLE_GROUPS.allOperational}><ReceiptPage /></ProtectedRoute>
      } />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={
          <ProtectedRoute roles={ROLE_GROUPS.adminManager}><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/pos" element={
          <ProtectedRoute roles={ROLE_GROUPS.allOperational}><POSPage /></ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute roles={ROLE_GROUPS.adminManager}><ProductsPage /></ProtectedRoute>
        } />
        <Route path="/suppliers" element={
          <ProtectedRoute roles={ROLE_GROUPS.adminManager}><SuppliersPage /></ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute roles={ROLE_GROUPS.adminManager}><InventoryPage /></ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute roles={ROLE_GROUPS.allOperational}><CustomersPage /></ProtectedRoute>
        } />
        <Route path="/refunds" element={
          <ProtectedRoute roles={ROLE_GROUPS.allOperational}><RefundsPage /></ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute roles={ROLE_GROUPS.adminManager}><ReportsPage /></ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute roles={ROLE_GROUPS.adminOnly}><UsersPage /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute roles={ROLE_GROUPS.adminOnly}><SettingsPage /></ProtectedRoute>
        } />
      </Route>

      <Route path="/" element={<RoleDefaultRoute />} />
      <Route path="*" element={<RoleDefaultRoute />} />
    </Routes>
  )
}

function RoleDefaultRoute() {
  const { isAuthenticated, user } = useAuth()
  return <Navigate to={isAuthenticated ? roleHomeRoute(user?.role) : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
