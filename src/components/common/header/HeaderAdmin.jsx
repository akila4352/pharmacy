import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./header.css";

const HeaderAdmin = () => {
  const [navList, setNavList] = useState(false); // State to toggle navigation list
 
  return (

      <header>
        <div className="container flex">          <div className="logo">
            <img src="/images/logo.png" alt="logo" style={{ width: "75px", height: "auto" }} />
          </div>
          <div className="nav">
            <ul className={navList ? "small" : "flex"}>  
      
              <li>
                <Link to="/manage-Pharmacy-medicines">Home</Link>
              </li>

              <li>
                <Link to="/alert">Alerts</Link>
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

  

  );
};

export default HeaderAdmin;
