import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "./header.css";

// Example avatars (add your own images in public/user-icons/)
const avatarOptions = [
  { value: "default", label: "Default", src: "/user-icons/default.png" },
  { value: "avatar1", label: "Avatar 1", src: "/user-icons/avatar1.png" },
  { value: "avatar2", label: "Avatar 2", src: "/user-icons/avatar2.png" }
];
 
const Header = () => {
  const [navList, setNavList] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Simulate user info (replace with real user context/auth in production)
  const user = JSON.parse(localStorage.getItem("userProfile") || "null");
  const [profileData, setProfileData] = useState(user || {});

  // Save profile to backend (if logged in) and localStorage
  const handleProfileSave = async () => {
    // Save to localStorage for UI demo
    localStorage.setItem("userProfile", JSON.stringify(profileData));
    // If user is logged in and has an id, update backend
    if (profileData._id) {
      try {
        await fetch(`${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/users/${profileData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            // add other editable fields as needed
          }),
        });
      } catch (e) {
        // Optionally show error to user
      }
    }
    setEditMode(false);
    setShowProfilePopup(false);
    window.location.reload();
  };

  const popupRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    if (!showProfilePopup) return;
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowProfilePopup(false);
        setEditMode(false);
      }
    };
    document.addEventListener("mousedown", handleClick, true);
    return () => document.removeEventListener("mousedown", handleClick, true);
  }, [showProfilePopup]);

  const handleProfileClick = () => {
    setShowProfilePopup((prev) => !prev);
    setEditMode(false);
    setProfileData(user || {});
  };

  const handleEditProfile = () => setEditMode(true);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Get avatar src
  const getAvatarSrc = (icon) => {
    const found = avatarOptions.find(a => a.value === icon);
    return found ? found.src : avatarOptions[0].src;
  };

  return (
    <>
      <header>
        <div className="container flex">
          <div className="logo">
            <img src="./images/logo.png" alt="logo" style={{ width: "75px", height: "auto" }} />
          </div>
          <div className="nav">
            <ul className={navList ? "small" : "flex"}>
              <li>
                <Link to="/Hero">Home</Link>
              </li>
              <li>
                <Link to="/prescriptionScanner">prescriptionScanner</Link>
              </li>
            </ul>
          </div>
          {/* Show current logged-in user's name and greeting */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {profileData && (profileData.name || profileData.username) && (
              <span style={{
                fontWeight: 600,
                color: "#3498db",
                fontSize: 18,
                marginRight: 8,
                letterSpacing: 0.5
              }}>
                hi {profileData.name || profileData.username}
              </span>
            )}
            {/* User profile icon and menu */}
            <div style={{ cursor: "pointer", position: "relative" }}>
              {profileData.profileIcon && profileData.profileIcon !== "default" ? (
                <img
                  src={getAvatarSrc(profileData.profileIcon)}
                  alt="Profile"
                  style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #eee" }}
                  onClick={handleProfileClick}
                />
              ) : (
                <FaUserCircle size={36} color="#888" onClick={handleProfileClick} />
              )}
              {/* Profile Popup */}
              {showProfilePopup && (
                <div
                  ref={popupRef}
                  id="profile-popup"
                  style={{
                    position: "absolute",
                    top: 44,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #444",
                    borderRadius: 16,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                    minWidth: 320,
                    zIndex: 100,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    color: "#222"
                  }}
                >
                  {/* Large avatar */}
                  <div style={{ marginBottom: 18 }}>
                    {profileData.profileIcon && profileData.profileIcon !== "default" ? (
                      <img
                        src={getAvatarSrc(profileData.profileIcon)}
                        alt="Profile"
                        style={{ width: 90, height: 90, borderRadius: "50%", border: "3px solid #3498db" }}
                      />
                    ) : (
                      <FaUserCircle size={90} color="#3498db" />
                    )}
                  </div>
                  {/* Show greeting message with user name */}
                  <div style={{ fontWeight: "bold", marginBottom: 12, textAlign: "center", fontSize: 20, color: "#3498db" }}>
                    {profileData && (profileData.name || profileData.username) && (
                      <>hi {profileData.name || profileData.username}</>
                    )}
                  </div>
                  {editMode ? (
                    <>
                      <input
                        type="text"
                        name="name"
                        value={profileData.name || ""}
                        onChange={handleProfileChange}
                        placeholder="Name"
                        style={{
                          width: "95%",
                          marginBottom: 10,
                          padding: 8,
                          borderRadius: 8,
                          border: "1px solid #bbb",
                          background: "#f8f8f8",
                          color: "#222"
                        }}
                      />
                      <input
                        type="email"
                        name="email"
                        value={profileData.email || ""}
                        onChange={handleProfileChange}
                        placeholder="Email"
                        style={{
                          width: "95%",
                          marginBottom: 10,
                          padding: 8,
                          borderRadius: 8,
                          border: "1px solid #bbb",
                          background: "#f8f8f8",
                          color: "#222"
                        }}
                      />
                      <input
                        type="text"
                        name="phone"
                        value={profileData.phone || ""}
                        onChange={handleProfileChange}
                        placeholder="Phone"
                        style={{
                          width: "95%",
                          marginBottom: 10,
                          padding: 8,
                          borderRadius: 8,
                          border: "1px solid #bbb",
                          background: "#f8f8f8",
                          color: "#222"
                        }}
                      />
                      <select
                        name="profileIcon"
                        value={profileData.profileIcon || "default"}
                        onChange={handleProfileChange}
                        style={{
                          width: "95%",
                          marginBottom: 18,
                          padding: 8,
                          borderRadius: 8,
                          border: "1px solid #bbb",
                          background: "#f8f8f8",
                          color: "#222"
                        }}
                      >
                        {avatarOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        style={{
                          width: "100%",
                          padding: "10px 0",
                          border: "none",
                          borderRadius: 8,
                          background: "#3498db",
                          color: "#fff",
                          marginBottom: 10,
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                        onClick={handleProfileSave}
                      >
                        Save
                      </button>
                      <button
                        style={{
                          width: "100%",
                          padding: "10px 0",
                          border: "none",
                          borderRadius: 8,
                          background: "#bbb",
                          color: "#222",
                          cursor: "pointer"
                        }}
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: "bold", marginBottom: 8, textAlign: "center", fontSize: 22 }}>
                        {profileData.name || profileData.username || profileData.email}
                      </div>
                      <div style={{ fontSize: 15, color: "#666", marginBottom: 18, textAlign: "center" }}>
                        {profileData.email}
                      </div>
                      <button
                        style={{
                          width: "100%",
                          padding: "10px 0",
                          border: "none",
                          borderRadius: 8,
                          background: "#3498db",
                          color: "#fff",
                          marginBottom: 10,
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                        onClick={handleEditProfile}
                      >
                        Edit Profile
                      </button>
                      <button
                        style={{
                          width: "100%",
                          padding: "10px 0",
                          border: "none",
                          borderRadius: 8,
                          background: "#bbb",
                          color: "#222",
                          cursor: "pointer"
                        }}
                        onClick={() => setShowProfilePopup(false)}
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
