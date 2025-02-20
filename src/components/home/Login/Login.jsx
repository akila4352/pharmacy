import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "patient" // Default role
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Role-based navigation
        switch (formData.role) {
          case 'patient':
            navigate("/hero");
            break;
          case 'pharmacy':
            navigate("/manage-medicine");
            break;
          case 'admin':
            navigate("/manage-Pharmacy-medicines");
            break;
          default:
            navigate("/hero"); // Default route for unknown roles
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An error occurred during login");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Select Role</label>
            <select
              id="role"
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
          <button type="submit" className="login-button">Login</button>
          <button type="button" className="register-button" onClick={() => navigate("/register")}>Register</button>
        </form>
      </div>
    </div>
  );
};

export default Login;