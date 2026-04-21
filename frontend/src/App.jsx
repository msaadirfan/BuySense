import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Login           from './pages/auth/Login'
import Register        from './pages/auth/Register'
import HomePage        from './pages/HomePage'
import SellerDashboard from './pages/SellerDashboard'
import ProductDetail   from './pages/ProductDetail'
import CartPage        from './pages/CartPage'
import CheckoutPage    from './pages/CheckoutPage'
import OrderHistory,
  { OrderDetail }      from './pages/OrderHistory'
import SellerProducts  from './pages/SellerProducts'
import SellerOrders    from './pages/SellerOrders'
import SellerProfile  from './pages/SellerProfile'
import ProtectedRoute  from './components/ProtectedRoute'
import api             from './api'

// Redirect to /seller/dashboard if seller, else /
function RoleRedirect() {
  const [dest, setDest] = useState(null)
  useEffect(() => {
    api.get('/api/me/')
      .then(res => setDest(res.data.is_seller ? '/seller/dashboard' : '/'))
      .catch(() => setDest('/'))
  }, [])
  if (!dest) return null
  return <Navigate to={dest} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Role-based entry ── */}
        <Route path="/home" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

        {/* ── Customer ── */}
        <Route path="/"                element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/products/:id"    element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
        <Route path="/cart"            element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/checkout"        element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders"          element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/orders/:id"      element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />

        {/* ── Seller Profile (public) ── */}
        <Route path="/sellers/:id"       element={<ProtectedRoute><SellerProfile /></ProtectedRoute>} />

        {/* ── Seller ── */}
        <Route path="/seller/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
        <Route path="/seller/products"  element={<ProtectedRoute><SellerProducts /></ProtectedRoute>} />
        <Route path="/seller/orders"    element={<ProtectedRoute><SellerOrders /></ProtectedRoute>} />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App