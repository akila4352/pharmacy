// src/components/ManagePharmacyMedicines.jsx
import React, { useState } from "react";
import Heading from "../common/Heading";
import HeaderAdmin from "../common/header/HeaderAdmin";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const customMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LocationMarker = ({ setSelectedLocation }) => {
  useMapEvents({
    click(e) {
      setSelectedLocation(e.latlng);
    },
  });
  return null;
};

const ManagePharmacyMedicines = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pharmacies, setPharmacies] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const defaultCenter = { lat: 6.0825, lng: 80.2973 };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
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
    } catch (err) {
      showMessage(`Error: ${err.message}`, "error");
    }
  };

  const handleDelete = async (id) => {
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
      <section className="hero">
        <div className="container">
          <Heading title="Manage Pharmacy Medicines" />
          <form className="flex" onSubmit={handleSearch}>
            <div className="box">
              <span>Medicine Name</span>
              <input
                type="text"
                name="medicineName"
                placeholder="Enter medicine name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required
              />
            </div>
            <button className="btn1" type="submit">Search</button>
          </form>

          <div style={{ height: "400px", width: "100%", marginTop: "1rem" }}>
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

          {pharmacies.length > 0 && (
            <div className="results" style={{ marginTop: "2rem" }}>
              <h3>Search Results:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Actions</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Medicine</th>
                  </tr>
                </thead>
                <tbody>
                  {pharmacies.map((pharmacy) => (
                    <tr key={pharmacy._id}>
                      {editId === pharmacy._id ? (
                        <>
                          <td>
                            <button className="btn-action" onClick={handleSave}>💾</button>
                            <button className="btn-action" onClick={() => setEditId(null)}>❌</button>
                          </td>
                          <td><input name="name" value={editData.name} onChange={handleEditChange} /></td>
                          <td><input name="address" value={editData.address} onChange={handleEditChange} /></td>
                          <td>
                            <select name="isAvailable" value={editData.isAvailable} onChange={handleEditChange}>
                              <option value="true">Available</option>
                              <option value="false">Not Available</option>
                            </select>
                          </td>
                          <td><input name="price" type="number" value={editData.price} onChange={handleEditChange} /></td>
                          <td><input name="medicineName" value={editData.medicineName} onChange={handleEditChange} /></td>
                        </>
                      ) : (
                        <>
                          <td>
                            <button className="btn-action" onClick={() => handleEditClick(pharmacy)}>🖉</button>
                            <button className="btn-action" onClick={() => handleDelete(pharmacy._id)}>❌</button>
                          </td>
                          <td>{pharmacy.name}</td>
                          <td>{pharmacy.address}</td>
                          <td>{pharmacy.isAvailable ? "Available" : "Not Available"}</td>
                          <td>{pharmacy.price}</td>
                          <td>{pharmacy.medicineName}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showPopup && (
            <div className={`popup ${messageType}`}>
              <p>{message}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ManagePharmacyMedicines;
