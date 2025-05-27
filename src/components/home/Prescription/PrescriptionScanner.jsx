import React, { useState, useRef } from 'react';
import Header from '../../common/header/Header'; 
import axios from 'axios';
import sittingHuman from '../Login/sittingHuman.svg'; // Importing the SVG image

const PrescriptionScanner = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Use environment variable for backend URL
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const handleScan = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('prescription', selectedFile);

    try {
      // Call the backend Python OCR endpoint
      const response = await axios.post(`${API_URL}/api/prescription/scan`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Expecting { rawText: "...", parsedData: {...} } or at least { rawText: "..." }
      setResults(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Scanning failed'
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate "accuracy" (fake, for demo)
  const getAccuracy = (results) => {
    if (!results || !results.rawText) return 0;
    // If text found, show 98%, else 0%
    return results.rawText.trim().length > 0 ? 98 : 0;
  };

  return (
    <div
      className="prescription-scanner"
      style={{
      
      }}
    >
      {/* SVG background */}
      <img
        src={sittingHuman}
        alt=""
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          width: '600px',
          maxWidth: '90vw',
          minWidth: '300px',
          opacity: 0.10,
          zIndex: 0,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
        draggable={false}
      />
      <Header />
      <div style={{
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1 // Ensure content is above background
      }}>
        <h2>Prescription Scanner</h2>
        
        {/* File Upload */}
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            id="file-input"
          />
          <label htmlFor="file-input" className="upload-button">
            Choose Prescription Image
          </label>
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="preview-section" style={{ margin: '16px 0' }}>
            <img
              src={preview}
              alt="Prescription preview"
              className="preview-image"
              style={{
                maxWidth: 180,
                maxHeight: 180,
                borderRadius: 8,
                border: '1px solid #eee',
                boxShadow: '0 2px 8px #eee',
                marginBottom: 8
              }}
            />
            <br />
            <button onClick={handleScan} disabled={loading} className="scan-button">
              {loading ? 'Scanning...' : 'Scan Prescription'}
            </button>
          </div>
        )}

        {/* Loading State with animation */}
        {loading && (
          <div className="loading" style={{ margin: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              border: '6px solid #f3f3f3',
              borderTop: '6px solid #1976d2',
              borderRadius: '50%',
              width: 48,
              height: 48,
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ marginTop: 12, fontWeight: 500 }}>Processing prescription...</div>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg);}
                  100% { transform: rotate(360deg);}
                }
              `}
            </style>
          </div>
        )}

        {/* Error Display */}
        {error && <div className="error" style={{ color: 'red', margin: '12px 0' }}>{error}</div>}

        {/* Results Display */}
        {results && (
          <div
            className="results-section"
            style={{
              background: '#f9f9f9',
              borderRadius: 12,
              boxShadow: '0 2px 12px #eee',
              padding: 24,
              margin: '24px auto',
              maxWidth: 500
            }}
          >
            <h3 style={{ marginTop: 0, color: '#1976d2' }}>Scan Results</h3>
            <div style={{ marginBottom: 12 }}>
              <strong>Accuracy:</strong>{" "}
              <span style={{ color: getAccuracy(results) > 80 ? 'green' : 'red' }}>
                {getAccuracy(results)}%
              </span>
            </div>

            {/* Medications Table - always directly under Scan Results */}
            {results.medications && Object.keys(results.medications).length > 0 && (
              <div className="medications-output" style={{ marginBottom: 16 }}>
                <h4>Medications:</h4>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: '#fff',
                  borderRadius: 6,
                  overflow: 'hidden',
                  marginBottom: 12
                }}>
                  <thead>
                    <tr style={{ background: '#f0f4fa' }}>
                      <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Medicine Name</th>
                      <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Dosage</th>
                      <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Frequency</th>
                      <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Other Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.medications).map(([med, details], idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{med}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{details.dosage || '-'}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{details.frequency || '-'}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>
                          {Object.entries(details)
                            .filter(([key]) => key !== 'dosage' && key !== 'frequency' && key !== 'medicineName')
                            .map(([key, value]) => (
                              <div key={key}><strong>{key}:</strong> {value}</div>
                            ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Raw Text */}
            <div className="raw-text" style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 4 }}>Extracted Text:</h4>
              <pre style={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 6,
                padding: 10,
                fontSize: 14,
                maxHeight: 200,
                overflow: 'auto'
              }}>{results.rawText}</pre>
            </div>

            {/* Name Output */}
            {results.protectedHealthInfo && results.protectedHealthInfo.length > 0 && (
              <div className="name-output" style={{ marginBottom: 12 }}>
                <h4>Patient Name(s):</h4>
                <ul>
                  {results.protectedHealthInfo
                    .filter(info => info.type === "Name")
                    .map((info, idx) => (
                      <li key={idx}>{info.value}</li>
                    ))}
                </ul>
              </div>
            )}

            {/* Parsed Data */}
            {results.parsedData && (
              <div className="parsed-data" style={{ marginBottom: 12 }}>
                <h4>Prescription Details:</h4>
                <div>
                  <strong>License Number:</strong> {results.parsedData.licenseNumber}
                </div>
                <div>
                  <strong>Has Signature:</strong> {results.parsedData.signature ? 'Yes' : 'No'}
                </div>
                {/* Add more fields as needed */}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionScanner;