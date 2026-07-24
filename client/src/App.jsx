import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import './App.css'; 

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const CirculationDesk = lazy(() => import('./pages/CirculationDesk'));

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
        
        <Suspense fallback={<div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}><h2>Loading...</h2></div>}>
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
            <Route path="/desk" element={<CirculationDesk />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;