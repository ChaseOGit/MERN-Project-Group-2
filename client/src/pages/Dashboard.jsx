import { useState, useEffect } from 'react';
import { Package, Clock, RefreshCcw } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);
    api.get(`/users/${storedUser._id}`)
      .then(res => {
        setUser(res.data.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching user data", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleReturn = async (deviceId) => {
    try {
      const response = await api.post('/rentals/return', {
        deviceId: deviceId,
        userId: user._id
      });
      
      alert(response.data.message); 
      fetchUserData(); 
    } catch (error) {
      alert(error.response?.data?.message || "Failed to return device");
    }
  };

  //  Wait for the user to load before rendering the page
  if (isLoading) {
    return <main className="main-layout" style={{ textAlign: "center", padding: "4rem" }}><h2>Loading Dashboard...</h2></main>;
  }

  // If user failed to fetch, show an error
  if (!user) {
    return <main className="main-layout" style={{ textAlign: "center", padding: "4rem" }}><h2>Error loading user profile. Try logging in again.</h2></main>;
  }

  return (
    <main className="main-layout">
      <div style={{ marginBottom: '2rem' }}>
        {/* FIXED: Changed user.username to user.name to match teammate's schema! */}
        <h1 style={{ marginBottom: '0.5rem' }}>Welcome, {user.name}!</h1>
        <p style={{ color: 'var(--text-muted)' }}>Student Email: {user.email}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>UCF ID: {user.StudentIdNumber}</p>
      </div>

      <section>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={24} /> My Active Rentals
        </h2>
        
        {/* Check if activeRentals array is empty */}
        {!user.activeRentals || user.activeRentals.length === 0 ? (
          <div className="tech-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            You do not currently have any devices checked out.
          </div>
        ) : (
          <div className="inventory-grid">
            {user.activeRentals.map(device => (
              <article className="tech-card" key={device._id}>
                <div className="card-image-wrapper" style={{ height: '120px' }}>
                  <img src={device.image} alt={device.name} className="card-image" />
                </div>
                <div className="card-content">
                  <h3 className="card-title" style={{ fontSize: '1rem' }}>{device.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Serial: {device.serialNumber}
                  </p>
                  
                  <div className="status-indicator error" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
                    <Clock size={16} /> Due in: {device.loanPeriod}
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
            ))}
          </div>
        )}
      </section>
    </main>
  );
}