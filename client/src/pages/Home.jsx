import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  User,
  Package,
  Laptop,
  Camera,
  Cable,
  Layers,
  Search,
  Bell
} from 'lucide-react';
import api from '../services/api';

export default function Home({ activeLocation = "All" }) {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Role should eventually come from login/auth.
  // We are not showing role as a selectable filter anymore.
  const userRole = localStorage.getItem("role") || "Student";

  useEffect(() => {
    api.get('/devices')
      .then(response => {
        setItems(response.data.data || []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching devices:", error);
        setIsLoading(false);
      });
  }, []);

  const getCategoryIcon = (category) => {
    if (category === "Laptops") return <Laptop size={18} />;
    if (category === "Cameras") return <Camera size={18} />;
    if (category === "Accessories") return <Cable size={18} />;
    return <Layers size={18} />;
  };

  const getDeviceImage = (item) => {
    const name = item.name.toLowerCase();
    const category = item.category.toLowerCase();

    if (name.includes("laptop") || category.includes("laptop")) {
      return "/images/laptop.svg";
    }

    if (name.includes("camera") || category.includes("camera")) {
      return "/images/camera.svg";
    }

    if (
      name.includes("adapter") ||
      name.includes("hdmi") ||
      name.includes("usb") ||
      category.includes("accessories")
    ) {
      return "/images/adapter.svg";
    }

    return "/images/adapter.svg";
  };

  const groupedItems = items.reduce((acc, device) => {
    if (!acc[device.name]) {
      acc[device.name] = {
        id: device._id,
        name: device.name,
        category: device.category,
        image: device.image,
        loanPeriod: device.loanPeriod,
        restrictedTo: device.restrictedTo || "All",
        totalCount: 0,
        availableCount: 0,
        locations: {},
      };
    }

    const location = device.location || "Unknown Location";

    if (!acc[device.name].locations[location]) {
      acc[device.name].locations[location] = {
        totalCount: 0,
        availableCount: 0,
      };
    }

    acc[device.name].totalCount += 1;
    acc[device.name].locations[location].totalCount += 1;

    if (device.isAvailable) {
      acc[device.name].availableCount += 1;
      acc[device.name].locations[location].availableCount += 1;
    }

    return acc;
  }, {});

  const displayItems = Object.values(groupedItems);

  const getPrimaryLocation = (item) => {
    const locationNames = Object.keys(item.locations);

    if (activeLocation !== "All" && item.locations[activeLocation]) {
      return activeLocation;
    }

    return locationNames[0] || "Unknown Location";
  };

  const getPrimaryAvailability = (item) => {
    if (activeLocation === "All") {
      return item.availableCount;
    }

    return item.locations[activeLocation]?.availableCount || 0;
  };

  const getOtherAvailableLocations = (item) => {
    return Object.entries(item.locations)
      .filter(([location, stock]) => {
        return location !== activeLocation && stock.availableCount > 0;
      })
      .map(([location, stock]) => ({
        location,
        availableCount: stock.availableCount,
      }));
  };

  const filteredItems = displayItems.filter(item => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;

    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      item.restrictedTo === "All" ||
      item.restrictedTo === userRole;

    return matchesCategory && matchesSearch && matchesRole;
  });

  const handleReserveClick = (item) => {
    setSelectedItem(item);
    setAcceptedTerms(false);
  };

  const handleConfirmReserve = () => {
    alert(`Reservation request submitted for ${selectedItem.name}`);
    setSelectedItem(null);
    setAcceptedTerms(false);
  };

  const handleReminderClick = (item) => {
    alert(`Reminder set for ${item.name}. You will be notified when it becomes available.`);
  };

  if (isLoading) {
    return (
      <main className="main-layout" style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Loading Inventory...</h2>
      </main>
    );
  }

  return (
    <main className="main-layout">
      {/* SEARCH BAR */}
      <section className="top-search-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search devices, laptops, cameras, adapters..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </section>

      {/* DEVICE CATEGORY FILTER ONLY */}
      <section className="compact-filter-bar">
        <div className="filter-row">
          <div className="filter-label">
            <Layers size={20} />
            <span>Devices</span>
          </div>

          <div className="filter-options">
            {["All", "Laptops", "Cameras", "Accessories"].map(cat => (
              <button
                key={cat}
                className={`filter-btn compact ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {getCategoryIcon(cat)}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="results-header">
        <h2>Available Equipment</h2>
        <span>{filteredItems.length} results</span>
      </div>

      <section className="inventory-grid">
        {filteredItems.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No devices found with the selected filters.
          </p>
        ) : (
          filteredItems.map(item => {
            const primaryLocation = getPrimaryLocation(item);
            const primaryAvailableCount = getPrimaryAvailability(item);
            const otherAvailableLocations = getOtherAvailableLocations(item);

            return (
              <article className="tech-card" key={item.id}>
                <div className="card-image-wrapper">
                  <img
                    src={getDeviceImage(item)}
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
                      <span>Primary Location: {primaryLocation}</span>
                    </div>

                    <div className="meta-item">
                      <Clock size={16} className="meta-icon" />
                      <span>Loan Period: {item.loanPeriod}</span>
                    </div>

                    <div className="meta-item">
                      <User size={16} className="meta-icon" />
                      <span>Restricted To: {item.restrictedTo}</span>
                    </div>

                    <div className="meta-item">
                      <Package size={16} className="meta-icon" />
                      <span>Total Stock: {item.totalCount}</span>
                    </div>
                  </div>

                  <div className="location-stock-list">
                    {Object.entries(item.locations).map(([location, stock]) => (
                      <div key={location} className="location-stock-row">
                        <span>{location}</span>
                        <strong>{stock.availableCount}/{stock.totalCount} available</strong>
                      </div>
                    ))}
                  </div>

                  <div className="card-divider"></div>

                  <div className="card-actions">
                    {primaryAvailableCount > 0 ? (
                      <div className="status-indicator success">
                        <CheckCircle2 size={18} />
                        <span>{primaryAvailableCount} Available</span>
                      </div>
                    ) : otherAvailableLocations.length > 0 ? (
                      <div className="status-indicator warning">
                        <XCircle size={18} />
                        <span>
                          Out of stock here, available at {otherAvailableLocations[0].location}
                        </span>
                      </div>
                    ) : (
                      <div className="status-indicator error">
                        <XCircle size={18} />
                        <span>Out of Stock</span>
                      </div>
                    )}

                    {primaryAvailableCount > 0 ? (
                      <button
                        className="btn-reserve"
                        onClick={() => handleReserveClick(item)}
                      >
                        Reserve
                      </button>
                    ) : (
                      <button
                        className="btn-reminder"
                        onClick={() => handleReminderClick(item)}
                      >
                        <Bell size={16} />
                        Remind Me
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {selectedItem && (
        <div className="modal-overlay">
          <div className="reserve-modal">
            <h2>Confirm Reservation</h2>

            <p>
              You are requesting to reserve <strong>{selectedItem.name}</strong>.
            </p>

            <p>
              <strong>Location:</strong> {getPrimaryLocation(selectedItem)}
            </p>

            <p>
              <strong>Loan Period:</strong> {selectedItem.loanPeriod}
            </p>

            <p>
              <strong>Restricted To:</strong> {selectedItem.restrictedTo}
            </p>

            <label className="terms-row">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
              />
              I agree to return this item on time and accept responsibility for the device.
            </label>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setSelectedItem(null);
                  setAcceptedTerms(false);
                }}
              >
                Cancel
              </button>

              <button
                className="btn-reserve"
                disabled={!acceptedTerms}
                onClick={handleConfirmReserve}
              >
                Confirm Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}