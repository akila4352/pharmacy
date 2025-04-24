import React, { useState, useRef, useCallback } from "react";
import Header from "../../common/header/Header";
import Webcam from "react-webcam";

const PrescriptionScanner = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  
  const webcamRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log("Selected file:", file);
      // Process the file (e.g., upload or preview)
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

  const handleSubmit = async () => {
    // Here you would handle submitting the prescription image
    if (selectedFile) {
      // Create FormData for API submission
      const formData = new FormData();
      formData.append('prescription', selectedFile);
      
      try {
        console.log("Submitting prescription...", selectedFile);
        // Implement API call here
        // const response = await fetch('your-api-endpoint', {
        //   method: 'POST',
        //   body: formData,
        // });
        
        alert("Prescription submitted successfully!");
        // Reset states
        setSelectedFile(null);
        setCapturedImage(null);
      } catch (error) {
        console.error("Error submitting prescription:", error);
        alert("Failed to submit prescription. Please try again.");
      }
    } else {
      alert("Please capture or select a prescription image first.");
    }
  };

  return (
    <div>
      <Header />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
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
          
          {!showCamera && !capturedImage && (
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
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                />
              )}
              
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
                  Submit Prescription
                </button>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setCapturedImage(null);
                    setShowCamera(false);
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionScanner;