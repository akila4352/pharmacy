import React, { useState } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsService,
  DirectionsRenderer,
  TrafficLayer,
  useJsApiLoader,
} from "@react-google-maps/api";
import "./hero.css";

const Hero = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState({ medicineName: "" });
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AlzaSyb1l9Bt7-IsRhzLdOVukQeErPc21k96Rkq",
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

  const [distance, setDistance] = useState(null); // Add state for distance
  {distance && selectedPharmacy && (
    <div className="distance-info">
      <h4>Route Details</h4>
      <p>
        Destination: <strong>{selectedPharmacy.name}</strong>
      </p>
      <p>
        Distance: <strong>{distance}</strong>
      </p>
    </div>
  )}
  
const handlePharmacyClick = (pharmacy) => {
  setMessage("Calculating the best route...");
  setMessageType("info");
  setShowPopup(true);

  const directionsService = new google.maps.DirectionsService();
  directionsService.route(
    {
      origin: selectedLocation,
      destination: { lat: pharmacy.latitude, lng: pharmacy.longitude },
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(), // Current time
        trafficModel: google.maps.TrafficModel.LESS_TRAFFIC,
      },
    },
    (result, status) => {
      setShowPopup(false);
      if (status === "OK") {
        setDirectionsResponse(result);

        // Extract and set the distance
        const distanceText =
          result.routes[0]?.legs[0]?.distance?.text || "Distance unavailable";
        setDistance(distanceText);

        setMessage("Route calculated successfully.");
        setMessageType("success");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      } else {
        showNotification("Unable to calculate route.", "error");
      }
    }
  );
};

  
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <section className="hero">
      <div className="container">
        <p className="heading">Find your medicine easier.</p>

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
    onClick={() => handlePharmacyClick(pharmacy)} // Handle click
  />
))}


{directionsResponse && (
  <DirectionsRenderer
    directions={directionsResponse}
    options={{
      polylineOptions: {
        strokeColor: "#FF0000", // Customize route color
        strokeWeight: 3,
      },
    }}
  />
)}


            <TrafficLayer />
          </GoogleMap>
        </div>

        {pharmacies.length > 0 && (
          <div className="results">
            <h3>Search Results:</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Medicine</th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.map((pharmacy) => (
                  <tr key={pharmacy.id} onClick={() => handlePharmacyClick(pharmacy)}>
                    <td>{pharmacy.name}</td>
                    <td>{pharmacy.address}</td>
                    <td>{pharmacy.isAvailable ? "Available" : "Not Available"}</td>
                    <td>{pharmacy.price}</td>
                    <td>{pharmacy.medicineName}</td>
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
  );
};

export default Hero;
