import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../services/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    // Verification token arrives via email link query string.
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    // Verify once on page load and display a user-friendly status message.
    authApi
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully. You can now log in.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may be expired.');
      });
  }, [params]);

  return (
    <main className="main-layout" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
      <div className="tech-card" style={{ maxWidth: '460px', width: '100%', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Email Verification</h2>
        <p style={{ color: status === 'error' ? 'var(--error-color)' : 'var(--text-muted)' }}>{message}</p>
        {status !== 'loading' && (
          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
            Go to Login
          </Link>
        )}
      </div>
    </main>
  );
}
