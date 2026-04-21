import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './main.css'

const PAYMENT_LABELS = {
  COD:  '💵 Cash on Delivery',
  BANK: '🏦 Bank Transfer',
  EASYP: '📱 Easypaisa',
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading]     = useState(true)
  const [placing, setPlacing]     = useState(false)
  const [toast, setToast]         = useState(null)
  const navigate                  = useNavigate()

  const [form, setForm] = useState({
    address:       '',
    payment_method: 'COD',
  })

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await api.get('/api/cart/')
        if (!cancelled) {
          if (res.data.length === 0) navigate('/cart')
          else setCartItems(res.data)
        }
      } catch {
        if (!cancelled) navigate('/cart')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [navigate])

  const totalPrice = cartItems.reduce((s, i) => s + i.subtotal, 0)

  async function handlePlaceOrder(e) {
    e.preventDefault()
    if (!form.address.trim()) return showToast('Please enter a delivery address.', 'error')

    setPlacing(true)
    try {
      // Build order items from cart
      const items = cartItems.map(i => ({
        product_id: i.product.id,
        quantity:   i.quantity,
      }))

      // Place order
      const orderRes = await api.post('/api/orders/', {
        address: form.address,
        items,
      })

      // Record payment
      await api.post('/api/payments/', {
        order_id: orderRes.data.id,
        method:   form.payment_method,
      })

      // Clear cart after successful order
      await api.delete('/api/cart/clear/')

      navigate(`/orders/${orderRes.data.id}?success=1`)
    } catch (err) {
      const msg = err.response?.data?.detail
        || Object.values(err.response?.data || {}).flat().join(' ')
        || 'Failed to place order.'
      showToast(msg, 'error')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) return (
    <div className="app-shell">
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: 'var(--navbar-h)', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <Navbar />

      <div style={{ paddingTop: 'var(--navbar-h)', flex: 1 }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>

          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '28px' }}>
            ⚡ Checkout
          </h1>

          <form onSubmit={handlePlaceOrder}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

              {/* Left: Delivery + Payment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Delivery address */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>📍 Delivery Address</h3>
                  <div className="field-group">
                    <label>Full delivery address</label>
                    <textarea
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Street address, City, Province..."
                      rows={3}
                      required
                      style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                        color: 'var(--text)', fontFamily: 'Outfit, sans-serif',
                        fontSize: '14px', outline: 'none', resize: 'vertical', width: '100%',
                      }}
                    />
                  </div>
                </div>

                {/* Payment method */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>💳 Payment Method</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(PAYMENT_LABELS).map(([key, label]) => (
                      <label
                        key={key}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 16px', border: '1px solid',
                          borderColor: form.payment_method === key ? 'var(--accent)' : 'var(--border)',
                          background: form.payment_method === key ? 'var(--accent-dim)' : 'var(--bg-card)',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          transition: 'all 0.15s', fontSize: '14px', fontWeight: 500,
                          color: form.payment_method === key ? 'var(--accent)' : 'var(--text-soft)',
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={key}
                          checked={form.payment_method === key}
                          onChange={() => setForm(f => ({ ...f, payment_method: key }))}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Order items preview */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>🧾 Order Items ({cartItems.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cartItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <div style={{ color: 'var(--text-soft)' }}>
                          {item.product?.product_name}
                          <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>× {item.quantity}</span>
                        </div>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: 'var(--accent)' }}>
                          PKR {Number(item.subtotal).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Summary + Place order */}
              <div style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '20px',
                position: 'sticky', top: 'calc(var(--navbar-h) + 16px)',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Order Total</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-soft)' }}>
                    <span>Items ({cartItems.reduce((s, i) => s + i.quantity, 0)})</span>
                    <span>PKR {totalPrice.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-soft)' }}>
                    <span>Delivery</span>
                    <span style={{ color: 'var(--green)' }}>Free</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-soft)' }}>
                    <span>Payment</span>
                    <span>{PAYMENT_LABELS[form.payment_method]}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>
                      PKR {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={placing}
                  style={{
                    width: '100%', padding: '13px', background: placing ? 'var(--text-muted)' : 'var(--accent)',
                    border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff',
                    fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 600,
                    cursor: placing ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                  }}
                >
                  {placing ? 'Placing Order...' : '✅ Place Order'}
                </button>

                <Link to="/cart" style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                  ← Back to Cart
                </Link>
              </div>
            </div>
          </form>
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