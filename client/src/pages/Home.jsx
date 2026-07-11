import { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, MapPin, Clock, Search, ShieldAlert, RefreshCw, X, Bell 
} from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal & Reservation State
  const [selectedItem, setSelectedItem] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch ALL inventory so we can power the "Smart Suggestions" for other locations
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

  useEffect(() => {
    fetchInventory();
  }, []);

  // 🚀 GROUPING LOGIC (Tracks stock per location!)
  const groupedItems = items.reduce((acc, device) => {
    if (!acc[device.name]) {
      acc[device.name] = {
        name: device.name,
        category: device.category,
        image: device.image,
        loanPeriod: device.loanPeriod,
        restrictedTo: device.restrictedTo || "All",
        totalOverall: 0,
        availableOverall: 0,
        locations: {}, // Track stock at specific campuses
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
      acc[device.name].locations[loc].availableIds.push(device._id); // Needed for checkout!
    }

    return acc;
  }, {});

  // 🚀 FILTERING LOGIC
  const displayItems = Object.values(groupedItems).filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === "All Locations" || item.locations[selectedLocation];
    return matchesCategory && matchesSearch && matchesLocation;
  });

  // 🚀 REAL BACKEND CHECKOUT LOGIC (Inside the Modal)
  const handleConfirmReserve = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    
    // 1. Auth Check
    if (!storedUser) {
      alert("Please log in to reserve a device!");
      setSelectedItem(null);
      return;
    }

    // 2. Role Security Check
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
      
      // Grab the correct device ID based on where they are checking it out from
      let deviceIdToCheckout;
      if (selectedLocation === "All Locations") {
        // Find the first location that has it in stock
        const availableLoc = Object.values(selectedItem.locations).find(l => l.availableCount > 0);
        deviceIdToCheckout = availableLoc.availableIds[0];
      } else {
        deviceIdToCheckout = selectedItem.locations[selectedLocation].availableIds[0];
      }

      // 3. Send to Database
      const response = await api.post('/rentals/checkout', {
        deviceId: deviceIdToCheckout,
        userId: storedUser._id 
      });

      alert(response.data.message);
      fetchInventory(); // Refresh stock immediately
      
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
      {/* CONTROLS BAR */}
      <section className="controls-section" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search for a laptop, camera, etc..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '1rem' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ flex: '0 0 auto', display: 'flex', gap: '0.5rem' }}>
          <select 
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1rem' }}
          >
            <option value="All Locations">🌍 All Locations</option>
            <option value="John C. Hitt Library">📚 John C. Hitt Library</option>
            <option value="Downtown Campus">🏢 Downtown Campus</option>
            <option value="Rosen College">🏨 Rosen College</option>
          </select>
          <button onClick={fetchInventory} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', cursor: 'pointer' }}>
            <RefreshCw size={20} className={isLoading ? "spin-animation" : ""} />
          </button>
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <section className="filter-section" style={{ marginBottom: '2rem' }}>
        <div className="category-group" style={{ display: 'flex', gap: '1rem' }}>
          {["All", "Laptops", "Cameras", "Accessories"].map(cat => (
            <button key={cat} className={`filter-btn ${activeCategory === cat ? "active" : ""}`} onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* INVENTORY GRID */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}><h2>Loading Inventory...</h2></div>
      ) : (
        <section className="inventory-grid">
          {displayItems.length === 0 ? (
            <p style={{ color: "var(--text-muted)", gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>No devices match your search.</p>
          ) : (
            displayItems.map(item => {
              // Calculate location-specific stock numbers
              const primaryAvailableCount = selectedLocation === "All Locations" ? item.availableOverall : (item.locations[selectedLocation]?.availableCount || 0);
              const primaryTotalCount = selectedLocation === "All Locations" ? item.totalOverall : (item.locations[selectedLocation]?.totalCount || 0);
              
              // Smart Suggestions Check! Look at other campuses.
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

                    {/* ROLE BADGE */}
                    {(item.restrictedTo && item.restrictedTo !== "All") && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        <ShieldAlert size={14} /> Restricted: {item.restrictedTo} Only
                      </div>
                    )}

                    <div className="card-meta">
                      <div className="meta-item"><MapPin size={16} className="meta-icon" /><span>{selectedLocation === "All Locations" ? "Multiple Locations" : selectedLocation}</span></div>
                      <div className="meta-item"><Clock size={16} className="meta-icon" /><span>Loan Period: {item.loanPeriod}</span></div>
                    </div>
                    <div className="card-divider"></div>

                    <div className="card-actions">
                      
                      {/* STOCK LOGIC */}
                      {primaryAvailableCount > 0 ? (
                        <div className="status-indicator success"><CheckCircle2 size={18} /><span>{primaryAvailableCount} of {primaryTotalCount} Available</span></div>
                      ) : otherAvailableLocations.length > 0 ? (
                        <div className="status-indicator" style={{ color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                          <MapPin size={18} /><span>Available at {otherAvailableLocations[0]}</span>
                        </div>
                      ) : (
                        <div className="status-indicator error"><XCircle size={18} /><span>Out of Stock</span></div>
                      )}

                      {/* BUTTON LOGIC */}
                      {primaryAvailableCount > 0 ? (
                        <button className="btn-reserve" onClick={() => { setSelectedItem(item); setAcceptedTerms(false); }}>
                          Reserve
                        </button>
                      ) : (
                        <button className="btn-reserve" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                          <Bell size={16} style={{ marginRight: '4px' }} /> Remind Me
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

      {/* BILAL'S CONFIRMATION MODAL (Using Inline Styles to guarantee it renders perfectly) */}
      {selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', padding: '2rem', borderRadius: '12px', maxWidth: '500px', width: '90%', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem' }}>Confirm Reservation</h2>
            <p style={{ marginBottom: '1rem' }}>You are requesting to reserve <strong>{selectedItem.name}</strong>.</p>
            
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>Pickup Location:</strong> {selectedLocation === "All Locations" ? Object.keys(selectedItem.locations)[0] : selectedLocation}</p>
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>Loan Period:</strong> {selectedItem.loanPeriod}</p>
              <p style={{ margin: 0 }}><strong>Restriction:</strong> {selectedItem.restrictedTo}</p>
            </div>

            <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '2rem', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} style={{ marginTop: '0.25rem', transform: 'scale(1.2)' }} />
              <span style={{ lineHeight: '1.4' }}>I agree to return this item on time to the specified location and accept responsibility for the device.</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setSelectedItem(null)} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)', fontWeight: '500' }}>
                Cancel
              </button>
              <button onClick={handleConfirmReserve} disabled={!acceptedTerms || isProcessing} className="btn-primary" style={{ opacity: (!acceptedTerms || isProcessing) ? 0.5 : 1 }}>
                {isProcessing ? "Processing..." : "Confirm Reservation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
