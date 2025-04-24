import React, { useState } from "react";
import Header from "../../common/header/Header";

const PrescriptionScanner = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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
      document.getElementById("fileInputCamera").click();
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
            }}
          >
            📸 Capture Prescription
          </button>

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
                  }}
                >
                  Open Camera
                </button>
                <button
                  onClick={() => setShowOptions(false)}
                  style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    backgroundColor: "red",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {selectedFile && (
            <div style={{ marginTop: "20px" }}>
              <h3>Selected File:</h3>
              <p>{selectedFile.name}</p>
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Prescription Preview"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionScanner;