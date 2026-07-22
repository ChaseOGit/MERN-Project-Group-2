import { useState, useEffect } from 'react';
import { Search, UserCircle, Package, ArrowRightLeft, AlertTriangle, CheckCircle, Clock, MousePointerClick, List, X } from 'lucide-react';
import api from '../services/api';

export default function CirculationDesk() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Left Panel: Student Lookup
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Right Panel: Desk Actions
  const [actionType, setActionType] = useState('checkout'); // 'checkout' or 'return'
  const [serialNumber, setSerialNumber] = useState('');
  const [returnCondition, setReturnCondition] = useState('Good');
  const [isProcessing, setIsProcessing] = useState(false);

  // Demo Helpers
  const [allDevices, setAllDevices] = useState([]);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Security Check: Allow Admin and Faculty
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (user.role !== 'Admin' && user.role !== 'Faculty')) {
      alert("Access Denied: Circulation Desk is for authorized library faculty and staff only.");
      window.location.href = '/';
    } else {
      setIsAuthorized(true);
      // Fetch devices for the Demo Cheat Sheet
      api.get('/devices').then(res => setAllDevices(res.data.data)).catch(console.error);
    }
  }, []);

  // 1. Search for Student
  const handleStudentSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 2) {
      try {
        const res = await api.get(`/admin/users/search?q=${q}`);
        setSearchResults(res.data.data);
      } catch (error) {
        console.error("Search failed", error);
      }
    } else {
      setSearchResults([]);
    }
  };

  // 2. Select Student & Load Full Profile
  const loadStudentProfile = async (studentId) => {
    try {
      const res = await api.get(`/admin/users/${studentId}/circulation`);
      setSelectedStudent(res.data.data);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      alert("Failed to load student profile");
    }
  };

  // 3. Process Checkout or Return via Serial Number
  const handleDeskAction = async (e) => {
    e.preventDefault();
    if (!serialNumber) return;
    setIsProcessing(true);

    try {
      const deviceRes = await api.get(`/devices`);
      const device = deviceRes.data.data.find(d => d.serialNumber === serialNumber.trim());
      
      if (!device) {
         alert(`Device with Serial Number '${serialNumber}' not found in inventory.`);
         setIsProcessing(false);
         return;
      }

      if (actionType === 'checkout') {
        if (!selectedStudent) {
          alert("You must select a student first to check out an item!");
          setIsProcessing(false);
          return;
        }
        
        const res = await api.post('/rentals/checkout', {
          deviceId: device._id,
          userId: selectedStudent.user._id,
          conditionAtCheckout: 'Good'
        });
        alert(res.data.message);
      } 
      
      else if (actionType === 'return') {
        const res = await api.post('/rentals/return', {
          deviceId: device._id,
          conditionAtReturn: returnCondition
        });
        if (res.data.fineApplied > 0) {
           alert(`${res.data.message}\n\n⚠️ NOTE: A late fine of $${res.data.fineApplied} has been applied to the student's account.`);
        } else {
           alert(res.data.message);
        }
      }

      setSerialNumber('');
      if (selectedStudent) loadStudentProfile(selectedStudent.user._id); 
      // Refresh demo inventory list
      api.get('/devices').then(res => setAllDevices(res.data.data));
      
    } catch (error) {
      alert(error.response?.data?.message || "Transaction failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 🚀 DEMO HELPER: Click a row to auto-fill the serial number
  const handleRowClick = (sn, action) => {
    setSerialNumber(sn);
    setActionType(action);
  };

  if (!isAuthorized) return null;

  return (
    <main className="main-layout" style={{ maxWidth: '1400px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
          <ArrowRightLeft size={32} color="var(--ucf-gold)" /> Circulation Desk
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Process walk-up checkouts, inspect returns, and manage student accounts.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* ================= LEFT PANEL: STUDENT LOOKUP ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="tech-card" style={{ padding: '1.5rem', overflow: 'visible' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCircle size={20} /> Lookup Student
            </h3>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" placeholder="Search by Name, UCF ID, or Email..." 
                value={searchQuery} onChange={handleStudentSearch}
                style={{ width: '100%', padding: '0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', boxSizing: 'border-box' }}
              />
              
              {/* Dropdown Results */}
              {searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 50, marginTop: '4px', boxShadow: 'var(--shadow-md)' }}>
                  {searchResults.map(s => (
                    <div 
                      key={s._id} onClick={() => loadStudentProfile(s._id)}
                      style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <strong style={{ display: 'block' }}>{s.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.email} | ID: {s.StudentIdNumber || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedStudent && (
            <div className="tech-card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Student Header */}
              <div style={{ padding: '1.5rem', background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem 0' }}>{selectedStudent.user.name}</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>{selectedStudent.user.email}</p>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>UCF ID: {selectedStudent.user.StudentIdNumber || 'N/A'}</p>
                </div>
                <div style={{ textAlign: 'right', background: selectedStudent.totalFines > 0 ? 'var(--error-bg)' : 'var(--success-bg)', padding: '1rem', borderRadius: '8px', border: `1px solid ${selectedStudent.totalFines > 0 ? 'var(--error-color)' : 'var(--success-color)'}` }}>
                  <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold', color: selectedStudent.totalFines > 0 ? 'var(--error-color)' : 'var(--success-color)' }}>Outstanding Fines</span>
                  <strong style={{ fontSize: '1.5rem', color: selectedStudent.totalFines > 0 ? 'var(--error-color)' : 'var(--success-color)' }}>${selectedStudent.totalFines.toFixed(2)}</strong>
                </div>
              </div>

              {/* Transactions List */}
              <div style={{ padding: '1.5rem' }}>
                
                {/* 🚀 NEW: Pending Reservations */}
                {selectedStudent.transactions.filter(t => t.Status === 'reserved').length > 0 && (
                  <>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: 'var(--ucf-gold)' }}>
                      <Clock size={18} /> Pending Web Reservations
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '-0.5rem 0 0.5rem 0' }}>💡 Demo Tip: Click a row to auto-fill the Serial Number!</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.9rem' }}>
                      <tbody>
                        {selectedStudent.transactions.filter(t => t.Status === 'reserved').map(t => (
                          <tr 
                            key={t._id} 
                            onClick={() => handleRowClick(t.ItemID?.serialNumber, 'checkout')}
                            style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-app)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{t.ItemID?.name}</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SN: {t.ItemID?.serialNumber}</td>
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--ucf-gold)' }}><MousePointerClick size={16} /> Checkout</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: 'var(--success-color)' }}>
                  <Package size={18} /> Currently Checked Out
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '-0.5rem 0 0.5rem 0' }}>💡 Demo Tip: Click a row to auto-fill the Serial Number!</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.9rem' }}>
                  <tbody>
                    {selectedStudent.transactions.filter(t => t.Status === 'active').map(t => (
                      <tr 
                        key={t._id} 
                        onClick={() => handleRowClick(t.ItemID?.serialNumber, 'return')}
                        style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-app)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{t.ItemID?.name}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SN: {t.ItemID?.serialNumber}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--success-color)' }}><MousePointerClick size={16} /> Return</td>
                      </tr>
                    ))}
                    {selectedStudent.transactions.filter(t => t.Status === 'active').length === 0 && <tr><td colSpan="3" style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>No active rentals.</td></tr>}
                  </tbody>
                </table>

                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                  <Clock size={18} /> Recent History
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <tbody>
                    {selectedStudent.transactions.filter(t => t.Status === 'returned').slice(0, 5).map(t => (
                      <tr key={t._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 0' }}>{t.ItemID?.name || 'Unknown Item'}</td>
                        <td style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>Returned: {new Date(t.ReturnDate).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                           {t.FineAmount > 0 ? <span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>Fine: ${t.FineAmount}</span> : <span style={{ color: 'var(--success-color)' }}>On Time</span>}
                        </td>
                      </tr>
                    ))}
                    {selectedStudent.transactions.filter(t => t.Status === 'returned').length === 0 && <tr><td colSpan="3" style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>No previous return history.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT PANEL: DESK ACTIONS ================= */}
        <div className="tech-card" style={{ padding: '2rem' }}>
          
          {/* Action Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '0.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <button 
              onClick={() => setActionType('checkout')}
              style={{ flex: 1, padding: '1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: '0.2s', background: actionType === 'checkout' ? 'var(--ucf-gold)' : 'transparent', color: actionType === 'checkout' ? '#000' : 'var(--text-muted)', boxShadow: actionType === 'checkout' ? 'var(--shadow-sm)' : 'none' }}
            >
              Check Out
            </button>
            <button 
              onClick={() => setActionType('return')}
              style={{ flex: 1, padding: '1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: '0.2s', background: actionType === 'return' ? 'var(--ucf-black)' : 'transparent', color: actionType === 'return' ? 'var(--ucf-gold)' : 'var(--text-muted)', boxShadow: actionType === 'return' ? 'var(--shadow-sm)' : 'none' }}
            >
              Process Return
            </button>
          </div>

          {/* Action Form */}
          <form onSubmit={handleDeskAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              
              {/* 🚀 DEMO HELPER: Inventory Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Device Barcode / Serial
                </label>
                <button type="button" onClick={() => setShowDemoModal(true)} style={{ fontSize: '0.75rem', color: 'var(--ucf-gold)', background: 'var(--ucf-black)', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center', fontWeight: 'bold' }}>
                  <List size={14}/> Demo Inventory
                </button>
              </div>

              <input 
                type="text" required placeholder="e.g. SN-12345" 
                value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)}
                style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', fontFamily: 'monospace', borderRadius: '8px', border: `2px dashed ${actionType === 'return' ? 'var(--text-main)' : 'var(--ucf-gold)'}`, background: 'var(--bg-surface)', color: 'var(--text-main)', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Check Out Warning/Success Box */}
            {actionType === 'checkout' && (
              <div style={{ padding: '1rem', background: selectedStudent ? 'var(--success-bg)' : 'var(--error-bg)', color: selectedStudent ? 'var(--success-color)' : 'var(--error-color)', borderRadius: '8px', border: `1px solid ${selectedStudent ? 'var(--success-color)' : 'var(--error-color)'}`, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                {selectedStudent ? <><CheckCircle size={20} /> Assigning to: {selectedStudent.user.name}</> : <><AlertTriangle size={20} /> You must lookup and select a student first.</>}
              </div>
            )}

            {/* Return Condition Selector */}
            {actionType === 'return' && (
               <div>
                 <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                   Condition at Return
                 </label>
                 <select 
                   value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)}
                   style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', cursor: 'pointer' }}
                 >
                   <option value="Good">🟢 Good / No Damage</option>
                   <option value="Damaged">🔴 Damaged (Needs Repair)</option>
                   <option value="Missing Cables/Parts">🟡 Missing Cables or Parts</option>
                   <option value="Lost">⚫ Lost / Completely Destroyed</option>
                 </select>
               </div>
            )}

            <button 
              type="submit" 
              disabled={isProcessing || (actionType === 'checkout' && !selectedStudent)}
              className="btn-primary" 
              style={{ padding: '1.25rem', fontSize: '1.1rem', marginTop: '1rem', background: actionType === 'return' ? 'var(--ucf-black)' : 'var(--ucf-gold)', color: actionType === 'return' ? 'var(--ucf-gold)' : '#000' }}
            >
              {isProcessing ? "Processing..." : (actionType === 'checkout' ? "Complete Checkout" : "Log Condition & Return")}
            </button>
          </form>

        </div>
      </div>

      {/* ======================= DEMO INVENTORY MODAL ======================= */}
      {showDemoModal && (
        <div className="modal-backdrop" onClick={() => setShowDemoModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Available Inventory (Demo)</h2>
              <button onClick={() => setShowDemoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}><X size={24} /></button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Click an available item below to auto-fill its Serial Number for a walk-up checkout.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {allDevices.filter(d => d.isAvailable).map(d => (
                <div 
                  key={d._id}
                  onClick={() => { setSerialNumber(d.serialNumber); setActionType('checkout'); setShowDemoModal(false); }}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'var(--bg-app)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--ucf-gold)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <strong style={{ color: 'var(--text-main)' }}>{d.name}</strong>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{d.serialNumber}</span>
                </div>
              ))}
              {allDevices.filter(d => d.isAvailable).length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No items are currently in stock.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}