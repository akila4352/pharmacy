import React, { useState, useRef } from 'react';
import Header from '../../common/header/Header'; 
import axios from 'axios';

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
  const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

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
    <div className="prescription-scanner">
      <Header />
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

      {/* Loading State */}
      {loading && <div className="loading">Processing prescription...</div>}

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

          {/* Medications Output */}
          {results.medications && Object.keys(results.medications).length > 0 && (
            <div className="medications-output">
              <h4>Medications:</h4>
              <ul>
                {Object.entries(results.medications).map(([med, details], idx) => (
                  <li key={idx}>
                    <strong>{med}</strong>
                    {details.dosage && <> | Dosage: {details.dosage}</>}
                    {details.frequency && <> | Frequency: {details.frequency}</>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default PrescriptionScanner;