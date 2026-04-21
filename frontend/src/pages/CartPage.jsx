import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './main.css'

const CATEGORY_ICONS = {
  'Electronics': '💻', 'Clothing': '👗', 'Books': '📚',
  'Home & Kitchen': '🏠', 'Sports': '⚽', 'Beauty': '💄',
  'Groceries': '🛒', 'Toys & Games': '🎮', 'Automotive': '🚗', 'Health': '💊',
}

export default function CartPage() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [clearing, setClearing] = useState(false)
  const [toast, setToast]       = useState(null)
  const navigate                = useNavigate()

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await api.get('/api/cart/')
        if (!cancelled) setItems(res.data)
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleQuantityChange(itemId, newQty) {
    if (newQty < 1) return handleRemove(itemId)
    try {
      const res = await api.patch(`/api/cart/${itemId}/`, { quantity: newQty })
      setItems(prev => prev.map(i => i.id === itemId ? res.data : i))
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not update quantity.', 'error')
    }
  }

  async function handleRemove(itemId) {
    try {
      await api.delete(`/api/cart/${itemId}/`)
      setItems(prev => prev.filter(i => i.id !== itemId))
      showToast('Item removed from cart.')
    } catch {
      showToast('Could not remove item.', 'error')
    }
  }

  async function handleClear() {
    setClearing(true)
    try {
      await api.delete('/api/cart/clear/')
      setItems([])
      showToast('Cart cleared.')
    } catch {
      showToast('Could not clear cart.', 'error')
    } finally {
      setClearing(false)
    }
  }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.subtotal, 0)
  const cartCount  = totalItems

  if (loading) return (
    <div className="app-shell">
      <Navbar cartCount={0} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: 'var(--navbar-h)', color: 'var(--text-muted)' }}>
        Loading cart...
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <Navbar cartCount={cartCount} />

      <div style={{ paddingTop: 'var(--navbar-h)', flex: 1 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
              🛒 Your Cart
              {items.length > 0 && (
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '10px' }}>
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </span>
              )}
            </h1>
            {items.length > 0 && (
              <button
                onClick={handleClear}
                disabled={clearing}
                style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--red)', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
              >
                {clearing ? 'Clearing...' : '🗑 Clear Cart'}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: '80px' }}>
              <div className="empty-state-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add some products to get started</p>
              <Link to="/" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 24px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                Browse Products
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

              {/* Items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map(item => (
                  <div key={item.id} style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '16px',
                    display: 'grid', gridTemplateColumns: '72px 1fr auto',
                    gap: '16px', alignItems: 'center',
                  }}>
                    {/* Thumbnail */}
                    <div
                      onClick={() => navigate(`/products/${item.product?.id}`)}
                      style={{
                        width: '72px', height: '72px', background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px', cursor: 'pointer', flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {item.product?.product_image
                        ? <img src={item.product.product_image} alt={item.product.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : CATEGORY_ICONS[item.product?.category?.category_name] || '📦'
                      }
                    </div>

                    {/* Info */}
                    <div>
                      <div
                        onClick={() => navigate(`/products/${item.product?.id}`)}
                        style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginBottom: '4px' }}
                      >
                        {item.product?.product_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        by {item.product?.seller?.seller_name}
                      </div>

                      {/* Quantity control */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          style={{ width: '28px', height: '28px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-soft)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >−</button>
                        <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          style={{ width: '28px', height: '28px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-soft)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >+</button>
                        <button
                          onClick={() => handleRemove(item.id)}
                          style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Outfit, sans-serif' }}
                        >Remove</button>
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>
                        PKR {Number(item.subtotal).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        PKR {Number(item.product?.product_price).toLocaleString()} each
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order summary */}
              <div style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '20px',
                position: 'sticky', top: 'calc(var(--navbar-h) + 16px)',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Order Summary</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-soft)' }}>
                    <span>Subtotal ({totalItems} items)</span>
                    <span>PKR {totalPrice.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-soft)' }}>
                    <span>Delivery</span>
                    <span style={{ color: 'var(--green)' }}>Free</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>
                      PKR {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  style={{
                    width: '100%', padding: '12px', background: 'var(--accent)',
                    border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff',
                    fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 600,
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                >
                  Proceed to Checkout →
                </button>

                <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  )
}