import React, { useState } from "react";
import * as XLSX from "xlsx";
import Headerpowner from "../common/header/Headerpowner";
import Heading from "../common/Heading"; 

// Use the correct environment variable for backend URL
const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const UpdateStock = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [singleStock, setSingleStock] = useState({
    medicineName: "",
    price: "",
    isAvailable: true,
    quantity: "", // <-- add quantity field
  });
  const [bulkStock, setBulkStock] = useState([]);

  const handleSingleChange = (e) => {
    const { name, value } = e.target;
    setSingleStock((prev) => ({ ...prev, [name]: value }));
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/pharmacies/update-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(singleStock),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update stock");
      }

      setMessage("Stock updated successfully!");
      setMessageType("success");
      setSingleStock({ medicineName: "", price: "", isAvailable: true, quantity: "" });

      // Refresh My Stock and Low Stock Alert
      window.dispatchEvent(new Event("stock-updated"));
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setMessageType("error");
    }
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setBulkStock(jsonData);
      } catch (error) {
        setMessage("Error reading the file. Please ensure it is a valid Excel file.");
        setMessageType("error");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkSubmit = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pharmacies/update-stock-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ stock: bulkStock }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update stock in bulk");
      }

      setMessage("Bulk stock updated successfully!");
      setMessageType("success");
      setBulkStock([]);

      // Refresh My Stock and Low Stock Alert
      window.dispatchEvent(new Event("stock-updated"));
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setMessageType("error");
    }
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { medicineName: "Paracetamol", price: 10.5, isAvailable: true, quantity: 200 },
      { medicineName: "Ibuprofen", price: 15.0, isAvailable: false, quantity: 50 },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "bulk_stock_template.xlsx");
  };

  return (
    <div>
      <Headerpowner />
      <section className="hero">
        <div className="container">
          <Heading title="Update Stock" />

          {/* Single Stock Update */}
          <form className="flex" onSubmit={handleSingleSubmit}>
            <div className="box">
              <span>Medicine Name</span>
              <input
                type="text"
                name="medicineName"
                placeholder="Enter medicine name"
                value={singleStock.medicineName}
                onChange={handleSingleChange}
                required
              />
            </div>
            <div className="box">
              <span>Price</span>
              <input
                type="number"
                name="price"
                placeholder="Enter price"
                value={singleStock.price}
                onChange={handleSingleChange}
                required
                step="0.01"
              />
            </div>
            <div className="box">
              <span>Quantity</span>
              <input
                type="number"
                name="quantity"
                placeholder="Enter quantity"
                value={singleStock.quantity}
                onChange={handleSingleChange}
                required
                min={0}
              />
            </div>
            <div className="box">
              <span>Availability</span>
              <select
                name="isAvailable"
                value={singleStock.isAvailable}
                onChange={handleSingleChange}
              >
                <option value={true}>Available</option>
                <option value={false}>Not Available</option>
              </select>
            </div>
            <button className="btn1" type="submit">
              Update Stock
            </button>
          </form>

          {/* Bulk Stock Update */}
          <div className="bulk-upload">
            <h3>Bulk Update</h3>
            <button className="btn1" onClick={handleDownloadTemplate}>
              Download Template
            </button>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleBulkUpload}
            />
            {bulkStock.length > 0 && (
              <button className="btn1" onClick={handleBulkSubmit}>
                Submit Bulk Stock
              </button>
            )}
          </div>

          {showPopup && (
            <div className={`popup ${messageType}`}>
              <p>{message}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UpdateStock;