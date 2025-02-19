import React from "react";
import Header from "../common/header/Header";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../home/Home";
import AddPharmacy from "../Admin/AddPharmacy";
import ManageMedicine from "../Admin/ManageMedicine";
import ManagePharmacyMedicines from "../Admin/ManagePharmacyMedicines";
import Login from "../home/Login/Login";
import Hero from "../home/hero/Hero";
import Register from "../home/Register/Register";
const Pages = () => {
  return (
    <>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-pharmacy" element={<AddPharmacy />} />
          <Route path="/manage-medicine" element={<ManageMedicine />} />
          <Route path="/manage-medicine" element={<ManageMedicine />} />
          <Route path="/manage-Pharmacy-medicines" element={<ManagePharmacyMedicines />} />
          <Route path="/login" element={<Login />} />
          <Route path="/hero" element={<Hero/>} />
          <Route path="/register" element={< Register/>} />
        </Routes>
      </Router>
    </>
  );
};

export default Pages;
