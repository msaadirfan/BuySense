import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './main.css'

const STATUS_COLORS = {
  PENDING:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  SHIPPED:   { bg: 'rgba(249,115,22,0.12)',  color: '#f97316' },
  DELIVERED: { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  CANCELLED: { bg: 'rgba(239,68,68,0.1)',    color: '#ef4444' },
}

const STATUS_OPTIONS = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.PENDING
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
      {status}
    </span>
  )
}

export default function SellerOrders() {
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('ALL')
  const [updating, setUpdating] = useState(null)
  const [toast, setToast]       = useState(null)
  const [expanded, setExpanded] = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Fetch all orders that contain this seller's products
        const res = await api.get('/api/orders/')
        if (!cancelled) setOrders(res.data)
      } catch {
        if (!cancelled) setOrders([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleStatusChange(orderId, newStatus) {
    setUpdating(orderId)
    try {
      await api.patch(`/api/seller/orders/${orderId}/status/`, { status: newStatus })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      showToast(`Order #${orderId} marked as ${newStatus}`)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not update status.', 'error')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'ALL'
    ? orders
    : orders.filter(o => o.status === filter)

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
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700 }}>🧾 Customer Orders</h1>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {orders.length} total order{orders.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {['ALL', ...STATUS_OPTIONS].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: '7px 16px', border: '1px solid',
                  borderColor: filter === s ? 'var(--accent)' : 'var(--border)',
                  background: filter === s ? 'var(--accent-dim)' : 'var(--bg-card)',
                  color: filter === s ? 'var(--accent)' : 'var(--text-soft)',
                  borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                {s === 'ALL' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧾</div>
              <h3>No {filter !== 'ALL' ? filter.toLowerCase() : ''} orders</h3>
              <p>Orders will appear here when customers place them</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(order => (
                <div key={order.id} style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', overflow: 'hidden',
                }}>
                  {/* Order header */}
                  <div
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr auto auto',
                      gap: '16px', alignItems: 'center', padding: '16px 20px',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Order #{order.id}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(order.created_at).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                        {' · '}{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        {' · '}{order.address}
                      </div>
                    </div>

                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '15px', fontWeight: 700, color: 'var(--accent)' }}>
                      PKR {Number(order.total_amount).toLocaleString()}
                    </div>

                    <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
                      {expanded === order.id ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expanded === order.id && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>

                      {/* Items */}
                      <div style={{ marginBottom: '16px' }}>
                        {order.items?.map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', padding: '8px 0',
                            borderBottom: i < order.items.length - 1 ? '1px solid var(--border-soft)' : 'none',
                            fontSize: '13px',
                          }}>
                            <div>
                              <span style={{ color: 'var(--text)' }}>{item.product?.product_name}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>× {item.quantity}</span>
                            </div>
                            <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--accent)', fontSize: '12px' }}>
                              PKR {(Number(item.price) * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Status update */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-soft)' }}>Update status:</span>
                        {STATUS_OPTIONS.filter(s => s !== order.status).map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(order.id, s)}
                            disabled={updating === order.id}
                            style={{
                              padding: '6px 14px',
                              background: STATUS_COLORS[s]?.bg || 'var(--bg-card)',
                              border: `1px solid ${STATUS_COLORS[s]?.color || 'var(--border)'}40`,
                              borderRadius: '20px',
                              color: STATUS_COLORS[s]?.color || 'var(--text-soft)',
                              fontSize: '12px', fontWeight: 600,
                              cursor: updating === order.id ? 'not-allowed' : 'pointer',
                              fontFamily: 'Outfit, sans-serif',
                              opacity: updating === order.id ? 0.5 : 1,
                              transition: 'opacity 0.15s',
                            }}
                          >
                            {updating === order.id ? '...' : `Mark ${s}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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