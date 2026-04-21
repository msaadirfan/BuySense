import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './main.css'

const CATEGORY_ICONS = {
  'Electronics': '💻', 'Clothing': '👗', 'Books': '📚',
  'Home & Kitchen': '🏠', 'Sports': '⚽', 'Beauty': '💄',
  'Groceries': '🛒', 'Toys & Games': '🎮', 'Automotive': '🚗', 'Health': '💊',
}

function ProductCard({ product, onAddToCart }) {
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()

  async function handleAdd(e) {
    e.stopPropagation()
    setAdding(true)
    await onAddToCart(product.id)
    setAdding(false)
  }

  return (
    <div className="product-card" onClick={() => navigate(`/products/${product.id}`)}>
      <div className="product-img">
        {product.product_image
          ? <img src={product.product_image} alt={product.product_name} />
          : <span className="product-img-placeholder">
              {CATEGORY_ICONS[product.category?.category_name] || '📦'}
            </span>
        }
      </div>
      <div className="product-info">
        <div className="product-category">{product.category?.category_name}</div>
        <div className="product-name">{product.product_name}</div>
        <div className="product-footer">
          <div className="product-price">PKR {Number(product.product_price).toLocaleString()}</div>
          {product.avg_rating != null && (
            <div className="product-rating"><span>★</span> {product.avg_rating}</div>
          )}
        </div>
        <button
          className="add-to-cart-btn"
          onClick={handleAdd}
          disabled={adding || product.stock_quantity === 0}
        >
          {adding ? 'Adding...' : product.stock_quantity === 0 ? 'Out of Stock' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  )
}

export default function SellerProfile() {
  const { id }                    = useParams()
  const navigate                  = useNavigate()
  const [seller, setSeller]       = useState(null)
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [toast, setToast]         = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [prodRes, cartRes] = await Promise.all([
          api.get(`/api/products/?seller=${id}`),
          api.get('/api/cart/summary/'),
        ])
        if (!cancelled) {
          setProducts(prodRes.data)
          setCartCount(cartRes.data.total_items)
          // Seller info is embedded in any product
          if (prodRes.data.length > 0) {
            setSeller(prodRes.data[0].seller)
          }
        }
      } catch {
        if (!cancelled) navigate('/')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, navigate])

  async function handleAddToCart(productId) {
    try {
      await api.post('/api/cart/', { product_id: productId, quantity: 1 })
      setCartCount(c => c + 1)
      showToast('Added to cart!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not add to cart.', 'error')
    }
  }

  // Compute overall avg rating across all seller products
  const ratedProducts = products.filter(p => p.avg_rating != null)
  const overallRating = ratedProducts.length
    ? (ratedProducts.reduce((s, p) => s + p.avg_rating, 0) / ratedProducts.length).toFixed(1)
    : null

  const totalReviews = products.reduce((s, p) => s + (p.review_count || 0), 0)

  // Category breakdown
  const categoryCounts = products.reduce((acc, p) => {
    const cat = p.category?.category_name || 'Other'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  if (loading) return (
    <div className="app-shell">
      <Navbar cartCount={0} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: 'var(--navbar-h)', color: 'var(--text-muted)' }}>
        Loading seller...
      </div>
    </div>
  )

  if (!seller && products.length === 0) return (
    <div className="app-shell">
      <Navbar cartCount={cartCount} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: 'var(--navbar-h)' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🏪</div>
          <h3>Seller not found</h3>
          <p>This seller has no products listed yet</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <Navbar cartCount={cartCount} />

      <div style={{ paddingTop: 'var(--navbar-h)', flex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Outfit, sans-serif' }}
          >
            ← Back
          </button>

          {/* Seller header */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '28px 32px',
            marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '24px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Glow */}
            <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Avatar */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '16px', flexShrink: 0,
              background: seller?.profile_image ? 'transparent' : 'linear-gradient(135deg, var(--accent), #fbbf24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: 700, color: '#fff',
              overflow: 'hidden',
            }}>
              {seller?.profile_image
                ? <img src={seller.profile_image} alt={seller.seller_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (seller?.seller_name?.[0] || '🏪')
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
                {seller?.seller_name || 'Unknown Seller'}
              </h1>
              {seller?.address && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  📍 {seller.address}
                </div>
              )}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>
                    {products.length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Products</div>
                </div>
                {overallRating && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24', fontFamily: 'Space Mono, monospace' }}>
                      ★ {overallRating}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {totalReviews} Review{totalReviews !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--blue)', fontFamily: 'Space Mono, monospace' }}>
                    {Object.keys(categoryCounts).length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Categories</div>
                </div>
              </div>
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
              {Object.entries(categoryCounts).slice(0, 4).map(([cat, count]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-soft)' }}>
                  <span>{CATEGORY_ICONS[cat] || '📦'}</span>
                  <span>{cat}</span>
                  <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="section-header">
            <div className="section-title">
              <span />Products by {seller?.seller_name}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {products.length} listing{products.length !== 1 ? 's' : ''}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No products listed</h3>
              <p>This seller hasn't listed any products yet</p>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
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