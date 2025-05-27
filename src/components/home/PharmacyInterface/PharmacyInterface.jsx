import React, { useState, useEffect } from 'react';
import Headerpowner from "../../common/header/Headerpowner";
const PharmacyInterface = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPrescriptions();
  }, []);
 
  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('token'); // Assuming you store the token in localStorage
      const response = await fetch(`${API_URL}/api/pharmacy/prescriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setPrescriptions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setLoading(false);
    }
  };

  const handleAvailabilityUpdate = async (prescriptionId, isAvailable, price) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/pharmacy/update-availability`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prescriptionId,
          isAvailable,
          price
        })
      });

      if (response.ok) {
        // Remove the responded prescription from the list
        setPrescriptions(prev => 
          prev.filter(prescription => prescription._id !== prescriptionId)
        );
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;
  }

  return (<div><Headerpowner></Headerpowner>
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Pending Prescription Requests</h2>
      
      {prescriptions.length === 0 ? (
        <p>No pending prescription requests</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Patient</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Prescription Image</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Extracted Text</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map(prescription => (
                <tr key={prescription._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>
                    {prescription.patientId.firstName} {prescription.patientId.lastName}
                    <br />
                    <small style={{ color: '#6c757d' }}>{prescription.patientId.email}</small>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <img 
                      src={prescription.imageData} 
                      alt="Prescription"
                      style={{ maxWidth: '200px', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      margin: 0,
                      fontSize: '14px'
                    }}>
                      {prescription.rawText}
                    </pre>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                      <input
                        type="number"
                        placeholder="Enter price"
                        style={{
                          padding: '8px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          width: '120px'
                        }}
                        id={`price-${prescription._id}`}
                      />
                      <button
                        onClick={() => {
                          const price = document.getElementById(`price-${prescription._id}`).value;
                          handleAvailabilityUpdate(prescription._id, true, Number(price));
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Available
                      </button>
                      <button
                        onClick={() => handleAvailabilityUpdate(prescription._id, false, 0)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Not Available
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div></div>
  );
};

export default PharmacyInterface;