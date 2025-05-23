import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../common/header/Header";
import "./Profile.css";

const Profile = () => {  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();  useEffect(() => {
    // Get user data from localStorage, same as Header component
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      setLoading(false);
    } else {
      // Redirect to login if user is not logged in
      navigate('/login');
    }
  }, [navigate]);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading profile information...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{user.firstName ? user.firstName[0] : 'U'}</span>
          </div>
          <div className="profile-info">
            <h1>{user.firstName} {user.lastName}</h1>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="profile-content">
          <div className="profile-section">
            <h2>Personal Information</h2>
            <div className="profile-details">
              <div className="detail-item">
                <span className="label">First Name</span>
                <span className="value">{user.firstName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Last Name</span>
                <span className="value">{user.lastName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email</span>
                <span className="value">{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="label">Account Type</span>
                <span className="value">{user.role}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-actions">
            <Link to="/prescriptionScanner" className="action-button">
              <i className="fas fa-capsules"></i>
              Scan New Prescription
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
