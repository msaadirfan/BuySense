import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import '../pages/main.css'

const CATEGORY_ICONS = {
  'Electronics': '💻', 'Clothing': '👗', 'Books': '📚',
  'Home & Kitchen': '🏠', 'Sports': '⚽', 'Beauty': '💄',
  'Groceries': '🛒', 'Toys & Games': '🎮', 'Automotive': '🚗', 'Health': '💊',
}

export default function Navbar({ onSearch, cartCount = 0 }) {
  const [user, setUser]             = useState(null)
  const [isSeller, setIsSeller]     = useState(false)
  const [dropdownOpen, setDropdown] = useState(false)
  const [searchVal, setSearchVal]   = useState('')
  const dropdownRef                 = useRef(null)
  const navigate                    = useNavigate()
  const location                    = useLocation()

  useEffect(() => {
    api.get('/api/me/')
      .then(res => {
        setUser(res.data)
        setIsSeller(res.data.is_seller)
      })
      .catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) onSearch(searchVal)
    else navigate(`/?search=${encodeURIComponent(searchVal)}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/login')
  }

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase()
    : '?'

  const isDashboard = location.pathname.startsWith('/seller')

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo">
        <div className="navbar-logo-mark">B</div>
        <span className="navbar-logo-text">BuySense</span>
      </Link>

      {/* Search */}
      <form className="navbar-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search products, brands, categories..."
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
        />
        <span className="navbar-search-icon">🔍</span>
      </form>

      {/* Actions */}
      <div className="navbar-actions">

        {/* Seller links — always show both */}
        {isSeller && (
          <>
            <Link to="/" className={`nav-btn ${!isDashboard ? 'active' : ''}`}>
              🛍️ Shop
            </Link>
            <Link to="/seller/dashboard" className={`nav-btn seller-btn ${isDashboard ? 'active' : ''}`}>
              📊 Dashboard
            </Link>
          </>
        )}

        {/* Cart */}
        <Link to="/cart" className="nav-btn cart-btn">
          <span className="nav-btn-icon">🛒</span>
          <span className="sr-only">Cart</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
        </Link>

        {/* Orders */}
        <Link to="/orders" className="nav-btn">
          <span className="nav-btn-icon">📦</span>
          <span>Orders</span>
        </Link>

        {/* Profile dropdown */}
        <div className="profile-dropdown" ref={dropdownRef}>
          <div className="profile-avatar" onClick={() => setDropdown(o => !o)}>
            {initials}
          </div>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <p>{user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}</p>
                <p>{user?.email}</p>
              </div>

              <Link to="/profile" className="dropdown-item" onClick={() => setDropdown(false)}>
                👤 My Profile
              </Link>
              <Link to="/orders" className="dropdown-item" onClick={() => setDropdown(false)}>
                📦 My Orders
              </Link>
              {isSeller && (
                <Link to="/seller/products" className="dropdown-item" onClick={() => setDropdown(false)}>
                  📦 My Products
                </Link>
              )}
              <button className="dropdown-item danger" onClick={handleLogout}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}