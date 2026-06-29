import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import './App.css';

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
        {/* Navbar stays at the top of every page */}
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        
        {/* Routes swap out the main content based on the URL */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          {/* create these later */}
          {/* <Route path="/dashboard" element={<UserDashboard />} /> */}
          {/* <Route path="/admin" element={<AdminDashboard />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;