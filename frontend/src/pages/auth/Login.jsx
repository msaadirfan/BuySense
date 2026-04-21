import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './auth.css';

const API_BASE = 'http://localhost:8000';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res  = await fetch(`${API_BASE}/buysense/token/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Invalid username or password.');

      // Store tokens
      localStorage.setItem('access',  data.access);
      localStorage.setItem('refresh', data.refresh);

      navigate('/home');   // ← adjust route as needed
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Brand Panel ── */}
      <div className="auth-brand">
        <div className="brand-content">
          <div className="brand-logo">B</div>
          <h1>BuySense</h1>
          <p>Data-driven commerce,<br />intelligently delivered.</p>

          <div className="brand-stats">
            <div className="brand-stat">
              <strong>AI</strong>
              <span>Chatbot</span>
            </div>
            <div className="brand-stat">
              <strong>SQL</strong>
              <span>Analytics</span>
            </div>
            <div className="brand-stat">
              <strong>RT</strong>
              <span>Insights</span>
            </div>
          </div>

          <div className="brand-dots">
            <span /><span /><span />
          </div>
        </div>
        <div className="brand-bg-grid" />
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-container">

          <div className="auth-header">
            <h2>Welcome back</h2>
            <p>Sign in to your BuySense account</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="your_username"
                autoComplete="username"
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="btn-loader" /> : 'Sign In'}
            </button>
          </form>

          <p className="auth-redirect">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>

        </div>
      </div>

    </div>
  );
};

export default Login;