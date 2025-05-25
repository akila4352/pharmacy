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
  background: "#f7c815",
  color: "#222",
  fontWeight: 700,
  padding: "12px 8px",
  borderBottom: "2px solid #eee",
};

const tdStyle = {
  padding: "10px 8px",
  borderBottom: "1px solid #f0f0f0",
  textAlign: "center",
};

const badgeStyle = (quantity) => ({
  display: "inline-block",
  minWidth: 32,
  padding: "2px 10px",
  borderRadius: 12,
  background: quantity < 100 ? "#ff4d4f" : "#52c41a",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
});

const availableStyle = (isAvailable) => ({
  color: isAvailable ? "#52c41a" : "#ff4d4f",
  fontWeight: 600,
});

function PharmacyStock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStock = () => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;
    fetch(`http://localhost:5000/api/pharmacies/owner/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setStock(data?.stock || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStock();
    // Listen for stock updates from AddPharmacy
    const handler = () => fetchStock();
    window.addEventListener("stock-updated", handler);
    return () => window.removeEventListener("stock-updated", handler);
  }, []);

  return (
    <>
      <Headerpowner />
      <div style={{
        padding: 24,
        maxWidth: 900,
        margin: "0 auto",
        background: "#f8f8f8",
        minHeight: "90vh",
        borderRadius: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, color: "#222", fontWeight: 700 }}>My Pharmacy Stock</h2>
          <button
            onClick={fetchStock}
            style={{
              background: "#f7c815",
              color: "#222",
              border: "none",
              borderRadius: 8,
              padding: "8px 18px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            Refresh
          </button>
        </div>
        <p style={{ color: "#888", marginTop: 4, marginBottom: 16, fontSize: 15 }}>
          View and monitor your current pharmacy stock. Low stock items (less than 100) are highlighted.
        </p>
        {loading ? (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <span style={{ fontSize: 18, color: "#888" }}>Loading...</span>
          </div>
        ) : stock.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 40, color: "#888" }}>
            No stock found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Medicine Name</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Quantity</th>
                  <th style={thStyle}>Available</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{item.medicineName}</td>
                    <td style={tdStyle}>Rs. {item.price}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(item.quantity ?? 0)}>
                        {item.quantity ?? 0}
                        {item.quantity < 100 && (
                          <span style={{ marginLeft: 6, fontSize: 14 }} title="Low stock">⚠️</span>
                        )}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={availableStyle(item.isAvailable)}>
                        {item.isAvailable ? "Available" : "Not Available"}
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

export default PharmacyStock;
