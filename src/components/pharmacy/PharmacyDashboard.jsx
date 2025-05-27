import React, { useEffect, useState } from "react";
import Headerpowner from "../common/header/Headerpowner";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const cardStyle = {
  maxWidth: 700,
  margin: "32px auto",
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
  padding: 32,
};

function PharmacyDashboard() {
  const [topMedicines, setTopMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("daily");
  const [pharmacy, setPharmacy] = useState(null); // Pharmacy info
  const [photoUploading, setPhotoUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // preview

  // Fetch pharmacy info (assume endpoint returns current pharmacy for logged-in owner)
  useEffect(() => {
    const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    fetch(`${API_URL}/api/pharmacies/my`)
      .then(res => res.json())
      .then(data => setPharmacy(data))
      .catch(() => setPharmacy(null));
  }, []);

  const fetchReport = () => {
    setLoading(true);
    const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    fetch(`${API_URL}/api/medicine-search/all?filter=${filter}`)
      .then(res => res.json())
      .then(data => {
        // Remove duplicates by medicine name and sum their counts
        const medicineMap = {};
        (data.medicines || []).forEach(med => {
          const name = med.name?.toLowerCase();
          if (!name) return;
          if (!medicineMap[name]) {
            medicineMap[name] = { name: med.name, count: 0 };
          }
          medicineMap[name].count += med.count;
        });
        const uniqueMedicines = Object.values(medicineMap);
        setTopMedicines(uniqueMedicines);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [filter]);

  // Prepare chart data
  const chartData = {
    labels: topMedicines.map(med => med.name),
    datasets: [
      {
        label: "Search Count",
        data: topMedicines.map(med => med.count),
        backgroundColor: "#f7c815",
        borderRadius: 8,
        maxBarThickness: 40,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Most Searched Medicines",
        font: { size: 20, weight: "bold" },
        color: "#222",
      },
      tooltip: {
        callbacks: {
          label: context => `Search Count: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Medicine Name", color: "#444", font: { size: 16 } },
        ticks: { color: "#444", font: { size: 14 } },
      },
      y: {
        title: { display: true, text: "Search Count", color: "#444", font: { size: 16 } },
        beginAtZero: true,
        ticks: { color: "#444", font: { size: 14 }, stepSize: 1 },
      },
    },
  };
 
  // Handle photo upload
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !pharmacy) return;
    setSelectedPhoto(URL.createObjectURL(file)); // Show preview
    setPhotoUploading(true);
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/pharmacies/${pharmacy._id}/photo`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const updated = await res.json();
      setPharmacy(updated);
      setSelectedPhoto(null); // Clear preview after upload
    } catch {
      // Optionally show error
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <>
      <Headerpowner />
      <div style={cardStyle}>
        {/* Profile Icon with Photo Upload */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <div style={{ marginRight: 18, position: "relative" }}>
            <label htmlFor="pharmacy-photo-upload" style={{ cursor: "pointer" }}>
              {selectedPhoto ? (
                <img
                  src={selectedPhoto}
                  alt="Preview"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #f7c815",
                  }}
                />
              ) : pharmacy && pharmacy.photoUrl ? (
                <img
                  src={pharmacy.photoUrl}
                  alt="Pharmacy"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #f7c815",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    color: "#bbb",
                    border: "2px solid #f7c815",
                  }}
                  title="Upload pharmacy photo"
                >
                  <span role="img" aria-label="profile">🏪</span>
                </div>
              )}
              <input
                id="pharmacy-photo-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
                disabled={photoUploading}
              />
              {photoUploading && (
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, width: 64, height: 64,
                  background: "rgba(255,255,255,0.7)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "#888"
                }}>
                  Uploading...
                </div>
              )}
            </label>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#222" }}>
              {pharmacy ? pharmacy.name : "Pharmacy"}
            </div>
            <div style={{ color: "#888", fontSize: 15 }}>
              {pharmacy ? pharmacy.address : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, color: "#222", fontWeight: 700 }}>
            <span role="img" aria-label="dashboard">📊</span> Dashboard
          </h2>
          <button
            onClick={fetchReport}
            style={{
              background: "#f7c815",
              color: "#222",
              border: "none",
              borderRadius: 8,
              padding: "8px 18px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            Refresh
          </button>
        </div>
        <div style={{ marginTop: 18, marginBottom: 18 }}>
          <label style={{ fontWeight: 600, marginRight: 10 }}>Filter:</label>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #ddd",
              fontWeight: 600,
              fontSize: 15,
              outline: "none",
              background: "#fafafa"
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <h3 style={{ marginTop: 8, color: "#444" }}>Most Searched Medicines</h3>
        {topMedicines.length === 0 ? (
          <div style={{
            textAlign: "center",
            marginTop: 40,
            color: "#888",
            fontWeight: 600,
            fontSize: 18,
            background: "#f8f8f8",
            borderRadius: 8,
            padding: "18px 0"
          }}>
            No search data available.
          </div>
        ) : (
          <div style={{ marginTop: 32 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </>
  );
}

export default PharmacyDashboard;
