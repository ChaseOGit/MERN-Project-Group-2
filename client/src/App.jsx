import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState("Loading...");

  // Fulfills your AJAX [async enabled] requirement
  const fetchStatus = async () => {
    try {
      // Calling your Express API endpoint
      const response = await axios.get('http://localhost:5000/api/status');
      setApiStatus(response.data.message); // response.data is returned as JSON
    } catch (error) {
      console.error("Error fetching the API status:", error);
      setApiStatus("Failed to connect to API");
    }
  };

  // The useEffect hook runs when the web page loads
  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="App">
      <h1>MERN Project - Group 2</h1>
      <div className="card">
        <h2>Backend Connection Status:</h2>
        <p>{apiStatus}</p>
      </div>
    </div>
  );
}

export default App;