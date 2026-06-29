import { Mail } from 'lucide-react';

export default function Login() {
  return (
    <main className="main-layout" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
      <div className="tech-card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Sign In to Tech Lending</h2>
        
        {/* Placeholder for Google OAuth */}
        <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', color: '#000', border: '1px solid var(--border-color)' }}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" width="20" />
          Sign in with Google
        </button>

        <div style={{ margin: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>OR</div>

        {/* Placeholder for Email PIN verification */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              placeholder="UCF Email Address" 
              style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }}
            />
          </div>
          <button type="button" className="btn-primary" style={{ width: '100%' }}>
            Send Login PIN
          </button>
        </form>
      </div>
    </main>
  );
}