import { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch REAL data from your backend
    api.get('/devices')
      .then(response => {
        // Our backend wraps the array in { success: true, data: [...] }
        setItems(response.data.data); 
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching devices:", error);
        setIsLoading(false);
      });
  }, []);

  const filteredItems = activeCategory === "All" 
    ? items 
    : items.filter(item => item.category === activeCategory);

  // Show a simple loading message while fetching from MongoDB
  if (isLoading) {
    return (
      <main className="main-layout" style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Loading Inventory...</h2>
      </main>
    );
  }

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
        {filteredItems.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No devices found in this category.</p>
        ) : (
          filteredItems.map(item => (
            <article className="tech-card" key={item._id}>
              
              <div className="card-image-wrapper">
                {/* Fallback image since the Device schema doesn't have an image field yet */}
                <img 
                  src="https://via.placeholder.com/300x200?text=Tech+Device" 
                  alt={item.name} 
                  className="card-image" 
                />
                <span className="category-badge">{item.category}</span>
              </div>
              
              <div className="card-content">
                <h3 className="card-title">{item.name}</h3>
                
                <div className="card-meta">
                  <div className="meta-item">
                    <MapPin size={16} className="meta-icon" />
                    <span>SN: {item.serialNumber}</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={16} className="meta-icon" />
                    <span>Fee: ${item.RentRate}/day</span>
                  </div>
                </div>
                
                <div className="card-divider"></div>
                
                <div className="card-actions">
                  {item.isAvailable ? (
                    <div className="status-indicator success">
                      <CheckCircle2 size={18} />
                      <span>Available</span>
                    </div>
                  ) : (
                    <div className="status-indicator error">
                      <XCircle size={18} />
                      <span>Checked Out</span>
                    </div>
                  )}
                  
                  <button className="btn-reserve" disabled={!item.isAvailable}>
                    Reserve
                  </button>
                </div>
                
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}