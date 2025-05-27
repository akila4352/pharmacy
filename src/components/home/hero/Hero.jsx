import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import Header from "../../common/header/Header";
import "./hero.css";

// Fix default marker icons
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const pharmacyIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
// Add green and red icons for near/far pharmacies
const greenPharmacyIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
const redPharmacyIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Component: Location Marker
function LocationMarker({ position, setPosition }) {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      map.on("click", (e) => setPosition(e.latlng));
    }
    return () => map.off("click");
  }, [map, position, setPosition]);

  return position ? (
    <Marker position={position} icon={userIcon}>
      <Popup>You are here</Popup>
    </Marker>
  ) : null;
}

// Component: Routing Machine
function RoutingMachine({ userLocation, pharmacyLocation }) {
  const map = useMap();
  const controlRef = useRef(null);

  useEffect(() => {
    // Remove previous control if exists
    if (controlRef.current && map.hasLayer(controlRef.current)) {
      try {
        map.removeControl(controlRef.current);
      } catch (e) {
        // Ignore errors if already removed
      }
      controlRef.current = null;
    }

    if (userLocation && pharmacyLocation) {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(pharmacyLocation.lat, pharmacyLocation.lng)
        ],
        addWaypoints: false,
        draggableWaypoints: false,
        routeWhileDragging: false,
        lineOptions: { styles: [{ color: "#6FA1EC", weight: 4 }] }
      }).addTo(map);

      controlRef.current = routingControl;

      routingControl.on("routesfound", (e) => {
        const { totalDistance, totalTime } = e.routes[0].summary;
        document.getElementById("distance-value").textContent =
          (totalDistance / 1000).toFixed(2) + " km";
        document.getElementById("time-value").textContent =
          Math.round(totalTime / 60) + " min";
      });

      return () => {
        if (controlRef.current && map.hasLayer(controlRef.current)) {
          try {
            map.removeControl(controlRef.current);
          } catch (e) {
            // Ignore errors if already removed
          }
          controlRef.current = null;
        }
      };
    }
    // Cleanup if userLocation or pharmacyLocation becomes null
    return () => {
      if (controlRef.current && map.hasLayer(controlRef.current)) {
        try {
          map.removeControl(controlRef.current);
        } catch (e) {
          // Ignore errors if already removed
        }
        controlRef.current = null;
      }
    };
  }, [map, userLocation, pharmacyLocation]);

  return null;
}

// Haversine formula to calculate distance in km between two lat/lng
function getDistanceKm(lat1, lng1, lat2, lng2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const Hero = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // When a pharmacy marker is clicked, set as selected and show route if user location is set
  const handleMarkerClick = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
  };

  // Search handler
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setPharmacies([]);
    setSelectedPharmacy(null);

    if (!search.trim()) {
      setError("Please enter a medicine name.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/pharmacies/search?medicineName=${encodeURIComponent(search.trim())}`
      );
      let data;
      try {
        data = await res.json();
      } catch {
        setError("Server error: Invalid response format.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data && data.error ? data.error : "Failed to search pharmacies");
        setLoading(false);
        return;
      }
      setPharmacies(data);
      if (data.length === 0) {
        setMessage("No pharmacies found with this medicine.");
      } else {
        setMessage(`Found ${data.length} pharmacies with "${search}"`);
      }

      // Save search to backend for analytics
      fetch(`${API_URL}/api/medicine-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineName: search.trim() })
      });
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch suggestions as user types
  useEffect(() => {
    if (search.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let ignore = false;
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/medicines/suggestions?query=${encodeURIComponent(search.trim())}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) {
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    fetchSuggestions();
    return () => { ignore = true; };
  }, [search, API_URL]);

  // Hide suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <Header />
      <section className="hero">
        <div className="container">
          <h2>Find Medicine in Pharmacies</h2>
          <form className="flex" onSubmit={handleSearch} style={{ marginBottom: 16, position: "relative" }}>
            <div style={{ position: "relative", width: "100%" }} ref={suggestionsRef}>
              <input
                type="text"
                placeholder="Enter medicine name"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                style={{ minWidth: 200, marginRight: 8 }}
                required
                autoComplete="off"
                onFocus={() => setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #ccc",
                    zIndex: 10,
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    maxHeight: 180,
                    overflowY: "auto"
                  }}
                >
                  {suggestions.map((item, idx) => (
                    <li
                      key={idx}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        borderBottom: idx !== suggestions.length - 1 ? "1px solid #eee" : "none"
                      }}
                      onMouseDown={() => {
                        setSearch(item);
                        setShowSuggestions(false);
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button className="btn1" type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
          {message && <div className="message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <div id="distance-info">
            <strong>Distance:</strong> <span id="distance-value">--</span>
            &nbsp; | &nbsp;
            <strong>Time:</strong> <span id="time-value">--</span>
          </div>

          <MapContainer
            center={[6.0535, 80.2210]}
            zoom={13}
            style={{ height: "400px", width: "100%", marginTop: "20px" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
            />

            <LocationMarker position={userLocation} setPosition={setUserLocation} />

            {pharmacies.map((pharmacy, index) => {
              // Only render marker if valid coordinates
              if (
                typeof pharmacy.location?.coordinates?.[1] !== "number" ||
                typeof pharmacy.location?.coordinates?.[0] !== "number" ||
                isNaN(pharmacy.location.coordinates[1]) ||
                isNaN(pharmacy.location.coordinates[0])
              ) {
                return null;
              }
              // Find the stock item for the searched medicine
              const stockItem = (pharmacy.stock || []).find(
                item => item.medicineName?.toLowerCase() === search.trim().toLowerCase()
              );
              // Get pharmacy contact number (from owner or pharmacy object)
              let contactNumber = "";
              if (pharmacy.ownerId && typeof pharmacy.ownerId === "object" && pharmacy.ownerId.phone) {
                contactNumber = pharmacy.ownerId.phone;
              } else if (pharmacy.phone) {
                contactNumber = pharmacy.phone;
              }

              // Calculate distance from user location if set
              let distanceKm = null;
              let iconToUse = pharmacyIcon;
              if (userLocation) {
                distanceKm = getDistanceKm(
                  userLocation.lat,
                  userLocation.lng,
                  pharmacy.location.coordinates[1],
                  pharmacy.location.coordinates[0]
                );
                // Use green if <= 5km, red if > 5km
                iconToUse = distanceKm <= 5 ? greenPharmacyIcon : redPharmacyIcon;
              }

              return (
                <Marker
                  key={pharmacy._id || index}
                  position={[
                    pharmacy.location.coordinates[1],
                    pharmacy.location.coordinates[0]
                  ]}
                  icon={iconToUse}
                  eventHandlers={{
                    click: () => handleMarkerClick(pharmacy)
                  }}
                >
                  <Popup>
                    <strong>{pharmacy.name}</strong>
                    <br />
                    {pharmacy.address}
                    <br />
                    {contactNumber && (
                      <>
                        Contact: <a href={`tel:${contactNumber}`}>{contactNumber}</a>
                        <br />
                      </>
                    )}
                    Medicine: {stockItem ? stockItem.medicineName : "N/A"}
                    <br />
                    Price: {stockItem ? `$${stockItem.price?.toFixed(2)}` : "N/A"}
                    <br />
                    {stockItem
                      ? stockItem.isAvailable
                        ? "In Stock"
                        : "Out of Stock"
                      : "N/A"}
                    <br />
                    {distanceKm !== null && (
                      <>
                        Distance: {distanceKm.toFixed(2)} km
                        <br />
                      </>
                    )}
                    {userLocation && (
                      <span>
                        <button
                          style={{ marginTop: 8, cursor: "pointer" }}
                          onClick={() => handleMarkerClick(pharmacy)}
                        >
                          Show Route
                        </button>
                      </span>
                    )}
                  </Popup>
                </Marker>
              );
            })}

            {userLocation && selectedPharmacy && selectedPharmacy.location && (
              <RoutingMachine
                userLocation={userLocation}
                pharmacyLocation={{
                  lat: selectedPharmacy.location.coordinates[1],
                  lng: selectedPharmacy.location.coordinates[0]
                }}
              />
            )}
          </MapContainer>

          {/* Table of results */}
          {pharmacies.length > 0 && (
            <div className="results" style={{ marginTop: 24 }}>
              <h3>Search Results:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Contact</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Medicine</th>
                  </tr>
                </thead>
                <tbody>
                  {pharmacies.map((pharmacy, idx) => {
                    const stockItem = (pharmacy.stock || []).find(
                      item => item.medicineName?.toLowerCase() === search.trim().toLowerCase()
                    );
                    // Get pharmacy contact number (from owner or pharmacy object)
                    let contactNumber = "";
                    if (pharmacy.ownerId && typeof pharmacy.ownerId === "object" && pharmacy.ownerId.phone) {
                      contactNumber = pharmacy.ownerId.phone;
                    } else if (pharmacy.phone) {
                      contactNumber = pharmacy.phone;
                    }
                    return (
                      <tr
                        key={pharmacy._id || idx}
                        onClick={() => setSelectedPharmacy(pharmacy)}
                        className={selectedPharmacy && selectedPharmacy._id === pharmacy._id ? "selected-row" : ""}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{pharmacy.name}</td> 
                        <td>{pharmacy.address}</td>
                        <td>
                          {contactNumber ? (
                            <a href={`tel:${contactNumber}`}>{contactNumber}</a>
                          ) : "N/A"}
                        </td>
                        <td>
                          {stockItem
                            ? stockItem.isAvailable
                              ? "Available"
                              : "Not Available"
                            : "N/A"}
                        </td>
                        <td>
                          {stockItem ? `$${stockItem.price?.toFixed(2)}` : "N/A"}
                        </td>
                        <td>{stockItem ? stockItem.medicineName : "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Hero;
