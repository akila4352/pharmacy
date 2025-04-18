import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import Header from "../../common/header/Header";
import "./hero.css";

// API base URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Fix default Leaflet marker icons
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
const pharmacyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Component to select and mark user location
function LocationMarker({ position, setPosition }) {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      map.on("click", (e) => setPosition(e.latlng));
    }
    return () => {
      map.off("click");
    };
  }, [map, position, setPosition]);

  return position ? (
    <Marker position={position} icon={userIcon}>
      <Popup>You are here</Popup>
    </Marker>
  ) : null;
}

// Component to draw route
function RoutingMachine({ userLocation, pharmacyLocation }) {
  const map = useMap();
  const controlRef = useRef(null);

  useEffect(() => {
    if (userLocation && pharmacyLocation) {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
      }

      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(pharmacyLocation.lat, pharmacyLocation.lng)
        ],
        addWaypoints: false,
        draggableWaypoints: false,
        routeWhileDragging: false,
        lineOptions: { styles: [{ color: '#6FA1EC', weight: 4 }] }
      }).addTo(map);

      controlRef.current = routingControl;

      routingControl.on('routesfound', (e) => {
        const { totalDistance, totalTime } = e.routes[0].summary;
        document.getElementById('distance-value').textContent = (totalDistance / 1000).toFixed(2) + ' km';
        document.getElementById('time-value').textContent = Math.round(totalTime / 60) + ' min';
      });

      return () => {
        if (controlRef.current) {
          map.removeControl(controlRef.current);
        }
      };
    }
  }, [map, userLocation, pharmacyLocation]);

  return null;
}

// Component to handle map updates when pharmacies are loaded
function MapUpdater({ pharmacies, userPos }) {
  const map = useMap();
  
  useEffect(() => {
    if (pharmacies.length > 0 && userPos) {
      // Get bounds that include all points
      const bounds = L.latLngBounds([userPos]);
      
      pharmacies.forEach(pharmacy => {
        if (pharmacy.location && pharmacy.location.coordinates) {
          const lat = pharmacy.location.coordinates[1];
          const lng = pharmacy.location.coordinates[0];
          bounds.extend([lat, lng]);
        }
      });
      
      // Fit map to these bounds
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, pharmacies, userPos]);

  return null;
}

const Hero = () => {
  const [userPos, setUserPos] = useState(null);
  const [query, setQuery] = useState("");
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharma, setSelectedPharma] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: '', time: '' });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const defaultCenter = [6.08249715365853, 80.29727865317939];
  const mapRef = useRef(null);

  const handleSearchChange = (e) => setQuery(e.target.value);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    if (!userPos) {
      setMessage('Please click on the map to select your location.');
      setLoading(false);
      return;
    }

    try {
      // Clear previous search results
      setPharmacies([]);
      setSelectedPharma(null);
      
      const res = await fetch(
        `${API_URL}/api/pharmacies/search?latitude=${userPos.lat}&longitude=${userPos.lng}&medicineName=${encodeURIComponent(query)}`
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to search pharmacies');
      }
      
      const data = await res.json();
      console.log("Pharmacies found:", data); // Debugging
      
      setPharmacies(data);
      
      if (data.length === 0) {
        setMessage('No pharmacies found with this medicine nearby.');
      } else {
        setMessage(`Found ${data.length} pharmacies with ${query}`);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(`Error searching pharmacies: ${err.message}`);
      setMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePharmaClick = (ph) => {
    if (!ph.location || !ph.location.coordinates) {
      console.error("Invalid pharmacy location data:", ph);
      return;
    }
    
    const lat = ph.location.coordinates[1];
    const lng = ph.location.coordinates[0];
    
    console.log("Selected pharmacy:", ph.name, "at", lat, lng);
    setSelectedPharma(ph);
    setRouteInfo({ distance: 'Calculating...', time: 'Calculating...' });
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
                value={query}
                onChange={handleSearchChange}
                required
              />
            </div>
            <button className="btn1" type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {message && <div className="message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <div style={{ height: "400px", width: "100%", marginTop: "20px" }}>
            <MapContainer 
              center={defaultCenter} 
              zoom={13} 
              style={{ height: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <LocationMarker position={userPos} setPosition={setUserPos} />
              <MapUpdater pharmacies={pharmacies} userPos={userPos} />

              {pharmacies.map((ph) => {
                if (!ph.location || !ph.location.coordinates || ph.location.coordinates.length !== 2) {
                  console.warn("Invalid pharmacy location data:", ph);
                  return null;
                }
                
                const lat = ph.location.coordinates[1];
                const lng = ph.location.coordinates[0];
                
                return (
                  <Marker
                    key={ph._id}
                    position={[lat, lng]}
                    icon={pharmacyIcon}
                    eventHandlers={{ click: () => handlePharmaClick(ph) }}
                  >
                    <Popup>
                      <div>
                        <strong>{ph.name}</strong><br />
                        {ph.address}<br />
                        Medicine: {ph.medicineName}<br />
                        Price: {ph.price}<br />
                        {ph.isAvailable ? "In Stock" : "Out of Stock"}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {userPos && selectedPharma && selectedPharma.location && (
                <RoutingMachine
                  userLocation={userPos}
                  pharmacyLocation={{
                    lat: selectedPharma.location.coordinates[1],
                    lng: selectedPharma.location.coordinates[0]
                  }}
                />
              )}
            </MapContainer>
          </div>

          {selectedPharma && (
            <div className="distance-info">
              <h4>Route Details</h4>
              <p>Destination: <strong>{selectedPharma.name}</strong></p>
              <p>Distance: <strong id="distance-value">{routeInfo.distance}</strong></p>
              <p>Estimated Time: <strong id="time-value">{routeInfo.time}</strong></p>
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
                  {pharmacies.map((ph) => (
                    <tr 
                      key={ph._id} 
                      onClick={() => handlePharmaClick(ph)}
                      className={selectedPharma && selectedPharma._id === ph._id ? "selected-row" : ""}
                    >
                      <td>{ph.name}</td>
                      <td>{ph.address}</td>
                      <td>{ph.isAvailable ? "Available" : "Not Available"}</td>
                      <td>${ph.price.toFixed(2)}</td>
                      <td>{ph.medicineName}</td>
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

export default Hero;