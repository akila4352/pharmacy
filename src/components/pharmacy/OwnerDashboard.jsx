import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Headerpowner from '../common/header/Headerpowner';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const OwnerDashboard = () => {
  const [medicineStats, setMedicineStats] = useState([]);
  const [salesData, setSalesData] = useState({});
  const [demandData, setDemandData] = useState({});
  const [stockData, setStockData] = useState({});
  const [mostSearched, setMostSearched] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
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
        { id: 1, name: 'Paracetamol', stock: 150, price: 5.99, sales: 42, searchCount: 89, trend: 'up' },
        { id: 2, name: 'Amoxicillin', stock: 32, price: 12.50, sales: 18, searchCount: 76, trend: 'up' },
        { id: 3, name: 'Omeprazole', stock: 85, price: 8.75, sales: 24, searchCount: 45, trend: 'down' },
        { id: 4, name: 'Metformin', stock: 12, price: 15.25, sales: 9, searchCount: 34, trend: 'stable' },
        { id: 5, name: 'Atorvastatin', stock: 48, price: 22.99, sales: 15, searchCount: 29, trend: 'up' },
        { id: 6, name: 'Amlodipine', stock: 8, price: 18.50, sales: 14, searchCount: 22, trend: 'down' },
        { id: 7, name: 'Lisinopril', stock: 74, price: 9.99, sales: 20, searchCount: 18, trend: 'stable' },
        { id: 8, name: 'Azithromycin', stock: 25, price: 24.99, sales: 12, searchCount: 13, trend: 'down' }
      ];
      
      setMedicineStats(medicines);
      setLowStockItems(medicines.filter(med => med.stock < 30));
      
      // Sort by search count to get most searched medicines
      setMostSearched([...medicines].sort((a, b) => b.searchCount - a.searchCount).slice(0, 5));
      
      // Generate chart data based on the selected period
      const labels = generateTimeLabels();
      
      // Sales data - weekly or monthly pattern
      setSalesData({
        labels,
        datasets: [
          {
            label: 'Sales Volume',
            data: generateRandomData(labels.length, 10, 50),
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
      });
      
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
      
      // Stock level data
      setStockData({
        labels: medicines.map(m => m.name),
        datasets: [
          {
            label: 'Current Stock',
            data: medicines.map(m => m.stock),
            backgroundColor: medicines.map(m => 
              m.stock < 30 ? 'rgba(255, 99, 132, 0.7)' : 
              m.stock < 80 ? 'rgba(255, 206, 86, 0.7)' : 
              'rgba(75, 192, 192, 0.7)'
            ),
          },
        ],
      });
      
      setLoading(false);
    }, 1000);
  };
  
  // Helper function to generate period labels based on selected period
  const generateTimeLabels = () => {
    if (period === 'week') {
      return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    } else if (period === 'month') {
      return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    } else {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
  };
  
  // Helper function to generate random data for demo purposes
  const generateRandomData = (length, min, max) => {
    return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
  };
  
  // Chart options
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Sales Trends (${period})`,
      },
    },
  };
  
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Stock Levels',
      },
    },
  };
  
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
          Pharmacy Owner Analytics Dashboard
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
            
            {/* Quick Info Cards */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
              gap: "20px",
              marginBottom: "30px" 
            }}>
              <InfoCard 
                title="Total Medicines" 
                value={medicineStats.length} 
                icon="💊"
                color="#4CAF50"
              />
              <InfoCard 
                title="Low Stock Items" 
                value={lowStockItems.length} 
                icon="⚠️"
                color="#FF9800"
              />
              <InfoCard 
                title="Total Sales" 
                value={`$${medicineStats.reduce((sum, med) => sum + (med.sales * med.price), 0).toFixed(2)}`} 
                icon="💰"
                color="#2196F3"
              />
              <InfoCard 
                title="Medicine Searches" 
                value={medicineStats.reduce((sum, med) => sum + med.searchCount, 0)} 
                icon="🔍"
                color="#9C27B0"
              />
            </div>
            
            {/* Charts Section */}
            <div style={{ marginBottom: "30px" }}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", 
                gap: "20px"
              }}>
                {/* Sales Trends Chart */}
                <div className="chart-container" style={{ 
                  backgroundColor: "white", 
                  borderRadius: "8px", 
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  padding: "20px"
                }}>
                  <h3 style={{ marginBottom: "15px", color: "#333" }}>Sales Patterns</h3>
                  <Line options={lineOptions} data={salesData} />
                </div>
                
                {/* Stock Levels Chart */}
                <div className="chart-container" style={{ 
                  backgroundColor: "white", 
                  borderRadius: "8px", 
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  padding: "20px"
                }}>
                  <h3 style={{ marginBottom: "15px", color: "#333" }}>Stock Levels</h3>
                  <Bar options={barOptions} data={stockData} />
                </div>
              </div>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", 
                gap: "20px",
                marginTop: "20px"
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
            </div>
            
            {/* Inventory Alert Section */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              padding: "20px",
              marginBottom: "30px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ margin: 0, color: "#333" }}>Low Stock Alerts</h3>
                <span style={{ 
                  backgroundColor: "#ff5722", 
                  color: "white", 
                  padding: "4px 12px", 
                  borderRadius: "16px",
                  fontSize: "14px"
                }}>
                  {lowStockItems.length} items need attention
                </span>
              </div>
              
              {lowStockItems.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #eee" }}>
                      <th style={{ textAlign: "left", padding: "10px" }}>Medicine</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Current Stock</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Price</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((medicine) => (
                      <tr key={medicine.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{medicine.name}</td>
                        <td style={{ 
                          textAlign: "center", 
                          padding: "10px",
                          color: medicine.stock < 10 ? "#d32f2f" : "#f57c00",
                          fontWeight: medicine.stock < 10 ? "bold" : "normal"
                        }}>
                          {medicine.stock}
                        </td>
                        <td style={{ textAlign: "center", padding: "10px" }}>${medicine.price.toFixed(2)}</td>
                        <td style={{ textAlign: "center", padding: "10px" }}>
                          <button style={{
                            backgroundColor: "#2196F3",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            cursor: "pointer"
                          }}>
                            Restock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: "center", color: "#666" }}>No low stock items at the moment!</p>
              )}
            </div>
            
            {/* Medicine Data Table */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              padding: "20px"
            }}>
              <h3 style={{ marginBottom: "15px", color: "#333" }}>Medicine Inventory</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #eee" }}>
                      <th style={{ textAlign: "left", padding: "10px" }}>Medicine</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Stock</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Price</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Sales</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Search Count</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicineStats.map((medicine) => (
                      <tr key={medicine.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{medicine.name}</td>
                        <td style={{ 
                          textAlign: "center", 
                          padding: "10px",
                          backgroundColor: medicine.stock < 10 ? "#ffebee" : 
                                          medicine.stock < 30 ? "#fff8e1" : "transparent"
                        }}>
                          {medicine.stock}
                        </td>
                        <td style={{ textAlign: "center", padding: "10px" }}>${medicine.price.toFixed(2)}</td>
                        <td style={{ textAlign: "center", padding: "10px" }}>{medicine.sales}</td>
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

// Info Card Component
const InfoCard = ({ title, value, icon, color }) => {
  return (
    <div style={{ 
      backgroundColor: "white", 
      borderRadius: "8px", 
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      padding: "20px",
      display: "flex",
      alignItems: "center",
      gap: "15px"
    }}>
      <div style={{ 
        backgroundColor: `${color}20`, // Add transparency to color
        color: color,
        width: "60px",
        height: "60px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px"
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>{value}</h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>{title}</p>
      </div>
    </div>
  );
};

export default OwnerDashboard;
