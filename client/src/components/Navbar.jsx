import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, User, LogOut } from 'lucide-react';

export default function Navbar({ theme, toggleTheme }) {
  // Navbar re-render every time the URL changes
  const location = useLocation(); 

  // Navbar reads the cached user to determine which actions to show.
  // Because useLocation() triggers a re-render on navigation, this always stays up to date!
  const currentUser = JSON.parse(localStorage.getItem('user')); 

  const handleLogout = () => {
    // Clear both identity payload and JWT so protected calls stop immediately.
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/*  */}
        <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <img src="/logo.svg" alt="UCF Tech Lending Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
          <div>
            <span className="brand-highlight">UCF</span>
            <span className="brand-text">Tech Lending</span>
          </div>
        </Link>
        
        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Dark Mode">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          {currentUser ? (
            <>
              {/* Show Circulation Desk to BOTH Faculty and Admins */}
              {(currentUser.role === 'Admin' || currentUser.role === 'Faculty') && (
                <Link to="/desk" className="btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', textDecoration: 'none', backgroundColor: 'var(--ucf-black)', color: 'var(--ucf-gold)', border: '1px solid var(--ucf-gold)' }}>
                  Circulation Desk
                </Link>
              )}

              {/* Show Admin Portal ONLY to Admins */}
              {currentUser.role === 'Admin' && (
                <Link to="/admin" className="btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', textDecoration: 'none', backgroundColor: '#EF4444', color: '#FFF' }}>
                  Admin
                </Link>
              )}

              <Link to="/dashboard" className="btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', textDecoration: 'none' }}>
                <User size={18} /> Dashboard
              </Link>
              
              <button onClick={handleLogout} className="btn-nav-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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