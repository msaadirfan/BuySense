import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './main.css'

const EMPTY_FORM = {
  product_name:  '',
  product_desc:  '',
  product_price: '',
  stock_quantity: '',
  category_id:   '',
  product_image: null,
}

function ProductModal({ product, categories, onClose, onSaved }) {
  const isEdit = Boolean(product)
  const [form, setForm]       = useState(
    isEdit
      ? {
          product_name:   product.product_name,
          product_desc:   product.product_desc,
          product_price:  product.product_price,
          stock_quantity: product.stock_quantity,
          category_id:    product.category?.id || '',
          product_image:  null,
        }
      : { ...EMPTY_FORM }
  )
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  function handleChange(e) {
    const { name, value, files } = e.target
    setForm(f => ({ ...f, [name]: files ? files[0] : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const data = new FormData()
      data.append('product_name',   form.product_name)
      data.append('product_desc',   form.product_desc)
      data.append('product_price',  form.product_price)
      data.append('stock_quantity', form.stock_quantity)
      data.append('category_id',    form.category_id)
      if (form.product_image) data.append('product_image', form.product_image)

      let res
      if (isEdit) {
        res = await api.patch(`/api/seller/products/${product.id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        res = await api.post('/api/seller/products/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      onSaved(res.data, isEdit)
      onClose()
    } catch (err) {
      const msg = Object.values(err.response?.data || {}).flat().join(' ') || 'Failed to save product.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      z: 999, zIndex: 999, padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%',
        maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
            {isEdit ? '✏️ Edit Product' : '➕ Add Product'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="field-group">
            <label>Product Name</label>
            <input name="product_name" value={form.product_name} onChange={handleChange} placeholder="e.g. Wireless Earbuds" required />
          </div>

          <div className="field-group">
            <label>Description</label>
            <textarea
              name="product_desc"
              value={form.product_desc}
              onChange={handleChange}
              placeholder="Describe your product..."
              rows={3}
              required
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none', resize: 'vertical', width: '100%' }}
            />
          </div>

          <div className="form-row">
            <div className="field-group">
              <label>Price (PKR)</label>
              <input name="product_price" type="number" min="0" step="0.01" value={form.product_price} onChange={handleChange} placeholder="0.00" required />
            </div>
            <div className="field-group">
              <label>Stock Quantity</label>
              <input name="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={handleChange} placeholder="0" required />
            </div>
          </div>

          <div className="field-group">
            <label>Category</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: form.category_id ? 'var(--text)' : 'var(--text-muted)', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none', width: '100%' }}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.category_name}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Product Image {isEdit && '(leave blank to keep existing)'}</label>
            <input name="product_image" type="file" accept="image/*" onChange={handleChange} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-soft)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '14px' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="auth-btn" style={{ flex: 1, marginTop: 0 }}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SellerProducts() {
  const [products, setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)  // null | 'add' | product object
  const [deleting, setDeleting]   = useState(null)
  const [toast, setToast]         = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/api/seller/products/'),
          api.get('/api/categories/'),
        ])
        if (!cancelled) {
          setProducts(prodRes.data)
          setCategories(catRes.data)
        }
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  function handleSaved(savedProduct, isEdit) {
    if (isEdit) {
      setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p))
      showToast('Product updated!')
    } else {
      setProducts(prev => [savedProduct, ...prev])
      showToast('Product added!')
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.product_name}"? This cannot be undone.`)) return
    setDeleting(product.id)
    try {
      await api.delete(`/api/seller/products/${product.id}/`)
      setProducts(prev => prev.filter(p => p.id !== product.id))
      showToast('Product deleted.')
    } catch {
      showToast('Could not delete product.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return (
    <div className="app-shell">
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: 'var(--navbar-h)', color: 'var(--text-muted)' }}>
        Loading products...
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <Navbar />

      <div style={{ paddingTop: 'var(--navbar-h)', flex: 1 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700 }}>📦 My Products</h1>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {products.length} product{products.length !== 1 ? 's' : ''} listed
              </div>
            </div>
            <button
              onClick={() => setModal('add')}
              style={{ padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              ➕ Add Product
            </button>
          </div>

          {products.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: '80px' }}>
              <div className="empty-state-icon">📦</div>
              <h3>No products yet</h3>
              <p>Add your first product to start selling</p>
              <button
                onClick={() => setModal('add')}
                style={{ marginTop: '20px', padding: '10px 24px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px' }}
              >
                Add First Product
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <table className="data-table" style={{ fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text)' }}>{product.product_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.product_desc}
                        </div>
                      </td>
                      <td>
                        <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                          {product.category?.category_name}
                        </span>
                      </td>
                      <td className="money">PKR {Number(product.product_price).toLocaleString()}</td>
                      <td>
                        <span style={{ color: product.stock_quantity <= 5 ? 'var(--red)' : product.stock_quantity <= 20 ? 'var(--accent)' : 'var(--green)' }}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setModal(product)}
                            style={{ padding: '6px 12px', background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--blue)', fontSize: '12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deleting === product.id}
                            style={{ padding: '6px 12px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--red)', fontSize: '12px', cursor: deleting === product.id ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', opacity: deleting === product.id ? 0.5 : 1 }}
                          >
                            {deleting === product.id ? '...' : '🗑 Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  )
}