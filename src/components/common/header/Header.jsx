import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./header.css";

const Header = () => {
  const [navList, setNavList] = useState(false); // State to toggle navigation list
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get user data from localStorage when component mounts
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);
  
  const handleLogout = () => {
    // Remove user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };
 
  return (
    <>
      <header>
        <div className="container flex">
          <div className="logo">
            <img src="/images/logo.png" alt="logo" style={{ width: "75px", height: "auto" }} />
          </div>
          <div className="nav">
            <ul className={navList ? "small" : "flex"}>
              <li>
                <Link to="/Hero">Home</Link>
              </li>
   
              <li>
                <Link to="/prescriptionScanner">Prescription Scanner</Link>
              </li>
            </ul>
          </div>
          
          {user ? (
            <div className="user-profile">
              <div 
                className="profile-icon" 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <span className="user-initial">{user.firstName ? user.firstName[0] : 'U'}</span>
                <span className="user-name">{user.firstName} {user.lastName}</span>
                <i className={`fa fa-chevron-${showProfileMenu ? 'up' : 'down'}`}></i>
              </div>
              
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    <p className="full-name">{user.firstName} {user.lastName}</p>
                    <p className="email">{user.email}</p>
                  </div>
                  <ul>
                    <li><Link to="/profile">My Profile</Link></li>
                    <li><button onClick={handleLogout}>Logout</button></li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/register" className="register-btn">Register</Link>
            </div>
          )}
    
          <div className="toggle">
            <button onClick={() => setNavList(!navList)}>
              {navList ? <i className="fa fa-times"></i> : <i className="fa fa-bars"></i>}
            </button>
          </div>
        </div>
      </header>

  
    </>
  );
};

export default Header;
