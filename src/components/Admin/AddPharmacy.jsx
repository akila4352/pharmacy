import React, { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import Heading from "../common/Heading";
import Headerpowner from "../common/header/Headerpowner";

// Fix for default marker icons not showing in Leaflet with React
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Create custom icon to replace the default one
const defaultIcon = new Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// MapClickHandler component to handle map click events
function MapClickHandler({ setClickedPosition }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      setClickedPosition({ lat, lng });
    }
  });
  return null;
}

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

  // Map settings
  const mapContainerStyle = { width: "100%", height: "400px" };
  const defaultCenter = [6.08249715365853, 80.29727865317939]; // Note: Leaflet uses [lat, lng] format

  const handlePositionChange = useCallback((position) => {
    setFormData((fd) => ({
      ...fd,
      latitude: position.lat,
      longitude: position.lng,
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate form data
      if (!formData.latitude || !formData.longitude) {
        setMessage("Please select a location on the map");
        setMessageType("error");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
        return;
      }

      const body = {
        name: formData.name,
        address: formData.address,
        medicineName: formData.medicineName,
        price: parseFloat(formData.price),
        isAvailable: formData.isAvailable === "true" || formData.isAvailable === true,
        location: {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
        },
      };
      
      const res = await fetch(`${API_URL}/api/pharmacies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add pharmacy');
      }
      
      const data = await res.json();
      setMessage("Pharmacy added successfully!");
      setMessageType("success");
      setFormData({ 
        name: "", 
        address: "", 
        isAvailable: true, 
        price: "", 
        medicineName: "", 
        latitude: "", 
        longitude: "" 
      });
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setMessageType("error");
    }
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  return (
    <div>
      <Headerpowner />
      <section className="hero">
        <div className="container">
          <Heading title="Add Pharmacy" />
          <form className="flex" onSubmit={handleSubmit}>
            <div className="box">
              <span>Pharmacy Name</span>
              <input
                type="text"
                name="name"
                placeholder="Enter pharmacy name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="box">
              <span>Address</span>
              <input
                type="text"
                name="address"
                placeholder="Enter pharmacy address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="box">
              <span>Medicine Name</span>
              <input
                type="text"
                name="medicineName"
                placeholder="Enter medicine name"
                value={formData.medicineName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="box">
              <span>Price</span>
              <input
                type="number"
                name="price"
                placeholder="Enter price"
                value={formData.price}
                onChange={handleChange}
                required
                step="0.01"
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
              <span>Latitude</span>
              <input
                type="text"
                name="latitude"
                placeholder="Click on map to set"
                value={formData.latitude}
                onChange={handleChange}
                readOnly
              />
            </div>
            <div className="box">
              <span>Longitude</span>
              <input
                type="text"
                name="longitude"
                placeholder="Click on map to set"
                value={formData.longitude}
                onChange={handleChange}
                readOnly
              />
            </div>
            <button className="btn1" type="submit">Add Pharmacy</button>
          </form>
          
          {showPopup && (
            <div className={`popup ${messageType}`}>
              <p>{message}</p>
            </div>
          )}

          <div style={mapContainerStyle}>
            <MapContainer
              center={defaultCenter}
              zoom={10}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler setClickedPosition={handlePositionChange} />
              {formData.latitude && formData.longitude && (
                <Marker
                  position={[formData.latitude, formData.longitude]}
                  icon={defaultIcon}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      handlePositionChange(position);
                    },
                  }}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AddPharmacy;