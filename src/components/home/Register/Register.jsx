import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    role: "patient",
    adminCode: "",
    // Pharmacy specific fields
    pharmacyName: "",
    address: "",
    medicineName: "",
    price: "",
    latitude: "",
    longitude: "",
    isAvailable: true
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate admin code
    if (formData.role === 'admin' && formData.adminCode !== '1234') {
      setError("Invalid admin code");
      return;
    }

    // Validate pharmacy fields
    if (formData.role === 'pharmacy') {
      const requiredFields = ['pharmacyName', 'address', 'medicineName', 'price', 'latitude', 'longitude'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required pharmacy fields: ${missingFields.join(', ')}`);
        return;
      }
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An error occurred during registration");
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">Register</h2>
        <form onSubmit={handleSubmit} className="register-form">
          {error && <p className="error">{error}</p>}
          
          {/* Basic Fields */}
          <div className="form-group">
            <input 
              type="text" 
              name="firstName" 
              placeholder="First Name" 
              value={formData.firstName} 
              onChange={handleChange} 
              required 
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input 
              type="text" 
              name="lastName" 
              placeholder="Last Name" 
              value={formData.lastName} 
              onChange={handleChange} 
              required 
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input 
              type="text" 
              name="username" 
              placeholder="Username" 
              value={formData.username} 
              onChange={handleChange} 
              required 
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              className="form-input"
            />
          </div>

          <div className="form-group">
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              required
              className="form-input"
            >
              <option value="patient">Patient</option>
              <option value="pharmacy">Pharmacy Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Admin Code Field */}
          {formData.role === 'admin' && (
            <div className="form-group">
              <input 
                type="password" 
                name="adminCode" 
                placeholder="Admin Secret Code" 
                value={formData.adminCode} 
                onChange={handleChange} 
                required 
                className="form-input"
              />
            </div>
          )}

          {/* Pharmacy Fields */}
          {formData.role === 'pharmacy' && (
            <>
              <div className="form-group">
                <input 
                  type="text" 
                  name="pharmacyName" 
                  placeholder="Pharmacy Name" 
                  value={formData.pharmacyName} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <input 
                  type="text" 
                  name="address" 
                  placeholder="Address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <input 
                  type="text" 
                  name="medicineName" 
                  placeholder="Medicine Name" 
                  value={formData.medicineName} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <input 
                  type="number" 
                  name="price" 
                  placeholder="Price" 
                  value={formData.price} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <input 
                  type="text" 
                  name="latitude" 
                  placeholder="Latitude" 
                  value={formData.latitude} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <input 
                  type="text" 
                  name="longitude" 
                  placeholder="Longitude" 
                  value={formData.longitude} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                />
              </div>

              <div className="form-group checkbox">
                <label>
                  <input 
                    type="checkbox" 
                    name="isAvailable" 
                    checked={formData.isAvailable} 
                    onChange={handleChange} 
                  />
                  Medicine Available
                </label>
              </div>
            </>
          )}

          <button type="submit" className="register-button">Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;