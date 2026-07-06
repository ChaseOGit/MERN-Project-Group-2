import { Link } from 'react-router-dom';
import { Sun, Moon, User, LogOut } from 'lucide-react';

export default function Navbar({ theme, toggleTheme }) {
  // Check if a user is stored in the browser
  const currentUser = JSON.parse(localStorage.getItem('user')); 

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
          <span className="brand-highlight">UCF</span><span className="brand-text">Tech Lending</span>
        </Link>
        
        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Dark Mode">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          {currentUser ? (
            <>
              <Link to="/dashboard" className="btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', textDecoration: 'none' }}>
                <User size={18} /> Dashboard
              </Link>
              <button onClick={handleLogout} className="btn-reserve" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}