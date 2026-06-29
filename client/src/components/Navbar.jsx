import { Link } from 'react-router-dom';
import { Sun, Moon, User } from 'lucide-react';

export default function Navbar({ theme, toggleTheme }) {
  // We will replace this with real Auth context later
  const isLoggedIn = false; 

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
          <span className="brand-highlight">UCF</span>
          <span className="brand-text">Tech Lending</span>
        </Link>
        
        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Dark Mode">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', textDecoration: 'none' }}>
              <User size={18} /> Dashboard
            </Link>
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