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
import ManageCalendar from "../pharmacy/ManageCalendar";
import PharmacyDashboard from "../Admin/PharmacyDashboard";
 import PharmacyStock from "../pharmacy/PharmacyStock";
import PharmacyLowStock from "../pharmacy/PharmacyLowStock";  
import PharmacyDashboard2 from "../pharmacy/PharmacyDashboard";
import ForgotPassword from "../home/Login/ForgotPassword"

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
          <Route path="/manage-calendar" element={<ManageCalendar/>} />
           <Route path="/pharmacy-stock" element={<PharmacyStock/>} />
           <Route path="/pharmacy-low-stock" element={<PharmacyLowStock/>} />
           <Route path="/pharmacy-dashboard" element={<PharmacyDashboard2/>} />
          

<Route path="/forgot-password" element={<ForgotPassword />} />

        </Routes>
      </Router>
    </>
  );
};

export default Pages;
