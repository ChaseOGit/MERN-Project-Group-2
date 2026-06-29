import { useState, useEffect } from 'react';
import mockItems from './mockData/items.json';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  // Simulate an AJAX fetch when the page loads
  useEffect(() => {
    // Later, you will replace this line with: axios.get('/api/items')
    setItems(mockItems);
  }, []);

  // Filter items based on the selected category
  const filteredItems = activeCategory === "All" 
    ? items 
    : items.filter(item => item.category === activeCategory);

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo">
          <span className="ucf-gold-text">UCF</span> Tech Lending
        </div>
        <div className="nav-links">
          <button className="login-btn">Student/Faculty Login</button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="main-content">
        
        {/* SLICKDEALS-STYLE CATEGORY FILTER */}
        <section className="category-section">
          <h2>Categories</h2>
          <div className="category-buttons">
            {["All", "Laptops", "Cameras", "Accessories"].map(cat => (
              <button 
                key={cat}
                className={activeCategory === cat ? "cat-btn active" : "cat-btn"}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ITEM GRID */}
        <section className="item-grid">
          {filteredItems.map(item => (
            <div className="item-card" key={item.id}>
              <img src={item.image} alt={item.name} className="item-image" />
              
              <div className="item-info">
                <h3 className="item-title">{item.name}</h3>
                
                <div className="item-badges">
                  <span className="badge location">📍 {item.location}</span>
                  <span className="badge time">⏱️ {item.loanPeriod}</span>
                </div>

                <div className="item-footer">
                  {item.availability > 0 ? (
                    <span className="status in-stock">✅ {item.availability} Available</span>
                  ) : (
                    <span className="status out-of-stock">❌ Out of Stock</span>
                  )}
                  
                  <button className="checkout-btn" disabled={item.availability === 0}>
                    Reserve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

      </main>
    </div>
  );
}

export default App;