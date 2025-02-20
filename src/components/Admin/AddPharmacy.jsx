// AddPharmacy.jsx
import React, { useState, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import Heading from "../common/Heading";
import Headerpowner from "../common/header/Headerpowner";
const AddPharmacy = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    isAvailable: true,
    price: "",
    medicineName: "",
    latitude: "",
    longitude: "",
  });

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AlzaSyYuXQcONmY0Fy-7r818WazltBm3VElC3Mh",
  });

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  const center = {
    lat: formData.latitude || 6.08249715365853,
    lng: formData.longitude || 80.29727865317939,
  };

  const handleMapClick = useCallback((e) => {
    setFormData({
      ...formData,
      latitude: e.latLng.lat(),
      longitude: e.latLng.lng(),
    });
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8080/pharmacies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.text();

      if (response.ok) {
        setMessage("Pharmacy added successfully!");
        setMessageType("success");
        setShowPopup(true);
        setFormData({
          name: "",
          address: "",
          isAvailable: true,
          price: "",
          medicineName: "",
          latitude: "",
          longitude: "",
        });
      } else {
        setMessage(`Error: ${data}`);
        setMessageType("error");
      }
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (  <div><Headerpowner></Headerpowner>
    <section className="hero">
      <div className="container">
        <Heading title="Add Pharmacy" />
        <form className="flex" onSubmit={handleSubmit}>
          <div className="box">
            <span>Pharmacy Name</span>
            <input
              type="text"
              placeholder="Pharmacy Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="box">
            <span>Address</span>
            <input
              type="text"
              placeholder="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="box">
            <span>Availability</span>
            <select
              name="isAvailable"
              value={formData.isAvailable}
              onChange={handleChange}
            >
              <option value={true}>Available</option>
              <option value={false}>Not Available</option>
            </select>
          </div>
          <div className="box">
            <span>Price</span>
            <input
              type="number"
              placeholder="Price per Unit"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              required
            />
          </div>
          <div className="box">
            <span>Medicine Name</span>
            <input
              type="text"
              placeholder="Medicine Name"
              name="medicineName"
              value={formData.medicineName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="box">
            <span>Latitude</span>
            <input
              type="number"
              placeholder="Latitude"
              name="latitude"
              value={formData.latitude}
              readOnly
            />
          </div>
          <div className="box">
            <span>Longitude</span>
            <input
              type="number"
              placeholder="Longitude"
              name="longitude"
              value={formData.longitude}
              readOnly
            />
          </div>

          <div>
            <h3>Click on the map to set the location:</h3>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={10}
              onClick={handleMapClick}
            >
              <Marker
                position={{
                  lat: formData.latitude || center.lat,
                  lng: formData.longitude || center.lng,
                }}
                draggable={true}
                onDragEnd={(e) =>
                  setFormData({
                    ...formData,
                    latitude: e.latLng.lat(),
                    longitude: e.latLng.lng(),
                  })
                }
              />
            </GoogleMap>
          </div>

          <button className="btn1" type="submit">
            Add Pharmacy
          </button>
        </form>

        {showPopup && (
          <div className={`popup ${messageType}`}>
            <p>{message}</p>
          </div>
        )}
      </div>
    </section></div>
  );
};
export default AddPharmacy;