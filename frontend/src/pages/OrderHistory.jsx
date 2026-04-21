import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './main.css'

const STATUS_COLORS = {
  PENDING:   { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  SHIPPED:   { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
  DELIVERED: { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  CANCELLED: { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.PENDING
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 600,
    }}>
      {status}
    </span>
  )
}

// ── Order Detail ───────────────────────────────────────────────
export function OrderDetail() {
  const { id }           = useParams()
  const [searchParams]   = useSearchParams()
  const isSuccess        = searchParams.get('success') === '1'
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate         = useNavigate()

  useEffect(() => {
    let cancelled = false
    api.get(`/api/orders/${id}/`)
      .then(res => { if (!cancelled) setOrder(res.data) })
      .catch(() => { if (!cancelled) navigate('/orders') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, navigate])

  if (loading) return (
    <div className="app-shell">
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: 'var(--navbar-h)', color: 'var(--text-muted)' }}>
        Loading order...
      </div>
    </div>
  )

  if (!order) return null

  return (
    <div className="app-shell">
      <Navbar />
      <div style={{ paddingTop: 'var(--navbar-h)', flex: 1 }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Success banner */}
          {isSuccess && (
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '24px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '24px' }}>🎉</span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: '2px' }}>Order placed successfully!</div>
                <div style={{ fontSize: '13px', color: 'var(--text-soft)' }}>Your order #{order.id} has been confirmed.</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Order #{order.id}</h1>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Placed {new Date(order.created_at).toLocaleDateString('en-PK', { dateStyle: 'long' })}
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Items */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: '14px', fontWeight: 600 }}>
              Order Items ({order.items?.length})
            </div>
            {order.items?.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 20px', borderBottom: i < order.items.length - 1 ? '1px solid var(--border-soft)' : 'none',
              }}>
                <div
                  onClick={() => navigate(`/products/${item.product?.id}`)}
                  style={{ width: '52px', height: '52px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', cursor: 'pointer', flexShrink: 0 }}
                >
                  📦
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.product?.product_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    PKR {Number(item.price).toLocaleString()} × {item.quantity}
                  </div>
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: 'var(--accent)' }}>
                  PKR {(Number(item.price) * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-soft)' }}>
                <span>Delivery address</span>
                <span style={{ textAlign: 'right', maxWidth: '60%' }}>{order.address}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>
                  PKR {Number(order.total_amount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/orders" style={{ padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-soft)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
              ← All Orders
            </Link>
            <Link to="/" style={{ padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Order History ──────────────────────────────────────────────
export default function OrderHistory() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()

  useEffect(() => {
    let cancelled = false
    api.get('/api/orders/')
      .then(res => { if (!cancelled) setOrders(res.data) })
      .catch(() => { if (!cancelled) setOrders([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return (
    <div className="app-shell">
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: 'var(--navbar-h)', color: 'var(--text-muted)' }}>
        Loading orders...
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <Navbar />
      <div style={{ paddingTop: 'var(--navbar-h)', flex: 1 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '28px' }}>📦 My Orders</h1>

          {orders.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: '80px' }}>
              <div className="empty-state-icon">📦</div>
              <h3>No orders yet</h3>
              <p>When you place an order it will appear here</p>
              <Link to="/" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 24px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                Start Shopping
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '18px 20px',
                    cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s',
                    display: 'grid', gridTemplateColumns: '1fr auto',
                    gap: '16px', alignItems: 'center',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600 }}>Order #{order.id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {new Date(order.created_at).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                      {' · '}{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {order.items?.slice(0, 3).map((item, i) => (
                        <span key={i} style={{ background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px' }}>
                          {item.product?.product_name}
                        </span>
                      ))}
                      {order.items?.length > 3 && (
                        <span style={{ color: 'var(--text-muted)' }}>+{order.items.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>
                      PKR {Number(order.total_amount).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '6px' }}>
                      View details →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}