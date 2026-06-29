import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [form, setForm] = useState({ organizationName: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/register`, form);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Try a different username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      <div className="glass-container" style={{ maxWidth: '460px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="brand-icon">⚡</div>
          <div className="brand-wordmark">Aegis</div>
          <p style={{ color: 'var(--text-2)', fontSize: '.82rem', marginTop: '4px', letterSpacing: '.3px' }}>
            CREATE YOUR WORKSPACE
          </p>
        </div>

        <h1 className="auth-title" style={{ marginBottom: '4px' }}>Set up your organization</h1>
        <p className="auth-subtitle" style={{ marginBottom: '28px' }}>
          One workspace. All your projects, sprints, and team — in one place.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="input-group">
            <label className="input-label">Organization Name</label>
            <input
              className="input-field"
              placeholder="Iffort"
              value={form.organizationName}
              onChange={e => setForm({ ...form, organizationName: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label">Admin Username</label>
            <input
              className="input-field"
              placeholder="admin-username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="Choose a strong password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Creating workspace…' : 'Create Workspace →'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
