import { useState } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, MapPin, Building2, ChevronDown } from "lucide-react";

export default function Navbar({
  theme,
  toggleTheme,
  activeLocation,
  setActiveLocation,
}) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const handleLocationSelect = (location) => {
    setActiveLocation(location);
    setIsLocationOpen(false);
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-ucf">UCF</span>
        <span>Tech Lending</span>
      </Link>

      <div className="nav-actions">
        <div className="nav-location-dropdown">
          <button
            type="button"
            className="nav-location-btn"
            onClick={() => setIsLocationOpen(!isLocationOpen)}
          >
            <MapPin size={18} />
            <span>
              {activeLocation === "All" ? "All Locations" : activeLocation}
            </span>
            <ChevronDown size={18} />
          </button>

          {isLocationOpen && (
            <div className="nav-location-menu">
              {["All", "John C. Hitt Library", "Rosen Library"].map((location) => (
                <button
                  type="button"
                  key={location}
                  className={activeLocation === location ? "active" : ""}
                  onClick={() => handleLocationSelect(location)}
                >
                  <Building2 size={16} />
                  {location === "All" ? "All Locations" : location}
                </button>
              ))}
            </div>
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

        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? <Moon size={24} /> : <Sun size={24} />}
        </button>

        <Link to="/login" className="login-btn">
          Login
        </Link>
      </div>
    </header>
  );
}
