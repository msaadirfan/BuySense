import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './main.css'

const CATEGORY_ICONS = {
  'Electronics': '💻', 'Clothing': '👗', 'Books': '📚',
  'Home & Kitchen': '🏠', 'Sports': '⚽', 'Beauty': '💄',
  'Groceries': '🛒', 'Toys & Games': '🎮', 'Automotive': '🚗', 'Health': '💊',
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1,2,3,4,5].map(star => (
        <span
          key={star}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{
            fontSize: '24px',
            cursor: onChange ? 'pointer' : 'default',
            color: star <= (hovered || value) ? '#fbbf24' : 'var(--text-muted)',
            transition: 'color 0.15s',
          }}
        >★</span>
      ))}
    </div>
  )
}

export default function ProductDetail() {
  const { id }                      = useParams()
  const navigate                    = useNavigate()
  const [product, setProduct]       = useState(null)
  const [reviews, setReviews]       = useState([])
  const [quantity, setQuantity]     = useState(1)
  const [loading, setLoading]       = useState(true)
  const [addingCart, setAddingCart] = useState(false)
  const [toast, setToast]           = useState(null)
  const [cartCount, setCartCount]   = useState(0)

  // Review form
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [prodRes, revRes, cartRes] = await Promise.all([
          api.get(`/api/products/${id}/`),
          api.get(`/api/products/${id}/reviews/`),
          api.get('/api/cart/summary/'),
        ])
        if (!cancelled) {
          setProduct(prodRes.data)
          setReviews(revRes.data)
          setCartCount(cartRes.data.total_items)
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

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleAddToCart() {
    setAddingCart(true)
    try {
      await api.post('/api/cart/', { product_id: product.id, quantity })
      setCartCount(c => c + quantity)
      showToast(`Added ${quantity} item(s) to cart!`)
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not add to cart.', 'error')
    } finally {
      setAddingCart(false)
    }
  }

  async function handleBuyNow() {
    await handleAddToCart()
    navigate('/cart')
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    if (!rating) return showToast('Please select a rating.', 'error')
    setSubmitting(true)
    try {
      const res = await api.post(`/api/products/${id}/reviews/`, { rating, comment })
      setReviews(prev => [res.data, ...prev])
      setRating(0)
      setComment('')
      showToast('Review submitted!')
    } catch (err) {
      const msg = err.response?.data?.detail || Object.values(err.response?.data || {}).flat().join(' ') || 'Could not submit review.'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="app-shell">
      <Navbar cartCount={cartCount} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: 'var(--navbar-h)', color: 'var(--text-muted)' }}>
        Loading product...
      </div>
    </div>
  )

  if (!product) return null

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

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

          {/* Product main */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '48px' }}>

            {/* Image */}
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
            }}>
              {product.product_image
                ? <img src={product.product_image} alt={product.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
                : CATEGORY_ICONS[product.category?.category_name] || '📦'
              }
            </div>

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  {product.category?.category_name}
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.3px', marginBottom: '8px' }}>
                  {product.product_name}
                </h1>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Sold by{' '}
                  <Link
                    to={`/sellers/${product.seller?.id}`}
                    style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
                    onClick={e => e.stopPropagation()}
                  >
                    {product.seller?.seller_name}
                  </Link>
                </div>
              </div>

              {/* Rating summary */}
              {avgRating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StarRating value={Math.round(avgRating)} />
                  <span style={{ fontSize: '14px', color: 'var(--text-soft)' }}>
                    {avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}

              {/* Price */}
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>
                PKR {Number(product.product_price).toLocaleString()}
              </div>

              {/* Description */}
              <p style={{ fontSize: '14px', color: 'var(--text-soft)', lineHeight: 1.7 }}>
                {product.product_desc}
              </p>

              {/* Stock */}
              <div style={{ fontSize: '13px', color: product.stock_quantity > 0 ? 'var(--green)' : 'var(--red)' }}>
                {product.stock_quantity > 0
                  ? `✓ In Stock (${product.stock_quantity} available)`
                  : '✗ Out of Stock'
                }
              </div>

              {/* Quantity + actions */}
              {product.stock_quantity > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-soft)' }}>Qty:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '4px 8px' }}>
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        style={{ background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer', fontSize: '16px', width: '24px', fontFamily: 'Outfit, sans-serif' }}
                      >−</button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                        style={{ background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer', fontSize: '16px', width: '24px', fontFamily: 'Outfit, sans-serif' }}
                      >+</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleAddToCart}
                      disabled={addingCart}
                      style={{
                        flex: 1, padding: '12px', background: 'var(--accent-dim)',
                        border: '1px solid rgba(249,115,22,0.3)', borderRadius: 'var(--radius-sm)',
                        color: 'var(--accent)', fontFamily: 'Outfit, sans-serif', fontSize: '14px',
                        fontWeight: 600, cursor: addingCart ? 'not-allowed' : 'pointer',
                        opacity: addingCart ? 0.6 : 1, transition: 'all 0.2s',
                      }}
                    >
                      {addingCart ? 'Adding...' : '🛒 Add to Cart'}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={addingCart}
                      style={{
                        flex: 1, padding: '12px', background: 'var(--accent)',
                        border: 'none', borderRadius: 'var(--radius-sm)',
                        color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px',
                        fontWeight: 600, cursor: addingCart ? 'not-allowed' : 'pointer',
                        opacity: addingCart ? 0.6 : 1, transition: 'all 0.2s',
                      }}
                    >
                      ⚡ Buy Now
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reviews section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '28px' }}>
              Customer Reviews
              {reviews.length > 0 && <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '10px' }}>({reviews.length})</span>}
            </h2>

            {/* Write review */}
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '20px', marginBottom: '28px',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Write a Review</h3>
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '8px' }}>Your rating</div>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <div className="field-group">
                  <label>Comment (optional)</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={3}
                    style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                      color: 'var(--text)', fontFamily: 'Outfit, sans-serif',
                      fontSize: '14px', outline: 'none', resize: 'vertical', width: '100%',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="auth-btn"
                  style={{ width: 'auto', alignSelf: 'flex-start', padding: '10px 24px' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>

            {/* Review list */}
            {reviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <h3>No reviews yet</h3>
                <p>Be the first to review this product</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {reviews.map(review => (
                  <div key={review.id} style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '16px 20px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'var(--accent-dim)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--accent)',
                        }}>
                          {review.customer_name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{review.customer_name}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      {'★'.repeat(review.rating)}
                      <span style={{ color: 'var(--text-muted)' }}>{'★'.repeat(5 - review.rating)}</span>
                    </div>
                    {review.comment && (
                      <p style={{ fontSize: '14px', color: 'var(--text-soft)', lineHeight: 1.6 }}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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