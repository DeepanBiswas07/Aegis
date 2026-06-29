import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, { username, password });
      localStorage.setItem('org', JSON.stringify(res.data.organization));
      navigate('/organization');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      <div className="glass-container">
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div className="brand-icon">⚡</div>
          <div className="brand-wordmark">Aegis</div>
          <p style={{ color: 'var(--text-2)', fontSize: '.82rem', marginTop: '4px', letterSpacing: '.3px' }}>
            ORGANIZATION PORTAL
          </p>
        </div>

        <h1 className="auth-title" style={{ marginBottom: '4px' }}>Welcome back</h1>
        <p className="auth-subtitle" style={{ marginBottom: '28px' }}>Sign in to manage your projects and team.</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="input-group">
            <label className="input-label">Username</label>
            <input
              className="input-field"
              placeholder="your-username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0 16px' }}>
          <span>New here?</span>
        </div>

        <div className="auth-footer" style={{ marginTop: 0 }}>
          <Link to="/register" className="auth-link">Create an organization account</Link>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-2)', fontSize: '.82rem' }}>
            Team member?{' '}
            <Link to="/member/login" className="auth-link">Member login</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
