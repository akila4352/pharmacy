import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const PharmacyMedicineManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    price: '',
    quantity: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Get pharmacy user ID from local storage
  const user = JSON.parse(localStorage.getItem('user'));
  const pharmacyId = user?.id;
  const token = localStorage.getItem('token');

  // Set up axios headers with authentication token
  const authAxios = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // Fetch pharmacy's medicines on component mount
  useEffect(() => {
    const fetchMedicines = async () => {
      if (!pharmacyId) return;
      
      setLoading(true);
      try {
        const response = await authAxios.get(`/api/medicines/pharmacy/${pharmacyId}`);
        setMedicines(response.data);
      } catch (err) {
        setError('Failed to fetch medicines');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, [pharmacyId]);

  const handleInputChange = (e) => {
    setNewMedicine({ 
      ...newMedicine, 
      [e.target.name]: e.target.value 
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    // Clear any previous errors
    setError('');
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    
    try {
      // Add pharmacyId to the medicine data
      const medicineData = {
        ...newMedicine,
        pharmacyId,
        // Convert number strings to actual numbers
        price: parseFloat(newMedicine.price),
        quantity: parseInt(newMedicine.quantity, 10)
      };
      
      const response = await authAxios.post('/api/medicines', medicineData);
      
      // Update the medicines list
      setMedicines([...medicines, response.data]);
      
      // Reset the form
      setNewMedicine({
        name: '',
        dosage: '',
        price: '',
        quantity: '',
      });
      
      alert('Medicine added successfully!');
    } catch (err) {
      setError('Error adding medicine: ' + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

// Update the handleBulkUpload function in your React component

const handleBulkUpload = async () => {
  if (!file) {
    return setError('Please select a file');
  }

  setLoading(true);
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (jsonData.length === 0) {
      setError('The file is empty or not formatted correctly');
      setLoading(false);
      return;
    }
    
    // Validate each row in the Excel data
    const validData = jsonData.map(item => {
      // Ensure all required fields exist and convert to appropriate types
      return {
        name: String(item.name || ''),
        dosage: String(item.dosage || ''),
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity, 10) || 0,
      };
    }).filter(item => item.name && item.dosage); // Filter out invalid entries
    
    if (validData.length === 0) {
      setError('No valid medicine data found in the file');
      setLoading(false);
      return;
    }
    
    // Send valid data to server - this is the key fix
    await authAxios.post('/api/medicines/bulk', validData);

    // Refresh medicines list - use the correct endpoint
    const response = await authAxios.get('/api/medicines');
    setMedicines(response.data);
    
    setFile(null);
    // Reset the file input 
    document.getElementById('file-input').value = '';
    alert(`Bulk import successful! Imported ${validData.length} medicines.`);
  } catch (err) {
    setError('Bulk import failed: ' + (err.response?.data?.error || err.message));
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const handleEdit = (medicine) => {
    setEditingId(medicine._id);
    setNewMedicine({
      name: medicine.name,
      dosage: medicine.dosage,
      price: medicine.price,
      quantity: medicine.quantity
    });
  };

  const handleUpdate = async () => {
    try {
      const updatedMedicine = {
        ...newMedicine,
        pharmacyId,
        price: parseFloat(newMedicine.price),
        quantity: parseInt(newMedicine.quantity, 10)
      };
      
      await authAxios.put(`/api/medicines/${editingId}`, updatedMedicine);
      
      // Update the medicines list
      setMedicines(medicines.map(med => 
        med._id === editingId ? {...med, ...updatedMedicine} : med
      ));
      
      // Reset form and editing state
      setNewMedicine({
        name: '',
        dosage: '',
        price: '',
        quantity: '',
      });
      setEditingId(null);
      
      alert('Medicine updated successfully!');
    } catch (err) {
      setError('Error updating medicine: ' + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await authAxios.delete(`/api/medicines/${id}`);
        
        // Update the medicines list
        setMedicines(medicines.filter(med => med._id !== id));
        
        alert('Medicine deleted successfully!');
      } catch (err) {
        setError('Error deleting medicine: ' + (err.response?.data?.error || err.message));
        console.error(err);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewMedicine({
      name: '',
      dosage: '',
      price: '',
      quantity: '',
    });
  };

  // Sample template download
  const downloadTemplate = () => {
    // Create a sample template with proper column headers
    const template = [
      { name: 'Example Medicine', dosage: '500mg', price: 10.99, quantity: 100 }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicines');
    XLSX.writeFile(workbook, 'medicine_template.xlsx');
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pharmacy Medicine Management</h1>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add/Edit Medicine Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>
          
          <form onSubmit={editingId ? undefined : handleAddMedicine} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Medicine Name</label>
              <input
                type="text"
                name="name"
                value={newMedicine.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-2 border"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Dosage</label>
              <input
                type="text"
                name="dosage"
                value={newMedicine.dosage}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-2 border"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input
                type="number"
                name="price"
                value={newMedicine.price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-2 border"
                required
                step="0.01"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={newMedicine.quantity}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-2 border"
                required
                min="0"
              />
            </div>
            
            <div className="flex space-x-2">
              {editingId ? (
                <>
                  <button 
                    type="button" 
                    onClick={handleUpdate}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Update Medicine
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  type="submit" 
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add Medicine
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Bulk Import */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Bulk Import Medicines</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload an Excel file with your medicines data. Each row should contain name, dosage, price, and quantity columns.
            </p>
            
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The Excel file must have columns named exactly:
                <br />
                <code>name</code>, <code>dosage</code>, <code>price</code>, <code>quantity</code>
              </p>
            </div>
            
            <button 
              onClick={downloadTemplate}
              className="text-blue-600 underline text-sm hover:text-blue-800"
            >
              Download template file
            </button>
            
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">Select File</label>
              <input 
                id="file-input"
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={handleFileChange}
                className="mt-1 block w-full"
              />
            </div>
            
            <button
              onClick={handleBulkUpload}
              disabled={loading || !file}
              className={`w-full ${loading || !file ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded`}
            >
              {loading ? 'Uploading...' : 'Upload Medicines'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Medicines List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Medicines</h2>
        
        {loading && !medicines.length ? (
          <p>Loading medicines...</p>
        ) : medicines.length === 0 ? (
          <p>No medicines found. Add your first medicine above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {medicines.map((medicine) => (
                  <tr key={medicine._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{medicine.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{medicine.dosage}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${parseFloat(medicine.price).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{medicine.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(medicine)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(medicine._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyMedicineManagement;