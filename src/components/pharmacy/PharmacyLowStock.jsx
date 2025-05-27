import React, { useEffect, useState } from "react";
import Headerpowner from "../common/header/Headerpowner";

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
  borderRadius: "10px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  marginTop: 24,
};
 
const thStyle = {
  background: "#ff4d4f",
  color: "#fff",
  fontWeight: 700,
  padding: "12px 8px",
  borderBottom: "2px solid #eee",
};

const tdStyle = {
  padding: "10px 8px",
  borderBottom: "1px solid #f0f0f0",
  textAlign: "center",
  fontSize: 15,
};

const badgeStyle = (quantity) => ({
  display: "inline-block",
  minWidth: 32,
  padding: "2px 10px",
  borderRadius: 12,
  background: "#ff4d4f",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
});

function PharmacyLowStock() {
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStock = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;
      const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      fetch(`${API_URL}/api/pharmacies/owner/${user.id}`)
        .then(res => res.json())
        .then(data => {
          // Show items with quantity < 100
          const low = (data?.stock || []).filter(item => item.quantity !== undefined && item.quantity < 100);
          setLowStock(low);
          setLoading(false);
        });
    };
    fetchLowStock();
    window.addEventListener("stock-updated", fetchLowStock);
    return () => window.removeEventListener("stock-updated", fetchLowStock);
  }, []);

  return (
    <>
      <Headerpowner />
      <div style={{
        padding: 24,
        maxWidth: 700,
        margin: "0 auto",
        background: "#f8f8f8",
        minHeight: "80vh",
        borderRadius: 12,
      }}>
        <h2 style={{ color: "#ff4d4f", fontWeight: 700, marginBottom: 8 }}>
          <span role="img" aria-label="alert">⚠️</span> Low Stock Alerts
        </h2>
        <p style={{ color: "#888", marginBottom: 18, fontSize: 15 }}>
          The following medicines have less than <b>100</b> units in stock. Please restock soon.
        </p>
        {loading ? (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <span style={{ fontSize: 18, color: "#888" }}>Loading...</span>
          </div>
        ) : lowStock.length === 0 ? (
          <div style={{
            textAlign: "center",
            marginTop: 40,
            color: "#52c41a",
            fontWeight: 600,
            fontSize: 18,
            background: "#eaffea",
            borderRadius: 8,
            padding: "18px 0"
          }}>
            All medicines are sufficiently stocked!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Medicine Name</th>
                  <th style={thStyle}>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{item.medicineName}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(item.quantity)}>
                        {item.quantity} <span style={{ marginLeft: 6, fontSize: 14 }}>⚠️</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default PharmacyLowStock;
