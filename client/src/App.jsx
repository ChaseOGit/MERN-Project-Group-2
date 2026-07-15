import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css'; 
import AdminDashboard from './pages/AdminDashboard';
import VerifyEmail from './pages/VerifyEmail';
import OAuthCallback from './pages/OAuthCallback';

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <div className="app-wrapper">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          {/* Landing page for verification links sent by email. */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          {/* Handles token handoff after backend completes Google OAuth callback. */}
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Updated the element to match our actual Dashboard component */}
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;