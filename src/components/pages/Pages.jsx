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
import Header from "../common/header/Header";
import PrescriptionScanner from "../home/Prescription/PrescriptionScanner";

import PharmacyDashboard from "../Admin/PharmacyDashboard";
const Pages = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/PharmacyDashboard" element={<PharmacyDashboard />} />
          <Route path="/add-pharmacy" element={<AddPharmacy />} />
          <Route path="/manage-medicine" element={<ManageMedicine />} />
          <Route path="/manage-Pharmacy-medicines" element={<ManagePharmacyMedicines />} />
          <Route path="/login" element={<Login />} />
          <Route path="/hero" element={<Hero/>} />
          <Route path="/register" element={< Register/>}/>
          <Route path="/header" element={<Header/>} />
          <Route path="/headerAdmin" element={<HeaderAdmin/>} />
          <Route path="/headerpowner" element={<Headerpowner/>} />
          <Route path="/prescriptionScanner" element={<PrescriptionScanner/>} />
    
        </Routes>
      </Router>
    </>
  );
};

export default Pages;
