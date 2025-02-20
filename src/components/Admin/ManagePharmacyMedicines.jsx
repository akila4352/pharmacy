import React, { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import Heading from "../common/Heading";
import HeaderAdmin from "../common/header/HeaderAdmin";

const ManagePharmacyMedicines = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState({ medicineName: "" });
  const [pharmacies, setPharmacies] = useState([]);
  const [editPharmacyId, setEditPharmacyId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AlzaSyYuXQcONmY0Fy-7r818WazltBm3VElC3Mh",
  });

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  const defaultCenter = {
    lat: 6.08249715365853,
    lng: 80.29727865317939,
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchQuery({ ...searchQuery, [name]: value });
  };

  const handleMapClick = (e) => {
    setSelectedLocation({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
  };

  const handleEditClick = (pharmacy) => {
    setEditPharmacyId(pharmacy.id);
    setEditFormData({ ...pharmacy });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleSaveClick = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/pharmacies/${editPharmacyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...editFormData,
            price: parseFloat(editFormData.price),
            latitude: parseFloat(editFormData.latitude),
            longitude: parseFloat(editFormData.longitude),
          }),
        }
      );

      if (response.ok) {
        const updatedPharmacy = await response.json();
        setPharmacies((prev) =>
          prev.map((pharmacy) =>
            pharmacy.id === editPharmacyId ? updatedPharmacy : pharmacy
          )
        );
        setEditPharmacyId(null);
        setEditFormData({});
        setMessage("Pharmacy updated successfully!");
        setMessageType("success");
      } else {
        throw new Error("Failed to update pharmacy");
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageType("error");
    }
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleCancelClick = () => {
    setEditPharmacyId(null);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/pharmacies/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPharmacies(pharmacies.filter((pharmacy) => pharmacy.id !== id));
        setMessage("Pharmacy deleted successfully!");
        setMessageType("success");
      } else {
        throw new Error("Failed to delete pharmacy");
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageType("error");
    }
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      setMessage("Please select a location on the map");
      setMessageType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/pharmacies/search?latitude=${selectedLocation.lat}&longitude=${selectedLocation.lng}&medicineName=${searchQuery.medicineName}`
      );
      if (response.ok) {
        const data = await response.json();
        setPharmacies(data);
        if (data.length === 0) {
          setMessage("No pharmacies found.");
          setMessageType("info");
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 3000);
        }
      } else {
        throw new Error("Failed to fetch pharmacies");
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div><HeaderAdmin>
      
    </HeaderAdmin>
    <section className="hero">
      <div className="container">
        <Heading title="Manage pharmacy" />

        <form className="flex" onSubmit={handleSearch}>
          <div className="box">
            <span>Medicine Name</span>
            <input
              type="text"
              placeholder="Enter medicine name"
              name="medicineName"
              value={searchQuery.medicineName}
              onChange={handleSearchChange}
              required
            />
          </div>
          <button className="btn1" type="submit">
            Search
          </button>
        </form>

        <div>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={10}
            onClick={handleMapClick}
          >
            {selectedLocation && (
              <Marker
                position={selectedLocation}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                }}
              />
            )}
            {pharmacies.map((pharmacy) => (
              <Marker
                key={pharmacy.id}
                position={{ lat: pharmacy.latitude, lng: pharmacy.longitude }}
                title={`${pharmacy.name} - ${pharmacy.medicineName}`}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                }}
              />
            ))}
          </GoogleMap>
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
                {pharmacies.map((pharmacy) => (
                  <tr key={pharmacy.id}>
                    {editPharmacyId === pharmacy.id ? (
                      <>
                        <td>
                          <button className="btn-action btn-save" onClick={handleSaveClick}>
                            💾
                          </button>
                          <button className="btn-action btn-cancel" onClick={handleCancelClick}>
                            ❌
                          </button>
                        </td>
                        <td>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="address"
                            value={editFormData.address}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td>
                          <select
                            name="isAvailable"
                            value={editFormData.isAvailable}
                            onChange={handleEditChange}
                          >
                            <option value={true}>Available</option>
                            <option value={false}>Not Available</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            name="price"
                            value={editFormData.price}
                            onChange={handleEditChange}
                            step="0.01"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="medicineName"
                            value={editFormData.medicineName}
                            onChange={handleEditChange}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <button
                            className="btn-action btn-update"
                            onClick={() => handleEditClick(pharmacy)}
                          >
                            🖉
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDelete(pharmacy.id)}
                          >
                            ❌
                          </button>
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
