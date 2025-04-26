// src/components/ModernPharmacyDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import components from your existing structure
import HeaderAdmin from "../common/header/HeaderAdmin";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const customMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Location marker component for map
const LocationMarker = ({ setSelectedLocation }) => {
  useMapEvents({
    click(e) {
      setSelectedLocation(e.latlng);
    },
  });
  return null;
};

const PharmacyDashboard = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [showNotification, setShowNotification] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pharmacies, setPharmacies] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState({
    totalPharmacies: 0,
    totalMedicines: 0,
    availableMedicines: 0,
  });

  const defaultCenter = { lat: 6.0825, lng: 80.2973 };

  useEffect(() => {
    // Update statistics whenever pharmacies change
    setStats({
      totalPharmacies: pharmacies.length,
      totalMedicines: new Set(pharmacies.map(p => p.medicineName)).size,
      availableMedicines: pharmacies.filter(p => p.isAvailable).length,
    });
  }, [pharmacies]);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      showMessage("Please select a location on the map.", "error");
      return;
    }
    try {
      const res = await fetch(
        `${API_URL}/api/pharmacies/search?latitude=${selectedLocation.lat}&longitude=${selectedLocation.lng}&medicineName=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPharmacies(data);
      if (data.length === 0) showMessage("No pharmacies found.", "info");
      else showMessage(`Found ${data.length} pharmacies`, "success");
    } catch (err) {
      showMessage(`Error: ${err.message}`, "error");
    }
  };

  const handleEditClick = (ph) => {
    setEditId(ph._id);
    setEditData({
      name: ph.name,
      address: ph.address,
      medicineName: ph.medicineName,
      price: ph.price,
      isAvailable: String(ph.isAvailable),
      latitude: ph.location.coordinates[1],
      longitude: ph.location.coordinates[0],
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const body = {
        name: editData.name,
        address: editData.address,
        medicineName: editData.medicineName,
        price: parseFloat(editData.price),
        isAvailable: editData.isAvailable === "true",
        location: {
          type: "Point",
          coordinates: [parseFloat(editData.longitude), parseFloat(editData.latitude)],
        },
      };
      const res = await fetch(`${API_URL}/api/pharmacies/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setPharmacies((prev) =>
        prev.map((p) => (p._id === editId ? updated : p))
      );
      showMessage("Pharmacy updated successfully.", "success");
      setEditId(null);
      setShowEditModal(false);
    } catch (err) {
      showMessage(`Error: ${err.message}`, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this pharmacy?")) return;
    
    try {
      const res = await fetch(`${API_URL}/api/pharmacies/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      setPharmacies((prev) => prev.filter((p) => p._id !== id));
      showMessage("Pharmacy deleted successfully.", "success");
    } catch (err) {
      showMessage(`Error: ${err.message}`, "error");
    }
  };

  return (
    <div>
      <HeaderAdmin />
      <div className="dashboard-container">
        <h2 className="dashboard-title">Pharmacy Medicine Management</h2>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <div className="stat-value">{stats.totalPharmacies}</div>
            <div className="stat-label">Total Pharmacies</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💊</div>
            <div className="stat-value">{stats.totalMedicines}</div>
            <div className="stat-label">Unique Medicines</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.availableMedicines}</div>
            <div className="stat-label">Available Medicines</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Search for Medicines</h3>
          </div>
          <div className="card-body">
            <form className="search-form" onSubmit={handleSearch}>
              <div className="form-group">
                <label htmlFor="medicine-search">Medicine Name</label>
                <input
                  id="medicine-search"
                  type="text"
                  placeholder="Enter medicine name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="search-button">
                <span className="search-icon">🔍</span> Search
              </button>
            </form>

            <div className="map-container">
              <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                />
                <LocationMarker setSelectedLocation={setSelectedLocation} />
                {selectedLocation && (
                  <Marker position={selectedLocation} icon={customMarkerIcon} />
                )}
                {pharmacies.map((pharmacy) => (
                  <Marker
                    key={pharmacy._id}
                    position={{
                      lat: pharmacy.location.coordinates[1],
                      lng: pharmacy.location.coordinates[0],
                    }}
                    icon={customMarkerIcon}
                  />
                ))}
              </MapContainer>
            </div>
            
            <div className="location-info">
              {selectedLocation 
                ? `Selected Location: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}` 
                : "Click on the map to select a location"}
            </div>
          </div>
        </div>

        {pharmacies.length > 0 && (
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Search Results ({pharmacies.length} pharmacies)</h3>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="pharmacy-table">
                  <thead>
                    <tr>
                      <th>Actions</th>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Medicine</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pharmacies.map((pharmacy) => (
                      <tr key={pharmacy._id}>
                        <td className="action-buttons">
                          <button 
                            className="edit-button" 
                            onClick={() => handleEditClick(pharmacy)}
                            aria-label="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="delete-button" 
                            onClick={() => handleDelete(pharmacy._id)}
                            aria-label="Delete"
                          >
                            🗑️
                          </button>
                        </td>
                        <td>{pharmacy.name}</td>
                        <td>{pharmacy.address}</td>
                        <td>{pharmacy.medicineName}</td>
                        <td>${pharmacy.price.toFixed(2)}</td>
                        <td>
                          <span className={pharmacy.isAvailable ? "status-available" : "status-unavailable"}>
                            {pharmacy.isAvailable ? "Available" : "Not Available"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Edit Pharmacy Details</h3>
                <button className="close-button" onClick={() => setShowEditModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-name">Pharmacy Name</label>
                    <input
                      id="edit-name"
                      name="name"
                      type="text"
                      value={editData.name || ""}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-medicine">Medicine Name</label>
                    <input
                      id="edit-medicine"
                      name="medicineName"
                      type="text"
                      value={editData.medicineName || ""}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-address">Address</label>
                  <input
                    id="edit-address"
                    name="address"
                    type="text"
                    value={editData.address || ""}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-price">Price ($)</label>
                    <input
                      id="edit-price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={editData.price || ""}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-status">Availability Status</label>
                    <select
                      id="edit-status"
                      name="isAvailable"
                      value={editData.isAvailable || ""}
                      onChange={handleEditChange}
                    >
                      <option value="true">Available</option>
                      <option value="false">Not Available</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-lat">Latitude</label>
                    <input
                      id="edit-lat"
                      name="latitude"
                      type="number"
                      step="0.000001"
                      value={editData.latitude || ""}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-lng">Longitude</label>
                    <input
                      id="edit-lng"
                      name="longitude"
                      type="number"
                      step="0.000001"
                      value={editData.longitude || ""}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-button" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="save-button" 
                  onClick={handleSave}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {showNotification && (
          <div className={`notification ${messageType}`}>
            {message}
          </div>
        )}
      </div>
      
      {/* CSS Styles */}
      <style jsx>{`
        .dashboard-container {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .dashboard-title {
          font-size: 28px;
          margin-bottom: 24px;
          color: #2c3e50;
        }
        
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          background-color: #fff;
          border-radius: 10px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
        }
        
        .stat-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #3498db;
        }
        
        .stat-label {
          color: #7f8c8d;
          font-size: 14px;
          margin-top: 8px;
        }
        
        .dashboard-card {
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
          overflow: hidden;
        }
        
        .card-header {
          background-color: #3498db;
          color: white;
          padding: 16px 24px;
        }
        
        .card-header h3 {
          margin: 0;
          font-size: 18px;
        }
        
        .card-body {
          padding: 24px;
        }
        
        .search-form {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .form-group {
          flex: 1;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #34495e;
        }
        
        .form-group input, .form-group select {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
        }
        
        .search-button {
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 12px 24px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s;
        }
        
        .search-button:hover {
          background-color: #2980b9;
        }
        
        .map-container {
          height: 400px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .location-info {
          margin-top: 12px;
          font-size: 14px;
          color: #7f8c8d;
        }
        
        .table-responsive {
          overflow-x: auto;
        }
        
        .pharmacy-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .pharmacy-table th,
        .pharmacy-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .pharmacy-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #34495e;
        }
        
        .pharmacy-table tr:hover {
          background-color: #f8f9fa;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .edit-button, .delete-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .edit-button:hover {
          background-color: #f0f0f0;
        }
        
        .delete-button:hover {
          background-color: #ffecec;
        }
        
        .status-available {
          color: #27ae60;
          font-weight: bold;
        }
        
        .status-unavailable {
          color: #e74c3c;
          font-weight: bold;
        }
        
        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 10px;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #eee;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #2c3e50;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #7f8c8d;
        }
        
        .modal-body {
          padding: 24px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding: 16px 24px;
          border-top: 1px solid #eee;
        }
        
        .cancel-button {
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 16px;
        }
        
        .save-button {
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 16px;
        }
        
        .save-button:hover {
          background-color: #2980b9;
        }
        
        /* Notification Toast */
        .notification {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 16px 24px;
          border-radius: 6px;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1001;
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .success {
          background-color: #27ae60;
        }
        
        .error {
          background-color: #e74c3c;
        }
        
        .info {
          background-color: #3498db;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .search-form {
            flex-direction: column;
            align-items: stretch;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .stats-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PharmacyDashboard;