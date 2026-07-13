import { useState, useEffect } from 'react';
import axios from 'axios'; // We import base axios here for the 3rd Party API
import { ShieldAlert, Wand2, Plus, Package } from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '', category: 'Laptops', serialNumber: '', location: 'John C. Hitt Library',
    loanPeriod: '7 Days', restrictedTo: 'All', overdueFeeRate: 15, description: '', image: ''
  });

  const [isSearching, setIsSearching] = useState(false);

  // 1. SECURITY CHECK: Verify user is an Admin
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'Admin') {
      alert("Access Denied: You must be an Admin to view this page.");
      window.location.href = '/';
    } else {
      setUser(storedUser);
      setIsLoading(false);
    }
  }, []);

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🚀 3RD-PARTY API INTEGRATION (Fulfills Project Requirement!)
  const handleAutoFill = async () => {
    if (!formData.name) return alert("Please type a product name first (e.g., 'Macbook' or 'Surface').");
    
    setIsSearching(true);
    try {
      // Calling an external public API to fetch real tech data!
      const response = await axios.get(`https://dummyjson.com/products/search?q=${formData.name}`);
      const products = response.data.products;

      if (products.length > 0) {
        const product = products[0]; // Grab the best match
        setFormData(prev => ({
          ...prev,
          name: product.title,
          description: product.description,
          image: product.thumbnail
        }));
        alert(`Successfully found specs for: ${product.title}!`);
      } else {
        alert("No products found in external database. Try a more general term like 'laptop'.");
      }
    } catch (error) {
      console.error("3rd Party API Error:", error);
      alert("Failed to connect to external API.");
    } finally {
      setIsSearching(false);
    }
  };

  // Submit new device to YOUR MongoDB database
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/devices', formData);
      alert(`Success! ${response.data.data.name} added to inventory.`);
      // Reset form
      setFormData({
        name: '', category: 'Laptops', serialNumber: '', location: 'John C. Hitt Library',
        loanPeriod: '7 Days', restrictedTo: 'All', overdueFeeRate: 15, description: '', image: ''
      });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add device.");
    }
  };

  if (isLoading) return <main className="main-layout" style={{ textAlign: "center", padding: "4rem" }}><h2>Loading Secure Portal...</h2></main>;

  return (
    <main className="main-layout">
      <div style={{ marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={32} color="var(--error-color)" /> Admin Portal
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Authorized Access Only. Logged in as: {user.name}</p>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* ADD DEVICE FORM */}
        <div className="tech-card" style={{ padding: '2rem', height: 'fit-content' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
            <Package size={24} /> Add New Device
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* The Magic API Row */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Device Name / Model</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input 
                  type="text" name="name" required value={formData.name} onChange={handleChange}
                  placeholder="e.g. MacBook Pro"
                  style={{ flexGrow: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                />
                <button type="button" onClick={handleAutoFill} disabled={isSearching} className="btn-reserve" style={{ flexGrow: 0, width: 'auto', padding: '0 1rem', background: 'var(--ucf-gold)', color: '#000', border: 'none' }}>
                  <Wand2 size={18} style={{ marginRight: '6px' }} /> {isSearching ? "Searching..." : "Auto-Fill"}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Category</label>
                <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                  <option value="Laptops">Laptops</option><option value="Cameras">Cameras</option><option value="Accessories">Accessories</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Serial Number</label>
                <input type="text" name="serialNumber" required value={formData.serialNumber} onChange={handleChange} placeholder="SN-123" style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Location</label>
                <select name="location" value={formData.location} onChange={handleChange} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                  <option value="John C. Hitt Library">John C. Hitt Library</option><option value="Downtown Campus">Downtown Campus</option><option value="Rosen College">Rosen College</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Loan Period</label>
                <select name="loanPeriod" value={formData.loanPeriod} onChange={handleChange} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                  <option value="4 Hours">4 Hours</option><option value="3 Days">3 Days</option><option value="7 Days">7 Days</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Restriction</label>
                <select name="restrictedTo" value={formData.restrictedTo} onChange={handleChange} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                  <option value="All">All</option><option value="Student">Student</option><option value="Faculty">Faculty</option><option value="Admin">Admin</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Overdue Fee ($/day)</label>
                <input type="number" name="overdueFeeRate" required value={formData.overdueFeeRate} onChange={handleChange} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Description</label>
              <textarea name="description" required value={formData.description} onChange={handleChange} rows="3" style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Image URL</label>
              <input type="url" name="image" required value={formData.image} onChange={handleChange} placeholder="https://..." style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
            </div>

            {/* Image Preview */}
            {formData.image && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <img src={formData.image} alt="Preview" style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', display: 'flex', gap: '8px' }}>
              <Plus size={20} /> Add to Library Inventory
            </button>
          </form>
        </div>

        {/* INSTRUCTIONS / INFO PANEL */}
        <div>
          <div className="tech-card" style={{ padding: '2rem', background: 'var(--ucf-black)', color: 'white', borderTop: '4px solid var(--ucf-gold)' }}>
            <h3 style={{ marginTop: 0 }}>API Integration Active</h3>
            <p style={{ color: '#CCC', lineHeight: 1.6 }}>
              This form is securely connected to our Third-Party API database. Type a keyword like <strong>"Macbook"</strong> or <strong>"Surface"</strong> into the Device Name box and click Auto-Fill.
            </p>
            <p style={{ color: '#CCC', lineHeight: 1.6 }}>
              The API will automatically scrape the database and instantly populate the Description and Image fields!
            </p>
          </div>
        </div>

      </section>
    </main>
  );
}