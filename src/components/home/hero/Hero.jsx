import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "./hero.css";
import Header from "../../common/header/Header";

// Fix for default marker icons in Leaflet with webpack
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom blue marker icon for pharmacies
const pharmacyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Custom red marker icon for user location
const userLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to handle location marker placement
function LocationMarker({ position, setPosition }) {
  const map = useMap();
  
  useEffect(() => {
    if (position === null) {
      map.on('click', function(e) {
        setPosition(e.latlng);
      });
    }
    
    return () => {
      map.off('click');
    };
  }, [map, position, setPosition]);

  return position === null ? null : (
    <Marker position={position} icon={userLocationIcon}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

// Component to handle routing
function RoutingMachine({ userLocation, pharmacyLocation }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (userLocation && pharmacyLocation) {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }

      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(pharmacyLocation.lat, pharmacyLocation.lng)
        ],
        routeWhileDragging: false,
        lineOptions: {
          styles: [{ color: '#6FA1EC', weight: 4 }]
        },
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true
      }).addTo(map);

      routingControlRef.current = routingControl;

      routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        // Distance in meters, convert to km
        const distance = (summary.totalDistance / 1000).toFixed(2) + ' km';
        const time = Math.round(summary.totalTime / 60) + ' min';
        
        document.getElementById('distance-value').textContent = distance;
        document.getElementById('time-value').textContent = time;
      });

      return () => {
        if (routingControlRef.current) {
          map.removeControl(routingControlRef.current);
        }
      };
    }
  }, [map, userLocation, pharmacyLocation]);

  return null;
}

const Hero = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState({ medicineName: "" });
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [pharmacyLocation, setPharmacyLocation] = useState(null);

  const defaultCenter = [6.08249715365853, 80.29727865317939]; // [lat, lng] format for Leaflet

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchQuery({ ...searchQuery, [name]: value });
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

  const handlePharmacyClick = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setPharmacyLocation({
      lat: pharmacy.latitude,
      lng: pharmacy.longitude
    });
    
    setMessage("Calculating the best route...");
    setMessageType("info");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  return (
    <div>
      <Header />
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

          <div style={{ height: "400px", width: "100%" }}>
            <MapContainer 
              center={defaultCenter} 
              zoom={13} 
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <LocationMarker position={selectedLocation} setPosition={setSelectedLocation} />
              
              {pharmacies.map((pharmacy) => (
                <Marker
                  key={pharmacy.id}
                  position={[pharmacy.latitude, pharmacy.longitude]}
                  icon={pharmacyIcon}
                  eventHandlers={{
                    click: () => handlePharmacyClick(pharmacy),
                  }}
                >
                  <Popup>
                    <div>
                      <strong>{pharmacy.name}</strong><br />
                      {pharmacy.address}<br />
                      Medicine: {pharmacy.medicineName}<br />
                      Price: {pharmacy.price}<br />
                      {pharmacy.isAvailable ? "In Stock" : "Out of Stock"}
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {selectedLocation && pharmacyLocation && (
                <RoutingMachine userLocation={selectedLocation} pharmacyLocation={pharmacyLocation} />
              )}
            </MapContainer>
          </div>
          
          {selectedPharmacy && (
            <div className="distance-info">
              <h4>Route Details</h4>
              <p>
                Destination: <strong>{selectedPharmacy.name}</strong>
              </p>
              <p>
                Distance: <strong id="distance-value">Calculating...</strong>
              </p>
              <p>
                Estimated Time: <strong id="time-value">Calculating...</strong>
              </p>
            </div>
          )}

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
    </div>
  );
};

export default Hero;