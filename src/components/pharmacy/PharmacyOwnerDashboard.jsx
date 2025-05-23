import React, { useState, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PharmacyOwnerDashboard = () => {
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    stock: 0,
    isAvailable: true,
    recommended: "",
    price: 0,
  });
  const [editMedicine, setEditMedicine] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch medicines when component loads
  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API_URL}/api/medicines`);
      if (response.ok) {
        const data = await response.json();
        setMedicines(data);
      } else {
        throw new Error("Failed to fetch medicines");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${API_URL}/api/medicines/search?query=${searchQuery}`
      );
      if (response.ok) {
        const data = await response.json();
        setMedicines(data);
      } else {
        throw new Error("Failed to search medicines");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleAddMedicine = async () => {
    try {
      const response = await fetch(`${API_URL}/api/medicines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMedicine),
      });
      if (response.ok) {
        fetchMedicines();
        setNewMedicine({
          name: "",
          stock: 0,
          isAvailable: true,
          recommended: "",
          price: 0,
        });
      } else {
        throw new Error("Failed to add medicine");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleUpdateMedicine = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/medicines/${editMedicine.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editMedicine),
        }
      );
      if (response.ok) {
        fetchMedicines();
        setEditMedicine(null);
      } else {
        throw new Error("Failed to update medicine");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleDeleteMedicine = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/medicines/${id}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        fetchMedicines();
      } else {
        throw new Error("Failed to delete medicine");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="dashboard">
      <h1>Pharmacy Owner Dashboard</h1>
      {errorMessage && <p className="error">{errorMessage}</p>}

      <div className="search-section">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search medicines..."
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="add-section">
        <h2>Add New Medicine</h2>
        <input
          type="text"
          value={newMedicine.name}
          onChange={(e) =>
            setNewMedicine({ ...newMedicine, name: e.target.value })
          }
          placeholder="Medicine Name"
        />
        <input
          type="number"
          value={newMedicine.stock}
          onChange={(e) =>
            setNewMedicine({ ...newMedicine, stock: parseInt(e.target.value) })
          }
          placeholder="Stock"
        />
        <input
          type="number"
          value={newMedicine.price}
          onChange={(e) =>
            setNewMedicine({ ...newMedicine, price: parseFloat(e.target.value) })
          }
          placeholder="Price"
        />
        <input
          type="text"
          value={newMedicine.recommended}
          onChange={(e) =>
            setNewMedicine({ ...newMedicine, recommended: e.target.value })
          }
          placeholder="Recommended By"
        />
        <button onClick={handleAddMedicine}>Add Medicine</button>
      </div>

      <div className="list-section">
        <h2>Medicine List</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock</th>
              <th>Price</th>
              <th>Recommended</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((medicine) => (
              <tr key={medicine.id}>
                <td>{medicine.name}</td>
                <td>{medicine.stock}</td>
                <td>{medicine.price}</td>
                <td>{medicine.recommended}</td>
                <td>
                  <button
                    onClick={() => setEditMedicine({ ...medicine })}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDeleteMedicine(medicine.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editMedicine && (
        <div className="edit-section">
          <h2>Edit Medicine</h2>
          <input
            type="text"
            value={editMedicine.name}
            onChange={(e) =>
              setEditMedicine({ ...editMedicine, name: e.target.value })
            }
            placeholder="Medicine Name"
          />
          <input
            type="number"
            value={editMedicine.stock}
            onChange={(e) =>
              setEditMedicine({
                ...editMedicine,
                stock: parseInt(e.target.value),
              })
            }
            placeholder="Stock"
          />
          <input
            type="number"
            value={editMedicine.price}
            onChange={(e) =>
              setEditMedicine({
                ...editMedicine,
                price: parseFloat(e.target.value),
              })
            }
            placeholder="Price"
          />
          <input
            type="text"
            value={editMedicine.recommended}
            onChange={(e) =>
              setEditMedicine({ ...editMedicine, recommended: e.target.value })
            }
            placeholder="Recommended By"
          />
          <button onClick={handleUpdateMedicine}>Save</button>
          <button onClick={() => setEditMedicine(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default PharmacyOwnerDashboard;
