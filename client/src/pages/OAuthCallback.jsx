import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    // Backend redirects here with app JWT in query params after Google flow completes.
    const token = params.get('token');

    if (!token) {
      setMessage('OAuth callback is missing token.');
      return;
    }

    localStorage.setItem('token', token);

    // Fetch canonical user profile for local cache and role-aware UI.
    authApi
      .me()
      .then((res) => {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setMessage('Sign in failed. Please try again.');
      });
  }, [navigate, params]);

  return (
    <main className="main-layout" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
      <div className="tech-card" style={{ maxWidth: '460px', width: '100%', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Google Sign-In</h2>
        <p style={{ color: 'var(--text-muted)' }}>{message}</p>
      </div>
    </main>
  );
}
