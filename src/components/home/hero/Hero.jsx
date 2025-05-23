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
        if (controlRef.current) {
          map.removeControl(controlRef.current);
        }
      };
    }
  }, [map, userLocation, pharmacyLocation]);

  return null;
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Hero = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

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
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <section className="hero">
        <div className="container">
          <h2>Find Medicine in Pharmacies</h2>
          <form className="flex" onSubmit={handleSearch} style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Enter medicine name"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 200, marginRight: 8 }}
              required
            />
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
            center={[10.7905, 78.7047]}
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
              return (
                <Marker
                  key={pharmacy._id || index}
                  position={[
                    pharmacy.location.coordinates[1],
                    pharmacy.location.coordinates[0]
                  ]}
                  icon={pharmacyIcon}
                  eventHandlers={{
                    click: () => handleMarkerClick(pharmacy)
                  }}
                >
                  <Popup>
                    <strong>{pharmacy.name}</strong>
                    <br />
                    {pharmacy.address}
                    <br />
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
