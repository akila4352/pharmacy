// src/components/ManageMedicine.jsx
import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Heading from "../common/Heading";
import Headerpowner from "../common/header/Headerpowner";

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

const ManageMedicine = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pharmacies, setPharmacies] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const defaultCenter = { lat: 6.0825, lng: 80.2973 };

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
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setPharmacies(data);
      if (data.length === 0) showMessage("No pharmacies found", "info");
    } catch (err) {
      showMessage(`Error: ${err.message}`, "error");
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleEditClick = (ph) => {
    setEditId(ph._id);
    setEditData({
      name: ph.name,
      address: ph.address,
      medicineName: ph.medicineName,
      price: ph.price,
      isAvailable: ph.isAvailable,
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
          coordinates: [
            parseFloat(editData.longitude),
            parseFloat(editData.latitude),
          ],
        },
      };
      const res = await fetch(`${API_URL}/api/pharmacies/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setPharmacies((prev) =>
        prev.map((ph) => (ph._id === editId ? updated : ph))
      );
      showMessage("Updated successfully", "success");
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
      if (!res.ok) throw new Error("Delete failed");
      setPharmacies((prev) => prev.filter((ph) => ph._id !== id));
      showMessage("Deleted successfully", "success");
    } catch (err) {
      showMessage(`Error: ${err.message}`, "error");
    }
  };

  return (
    <div>
      <Headerpowner />
      <section className="hero">
        <div className="container">
          <Heading title="Manage Medicine" />
          <form className="flex" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Medicine"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              required
            />
            <button className="btn1" type="submit">
              Search
            </button>
          </form>

          {showPopup && <div className={`popup ${messageType}`}>{message}</div>}

          <div style={{ height: "400px", width: "100%", marginTop: "1rem" }}>
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              />
              <LocationMarker setSelectedLocation={setSelectedLocation} />
              {selectedLocation && (
                <Marker position={selectedLocation} icon={customMarkerIcon} />
              )}
              {pharmacies.map((ph) => (
                <Marker
                  key={ph._id}
                  position={{
                    lat: ph.location.coordinates[1],
                    lng: ph.location.coordinates[0],
                  }}
                  icon={customMarkerIcon}
                />
              ))}
            </MapContainer>
          </div>

          {pharmacies.length > 0 && (
            <div className="results">
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
                  {pharmacies.map((ph) => (
                    <tr key={ph._id}>
                      {editId === ph._id ? (
                        <>
                          <td>
                            <button className="btn-action" onClick={handleSave}>
                              💾
                            </button>
                            <button
                              className="btn-action"
                              onClick={() => setEditId(null)}
                            >
                              ❌
                            </button>
                          </td>
                          <td>
                            <input
                              name="name"
                              value={editData.name}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              name="address"
                              value={editData.address}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <select
                              name="isAvailable"
                              value={editData.isAvailable}
                              onChange={handleEditChange}
                            >
                              <option value="true">Available</option>
                              <option value="false">Not Available</option>
                            </select>
                          </td>
                          <td>
                            <input
                              name="price"
                              type="number"
                              value={editData.price}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              name="medicineName"
                              value={editData.medicineName}
                              onChange={handleEditChange}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <button
                              className="btn-action"
                              onClick={() => handleEditClick(ph)}
                            >
                              🖉
                            </button>
                            <button
                              className="btn-action"
                              onClick={() => handleDelete(ph._id)}
                            >
                              ❌
                            </button>
                          </td>
                          <td>{ph.name}</td>
                          <td>{ph.address}</td>
                          <td>{ph.isAvailable ? "Available" : "Not Available"}</td>
                          <td>{ph.price}</td>
                          <td>{ph.medicineName}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ManageMedicine;
