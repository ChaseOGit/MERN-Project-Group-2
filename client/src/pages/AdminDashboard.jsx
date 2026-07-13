import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Wand2, Plus, Package, List, Edit, Trash2, X } from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'manage'
  
  // Inventory State for the Manage Tab
  const [inventory, setInventory] = useState([]);
  const [editingDevice, setEditingDevice] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '', category: 'Laptops', serialNumber: '', location: 'John C. Hitt Library',
    loanPeriod: '7 Days', restrictedTo: 'All', overdueFeeRate: 15, description: '', image: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SECURITY CHECK & INITIAL FETCH
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'Admin') {
      alert("Access Denied: You must be an Admin to view this page.");
      window.location.href = '/';
    } else {
      setUser(storedUser);
      fetchInventory();
    }
  }, []);

// 1. Define the fetch function FIRST (and add safety fallbacks)
  const fetchInventory = async () => {
    try {
      const res = await api.get('/devices');
      // Use optional chaining just in case the API responds differently
      const fetchedData = res.data?.data || []; 
      setInventory(fetchedData);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
      setIsLoading(false);
    }
  };

  // 2. SECURITY CHECK & INITIAL FETCH
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'Admin') {
      alert("Access Denied: You must be an Admin to view this page.");
      window.location.href = '/';
    } else {
      setUser(storedUser);
      fetchInventory(); // Now it knows exactly what this function is!
    }
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // 3RD-PARTY API AUTO-FILL
  const handleAutoFill = async () => {
    if (!formData.name) return alert("Please type a product name first.");
    setIsSearching(true);
    try {
      const response = await axios.get(`https://dummyjson.com/products/search?q=${formData.name}`);
      const products = response.data.products;
      if (products.length > 0) {
        setFormData(prev => ({ ...prev, name: products[0].title, description: products[0].description, image: products[0].thumbnail }));
        alert(`Successfully found specs for: ${products[0].title}!`);
      } else {
        alert("No products found in external database.");
      }
    } catch (error) {
      alert("Failed to connect to external API.");
    } finally {
      setIsSearching(false);
    }
  };

  // BULK ADD DEVICES (Comma-separated serials)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Split serial numbers by comma and remove extra spaces
    const serials = formData.serialNumber.split(',').map(s => s.trim()).filter(s => s);
    
    try {
      let successCount = 0;
      for (const sn of serials) {
        await api.post('/devices', { ...formData, serialNumber: sn });
        successCount++;
      }
      
      alert(`Success, Added ${successCount} device(s) to inventory.`);
      
      // Reset Form
      setFormData({ name: '', category: 'Laptops', serialNumber: '', location: 'John C. Hitt Library', loanPeriod: '7 Days', restrictedTo: 'All', overdueFeeRate: 15, description: '', image: '' });
      fetchInventory(); // Update the table
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add one or more devices. Check if a Serial Number is already in use.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE DEVICE
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete this ${name}?`)) {
      try {
        await api.delete(`/devices/${id}`);
        setInventory(inventory.filter(item => item._id !== id));
      } catch (error) {
        alert("Failed to delete device.");
      }
    }
  };

  // UPDATE EXISTING DEVICE
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/devices/${editingDevice._id}`, editingDevice);
      alert("Device updated successfully");
      setInventory(inventory.map(item => item._id === editingDevice._id ? res.data.data : item));
      setEditingDevice(null);
    } catch (error) {
      alert("Failed to update device.");
    }
  };

  if (isLoading) return <main className="main-layout" style={{ textAlign: "center", padding: "4rem" }}><h2>Loading Secure Portal...</h2></main>;

  return (
    <main className="main-layout">
      <div style={{ marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 0.5rem 0' }}>
            <ShieldAlert size={32} color="var(--error-color)" /> Admin Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Authorized Access Only. Logged in as: {user.name}</p>
        </div>
        
        {/* TABS CONTROLS */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('add')} 
            className={`btn-primary ${activeTab === 'add' ? '' : 'btn-nav-outline'}`}
            style={{ color: activeTab === 'add' ? '#000' : 'var(--text-main)', borderColor: activeTab === 'add' ? 'transparent' : 'var(--border-color)', background: activeTab === 'add' ? 'var(--ucf-gold)' : 'transparent' }}
          >
            <Plus size={18} style={{ marginRight: '6px' }}/> Add Devices
          </button>
          
          {/* refreshes the inventory on click */}
          <button 
            onClick={() => { setActiveTab('manage'); fetchInventory(); }} 
            className={`btn-primary ${activeTab === 'manage' ? '' : 'btn-nav-outline'}`}
            style={{ color: activeTab === 'manage' ? '#000' : 'var(--text-main)', borderColor: activeTab === 'manage' ? 'transparent' : 'var(--border-color)', background: activeTab === 'manage' ? 'var(--ucf-gold)' : 'transparent' }}
          >
            <List size={18} style={{ marginRight: '6px' }}/> Manage Inventory
          </button>
        </div>
      </div>

      {/* ======================= ADD DEVICE TAB ======================= */}
      {activeTab === 'add' && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="tech-card" style={{ padding: '2rem', height: 'fit-content' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}><Package size={24} /> Add New Devices</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Device Name / Model</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. MacBook Pro" style={{ flexGrow: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }} />
                  <button type="button" onClick={handleAutoFill} disabled={isSearching} className="btn-reserve" style={{ flexGrow: 0, width: 'auto', padding: '0 1rem', background: 'var(--ucf-black)', color: 'var(--ucf-gold)', border: 'none' }}>
                    <Wand2 size={18} style={{ marginRight: '6px' }} /> {isSearching ? "Searching..." : "Auto-Fill"}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Serial Number(s)</label>
                <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>To add multiple items at once, separate serial numbers with a comma.</p>
                <textarea name="serialNumber" required value={formData.serialNumber} onChange={handleChange} placeholder="e.g. SN-001, SN-002, SN-003" rows="2" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                    <option value="Laptops">Laptops</option><option value="Cameras">Cameras</option><option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Location</label>
                  <select name="location" value={formData.location} onChange={handleChange} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                    <option value="John C. Hitt Library">John C. Hitt Library</option><option value="Downtown Campus">Downtown Campus</option><option value="Rosen College">Rosen College</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 100px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Loan Period</label>
                  <select name="loanPeriod" value={formData.loanPeriod} onChange={handleChange} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                    <option value="4 Hours">4 Hours</option><option value="3 Days">3 Days</option><option value="7 Days">7 Days</option>
                  </select>
                </div>
                <div style={{ flex: '1 1 100px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Restriction</label>
                  <select name="restrictedTo" value={formData.restrictedTo} onChange={handleChange} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                    <option value="All">All</option><option value="Student">Student</option><option value="Faculty">Faculty</option><option value="Admin">Admin</option>
                  </select>
                </div>
                <div style={{ flex: '1 1 100px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Fee ($/day)</label>
                  <input type="number" name="overdueFeeRate" required value={formData.overdueFeeRate} onChange={handleChange} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Description</label>
                <textarea name="description" required value={formData.description} onChange={handleChange} rows="3" style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Image URL</label>
                <input type="url" name="image" required value={formData.image} onChange={handleChange} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '1rem' }}>
                {isSubmitting ? "Processing..." : "Add to Library Inventory"}
              </button>
            </form>
          </div>

          <div>
            <div className="tech-card" style={{ padding: '2rem', background: 'var(--ucf-black)', color: 'white', borderTop: '4px solid var(--ucf-gold)' }}>
              <h3 style={{ marginTop: 0 }}>API Integration Active</h3>
              <p style={{ color: '#CCC', lineHeight: 1.6 }}>This form is securely connected to our Third-Party API database. Type a keyword like <strong>"Macbook"</strong> or <strong>"Surface"</strong> into the Device Name box and click Auto-Fill.</p>
              <p style={{ color: '#CCC', lineHeight: 1.6 }}>The API will automatically scrape the database and populate the Description and Image fields</p>
            </div>
          </div>
        </section>
      )}

      {/* ======================= MANAGE INVENTORY TAB ======================= */}
      {activeTab === 'manage' && (
        <section className="tech-card" style={{ padding: '2rem', overflowX: 'auto' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Current Library Inventory</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>Device Name</th>
                <th style={{ padding: '1rem' }}>Serial Number</th>
                <th style={{ padding: '1rem' }}>Location</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{item.serialNumber}</td>
                  <td style={{ padding: '1rem' }}>{item.location}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: item.isAvailable ? 'var(--success-bg)' : 'var(--error-bg)', color: item.isAvailable ? 'var(--success-color)' : 'var(--error-color)' }}>
                      {item.isAvailable ? "In Stock" : "Checked Out"}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button onClick={() => setEditingDevice(item)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', cursor: 'pointer' }}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(item._id, item.name)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #EF4444', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No inventory found.</td></tr>}
            </tbody>
          </table>
        </section>
      )}

      {/* ======================= EDIT MODAL ======================= */}
      {editingDevice && (
        <div className="modal-backdrop" onClick={() => setEditingDevice(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Edit Device</h2>
              <button onClick={() => setEditingDevice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Device Name</label>
                <input type="text" required value={editingDevice.name} onChange={(e) => setEditingDevice({...editingDevice, name: e.target.value})} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Location</label>
                  <select value={editingDevice.location} onChange={(e) => setEditingDevice({...editingDevice, location: e.target.value})} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                    <option value="John C. Hitt Library">John C. Hitt Library</option><option value="Downtown Campus">Downtown Campus</option><option value="Rosen College">Rosen College</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Restriction</label>
                  <select value={editingDevice.restrictedTo} onChange={(e) => setEditingDevice({...editingDevice, restrictedTo: e.target.value})} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                    <option value="All">All</option><option value="Student">Student</option><option value="Faculty">Faculty</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}