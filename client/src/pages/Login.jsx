import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, User, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      // Backend returns provider URL so frontend does not hardcode OAuth query details.
      const res = await authApi.beginGoogleOAuth();
      window.location.href = res.data.authUrl;
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Unable to start Google sign-in.' });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      // Persist session token + user snapshot for route guards and navbar state.
      const res = await authApi.login({ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/';
    } catch (error) {
      // EMAIL_NOT_VERIFIED drives a softer warning state with resend CTA.
      const code = error.response?.data?.code;
      const message = error.response?.data?.message || 'Login failed';
      setStatus({ type: code === 'EMAIL_NOT_VERIFIED' ? 'warning' : 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      // Register flow intentionally returns to login mode after successful signup.
      const res = await authApi.register({ name, email, password });
      setStatus({
        type: 'success',
        message: res.data.message || 'Registration complete. Please verify your email before logging in.',
      });
      setMode('login');
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Registration failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      // Uses current email input so users can recover from missed/expired links quickly.
      const res = await authApi.resendVerification(email);
      setStatus({ type: 'success', message: res.data.message || 'Verification email resent.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Could not resend verification email.' });
    }
  };

  return (
    <main className="main-layout" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
      <div className="tech-card" style={{ maxWidth: '430px', width: '100%', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>
          {mode === 'login' ? 'Sign In to Tech Lending' : 'Create Your Account'}
        </h2>

        {status.message && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              borderRadius: '8px',
              background: status.type === 'error' ? 'var(--error-bg)' : 'var(--bg-app)',
              color: status.type === 'error' ? 'var(--error-color)' : 'var(--text-main)',
              border: '1px solid var(--border-color)',
              textAlign: 'left',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <AlertCircle size={16} /> {status.message}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn-primary"
          style={{
            width: '100%',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            color: '#000',
            border: '1px solid var(--border-color)',
          }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" width="20" />
          Continue with Google
        </button>

        <div style={{ margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>or use email and password</div>

        <form
          onSubmit={mode === 'login' ? handleLogin : handleRegister}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          {mode === 'register' && (
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="email"
              required
              placeholder="UCF email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-app)',
                color: 'var(--text-main)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <KeyRound size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-app)',
                color: 'var(--text-main)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? 'Processing...'
              : mode === 'login'
                ? 'Login'
                : 'Register'}
          </button>
        </form>

        {mode === 'login' && (
          <button
            type="button"
            onClick={handleResend}
            className="btn-nav-outline"
            style={{ marginTop: '0.8rem', width: '100%' }}
          >
            Resend verification email
          </button>
        )}

        <p style={{ marginTop: '1.2rem', color: 'var(--text-muted)' }}>
          {mode === 'login' ? 'Need an account?' : 'Already registered?'}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ background: 'transparent', border: 'none', color: 'var(--ucf-gold)', cursor: 'pointer' }}
          >
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          By signing in, you agree to UCF Tech Lending borrowing policies.
        </p>

        <p style={{ marginTop: '0.5rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>Back to catalog</Link>
        </p>
      </div>
    </main>
  );
}
