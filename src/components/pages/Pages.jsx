import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../home/Home";
import AddPharmacy from "../Admin/AddPharmacy";
import ManageMedicine from "../Admin/ManageMedicine";
import ManagePharmacyMedicines from "../Admin/ManagePharmacyMedicines";
import Login from "../home/Login/Login";
import Hero from "../home/hero/Hero";
import Headerpowner from "../common/header/Headerpowner";
import HeaderAdmin from "../common/header/HeaderAdmin";
import Register from "../home/Register/Register";

const Pages = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-pharmacy" element={<AddPharmacy />} />
          <Route path="/manage-medicine" element={<ManageMedicine />} />
          <Route path="/manage-Pharmacy-medicines" element={<ManagePharmacyMedicines />} />
          <Route path="/login" element={<Login />} />
          <Route path="/hero" element={<Hero/>} />
          <Route path="/register" element={< Register/>}/>
          <Route path="/headerAdmin" element={<HeaderAdmin/>} />
          <Route path="/headerpowner" element={<Headerpowner/>} />
        </Routes>
      </Router>
    </>
  );
};

export default Pages;
