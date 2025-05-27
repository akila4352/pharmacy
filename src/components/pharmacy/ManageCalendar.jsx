import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Headerpowner from "../common/header/Headerpowner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const cardStyle = {
  maxWidth: 500,
  margin: "32px auto",
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
  padding: 32,
};

const labelStyle = {
  display: "block",
  marginBottom: 8,
  color: "#222",
  fontWeight: 600,
  fontSize: 15,
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ddd",
  fontSize: 15,
  marginBottom: 16,
};

const selectStyle = {
  ...inputStyle,
  width: "100%",
};

const buttonStyle = {
  background: "#f7c815",
  color: "#222",
  border: "none",
  borderRadius: 8,
  padding: "10px 28px",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
  marginTop: 12,
  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
};

const msgStyle = (success) => ({
  marginTop: 18,
  color: success ? "#52c41a" : "#ff4d4f",
  background: success ? "#eaffea" : "#fff1f0",
  borderRadius: 8,
  padding: "10px 0",
  textAlign: "center",
  fontWeight: 600,
  fontSize: 15,
});

const calendarContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 18,
};

const timeRowStyle = {
  display: "flex",
  gap: 16,
  width: "100%",
  marginBottom: 12,
};

const availRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
};

const ManageCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openingTimes, setOpeningTimes] = useState({
    open: "09:00",
    close: "18:00",
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [message, setMessage] = useState("");
  const [pharmacyId, setPharmacyId] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch pharmacy ID from the backend
    const fetchPharmacyId = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/pharmacy-owners`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setPharmacyId(data[0]._id); // Assuming the first pharmacy owner is the current user
            localStorage.setItem("pharmacyId", data[0]._id);
          } else {
            setMessage("No pharmacy owner found for the current user.");
            setSuccess(false);
          }
        } else {
          throw new Error("Failed to fetch pharmacy owner details.");
        }
      } catch (err) {
        setMessage(`Error: ${err.message}`);
        setSuccess(false);
      }
    };

    fetchPharmacyId();
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setOpeningTimes((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvailabilityChange = (e) => {
    setIsAvailable(e.target.value === "true");
  };

  const handleSave = async () => {
    if (!pharmacyId) {
      setMessage("Pharmacy ID is missing. Cannot save calendar entry.");
      setSuccess(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/pharmacies/${pharmacyId}/calendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          openingTime: openingTimes.open,
          closingTime: openingTimes.close,
          isAvailable,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setMessage("Calendar entry saved successfully!");
      setSuccess(true);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setSuccess(false);
    }
  };
 
  return (
    <>
      <Headerpowner />
      <div style={cardStyle}>
        <h2 style={{ color: "#222", fontWeight: 700, marginBottom: 18, textAlign: "center" }}>
          <span role="img" aria-label="calendar">📅</span> Manage Pharmacy Calendar
        </h2>
        <div style={calendarContainerStyle}>
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
          />
          <div style={timeRowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Opening Time:</label>
              <input
                type="time"
                name="open"
                value={openingTimes.open}
                onChange={handleTimeChange}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Closing Time:</label>
              <input
                type="time"
                name="close"
                value={openingTimes.close}
                onChange={handleTimeChange}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={availRowStyle}>
            <label style={labelStyle}>Availability:</label>
            <select
              value={isAvailable}
              onChange={handleAvailabilityChange}
              style={selectStyle}
            >
              <option value={true}>Available</option>
              <option value={false}>Not Available</option>
            </select>
          </div>
          <button style={buttonStyle} onClick={handleSave}>
            Save
          </button>
          {message && (
            <div style={msgStyle(success)}>
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ManageCalendar;
