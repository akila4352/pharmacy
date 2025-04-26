import React, { useState, useRef, useCallback } from "react";
import Header from "../../common/header/Header";
import Webcam from "react-webcam";
import Tesseract from 'tesseract.js';

const PrescriptionScanner = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [medicineToSearch, setMedicineToSearch] = useState("");
  const [extractedMedicines, setExtractedMedicines] = useState([]);
  const [pharmacyResults, setPharmacyResults] = useState([]);
  const [error, setError] = useState(null);
  const [processingStep, setProcessingStep] = useState(null);
  
  const webcamRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log("Selected file:", file);
      setError(null);
      setExtractedMedicines([]);
      setPharmacyResults([]);
    }
  };

  const handleOptionClick = (option) => {
    setShowOptions(false); // Close the options modal
    if (option === "device") {
      document.getElementById("fileInputDevice").click();
    } else if (option === "camera") {
      // Open the webcam interface
      setShowCamera(true);
    }
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      
      // Convert base64 to file object
      if (imageSrc) {
        const byteString = atob(imageSrc.split(',')[1]);
        const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
        setSelectedFile(file);
        setError(null);
        setExtractedMedicines([]);
        setPharmacyResults([]);
      }
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
  };

  const switchCamera = () => {
    setIsFrontCamera(!isFrontCamera);
  };

  const closeCamera = () => {
    setShowCamera(false);
    if (!capturedImage) {
      setCapturedImage(null);
    }
  };

  const searchPharmacies = async (medicineName) => {
    return new Promise((resolve, reject) => {
      // Get user's position using browser geolocation
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch(
              `http://localhost:5000/api/pharmacies/search?latitude=${latitude}&longitude=${longitude}&medicineName=${encodeURIComponent(medicineName)}`
            );
            
            if (!response.ok) {
              throw new Error(`Failed to fetch pharmacies: ${response.statusText}`);
            }
            
            const pharmacies = await response.json();
            resolve(pharmacies);
          } catch (error) {
            console.error("Error finding pharmacies:", error);
            reject(error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          reject(new Error("Unable to get your location. Please enable location services."));
        }
      );
    });
  };

  const handleManualMedicineSearch = async (e) => {
    e.preventDefault();
    if (!medicineToSearch.trim()) {
      setError("Please enter a medicine name to search");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProcessingStep("Searching pharmacies...");

    try {
      const pharmacies = await searchPharmacies(medicineToSearch);
      if (pharmacies.length > 0) {
        setPharmacyResults([{
          medicine: medicineToSearch,
          pharmacies: pharmacies
        }]);
      } else {
        setPharmacyResults([]);
        setError(`No pharmacies found with ${medicineToSearch}`);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
      setProcessingStep(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select or capture a prescription image first");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setProcessingStep("Processing prescription image...");
      
      // Convert the File object to a format Tesseract can work with
      const file = URL.createObjectURL(selectedFile);
      console.log("Submitting prescription...", file);

      // OCR: Extract text from image using Tesseract.js (on frontend)
      setProcessingStep("Extracting text from image...");
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      console.log("Extracted text:", text);

      // Get user location
      setProcessingStep("Getting your location...");
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // Send text + user location to backend
      setProcessingStep("Finding pharmacies with your medicines...");
      const response = await fetch('http://localhost:5000/api/process-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageText: text,
          userLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Detected medicines:", data.detectedMedicines);
      console.log("Nearby pharmacies:", data.pharmacies);

      // Update the UI with results
      setExtractedMedicines(data.detectedMedicines);
      
      // Format pharmacy results
      const formattedPharmacies = [];
      
      // Group pharmacies by medicine
      data.detectedMedicines.forEach(medicine => {
        const pharmaciesForMedicine = data.pharmacies.filter(pharmacy => 
          pharmacy.medicineName.toLowerCase() === medicine.toLowerCase()
        );
        
        if (pharmaciesForMedicine.length > 0) {
          formattedPharmacies.push({
            medicine: medicine,
            pharmacies: pharmaciesForMedicine
          });
        }
      });
      
      setPharmacyResults(formattedPharmacies);
      
      if (formattedPharmacies.length === 0) {
        setError("No pharmacies found with the medicines in your prescription");
      }
    } catch (error) {
      console.error("Error processing prescription:", error);
      setError(`Failed to process prescription: ${error.message}`);
    } finally {
      setIsLoading(false);
      setProcessingStep(null);
    }
  };

  return (
    <div>
      <Header />
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "20px",
            backgroundColor: "white",
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
            Prescription Scanner
          </h2>
          
          {/* Manual Medicine Search */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ marginBottom: "12px" }}>Quick Medicine Search</h3>
            <form onSubmit={handleManualMedicineSearch} style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={medicineToSearch}
                onChange={(e) => setMedicineToSearch(e.target.value)}
                placeholder="Enter medicine name"
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "16px"
                }}
                disabled={isLoading}
              >
                Search
              </button>
            </form>
            <p style={{ fontSize: "14px", marginTop: "8px", color: "#666" }}>
              Or scan your prescription below
            </p>
          </div>
          
          <hr style={{ margin: "20px 0", borderTop: "1px solid #eee" }} />
          
          {!showCamera && !capturedImage && !selectedFile && (
            <div style={{ textAlign: "center" }}>
              <p style={{ marginBottom: "20px" }}>
                Scan your prescription to find pharmacies with the required medicines
              </p>
              <button
                onClick={() => setShowOptions(true)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  margin: "0 auto",
                }}
              >
                📸 Capture Prescription
              </button>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            id="fileInputDevice"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <input
            id="fileInputCamera"
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {/* Camera Interface */}
          {showCamera && !capturedImage && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: isFrontCamera ? "user" : "environment",
                }}
                style={{
                  width: "100%", 
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              />
              <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "10px" }}>
                <button 
                  onClick={capture}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Capture Photo
                </button>
                <button 
                  onClick={switchCamera}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Switch Camera
                </button>
                <button 
                  onClick={closeCamera}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Modal for Options */}
          {showOptions && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  padding: "20px",
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <h3>Choose an Action</h3>
                <button
                  onClick={() => handleOptionClick("device")}
                  style={{
                    margin: "10px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  Upload from Device
                </button>
                <button
                  onClick={() => handleOptionClick("camera")}
                  style={{
                    margin: "10px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  Open Camera
                </button>
                <button
                  onClick={() => setShowOptions(false)}
                  style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Preview Captured/Selected Image */}
          {(capturedImage || selectedFile) && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <h3>Prescription Image:</h3>
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured Prescription"
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                />
              ) : (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Selected Prescription"
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                />
              )}
              
              {!isLoading && extractedMedicines.length === 0 && (
                <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "10px" }}>
                  {capturedImage && (
                    <button
                      onClick={retake}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#ffc107",
                        color: "black",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Retake Photo
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Process Prescription
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setCapturedImage(null);
                      setShowCamera(false);
                      setError(null);
                      setExtractedMedicines([]);
                      setPharmacyResults([]);
                    }}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div style={{ 
              marginTop: '20px',
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div className="spinner" style={{
                border: '4px solid rgba(0, 0, 0, 0.1)',
                borderLeft: '4px solid #3498db',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 15px',
              }}></div>
              <style>
                {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
              </style>
              <p>{processingStep || "Processing..."}</p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div style={{ 
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          {/* Extracted Medicines - Only show if pharmacies were found */}
          {extractedMedicines.length > 0 && pharmacyResults.length > 0 && (
            <div style={{ 
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <h3 style={{ marginBottom: '12px' }}>Detected Medicines:</h3>
              <ul style={{ paddingLeft: '20px' }}>
                {extractedMedicines.map((medicine, index) => (
                  <li key={index} style={{ marginBottom: '8px', fontSize: '16px' }}>{medicine}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Pharmacy Results */}
          {pharmacyResults.length > 0 ? (
            <div style={{ 
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <h3 style={{ marginBottom: '16px' }}>Pharmacies with Your Medicines:</h3>
              
              {pharmacyResults.map((result, index) => (
                <div key={index} style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    backgroundColor: '#e9ecef', 
                    padding: '8px 12px',
                    borderRadius: '4px',
                    marginBottom: '12px'
                  }}>
                    {result.medicine}
                  </h4>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f3f5' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Pharmacy</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Address</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Price</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Availability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.pharmacies.map((pharmacy, pIndex) => (
                          <tr key={pIndex} style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td style={{ padding: '8px 12px' }}>{pharmacy.name}</td>
                            <td style={{ padding: '8px 12px' }}>{pharmacy.address}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>${pharmacy.price.toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span style={{
                                backgroundColor: pharmacy.isAvailable ? '#28a745' : '#dc3545',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                {pharmacy.isAvailable ? 'Available' : 'Not Available'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionScanner;