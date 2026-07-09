import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css'; 

function App() {
  const [theme, setTheme] = useState(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    return 'light';
  });

  const [activeLocation, setActiveLocation] = useState("All");

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <div className="app-wrapper">
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
          activeLocation={activeLocation}
          setActiveLocation={setActiveLocation}
        />

        <Navbar theme={theme} toggleTheme={toggleTheme} />
        
        <Routes>
          <Route
            path="/"
            element={<Home activeLocation={activeLocation} />}
          />
          <Route path="/login" element={<Login />} />
          
          {/* Updated the element to match our actual Dashboard component */}
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
