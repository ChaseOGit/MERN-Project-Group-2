import { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, XCircle, MapPin, Clock, Search, ShieldAlert, 
  RefreshCw, X, Laptop, Camera, Cable, Layers, Tablet, Headphones, Calculator, SlidersHorizontal, Info
} from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Basic Filters
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  
  // Advanced Filters (Hidden by default for a clean UI)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLoanPeriod, setSelectedLoanPeriod] = useState("All");
  const [selectedEligibility, setSelectedEligibility] = useState("All");

  // Modal State
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

  // Sleek Category Icons
  const getCategoryIcon = (category) => {
    if (category === "Laptops") return <Laptop size={18} />;
    if (category === "Tablets") return <Tablet size={18} />;
    if (category === "Cameras") return <Camera size={18} />;
    if (category === "Audio & Video") return <Headphones size={18} />;
    if (category === "Calculators") return <Calculator size={18} />;
    if (category === "Accessories") return <Cable size={18} />;
    return <Layers size={18} />;
  };

  // GROUPING LOGIC
  const groupedItems = items.reduce((acc, device) => {
    if (!acc[device.name]) {
      acc[device.name] = {
        name: device.name, 
        category: device.category, 
        image: device.image,
        description: device.description || "No description available.",
        loanPeriod: device.loanPeriod, 
        restrictedTo: device.restrictedTo || "All",
        totalOverall: 0, 
        availableOverall: 0, 
        locations: {},
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

  const displayItems = Object.values(groupedItems);

  // DYNAMIC FILTER GENERATION (Scans database to create dropdown options)
  const availableLoanPeriods = useMemo(() => {
    return [...new Set(displayItems.map(item => item.loanPeriod))].sort();
  }, [displayItems]);

  const availableRoles = useMemo(() => {
    return [...new Set(displayItems.map(item => item.restrictedTo))].sort();
  }, [displayItems]);

  // FILTERING LOGIC (Applies Basic + Advanced Filters)
  const filteredItems = displayItems.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === "All Locations" || item.locations[selectedLocation];
    const matchesLoanPeriod = selectedLoanPeriod === "All" || item.loanPeriod === selectedLoanPeriod;
    const matchesEligibility = selectedEligibility === "All" || item.restrictedTo === selectedEligibility;
    
    return matchesCategory && matchesSearch && matchesLocation && matchesLoanPeriod && matchesEligibility;
  });

  // Check Out Logic
  const handleConfirmReserve = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return alert("Please log in to reserve a device!");

    if (selectedItem.restrictedTo !== 'All') {
      const userRole = storedUser.role.toLowerCase();
      const itemRole = selectedItem.restrictedTo.toLowerCase();
      if (userRole !== itemRole && userRole !== 'admin') {
        return alert(`Access Denied: This item is restricted to ${selectedItem.restrictedTo}s only.`);
      }
    }

    try {
      setIsProcessing(true);
      let deviceIdToCheckout = selectedLocation === "All Locations" 
        ? Object.values(selectedItem.locations).find(l => l.availableCount > 0).availableIds[0]
        : selectedItem.locations[selectedLocation].availableIds[0];

      const response = await api.post('/rentals/checkout', { deviceId: deviceIdToCheckout, userId: storedUser._id });
      alert(response.data.message);
      fetchInventory(); 
      setSelectedItem(null); 
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reserve device");
    } finally {
      setIsProcessing(false);
      setAcceptedTerms(false);
    }
  };

  return (
    <main className="main-layout">
      {/* --- TOP CONTROLS BAR --- */}
      <section className="controls-bar" style={{ marginBottom: showAdvancedFilters ? '1rem' : '1.5rem' }}>
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
          
          {/* ADVANCED FILTERS TOGGLE */}
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
            className="refresh-btn"
            style={{ backgroundColor: showAdvancedFilters ? 'var(--ucf-black)' : 'var(--bg-surface)', color: showAdvancedFilters ? 'var(--ucf-gold)' : 'var(--text-main)' }}
            title="Advanced Filters"
          >
            <SlidersHorizontal size={20} />
          </button>
          
          <button onClick={fetchInventory} className="refresh-btn" title="Refresh Data">
            <RefreshCw size={20} className={isLoading ? "spin-animation" : ""} />
          </button>
        </div>
      </section>

      {/* --- ADVANCED FILTERS TRAY (Smooth Dropdown) --- */}
      {showAdvancedFilters && (
        <section style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Loan Period</label>
            <select value={selectedLoanPeriod} onChange={(e) => setSelectedLoanPeriod(e.target.value)} className="location-select" style={{ width: '100%' }}>
              <option value="All">All Loan Periods</option>
              {availableLoanPeriods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Eligible User</label>
            <select value={selectedEligibility} onChange={(e) => setSelectedEligibility(e.target.value)} className="location-select" style={{ width: '100%' }}>
              <option value="All">All Users</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role === 'All' ? 'Open to Everyone' : `${role}s Only`}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
             <button onClick={() => { setSelectedLoanPeriod("All"); setSelectedEligibility("All"); }} style={{ padding: '0.85rem 1rem', background: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer', fontWeight: 600 }}>
               Clear Filters
             </button>
          </div>

        </section>
      )}

      {/* --- UNIFIED CATEGORY PILLS --- */}
      <section>
        <div className="category-group">
          {/* Catagories */}
          {["All", "Laptops", "Tablets", "Cameras", "Audio & Video", "Calculators", "Accessories"].map(cat => (
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
          {filteredItems.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
              <Search size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0' }}>No devices match your exact filters.</h3>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>Try clearing some filters or selecting a different location.</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const primaryAvailableCount = selectedLocation === "All Locations" ? item.availableOverall : (item.locations[selectedLocation]?.availableCount || 0);
              const primaryTotalCount = selectedLocation === "All Locations" ? item.totalOverall : (item.locations[selectedLocation]?.totalCount || 0);
              const otherAvailableLocations = Object.entries(item.locations).filter(([loc, stock]) => loc !== selectedLocation && stock.availableCount > 0);

              return (
                <article 
                  className="tech-card" key={item.name} 
                  onClick={() => { setSelectedItem(item); setAcceptedTerms(false); }}
                  style={{ cursor: 'pointer' }} title="Click to view details"
                >
                  <div className="card-image-wrapper">
                    <img src={item.image} alt={item.name} className="card-image" />
                    <span className="category-badge">{item.category}</span>
                  </div>

                  <div className="card-content" style={{ paddingBottom: '1rem' }}>
                    <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>{item.name}</h3>

                    {(item.restrictedTo && item.restrictedTo !== "All") && (
                      <div className="restriction-badge">
                        <ShieldAlert size={14} /> {item.restrictedTo} Only
                      </div>
                    )}

                    <div style={{ marginTop: 'auto' }}>
                      {primaryAvailableCount > 0 ? (
                        <div className="status-indicator success"><CheckCircle2 size={16} /><span>{primaryAvailableCount} of {primaryTotalCount} Available</span></div>
                      ) : otherAvailableLocations.length > 0 ? (
                        <div className="status-indicator warning"><MapPin size={16} /><span>Available Elsewhere</span></div>
                      ) : (
                        <div className="status-indicator error"><XCircle size={16} /><span>Out of Stock</span></div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}

      {/* --- QUICK VIEW / CHECKOUT MODAL --- */}
      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '0', overflow: 'hidden' }}>
            
            <div style={{ position: 'relative', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-color)', height: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                <X size={20} />
              </button>
              <img src={selectedItem.image} alt={selectedItem.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', padding: '1rem' }} />
            </div>

            <div style={{ padding: '2rem' }}>
              <h2 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>{selectedItem.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>{selectedItem.description}</p>
              
              <div className="modal-info-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 0 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Pickup Location</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><MapPin size={16} className="meta-icon"/> {selectedLocation === "All Locations" ? Object.keys(selectedItem.locations).find(l => selectedItem.locations[l].availableCount > 0) || "Check Locations" : selectedLocation}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Loan Period</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><Clock size={16} className="meta-icon"/> {selectedItem.loanPeriod}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Restriction</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><ShieldAlert size={16} className="meta-icon"/> {selectedItem.restrictedTo}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Status</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    <Info size={16} className="meta-icon"/> 
                    {selectedLocation === "All Locations" 
                      ? `${selectedItem.availableOverall} Available Total` 
                      : `${selectedItem.locations[selectedLocation]?.availableCount || 0} Available Here`}
                  </div>
                </div>
              </div>

              {((selectedLocation === "All Locations" ? selectedItem.availableOverall : (selectedItem.locations[selectedLocation]?.availableCount || 0)) > 0) ? (
                <>
                  <label className="modal-checkbox-label">
                    <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                    <span>I agree to return this item on time to the specified location and accept financial responsibility for any damages.</span>
                  </label>
                  <button onClick={handleConfirmReserve} disabled={!acceptedTerms || isProcessing} className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
                    {isProcessing ? "Processing Reservation..." : "Confirm Reservation"}
                  </button>
                </>
              ) : (
                <div style={{ padding: '1rem', background: 'var(--error-bg)', color: 'var(--error-color)', borderRadius: '8px', textAlign: 'center', fontWeight: 600 }}>
                  Item is currently out of stock at this location.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}