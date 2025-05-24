import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./header.css";

const Headerpowner = () => {
  const [navList, setNavList] = useState(false); // State to toggle navigation list
 


 

  return (
    <>
      <header>
        <div className="container flex">
          <div className="logo">
            <img src="./images/logo.png" alt="logo" style={{ width: "75px", height: "auto" }} />
          </div>          <div className="nav">
            <ul className={navList ? "small" : "flex"}>
              <li>
                <Link to="/owner-dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/add-pharmacy">Home</Link>
              </li>
              <li>
                <Link to="/manage-medicine">Manage Medicine</Link>
              </li>
              <li>
                <Link to="/pharmacyInterface">Pharmacy Interface</Link>
              </li>
            </ul>
          </div>
    
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

export default Headerpowner;
