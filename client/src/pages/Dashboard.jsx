import { useState, useEffect } from 'react';
import { Package, Clock, CalendarClock, MapPin, AlertCircle, X, Info } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [returnModalItem, setReturnModalItem] = useState(null);

  const fetchData = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      window.location.href = '/login';
      return;
    }
    setUser(storedUser);
    setIsLoading(true);

    try {
      const response = await api.get('/rentals/my-loans');
      setLoans(response.data);
    } catch (err) {
      console.error("Error fetching user data", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculates estimated fines for currently overdue active rentals
  const totalEstimatedFines = loans.reduce((total, loan) => {
    const now = new Date();
    const due = new Date(loan.DueDate);
    if (now > due) {
      const diffTime = Math.abs(now - due);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return total + (diffDays * (loan.ItemID?.overdueFeeRate || 15));
    }
    return total;
  }, 0);

  // Time Remaining Helper Function
  const getTimeRemainingStr = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffHours = Math.floor((due - now) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (now > due) {
      const overdueDays = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
      return `${overdueDays} day(s) OVERDUE`;
    }

    if (diffDays > 0) {
      return `${diffDays} day(s) and ${diffHours % 24} hour(s) left`;
    }
    return `${diffHours} hour(s) left`;
  };

  if (isLoading) {
    return <main className="main-layout" style={{ textAlign: "center", padding: "4rem" }}><h2>Loading Dashboard...</h2></main>;
  }

  if (!user) {
    return <main className="main-layout" style={{ textAlign: "center", padding: "4rem" }}><h2>Error loading user profile. Try logging in again.</h2></main>;
  }

  return (
    <main className="main-layout">
      
      {/* HEADER SECTION */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Welcome, {user.name}!</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Student Email: {user.email}</p>
          {user.StudentIdNumber && (
             <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>UCF ID: {user.StudentIdNumber}</p>
          )}
        </div>

        {/* CONDITIONAL FEES DISPLAY */}
        {totalEstimatedFines > 0 && (
          <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error-color)', padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={32} color="var(--error-color)" />
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--error-color)' }}>Estimated Outstanding Fines</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--error-color)' }}>${totalEstimatedFines.toFixed(2)}</strong>
            </div>
          </div>
        )}
      </div>

      <section>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
          <Package size={24} /> My Active Rentals
        </h2>
        
        {loans.length === 0 ? (
          <div className="tech-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
            <h3>You do not currently have any devices checked out.</h3>
          </div>
        ) : (
          <div className="inventory-grid">
            {loans.map(loan => {
              const device = loan.ItemID; 
              const dueDateObj = new Date(loan.DueDate);
              const dueDateStr = dueDateObj.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              });
              const isOverdue = new Date() > dueDateObj;

              return (
                <article className="tech-card" key={loan._id}>
                  {
                    loan.Status === 'reserved' && (
                      <div style={{ background: 'var(--ucf-gold)', color: '#000', textAlign: 'center', padding: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        RESERVED AWAITING PICKUP
                      </div>
                    )
                  }

                  <div className="card-image-wrapper" style={{ height: '140px' }}>
                    <img src={device?.image || 'https://via.placeholder.com/150'} alt={device?.name} className="card-image" />
                  </div>
                  <div className="card-content">
                    <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {device?.name || 'Unknown Device'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'monospace' }}>
                      SN: {device?.serialNumber || 'N/A'}
                    </p>
                    
                    {loan.Status === 'reserved' ? (
                      <>
                        <div className="status-indicator warning" style={{ marginBottom: '1rem', display: 'inline-flex', padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
                          <Clock size={16} /> 
                          <span>Expires: {getTimeRemainingStr(loan.DueDate)}</span>
                        </div>
                        <button 
                          onClick={async () => {
                            if (window.confirm('Cancel this reservation?')) {
                              await api.post('/rentals/cancel-reservation', { transactionId: loan._id });
                              fetchData();
                            }
                          }}
                          className="btn-cancel" style={{ width: '100%' }}
                        >
                          Cancel Reservation
                        </button>
                      </>
                    ) : (
                      <>
                        <div className={`status-indicator ${isOverdue ? 'error' : 'warning'}`} style={{ marginBottom: '1rem', display: 'inline-flex', padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
                          <CalendarClock size={16} /> 
                          <span>{isOverdue ? 'OVERDUE: ' : 'Due: '} {dueDateStr}</span>
                        </div>
                        <button 
                          onClick={() => setReturnModalItem(loan)}
                          className="btn-nav-outline" 
                          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', color: 'var(--text-main)', borderColor: 'var(--text-main)' }}
                        >
                          <Info size={18} /> How to Return
                        </button>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ======================= RETURN INSTRUCTIONS MODAL ======================= */}
      {returnModalItem && (
        <div className="modal-backdrop" onClick={() => setReturnModalItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Return Instructions</h2>
              <button onClick={() => setReturnModalItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}><X size={24} /></button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img src={returnModalItem.ItemID?.image} alt="Device" style={{ height: '100px', objectFit: 'contain', marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{returnModalItem.ItemID?.name}</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SN: {returnModalItem.ItemID?.serialNumber}</span>
            </div>

            <div className="modal-info-box" style={{ marginTop: 0 }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <MapPin size={24} color="var(--ucf-gold)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Where to return:</strong>
                  <span>Please bring this device in-person to the Circulation Desk located at <strong>{returnModalItem.ItemID?.location || 'the main library'}</strong>.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <Clock size={24} color={new Date() > new Date(returnModalItem.DueDate) ? 'var(--error-color)' : 'var(--ucf-gold)'} style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Time Remaining:</strong>
                  <span style={{ color: new Date() > new Date(returnModalItem.DueDate) ? 'var(--error-color)' : 'var(--text-main)', fontWeight: new Date() > new Date(returnModalItem.DueDate) ? 'bold' : 'normal' }}>
                    {getTimeRemainingStr(returnModalItem.DueDate)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <AlertCircle size={24} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Staff Approval Required:</strong>
                  <span>A librarian must physically inspect the device for damages before it is removed from your account.</span>
                </div>
              </div>
            </div>

            <button onClick={() => setReturnModalItem(null)} className="btn-primary" style={{ width: '100%' }}>
              I Understand
            </button>

          </div>
        </div>
      )}

    </main>
  );
}