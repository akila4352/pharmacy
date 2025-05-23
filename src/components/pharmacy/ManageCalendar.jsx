import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Headerpowner from "../common/header/Headerpowner";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ManageCalendar = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [openingTimes, setOpeningTimes] = useState({
        open: "09:00",
        close: "18:00",
    });
    const [isAvailable, setIsAvailable] = useState(true);
    const [message, setMessage] = useState("");
    const [pharmacyId, setPharmacyId] = useState(null);

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
                    }
                } else {
                    throw new Error("Failed to fetch pharmacy owner details.");
                }
            } catch (err) {
                setMessage(`Error: ${err.message}`);
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
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        }
    };

    return (
        <div>
            <Headerpowner />
            <div className="calendar-container">
                <h2>Manage Calendar</h2>
                <Calendar onChange={handleDateChange} value={selectedDate} />
                <div className="time-settings">
                    <label>
                        Opening Time:
                        <input
                            type="time"
                            name="open"
                            value={openingTimes.open}
                            onChange={handleTimeChange}
                        />
                    </label>
                    <label>
                        Closing Time:
                        <input
                            type="time"
                            name="close"
                            value={openingTimes.close}
                            onChange={handleTimeChange}
                        />
                    </label>
                </div>
                <div className="availability-settings">
                    <label>
                        Availability:
                        <select value={isAvailable} onChange={handleAvailabilityChange}>
                            <option value={true}>Available</option>
                            <option value={false}>Not Available</option>
                        </select>
                    </label>
                </div>
                <button className="save-button" onClick={handleSave}>
                    Save
                </button>
                {message && <p>{message}</p>}
            </div>
        </div>
    );
};

export default ManageCalendar;
