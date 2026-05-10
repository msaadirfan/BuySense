import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './main.css'

export default function UserProfile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let cancelled = false
    api.get('/api/me/')
      .then(res => { if (!cancelled) { setUser(res.data); setForm(res.data) } })
      .catch(() => navigate('/login'))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [navigate])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await api.patch('/api/me/', {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        city: form.city,
        country: form.country,
        phone: form.phone || '',
        username: form.username,
        ...(form.password && form.new_password ? {
          password: form.password,
          new_password: form.new_password,
        } : {})
      })
      setUser(res.data)
      setForm(res.data)
      setEditing(false)
      showToast('Profile updated successfully!')
    } catch (err) {
      const msg = Object.values(err.response?.data || {}).flat().join(' ') || 'Failed to update.'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="app-shell">
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: 'var(--navbar-h)', color: 'var(--text-muted)' }}>
        Loading profile...
      </div>
    </div>
  )

  if (!user) return null

  const memberSince = new Date(user.date_joined || Date.now()).toLocaleDateString('en-PK', { year: 'numeric', month: 'long' })

  return (
    <div className="app-shell">
      <Navbar />

      <div style={{ paddingTop: 'var(--navbar-h)', flex: 1 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Outfit, sans-serif' }}
          >
            Back
          </button>

          {/* Profile Header */}
          <div className="profile-header-card">
            {/* Glow */}
            <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative' }}>
              {/* Avatar */}
              <div style={{
                width: '80px', height: '80px', borderRadius: '16px', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent), #fbbf24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', fontWeight: 700, color: '#fff',
              }}>
                {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
                  {user.first_name} {user.last_name}
                </h1>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  @{user.username}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {user.is_customer && (
                    <span style={{ background: 'var(--blue-dim)', color: 'var(--blue)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                      Customer
                    </span>
                  )}
                  {user.is_seller && (
                    <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                      Seller
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => editing ? handleSave() : setEditing(true)}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  background: editing ? 'var(--accent)' : 'var(--bg-card)',
                  border: editing ? 'none' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: editing ? '#fff' : 'var(--text-soft)',
                  fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {saving ? 'Saving...' : editing ? '✓ Save Changes' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value accent">{user.total_orders || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Spent</div>
              <div className="stat-value green">PKR {Number(user.total_spent || 0).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Member Since</div>
              <div className="stat-value blue" style={{ fontSize: '18px' }}>{memberSince}</div>
            </div>
          </div>

          {/* Profile Details */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '28px', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Personal Information
            </div>
            <div className="responsive-grid-2col" style={{ gap: '16px', marginBottom: 0 }}>
              <div className="field-group">
                <label>First Name</label>
                {editing ? (
                  <input
                    value={form.first_name || ''}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  />
                ) : (
                  <div className="profile-field-value">{user.first_name || '—'}</div>
                )}
              </div>
              <div className="field-group">
                <label>Last Name</label>
                {editing ? (
                  <input
                    value={form.last_name || ''}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  />
                ) : (
                  <div className="profile-field-value">{user.last_name || '—'}</div>
                )}
              </div>
              <div className="field-group">
                <label>Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                ) : (
                  <div className="profile-field-value">{user.email || '—'}</div>
                )}
              </div>
              <div className="field-group">
                <label>Phone</label>
                {editing ? (
                  <input
                    value={form.phone || ''}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                ) : (
                  <div className="profile-field-value">{user.phone || '—'}</div>
                )}
              </div>
              <div className="field-group">
                <label>City</label>
                {editing ? (
                  <input
                    value={form.city || ''}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  />
                ) : (
                  <div className="profile-field-value">{user.city || '—'}</div>
                )}
              </div>
              <div className="field-group">
                <label>Country</label>
                {editing ? (
                  <input
                    value={form.country || ''}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  />
                ) : (
                  <div className="profile-field-value">{user.country || '—'}</div>
                )}
              </div>
              <div className="field-group">
                <label>Username</label>
                {editing ? (
                  <input
                    value={form.username || ''}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  />
                ) : (
                  <div className="profile-field-value">{user.username || '—'}</div>
                )}
              </div>
              {editing && (
                <>
                  <div className="field-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={form.password || ''}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                  <div className="field-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={form.new_password || ''}
                      onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>

            {editing && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setEditing(false); setForm(user) }}
                  style={{ padding: '9px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-soft)', fontSize: '13px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: '9px 18px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '28px',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Quick Links
            </div>
            <div className="responsive-grid-2col" style={{ gap: '10px', marginBottom: 0 }}>
              {[
                { label: 'My Orders', icon: '', path: '/orders' },
                { label: 'Shopping Cart', icon: '', path: '/cart' },
                { label: 'Browse Products', icon: '', path: '/' },
                ...(user.is_seller ? [{ label: 'Seller Dashboard', icon: '', path: '/seller/dashboard' }] : []),
              ].map(link => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 16px', background: 'var(--bg-card)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-soft)', fontSize: '13px', fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    transition: 'border-color 0.2s, color 0.2s',
                    textAlign: 'left', width: '100%',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-soft)' }}
                >
                  <span style={{ fontSize: '18px' }}></span>
                  {link.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
