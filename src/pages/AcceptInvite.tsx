import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const called = useRef(false); // guard against React StrictMode double-invoke

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const accept = async () => {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/invite/accept/${token}`);
        setStatus('success');
        setTimeout(() => navigate('/member/login'), 3000);
      } catch (err) {
        setStatus('error');
      }
    };
    accept();
  }, [token]);

  return (
    <div className="auth-page">
      <div className="glass-container" style={{ textAlign: 'center', maxWidth: '440px' }}>
        {status === 'processing' && (
          <h2 style={{ color: 'var(--text-secondary)' }}>Accepting invitation...</h2>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ color: '#10b981', marginBottom: '12px' }}>Invitation Accepted!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              You are now a member. A welcome email has been sent to you with your login link.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '30px' }}>
              Redirecting you to the member login page...
            </p>
            <button className="btn-primary" onClick={() => navigate('/member/login')}>
              Go to Member Login →
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>❌</div>
            <h2 style={{ color: 'var(--error-color)', marginBottom: '12px' }}>Invalid or Expired Invite</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please ask your admin for a new invitation link.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
