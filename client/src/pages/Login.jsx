import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Bug } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users/debug-login', { email });
      localStorage.setItem('user', JSON.stringify(res.data.data)); // Save user to browser
      alert(res.data.message);
      window.location.href = '/'; // Hard refresh to update Navbar state
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  const handleRegister = async () => {
    try {
      const res = await api.post('/users/debug-register', { email, name });
      localStorage.setItem('user', JSON.stringify(res.data.data)); // Save user to browser
      alert(res.data.message);
      window.location.href = '/';
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <main className="main-layout" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
      <div className="tech-card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Sign In to Tech Lending</h2>
        
        {/* Placeholder for future Google OAuth */}
        <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', color: '#000', border: '1px solid var(--border-color)', opacity: 0.5, cursor: 'not-allowed' }}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" width="20" />
          Google OAuth (Coming Soon)
        </button>

        <div style={{ margin: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Bug size={16} /> DEBUG LOGIN AREA
        </div>

        {/* Debug Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <input 
            type="text" 
            placeholder="Name (Only needed for Register)" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }}
          />

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              required
              placeholder="Test Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              Login
            </button>
            <button type="button" onClick={handleRegister} className="btn-reserve" style={{ flex: 1 }}>
              Register
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}