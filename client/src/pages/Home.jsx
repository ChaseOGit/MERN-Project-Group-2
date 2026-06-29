import { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle2, XCircle } from 'lucide-react';
import mockItems from '../mockData/items.json';
// import api from '../services/api'; //  use this when the backend is done

export default function Home() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    // When backend is done, change this to:
    // api.get('/items').then(res => setItems(res.data.data)).catch(err => console.error(err));
    setItems(mockItems);
  }, []);

  const filteredItems = activeCategory === "All" 
    ? items 
    : items.filter(item => item.category === activeCategory);

  return (
    <main className="main-layout">
      {/* CATEGORY FILTER */}
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

      {/* ITEM GRID */}
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
                <div className="meta-item"><MapPin size={16} className="meta-icon" /><span>{item.location}</span></div>
                <div className="meta-item"><Clock size={16} className="meta-icon" /><span>{item.loanPeriod}</span></div>
              </div>
              <div className="card-divider"></div>
              <div className="card-actions">
                {item.availability > 0 ? (
                  <div className="status-indicator success"><CheckCircle2 size={18} /><span>{item.availability} Available</span></div>
                ) : (
                  <div className="status-indicator error"><XCircle size={18} /><span>Out of Stock</span></div>
                )}
                <button className="btn-reserve" disabled={item.availability === 0}>Reserve</button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}