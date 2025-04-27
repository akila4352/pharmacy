import React, { useState, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ManageMedicine = () => {
  const [stock, setStock] = useState([]);
  const [editMedicine, setEditMedicine] = useState(null);
  const [newMedicine, setNewMedicine] = useState({
    medicineName: "",
    price: "",
    isAvailable: true,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pharmacies/owner-stock`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch stock");
      const data = await res.json();
      setStock(data.stock || []);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleAddMedicine = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pharmacies/update-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newMedicine),
      });
      if (!res.ok) throw new Error("Failed to add medicine");
      setNewMedicine({ medicineName: "", price: "", isAvailable: true });
      fetchStock();
      setMessage("Medicine added successfully!");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleUpdateMedicine = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pharmacies/update-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editMedicine),
      });
      if (!res.ok) throw new Error("Failed to update medicine");
      setEditMedicine(null);
      fetchStock();
      setMessage("Medicine updated successfully!");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleDeleteMedicine = async (medicineName) => {
    try {
      const updatedStock = stock.filter(
        (item) => item.medicineName !== medicineName
      );
      const res = await fetch(`${API_URL}/api/pharmacies/update-stock-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ stock: updatedStock }),
      });
      if (!res.ok) throw new Error("Failed to delete medicine");
      fetchStock();
      setMessage("Medicine deleted successfully!");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="manage-medicine">
      <h1>Manage Medicines</h1>
      {message && <p className="message">{message}</p>}

      {/* Add New Medicine */}
      <div className="add-medicine">
        <h2>Add New Medicine</h2>
        <input
          type="text"
          placeholder="Medicine Name"
          value={newMedicine.medicineName}
          onChange={(e) =>
            setNewMedicine({ ...newMedicine, medicineName: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Price"
          value={newMedicine.price}
          onChange={(e) =>
            setNewMedicine({ ...newMedicine, price: e.target.value })
          }
        />
        <select
          value={newMedicine.isAvailable}
          onChange={(e) =>
            setNewMedicine({ ...newMedicine, isAvailable: e.target.value === "true" })
          }
        >
          <option value="true">Available</option>
          <option value="false">Not Available</option>
        </select>
        <button onClick={handleAddMedicine}>Add Medicine</button>
      </div>

      {/* Medicine List */}
      <div className="medicine-list">
        <h2>Medicine Stock</h2>
        <table>
          <thead>
            <tr>
              <th>Medicine Name</th>
              <th>Price</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((medicine, index) => (
              <tr key={index}>
                <td>
                  {editMedicine?.medicineName === medicine.medicineName ? (
                    <input
                      type="text"
                      value={editMedicine.medicineName}
                      onChange={(e) =>
                        setEditMedicine({
                          ...editMedicine,
                          medicineName: e.target.value,
                        })
                      }
                    />
                  ) : (
                    medicine.medicineName
                  )}
                </td>
                <td>
                  {editMedicine?.medicineName === medicine.medicineName ? (
                    <input
                      type="number"
                      value={editMedicine.price}
                      onChange={(e) =>
                        setEditMedicine({
                          ...editMedicine,
                          price: e.target.value,
                        })
                      }
                    />
                  ) : (
                    `$${medicine.price}`
                  )}
                </td>
                <td>
                  {editMedicine?.medicineName === medicine.medicineName ? (
                    <select
                      value={editMedicine.isAvailable}
                      onChange={(e) =>
                        setEditMedicine({
                          ...editMedicine,
                          isAvailable: e.target.value === "true",
                        })
                      }
                    >
                      <option value="true">Available</option>
                      <option value="false">Not Available</option>
                    </select>
                  ) : medicine.isAvailable ? (
                    "Available"
                  ) : (
                    "Not Available"
                  )}
                </td>
                <td>
                  {editMedicine?.medicineName === medicine.medicineName ? (
                    <>
                      <button onClick={handleUpdateMedicine}>Save</button>
                      <button onClick={() => setEditMedicine(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditMedicine({ ...medicine })}>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMedicine(medicine.medicineName)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageMedicine;
