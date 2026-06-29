import { useState, useEffect } from 'react';
import { 
  MapPin, Clock, CheckCircle2, XCircle, 
  Sun, Moon, Laptop, Camera, Cable 
} from 'lucide-react';
import mockItems from './mockData/items.json';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Detect Browser/OS Theme Preference on Initial Load
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
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    setItems(mockItems);
  }, []);

  const filteredItems = activeCategory === "All" 
    ? items 
    : items.filter(item => item.category === activeCategory);

  return (
    <div className="app-wrapper">
      {/* PROFESSIONAL NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-highlight">UCF</span>
            <span className="brand-text">Tech Lending</span>
          </div>
          <div className="nav-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Dark Mode">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="btn-primary">Login</button>
          </div>
        </div>
      </nav>

      {/* MAIN LAYOUT */}
      <main className="main-layout">
        
        {/* SLEEK CATEGORY FILTER */}
        <section className="filter-section">
          <h2 className="section-title">Categories</h2>
          <div className="category-group">
            {["All", "Laptops", "Cameras", "Accessories"].map(cat => (
              <button 
                key={cat}
                className={`filter-btn ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* UPGRADED ITEM GRID */}
        <section className="inventory-grid">
          {filteredItems.map(item => (
            <article className="tech-card" key={item.id}>
              <div className="card-image-wrapper">
                <img src={item.image} alt={item.name} className="card-image" />
                <span className="category-badge">{item.category}</span>
              </div>
              
              <div className="card-content">
                <h3 className="card-title">{item.name}</h3>
                
                <div className="card-meta">
                  <div className="meta-item">
                    <MapPin size={16} className="meta-icon" />
                    <span>{item.location}</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={16} className="meta-icon" />
                    <span>{item.loanPeriod}</span>
                  </div>
                </div>

                <div className="card-divider"></div>

                <div className="card-actions">
                  {item.availability > 0 ? (
                    <div className="status-indicator success">
                      <CheckCircle2 size={18} />
                      <span>{item.availability} Available</span>
                    </div>
                  ) : (
                    <div className="status-indicator error">
                      <XCircle size={18} />
                      <span>Out of Stock</span>
                    </div>
                  )}
                  
                  <button className="btn-reserve" disabled={item.availability === 0}>
                    Reserve
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;