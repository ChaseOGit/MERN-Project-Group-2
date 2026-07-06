import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, MapPin, Clock, Search } from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and Location
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");

  // Re-fetch data whenever the selected location changes
  useEffect(() => {
    setIsLoading(true);
    
    // Dynamically build the API URL based on the dropdown
    const endpoint = selectedLocation === "All Locations" 
      ? '/devices' 
      : `/devices?location=${encodeURIComponent(selectedLocation)}`;

    api.get(endpoint)
      .then(response => {
        const fetchedData = response.data?.data || [];
        setItems(fetchedData); 
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching devices:", error);
        setItems([]);
        setIsLoading(false);
      });
  }, [selectedLocation]);

  // GROUPING LOGIC 
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

  // Apply Category + Search Text
  let filteredItems = activeCategory === "All" 
    ? displayItems 
    : displayItems.filter(item => item.category === activeCategory);

  if (searchQuery.trim() !== "") {
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return (
    <main className="main-layout">
      
      {/*SEARCH & LOCATION CONTROLS */}
      <section className="controls-section" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        
        {/* Search Bar */}
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search for a laptop, camera, etc..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', 
              borderRadius: '8px', border: '1px solid var(--border-color)', 
              background: 'var(--bg-surface)', color: 'var(--text-main)', 
              boxSizing: 'border-box', fontSize: '1rem'
            }}
          />
        </div>

        {/* Location Dropdown */}
        <div style={{ flex: '0 0 auto' }}>
          <select 
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{ 
              padding: '0.75rem 1rem', borderRadius: '8px', 
              border: '1px solid var(--border-color)', background: 'var(--bg-surface)', 
              color: 'var(--text-main)', cursor: 'pointer', height: '100%', fontSize: '1rem'
            }}
          >
            <option value="All Locations">🌍 All Locations</option>
            <option value="John C. Hitt Library">📚 John C. Hitt Library</option>
            <option value="Downtown Campus">🏢 Downtown Campus</option>
            <option value="Rosen College">🏨 Rosen College</option>
          </select>
        </div>

      </section>

      {/* CATEGORY FILTER */}
      <section className="filter-section">
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
      {isLoading ? (
         <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
           <h2>Fetching Inventory...</h2>
         </div>
      ) : (
        <section className="inventory-grid">
          {filteredItems.length === 0 ? (
            <p style={{ color: "var(--text-muted)", gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              No devices match your search in this location.
            </p>
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
                        <span>{item.availableCount} of {item.totalCount} Available</span>
                      </div>
                    ) : (
                      <div className="status-indicator error">
                        <XCircle size={18} />
                        <span>0 of {item.totalCount} Available</span>
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
      )}
    </main>
  );
}