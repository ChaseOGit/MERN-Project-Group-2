import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, MapPin, Clock } from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/devices')
      .then(response => {
        const fetchedData = response.data?.data || [];
        setItems(fetchedData); 
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching devices:", error);
        setItems([]); // SAFEGUARD: Prevent crash on network error
        setIsLoading(false);
      });
  }, []);

  // GROUPING LOGIC (Now grabs the new image, location, and loan period)
  const groupedItems = items.reduce((acc, device) => {
    if (!acc[device.name]) {
      acc[device.name] = {
        id: device._id,
        name: device.name,
        category: device.category,
        image: device.image,
        location: device.location,
        loanPeriod: device.loanPeriod,
        totalCount: 0,
        availableCount: 0,
      };
    }
    acc[device.name].totalCount += 1;
    if (device.isAvailable) {
      acc[device.name].availableCount += 1;
    }
    return acc;
  }, {});

  const displayItems = Object.values(groupedItems);
  const filteredItems = activeCategory === "All" 
    ? displayItems 
    : displayItems.filter(item => item.category === activeCategory);

  if (isLoading) {
    return <main className="main-layout" style={{ textAlign: "center", padding: "4rem" }}><h2>Loading Inventory...</h2></main>;
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
                    <span>Loan Period: {item.loanPeriod}</span>
                  </div>
                </div>
                
                <div className="card-divider"></div>
                
                <div className="card-actions">
                  {item.availableCount > 0 ? (
                    <div className="status-indicator success">
                      <CheckCircle2 size={18} />
                      <span>{item.availableCount} Available</span>
                    </div>
                  ) : (
                    <div className="status-indicator error">
                      <XCircle size={18} />
                      <span>Out of Stock</span>
                    </div>
                  )}
                  
                  <button className="btn-reserve" disabled={item.availableCount === 0}>
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