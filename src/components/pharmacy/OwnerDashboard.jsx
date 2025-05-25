import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Headerpowner from '../common/header/Headerpowner';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const OwnerDashboard = () => {
  const [medicineStats, setMedicineStats] = useState([]);
  const [demandData, setDemandData] = useState({});
  const [mostSearched, setMostSearched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    // In a real implementation, these would be API calls
    fetchDashboardData();
  }, [period]);
    const fetchDashboardData = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Sample data - in a real app, this would come from your API
      const medicines = [
        { id: 1, name: 'Paracetamol', searchCount: 89, trend: 'up' },
        { id: 2, name: 'Amoxicillin', searchCount: 76, trend: 'up' },
        { id: 3, name: 'Omeprazole', searchCount: 45, trend: 'down' },
        { id: 4, name: 'Metformin', searchCount: 34, trend: 'stable' },
        { id: 5, name: 'Atorvastatin', searchCount: 29, trend: 'up' },
        { id: 6, name: 'Amlodipine', searchCount: 22, trend: 'down' },
        { id: 7, name: 'Lisinopril', searchCount: 18, trend: 'stable' },
        { id: 8, name: 'Azithromycin', searchCount: 13, trend: 'down' }
      ];
      
      setMedicineStats(medicines);
      
      // Sort by search count to get most searched medicines
      setMostSearched([...medicines].sort((a, b) => b.searchCount - a.searchCount).slice(0, 5));
      
      // Medicine demand data
      setDemandData({
        labels: medicines.slice(0, 6).map(m => m.name),
        datasets: [
          {
            label: 'Search Count',
            data: medicines.slice(0, 6).map(m => m.searchCount),
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      });
      
      setLoading(false);
    }, 1000);
  };
    // No longer need time labels or random data generation
    // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Medicine Demand (Search Volume)',
      },
    },
  };
  return (
    <div>
      <Headerpowner />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <h1 style={{ marginBottom: "20px", color: "#333", textAlign: "center" }}>
          Medicine Demand Dashboard
        </h1>
        
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="spinner" style={{
              border: '4px solid rgba(0, 0, 0, 0.1)',
              borderLeft: '4px solid #3498db',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px',
            }}></div>
            <style>
              {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Time period selector */}
            <div style={{ 
              display: "flex", 
              justifyContent: "flex-end", 
              marginBottom: "20px",
              gap: "10px"
            }}>
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  cursor: "pointer"
                }}
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
              
              <button 
                onClick={() => fetchDashboardData()}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Refresh Data
              </button>
            </div>
            
            {/* Main Content - Two Panels Side by Side */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", 
              gap: "20px"
            }}>
              {/* Medicine Demand Chart */}
              <div className="chart-container" style={{ 
                backgroundColor: "white", 
                borderRadius: "8px", 
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                padding: "20px"
              }}>
                <h3 style={{ marginBottom: "15px", color: "#333" }}>Medicine Demand</h3>
                <Pie options={pieOptions} data={demandData} />
              </div>
              
              {/* Most Searched Medicines */}
              <div className="chart-container" style={{ 
                backgroundColor: "white", 
                borderRadius: "8px", 
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                padding: "20px"
              }}>
                <h3 style={{ marginBottom: "15px", color: "#333" }}>
                  Most Searched Medicines (Last Week)
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #eee" }}>
                      <th style={{ textAlign: "left", padding: "10px" }}>Medicine</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Search Count</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostSearched.map((medicine) => (
                      <tr key={medicine.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{medicine.name}</td>
                        <td style={{ textAlign: "center", padding: "10px" }}>{medicine.searchCount}</td>
                        <td style={{ textAlign: "center", padding: "10px" }}>
                          {medicine.trend === 'up' ? 
                            <span style={{ color: "green" }}>▲</span> : 
                            medicine.trend === 'down' ? 
                            <span style={{ color: "red" }}>▼</span> : 
                            <span style={{ color: "gray" }}>◆</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Removed InfoCard component as it's no longer used

export default OwnerDashboard;
