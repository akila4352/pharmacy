import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import HeaderAdmin from "../common/header/HeaderAdmin";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Define pharmacy marker icon
const pharmacyMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const PharmacyDashboard = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [showNotification, setShowNotification] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [users, setUsers] = useState([]);
  const [pharmacyOwners, setPharmacyOwners] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [showPharmacyDetails, setShowPharmacyDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [stats, setStats] = useState({
    totalPharmacies: 0,
    availableMedicines: 0,
    totalUsers: 0,
    totalOwners: 0,
  });
  const [selectedPharmacyGroup, setSelectedPharmacyGroup] = useState(null);
  const [showStockDetails, setShowStockDetails] = useState(false);
  const [editStock, setEditStock] = useState(null); // Track the medicine being edited
  const [mapLocation, setMapLocation] = useState(null); // Track location for the map modal
  const [ownerDetails, setOwnerDetails] = useState(null); // Track owner details

  const defaultCenter = { lat: 6.0535, lng: 80.2210 };

  useEffect(() => {
    // Fetch all data when component mounts
    fetchUsers();
    fetchPharmacyOwners();
    fetchAllPharmacies();
  }, []);

  useEffect(() => {
    // Update statistics whenever data changes
    // Calculate available medicines from all pharmacies' stock
    let availableMedicinesCount = 0;
    pharmacies.forEach(pharmacy => {
      if (Array.isArray(pharmacy.stock)) {
        availableMedicinesCount += pharmacy.stock.filter(item => item.isAvailable).length;
      }
    });
    setStats({
      totalPharmacies: pharmacies.length,
      // totalMedicines removed
      availableMedicines: availableMedicinesCount,
      totalUsers: users.length,
      totalOwners: pharmacyOwners.length,
    });
  }, [pharmacies, users, pharmacyOwners]);

  const fetchAllPharmacies = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pharmacies`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPharmacies(data);
    } catch (err) {
      showMessage(`Error fetching pharmacies: ${err.message}`, "error");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      showMessage(`Error fetching users: ${err.message}`, "error");
    }
  };

  const fetchPharmacyOwners = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/pharmacy-owners`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPharmacyOwners(data);
    } catch (err) {
      showMessage(`Error fetching pharmacy owners: ${err.message}`, "error");
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleEditClick = (ph) => {
    setEditId(ph._id);
    setEditData({
      name: ph.name,
      address: ph.address,
      medicineName: ph.medicineName,
      price: ph.price || 0,
      isAvailable: String(ph.isAvailable),
      latitude: ph.location?.coordinates?.[1] || 0,
      longitude: ph.location?.coordinates?.[0] || 0,
      ownerId: ph.ownerId || "",
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
        price: parseFloat(editData.price || 0),
        isAvailable: editData.isAvailable === "true",
        ownerId: editData.ownerId,
        location: {
          type: "Point",
          coordinates: [parseFloat(editData.longitude || 0), parseFloat(editData.latitude || 0)],
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
    if (!window.confirm("Are you sure you want to delete this pharmacy?")) return;
    
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

  const handleUserDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      setUsers((prev) => prev.filter((u) => u._id !== id));
      showMessage("User deleted successfully.", "success");
    } catch (err) {
      showMessage(`Error: ${err.message}`, "error");
    }
  };

  const handleUserStatusChange = async (userId, isActive) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      // Update local state to reflect the change
      setUsers(prev => 
        prev.map(user => user._id === userId ? {...user, isActive} : user)
      );
      
      showMessage(`User ${isActive ? 'activated' : 'deactivated'} successfully.`, "success");
    } catch (err) {
      showMessage(`Error: ${err.message}`, "error");
    }
  };

  const handleViewPharmacyDetails = async (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setShowPharmacyDetails(true);

    // Fetch owner details
    if (pharmacy.ownerId) {
      try {
        const res = await fetch(`${API_URL}/api/users/${pharmacy.ownerId}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setOwnerDetails(data);
      } catch (err) {
        showMessage(`Error fetching owner details: ${err.message}`, "error");
      }
    }
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleViewPharmacyGroup = (ownerId) => {
    const filteredPharmacies = pharmacies.filter((ph) => ph.ownerId?._id === ownerId);
    setSelectedPharmacyGroup(filteredPharmacies);
    setActiveTab("pharmacyGroup");
  };

  const handleBackToOwners = () => {
    setSelectedPharmacyGroup(null);
    setActiveTab("owners");
  };

  const handleViewDetails = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setShowStockDetails(true);
  };

  const handleCloseDetails = () => {
    setSelectedPharmacy(null);
    setShowStockDetails(false);
  };

  const handleShowStock = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setShowStockDetails(true);
  };

  const handleEditStock = (medicine) => {
    setEditStock({ ...medicine });
  };

  const handleStockChange = (e) => {
    const { name, value } = e.target;
    setEditStock((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateStock = async () => {
    try {
      const updatedStock = selectedPharmacy.stock.map((item) =>
        item.medicineName === editStock.medicineName ? editStock : item
      );

      const res = await fetch(`${API_URL}/api/pharmacies/${selectedPharmacy._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: updatedStock }),
      });

      if (!res.ok) throw new Error(await res.text());

      setSelectedPharmacy((prev) => ({ ...prev, stock: updatedStock }));
      setEditStock(null);
      showMessage("Stock updated successfully.", "success");
    } catch (err) {
      showMessage(`Error: ${err.message}`, "error");
    }
  };

  const handleDeleteStock = async (medicineName) => {
    try {
      const updatedStock = selectedPharmacy.stock.filter(
        (item) => item.medicineName !== medicineName
      );

      const res = await fetch(`${API_URL}/api/pharmacies/${selectedPharmacy._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: updatedStock }),
      });

      if (!res.ok) throw new Error(await res.text());

      setSelectedPharmacy((prev) => ({ ...prev, stock: updatedStock }));
      showMessage("Medicine deleted successfully.", "success");
    } catch (err) {
      showMessage(`Error: ${err.message}`, "error");
    }
  };

  const handleLocatePharmacy = (pharmacy) => {
    if (pharmacy.location?.coordinates?.length === 2) {
      setMapLocation({
        name: pharmacy.name,
        coordinates: pharmacy.location.coordinates,
      });
    } else {
      showMessage("Location data is not available for this pharmacy.", "error");
    }
  };

  // Safe formatter function
  const formatPrice = (price) => {
    return (price !== undefined && price !== null) ? Number(price).toFixed(2) : '0.00';
  };

  const handleFixAvailability = async () => {
    try {
        const res = await fetch(`${API_URL}/api/pharmacies/fix-availability`, {
            method: "PUT",
        });
        if (!res.ok) throw new Error(await res.text());
        showMessage("All pharmacies are now marked as available.", "success");
        fetchAllPharmacies();
    } catch (err) {
        showMessage(`Error: ${err.message}`, "error");
    }
};

  return (
    <div>
      <HeaderAdmin />
      <div className="dashboard-container">
        <h2 className="dashboard-title">Admin Dashboard</h2>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <div className="stat-value">{stats.totalPharmacies}</div>
            <div className="stat-label">Total Pharmacies</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.availableMedicines}</div>
            <div className="stat-label">Available Medicines</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏪</div>
            <div className="stat-value">{stats.totalOwners}</div>
            <div className="stat-label">Pharmacy Owners</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button 
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="tab-icon">🗺️</span>
            Pharmacy Map
          </button>
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="tab-icon">👤</span>
            Users
          </button>
          <button 
            className={`tab-button ${activeTab === 'owners' ? 'active' : ''}`}
            onClick={() => setActiveTab('owners')}
          >
            <span className="tab-icon">🏪</span>
            Pharmacy Owners
          </button>
        </div>

        {/* Pharmacy Map Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h3>All Registered Pharmacies</h3>
              <button 
                className="refresh-button"
                onClick={fetchAllPharmacies}
              >
                Refresh Data
              </button>
         
            </div>
            <div className="card-body">
              <div className="map-container">
                <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                  />
                  {pharmacies.map((pharmacy) => (
                    pharmacy?.location?.coordinates?.length === 2 && (
                      <Marker
                        key={pharmacy._id}
                        position={{
                          lat: pharmacy.location.coordinates[1],
                          lng: pharmacy.location.coordinates[0],
                        }}
                        icon={pharmacyMarkerIcon}
                      >
                        <Popup>
                          <div className="pharmacy-popup">
                            <h4>{pharmacy.name}</h4>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              </div>
              
              <div className="pharmacy-list">
                <h4>Registered Pharmacies</h4>
                <div className="pharmacy-list-container">
                  {pharmacies.map(pharmacy => (
                    <div 
                      key={pharmacy._id} 
                      className="pharmacy-list-item"
                      onClick={() => handleViewPharmacyDetails(pharmacy)}
                    >
                      <div className="pharmacy-list-name">{pharmacy.name}</div>
                      <div className="pharmacy-list-medicine">{pharmacy.medicineName}</div>
                      <span className="status-available">Available</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Registered Users</h3>
              <button 
                className="refresh-button"
                onClick={fetchUsers}
              >
                Refresh Users
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Joined Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>{user._id.substring(0, 8)}...</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.phone || "N/A"}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={user.isActive ? "status-active" : "status-inactive"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="action-buttons">
                          <button 
                            className={user.isActive ? "deactivate-button" : "activate-button"}
                            onClick={() => handleUserStatusChange(user._id, !user.isActive)}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button 
                            className="view-details-button"
                            onClick={() => handleViewUserDetails(user)}
                          >
                            Details
                          </button>
                          <button 
                            className="delete-button" 
                            onClick={() => handleUserDelete(user._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pharmacy Owners Tab */}
        {activeTab === "owners" && (
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Pharmacy Owners</h3>
              <button className="refresh-button" onClick={fetchPharmacyOwners}>
                Refresh Owners
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="owner-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Pharmacy Count</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pharmacyOwners.map((owner) => {
                      const ownerPharmacies = pharmacies.filter(
                        (p) => p.ownerId?._id === owner._id
                      );
                      return (
                        <tr key={owner._id}>
                          <td>{owner._id.substring(0, 8)}...</td>
                          <td>{owner.name}</td>
                          <td>{owner.email}</td>
                          <td>{owner.phone || "N/A"}</td>
                          <td>{ownerPharmacies.length}</td>
                          <td>
                            <span
                              className={
                                owner.isActive ? "status-active" : "status-inactive"
                              }
                            >
                              {owner.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="action-buttons">
                            <button
                              className="view-details-button"
                              onClick={() => handleViewPharmacyGroup(owner._id)}
                            >
                              View Pharmacies
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleUserDelete(owner._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Individual Pharmacy Group Tab */}
        {activeTab === "pharmacyGroup" && selectedPharmacyGroup && (
          <div className="dashboard-card">
            <div className="card-header">
              <h3>{selectedPharmacyGroup[0]?.ownerId?.name || "Pharmacy"}'s Pharmacies</h3>
              <button className="back-button" onClick={handleBackToOwners}>
                Back to Owners
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="pharmacy-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPharmacyGroup.map((pharmacy) => (
                      <tr key={pharmacy._id}>
                        <td>{pharmacy.name}</td>
                        <td>{pharmacy.address}</td>
                        <td className="action-buttons">
                          <button
                            className="view-details-button"
                            onClick={() => handleShowStock(pharmacy)}
                          >
                            Show Stock
                          </button>
                          <button
                            className="locate-button"
                            onClick={() => handleLocatePharmacy(pharmacy)}
                          >
                            Locate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stock Details Modal */}
        {showStockDetails && selectedPharmacy && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Stock Details - {selectedPharmacy.name}</h3>
                <button className="close-button" onClick={handleCloseDetails}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                {selectedPharmacy.stock.length > 0 ? (
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th>Medicine Name</th>
                        <th>Price</th>
                        <th>Available</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPharmacy.stock.map((item, index) => (
                        <tr key={index}>
                          <td>
                            {editStock?.medicineName === item.medicineName ? (
                              <input
                                type="text"
                                name="medicineName"
                                value={editStock.medicineName}
                                onChange={handleStockChange}
                              />
                            ) : (
                              item.medicineName
                            )}
                          </td>
                          <td>
                            {editStock?.medicineName === item.medicineName ? (
                              <input
                                type="number"
                                name="price"
                                value={editStock.price}
                                onChange={handleStockChange}
                              />
                            ) : (
                              `$${item.price.toFixed(2)}`
                            )}
                          </td>
                          <td>
                            {editStock?.medicineName === item.medicineName ? (
                              <select
                                name="isAvailable"
                                value={editStock.isAvailable}
                                onChange={handleStockChange}
                              >
                                <option value={true}>Yes</option>
                                <option value={false}>No</option>
                              </select>
                            ) : (
                              item.isAvailable ? "Yes" : "No"
                            )}
                          </td>
                          <td>
                            {editStock?.medicineName === item.medicineName ? (
                              <>
                                <button
                                  className="save-button"
                                  onClick={handleUpdateStock}
                                >
                                  Save
                                </button>
                                <button
                                  className="cancel-button"
                                  onClick={() => setEditStock(null)}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="edit-button"
                                  onClick={() => handleEditStock(item)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="delete-button"
                                  onClick={() => handleDeleteStock(item.medicineName)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No stock details available.</p>
                )}
              </div>
              <div className="modal-footer">
                <button className="close-button" onClick={handleCloseDetails}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map Modal for Location */}
        {mapLocation && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Location - {mapLocation.name}</h3>
                <button className="close-button" onClick={() => setMapLocation(null)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="map-container">
                  <MapContainer
                    center={{
                      lat: mapLocation.coordinates[1],
                      lng: mapLocation.coordinates[0],
                    }}
                    zoom={15}
                    style={{ height: "400px", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    />
                    <Marker
                      position={{
                        lat: mapLocation.coordinates[1],
                        lng: mapLocation.coordinates[0],
                      }}
                      icon={pharmacyMarkerIcon}
                    >
                      <Popup>{mapLocation.name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
              <div className="modal-footer">
                <button className="close-button" onClick={() => setMapLocation(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Pharmacy Modal */}
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
                <div className="form-group">
                  <label htmlFor="edit-owner">Pharmacy Owner</label>
                  <select
                    id="edit-owner"
                    name="ownerId"
                    value={editData.ownerId || ""}
                    onChange={handleEditChange}
                  >
                    <option value="">-- Select Owner --</option>
                    {pharmacyOwners.map(owner => (
                      <option key={owner._id} value={owner._id}>
                        {owner.name} ({owner.email})
                      </option>
                    ))}
                  </select>
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

        {/* Pharmacy Details Modal */}
        {showPharmacyDetails && selectedPharmacy && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Pharmacy Details</h3>
                <button className="close-button" onClick={() => setShowPharmacyDetails(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-group">
                  <h4>Pharmacy Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedPharmacy.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedPharmacy.address}</span>
                  </div>
                  {selectedPharmacy.location?.coordinates?.length === 2 && (
                    <div className="detail-item">
                      <span className="detail-label">Coordinates:</span>
                      <span className="detail-value">
                        {selectedPharmacy.location.coordinates[1].toFixed(6)}, {selectedPharmacy.location.coordinates[0].toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="detail-group">
                  <h4>Medicine Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Medicine Name:</span>
                    <span className="detail-value">{selectedPharmacy.medicineName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value">${formatPrice(selectedPharmacy.price)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Availability:</span>
                    <span className={`detail-value ${selectedPharmacy.isAvailable ? "status-available" : "status-unavailable"}`}>
                      {selectedPharmacy.isAvailable ? "Available" : "Not Available"}
                    </span>
                  </div>
                </div>
                
                {ownerDetails && (
                  <div className="detail-group">
                    <h4>Owner Information</h4>
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{ownerDetails.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{ownerDetails.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{ownerDetails.phone || "N/A"}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  className="edit-button-large" 
                  onClick={() => {
                    handleEditClick(selectedPharmacy);
                    setShowPharmacyDetails(false);
                  }}
                >
                  Edit Pharmacy
                </button>
                <button 
                  className="delete-button-large" 
                  onClick={() => {
                    setShowPharmacyDetails(false);
                    handleDelete(selectedPharmacy._id);
                  }}
                >
                  Delete Pharmacy
                </button>
                <button 
                  className="close-button-large" 
                  onClick={() => setShowPharmacyDetails(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

     
        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>User Details</h3>
                <button className="close-button" onClick={() => setShowUserDetails(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-group">
                  <h4>User Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{selectedUser._id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedUser.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedUser.email}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="close-button-large" 
                  onClick={() => setShowUserDetails(false)}
                >
                  Close
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
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          background-color: #fff;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
        }
        
        .stat-icon {
          font-size: 28px;
          margin-bottom: 10px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #3498db;
        }
        
        .stat-label {
          color: #7f8c8d;
          font-size: 14px;
          margin-top: 6px;
        }
        
        /* Navigation Tabs */
        .nav-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        
        .tab-button {
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 12px 16px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          white-space: nowrap;
          transition: background-color 0.2s;
        }
        
        .tab-button.active {
          background-color: #3498db;
          color: white;
          border-color: #3498db;
        }
        
        .tab-icon {
          margin-right: 8px;
          font-size: 18px;
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
          display: flex;
          justify-content: space-between;
          align-items: center;
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
        
        .pharmacy-table, .user-table, .owner-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .pharmacy-table th,
        .pharmacy-table td,
        .user-table th,
        .user-table td,
        .owner-table th,
        .owner-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .pharmacy-table th,
        .user-table th,
        .owner-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #34495e;
        }
        
        .pharmacy-table tr:hover,
        .user-table tr:hover,
        .owner-table tr:hover {
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