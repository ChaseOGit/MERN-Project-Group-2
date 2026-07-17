import { useState, useEffect } from 'react';
import { Package, Clock, RefreshCcw, CalendarClock } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]); // 🚀 NEW: Store the Transactions
  const [isLoading, setIsLoading] = useState(true);

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
      //  Fetch from Transactions endpoint
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

  const handleReturn = async (deviceId) => {
    try {
      const response = await api.post('/rentals/return', {
        deviceId: deviceId
      });
      
      alert(response.data.message); 
      fetchData(); // Refresh the active loans
    } catch (error) {
      alert(error.response?.data?.message || "Failed to return device");
    }
  };

  if (isLoading) {
    return <main className="main-layout" style={{ textAlign: "center", padding: "4rem" }}><h2>Loading Dashboard...</h2></main>;
  }

  if (!user) {
    return <main className="main-layout" style={{ textAlign: "center", padding: "4rem" }}><h2>Error loading user profile. Try logging in again.</h2></main>;
  }

  return (
    <main className="main-layout">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Welcome, {user.name}!</h1>
        <p style={{ color: 'var(--text-muted)' }}>Student Email: {user.email}</p>
        {user.StudentIdNumber && (
           <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>UCF ID: {user.StudentIdNumber}</p>
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
              // Extract the nested Device item from the Transaction object
              const device = loan.ItemID; 
              
              // Format the Due Date nicely!
              const dueDate = new Date(loan.DueDate).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              });

              // Check if it is overdue
              const isOverdue = new Date() > new Date(loan.DueDate);

              return (
                <article className="tech-card" key={loan._id}>
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
                    
                    {/* 🚀 NEW: Showing the exact Due Date from the Transaction! */}
                    <div className={`status-indicator ${isOverdue ? 'error' : 'warning'}`} style={{ marginBottom: '1rem', display: 'inline-flex', padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
                      <CalendarClock size={16} /> 
                      <span>{isOverdue ? 'OVERDUE: ' : 'Due: '} {dueDate}</span>
                    </div>

                    <button 
                      onClick={() => handleReturn(device._id)}
                      className="btn-primary" 
                      style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                    >
                      <RefreshCcw size={18} /> Return Device
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  );
}