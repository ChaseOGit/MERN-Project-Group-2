import { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, MapPin, Clock, Search, ShieldAlert, 
  RefreshCw, X, Bell, Laptop, Camera, Cable, Layers 
} from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchInventory = () => {
    setIsLoading(true);
    api.get('/devices')
      .then(response => {
        setItems(response.data.data || []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching devices:", error);
        setItems([]);
        setIsLoading(false);
      });
  };

  useEffect(() => { fetchInventory(); }, []);

  const getCategoryIcon = (category) => {
    if (category === "Laptops") return <Laptop size={18} />;
    if (category === "Cameras") return <Camera size={18} />;
    if (category === "Accessories") return <Cable size={18} />;
    return <Layers size={18} />;
  };

  const groupedItems = items.reduce((acc, device) => {
    if (!acc[device.name]) {
      acc[device.name] = {
        name: device.name, category: device.category, image: device.image,
        loanPeriod: device.loanPeriod, restrictedTo: device.restrictedTo || "All",
        totalOverall: 0, availableOverall: 0, locations: {},
      };
    }
    const loc = device.location || "Unknown Location";
    if (!acc[device.name].locations[loc]) {
      acc[device.name].locations[loc] = { totalCount: 0, availableCount: 0, availableIds: [] };
    }
    acc[device.name].totalOverall += 1;
    acc[device.name].locations[loc].totalCount += 1;

    if (device.isAvailable) {
      acc[device.name].availableOverall += 1;
      acc[device.name].locations[loc].availableCount += 1;
      acc[device.name].locations[loc].availableIds.push(device._id);
    }
    return acc;
  }, {});

  const displayItems = Object.values(groupedItems).filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === "All Locations" || item.locations[selectedLocation];
    return matchesCategory && matchesSearch && matchesLocation;
  });

  const handleConfirmReserve = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    
    if (!storedUser) {
      alert("Please log in to reserve a device!");
      setSelectedItem(null);
      return;
    }

    if (selectedItem.restrictedTo !== 'All') {
      const userRole = storedUser.role.toLowerCase();
      const itemRole = selectedItem.restrictedTo.toLowerCase();
      if (userRole !== itemRole && userRole !== 'admin') {
        alert(`Access Denied: This item is restricted to ${selectedItem.restrictedTo}s only.`);
        setSelectedItem(null);
        return;
      }
    }

    try {
      setIsProcessing(true);
      let deviceIdToCheckout;
      if (selectedLocation === "All Locations") {
        const availableLoc = Object.values(selectedItem.locations).find(l => l.availableCount > 0);
        deviceIdToCheckout = availableLoc.availableIds[0];
      } else {
        deviceIdToCheckout = selectedItem.locations[selectedLocation].availableIds[0];
      }

      const response = await api.post('/rentals/checkout', { deviceId: deviceIdToCheckout, userId: storedUser._id });
      alert(response.data.message);
      fetchInventory(); 
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reserve device");
    } finally {
      setIsProcessing(false);
      setSelectedItem(null);
      setAcceptedTerms(false);
    }
  };

  return (
    <main className="main-layout">
      {/* --- SEARCH & LOCATION CONTROLS --- */}
      <section className="controls-bar">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" placeholder="Search laptops, cameras, adapters..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="clear-search-btn"><X size={18} /></button>
          )}
        </div>

        <div className="filter-dropdowns">
          <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="location-select">
            <option value="All Locations">🌍 All Locations</option>
            <option value="John C. Hitt Library">📚 John C. Hitt Library</option>
            <option value="Downtown Campus">🏢 Downtown Campus</option>
            <option value="Rosen College">🏨 Rosen College</option>
          </select>
          <button onClick={fetchInventory} className="refresh-btn">
            <RefreshCw size={20} className={isLoading ? "spin-animation" : ""} />
          </button>
        </div>
      </section>

      {/* --- CATEGORY PILLS --- */}
      <section>
        <div className="category-group">
          {["All", "Laptops", "Cameras", "Accessories"].map(cat => (
            <button key={cat} className={`filter-btn ${activeCategory === cat ? "active" : ""}`} onClick={() => setActiveCategory(cat)}>
              {getCategoryIcon(cat)} {cat}
            </button>
          ))}
        </div>
      </section>

      {/* --- INVENTORY GRID --- */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}><h2>Fetching Inventory...</h2></div>
      ) : (
        <section className="inventory-grid">
          {displayItems.length === 0 ? (
            <p style={{ color: "var(--text-muted)", gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', fontSize: '1.2rem' }}>No devices match your search.</p>
          ) : (
            displayItems.map(item => {
              const primaryAvailableCount = selectedLocation === "All Locations" ? item.availableOverall : (item.locations[selectedLocation]?.availableCount || 0);
              const primaryTotalCount = selectedLocation === "All Locations" ? item.totalOverall : (item.locations[selectedLocation]?.totalCount || 0);
              
              const otherAvailableLocations = Object.entries(item.locations)
                .filter(([loc, stock]) => loc !== selectedLocation && stock.availableCount > 0)
                .map(([loc]) => loc);

              return (
                <article className="tech-card" key={item.name}>
                  <div className="card-image-wrapper">
                    <img src={item.image} alt={item.name} className="card-image" />
                    <span className="category-badge">{item.category}</span>
                  </div>

                  <div className="card-content">
                    <h3 className="card-title">{item.name}</h3>

                    {(item.restrictedTo && item.restrictedTo !== "All") && (
                      <div className="restriction-badge">
                        <ShieldAlert size={14} /> Restricted: {item.restrictedTo} Only
                      </div>
                    )}

                    <div className="card-meta" style={{ marginTop: item.restrictedTo === "All" ? '0' : 'auto' }}>
                      <div className="meta-item"><MapPin size={16} className="meta-icon" /><span>{selectedLocation === "All Locations" ? "Multiple Locations" : selectedLocation}</span></div>
                      <div className="meta-item"><Clock size={16} className="meta-icon" /><span>Loan Period: {item.loanPeriod}</span></div>
                    </div>
                    
                    <div className="card-divider"></div>

                    <div className="card-actions">
                      {primaryAvailableCount > 0 ? (
                        <div className="status-indicator success"><CheckCircle2 size={18} /><span>{primaryAvailableCount} of {primaryTotalCount} Available</span></div>
                      ) : otherAvailableLocations.length > 0 ? (
                        <div className="status-indicator warning"><MapPin size={18} /><span>Available at {otherAvailableLocations[0]}</span></div>
                      ) : (
                        <div className="status-indicator error"><XCircle size={18} /><span>Out of Stock</span></div>
                      )}

                      {primaryAvailableCount > 0 ? (
                        <button className="btn-reserve" onClick={() => { setSelectedItem(item); setAcceptedTerms(false); }}>
                          Reserve Device
                        </button>
                      ) : (
                        <button className="btn-reserve" disabled>
                          <Bell size={16} style={{ marginRight: '6px' }} /> Remind Me
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}

      {/* --- CONFIRMATION MODAL --- */}
      {selectedItem && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 800 }}>Confirm Reservation</h2>
            <p style={{ color: 'var(--text-muted)' }}>You are requesting to reserve <strong>{selectedItem.name}</strong>.</p>
            
            <div className="modal-info-box">
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>📍 Pickup Location:</strong> {selectedLocation === "All Locations" ? Object.keys(selectedItem.locations).find(l => selectedItem.locations[l].availableCount > 0) : selectedLocation}</p>
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>⏱️ Loan Period:</strong> {selectedItem.loanPeriod}</p>
              <p style={{ margin: 0 }}><strong>🔒 Restriction:</strong> {selectedItem.restrictedTo}</p>
            </div>

            <label className="modal-checkbox-label">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
              <span>I agree to return this item on time to the specified location and accept financial responsibility for any damages.</span>
            </label>

            <div className="modal-actions">
              <button onClick={() => setSelectedItem(null)} className="btn-cancel">Cancel</button>
              <button onClick={handleConfirmReserve} disabled={!acceptedTerms || isProcessing} className="btn-primary">
                {isProcessing ? "Processing..." : "Confirm Reservation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}