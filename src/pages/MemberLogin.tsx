import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const MemberLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/member/login/send-otp`, { email });
      setSuccess(`A 6-digit code has been sent to ${email}`);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/member/login/verify-otp`, { email, otp });
      localStorage.setItem('member', JSON.stringify(res.data.member));
      navigate('/member');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      <div className="glass-container" style={{ maxWidth: '420px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="brand-icon" style={{ fontSize: '1.5rem' }}>👤</div>
          <div className="brand-wordmark">Aegis</div>
          <p style={{ color: 'var(--text-2)', fontSize: '.82rem', marginTop: '4px', letterSpacing: '.3px' }}>
            TEAM MEMBER ACCESS
          </p>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '28px' }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.8rem', fontWeight: 800, flexShrink: 0,
              background: 'var(--primary)',
              color: 'white', boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.15)'
            }}>
              {step === 'otp' ? '✓' : '1'}
            </div>
            <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Email</span>
          </div>

          {/* Connector */}
          <div style={{ flex: 1, height: '2px', background: step === 'otp' ? 'var(--primary)' : 'var(--border-color)', transition: 'background .4s', borderRadius: '99px', margin: '0 8px' }} />

          {/* Step 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '.82rem', fontWeight: 600, color: step === 'otp' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>Verify</span>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.8rem', fontWeight: 800, flexShrink: 0,
              background: step === 'otp' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
              color: step === 'otp' ? 'white' : 'var(--text-tertiary)',
              boxShadow: step === 'otp' ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
              transition: 'all .4s'
            }}>2</div>
          </div>
        </div>

        <h1 className="auth-title" style={{ marginBottom: '4px' }}>
          {step === 'email' ? 'Sign in to your workspace' : 'Enter your code'}
        </h1>
        <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
          {step === 'email'
            ? 'Enter the email address associated with your invitation.'
            : `We sent a 6-digit code to ${email}`}
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '18px' }}>
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '18px' }}>
            <span>✅</span> {success}
          </div>
        )}

        {/* Step 1 — Email */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="form-stack">
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                id="member-email"
                className="input-field"
                type="email"
                placeholder="deepan@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '4px' }}>
              {loading ? 'Sending code…' : 'Send Login Code →'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="form-stack">
            <div className="input-group">
              <label className="input-label">6-Digit Code</label>
              <input
                id="member-otp"
                className="input-field"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
                style={{ fontSize: '1.8rem', letterSpacing: '14px', textAlign: 'center', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
              />
              <p style={{ fontSize: '.78rem', color: 'var(--text-3)', textAlign: 'center' }}>
                Code expires in 10 minutes
              </p>
            </div>
            <button className="btn-primary" type="submit" disabled={loading || otp.length !== 6} style={{ marginTop: '4px' }}>
              {loading ? 'Verifying…' : 'Verify & Sign In →'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: '.85rem', padding: '6px', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              ← Use a different email
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-2)', fontSize: '.82rem' }}>
            Organization admin?{' '}
            <Link to="/login" className="auth-link">Admin login</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MemberLogin;
