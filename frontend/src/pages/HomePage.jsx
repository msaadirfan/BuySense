import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './main.css'

const CATEGORY_ICONS = {
  'Electronics': '💻', 'Clothing': '👗', 'Books': '📚',
  'Home & Kitchen': '🏠', 'Sports': '⚽', 'Beauty': '💄',
  'Groceries': '🛒', 'Toys & Games': '🎮', 'Automotive': '🚗', 'Health': '💊',
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

// ── Toast ──────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? '✅' : '❌'} {message}
    </div>
  )
}

// ── Product Card ───────────────────────────────────────────────
function ProductCard({ product, onAddToCart, pageLoadTime }) {
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()

  const isNew = new Date(product.created_at) > new Date(pageLoadTime - ONE_WEEK_MS)
  const outOfStock = product.stock_quantity === 0

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
        {isNew && !outOfStock && (
          <span className="product-badge badge-new">New</span>
        )}
        {outOfStock && (
          <span className="product-badge badge-hot"
            style={{ background: '#475569' }}>
            Out of Stock
          </span>
        )}
      </div>

      <div className="product-info">
        <div className="product-category">
          {product.category?.category_name}
        </div>
        <div className="product-name">{product.product_name}</div>
        <div className="product-seller">by {product.seller?.seller_name}</div>

        <div className="product-footer">
          <div className="product-price">
            PKR {Number(product.product_price).toLocaleString()}
          </div>
          {product.avg_rating != null && (
            <div className="product-rating">
              <span>★</span> {product.avg_rating} ({product.review_count})
            </div>
          )}
        </div>

        <button
          className="add-to-cart-btn"
          onClick={handleAdd}
          disabled={adding || outOfStock}
        >
          {adding ? 'Adding...' : outOfStock ? 'Out of Stock' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  )
}

// ── HomePage ───────────────────────────────────────────────────
export default function HomePage() {
  const [products, setProducts]       = useState([])
  const [categories, setCategories]   = useState([])
  const [activeCategory, setCategory] = useState(null)
  const [ordering, setOrdering]       = useState('newest')
  const [loading, setLoading]         = useState(true)
  const [cartCount, setCartCount]     = useState(0)
  const [toast, setToast]             = useState(null)
  const [pageLoadTime]                = useState(() => Date.now())
  const [searchParams]                = useSearchParams()

  const searchQuery = searchParams.get('search') || ''

  useEffect(() => {
    api.get('/api/categories/')
      .then(res => setCategories(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/api/cart/summary/')
      .then(res => setCartCount(res.data.total_items))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (activeCategory) params.set('category', activeCategory)
        if (ordering)       params.set('ordering', ordering)
        if (searchQuery)    params.set('search', searchQuery)

        const res = await api.get(`/api/products/?${params.toString()}`)
        if (!cancelled) setProducts(res.data)
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [activeCategory, ordering, searchQuery])

  const handleAddToCart = useCallback(async (productId) => {
    try {
      await api.post('/api/cart/', { product_id: productId, quantity: 1 })
      setCartCount(c => c + 1)
      setToast({ message: 'Added to cart!', type: 'success' })
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not add to cart.'
      setToast({ message: msg, type: 'error' })
    }
  }, [])

  const activeCategoryName = categories.find(c => c.id === activeCategory)?.category_name

  return (
    <div className="app-shell">
      <Navbar cartCount={cartCount} />

      <div className="app-body">

        {/* Category Sidebar */}
        <aside className="category-sidebar">
          <div className="sidebar-title">Categories</div>

          <button
            className={`sidebar-item ${!activeCategory ? 'active' : ''}`}
            onClick={() => setCategory(null)}
          >
            <span className="sidebar-item-icon">🏪</span>
            All Products
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              className={`sidebar-item ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              <span className="sidebar-item-icon">
                {CATEGORY_ICONS[cat.category_name] || '📦'}
              </span>
              {cat.category_name}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="home-content">

          {/* Hero */}
          {!searchQuery && !activeCategory && (
            <div className="hero-banner">
              <div className="hero-text">
                <h2>Shop Smarter with <span>BuySense</span></h2>
                <p>
                  Thousands of products across every category —
                  delivered across Pakistan.
                </p>
                <button
                  className="hero-cta"
                  onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })}
                >
                  Browse Products
                </button>
              </div>
            </div>
          )}

          {/* Category chips */}
          {!activeCategory && !searchQuery && (
            <>
              <div className="section-header">
                <div className="section-title"><span />Shop by Category</div>
              </div>
              <div className="category-row">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className="category-chip"
                    onClick={() => setCategory(cat.id)}
                  >
                    <span className="category-chip-icon">
                      {CATEGORY_ICONS[cat.category_name] || '📦'}
                    </span>
                    <span className="category-chip-name">{cat.category_name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Products heading + sort */}
          <div className="section-header">
            <div className="section-title">
              <span />
              {searchQuery
                ? `Results for "${searchQuery}"`
                : activeCategoryName || 'Trending Products'
              }
            </div>
            <select
              className="filter-select"
              value={ordering}
              onChange={e => setOrdering(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="top_rated">Top Rated</option>
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton skeleton-card" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No products found</h3>
              <p>Try a different search or category</p>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  pageLoadTime={pageLoadTime}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}