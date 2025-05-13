import React, { useState, useRef, useCallback } from "react";
import Header from "../../common/header/Header";
import Webcam from "react-webcam";
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default Leaflet marker icons
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";

// Set up default marker icon for Leaflet
const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// LocationSelector component to handle map clicks
function LocationSelector({ position, setPosition }) {
  useMapEvents({
    click: (e) => {
      setPosition(e.latlng);
    }
  });

  return position ? (
    <Marker position={position} />
  ) : null;
}

// Image preprocessing utility functions
const imagePreprocessing = {
  // Create a canvas element for image manipulation
  createCanvas: (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },

  // Load image from URL/Blob
  loadImage: (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  },

  // Apply grayscale filter
  applyGrayscale: (canvas, ctx, img) => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg; // red
      data[i + 1] = avg; // green
      data[i + 2] = avg; // blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  },

  // Increase contrast
  applyContrast: (canvas, ctx, img, contrast = 150) => {
    // Draw image on canvas (if not already drawn)
    if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor * (data[i] - 128) + 128; // red
      data[i + 1] = factor * (data[i + 1] - 128) + 128; // green
      data[i + 2] = factor * (data[i + 2] - 128) + 128; // blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  },

  // Apply threshold (make pixels either black or white)
  applyThreshold: (canvas, ctx, threshold = 127) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const val = avg < threshold ? 0 : 255;
      data[i] = val; // red
      data[i + 1] = val; // green
      data[i + 2] = val; // blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  },

  // Process image with all enhancements
  enhanceImage: async (imageUrl) => {
    try {
      const img = await imagePreprocessing.loadImage(imageUrl);
      const canvas = imagePreprocessing.createCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      
      // Apply more sophisticated processing steps for better text recognition
      // Step 1: Apply grayscale
      imagePreprocessing.applyGrayscale(canvas, ctx, img);
      
      // Step 2: Apply higher contrast for better letter definition
      imagePreprocessing.applyContrast(canvas, ctx, null, 200); // Increased from 180 to 200
      
      // Step 3: Apply adaptive thresholding for better text separation
      const thresholdCanvas = imagePreprocessing.applyAdaptiveThreshold(canvas, ctx);
      
      // Step 4: Apply noise reduction (light smoothing)
      const denoisedCanvas = imagePreprocessing.applyDenoising(thresholdCanvas);
      
      // Convert to dataURL and return
      return denoisedCanvas.toDataURL('image/png');
    } catch (error) {
      console.error("Error in image preprocessing:", error);
      return imageUrl; // Return original if processing fails
    }
  },
  
  // Apply adaptive thresholding - works better for uneven lighting in prescription images
  applyAdaptiveThreshold: (canvas, ctx) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const blockSize = 15; // Size of the neighborhood to calculate threshold
    const C = 5; // Constant subtracted from mean
    
    // Process in blocks to create adaptive threshold
    for (let y = 0; y < canvas.height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        // Calculate average of the block
        let sum = 0;
        let count = 0;
        
        for (let by = 0; by < blockSize && y + by < canvas.height; by++) {
          for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
            const idx = 4 * ((y + by) * width + (x + bx));
            // Use grayscale value (R, G, and B are the same in grayscale)
            sum += data[idx];
            count++;
          }
        }
        
        // Set threshold for this block (mean - C)
        const threshold = sum / count - C;
        
        // Apply threshold to the block
        for (let by = 0; by < blockSize && y + by < canvas.height; by++) {
          for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
            const idx = 4 * ((y + by) * width + (x + bx));
            // Thresholding
            const val = data[idx] < threshold ? 0 : 255;
            data[idx] = data[idx + 1] = data[idx + 2] = val;
          }
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  },
  
  // Apply denoising to reduce speckles and increase text clarity
  applyDenoising: (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const outputData = new Uint8ClampedArray(data);
    
    // Simple 3x3 median filter for denoising
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        // For each pixel, collect its 3x3 neighborhood
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = 4 * ((y + dy) * width + (x + dx));
            neighbors.push(data[idx]); // We only need one channel for grayscale
          }
        }
        
        // Sort and get median
        neighbors.sort((a, b) => a - b);
        const median = neighbors[4]; // Middle value of 9 pixels
        
        // Apply median to all channels
        const idx = 4 * (y * width + x);
        outputData[idx] = outputData[idx + 1] = outputData[idx + 2] = median;
      }
    }
    
    // Create new canvas with denoised data
    const resultCanvas = imagePreprocessing.createCanvas(width, height);
    const resultCtx = resultCanvas.getContext('2d');
    const resultImageData = new ImageData(outputData, width, height);
    resultCtx.putImageData(resultImageData, 0, 0);
    
    return resultCanvas;
  }
};

// Google Lens API integration for improved accuracy
const googleLensService = {
  // Process image using Google Lens API via backend proxy
  processImageWithGoogleLens: async (imageData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/google-lens/analyze', {
        image: imageData
      });
      
      return response.data;
    } catch (error) {
      console.error("Error using Google Lens:", error);
      throw new Error("Failed to analyze image with Google Lens");
    }
  },
  
  // Extract medicine names from Google Lens results
  extractMedicinesFromLensResults: (lensResults) => {
    // Extract medicine names from the structured data
    // This implementation will depend on the actual response format from your backend
    if (!lensResults || !lensResults.detectedItems) {
      return [];
    }
    
    // Increased confidence threshold from 0.75 to 0.90 (90%) for higher accuracy
    return lensResults.detectedItems
      .filter(item => item.confidence > 0.90)
      .map(item => item.name);
  }
};

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
  const [useGoogleLens, setUseGoogleLens] = useState(true); // Default to using Google Lens
  const [mapPosition, setMapPosition] = useState(null); // Position for map selector
  
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
      
      // Convert the File object to a format for processing
      const imageUrl = URL.createObjectURL(selectedFile);
      
      // Enhance the image for better OCR results
      setProcessingStep("Enhancing image quality...");
      const enhancedImageUrl = await imagePreprocessing.enhanceImage(imageUrl);
      
      let extractedText = "";
      let detectedMedicines = [];
      
      // Use Google Lens if enabled, otherwise fall back to Tesseract
      if (useGoogleLens) {
        try {
          setProcessingStep("Analyzing prescription with Google Lens...");
          const lensResults = await googleLensService.processImageWithGoogleLens(enhancedImageUrl);
          
          // Extract text and medicines from Google Lens results
          extractedText = lensResults.fullText || "";
          const lensMedicines = googleLensService.extractMedicinesFromLensResults(lensResults);
          
          if (lensMedicines.length > 0) {
            detectedMedicines = lensMedicines;
            console.log("Medicines detected by Google Lens:", lensMedicines);
          } else {
            // Fall back to Tesseract if Google Lens doesn't find medicines
            setProcessingStep("Enhancing detection with Tesseract OCR...");
            const { data: { text } } = await Tesseract.recognize(
              enhancedImageUrl, 
              'eng',
              { 
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,-()', 
                tessedit_pageseg_mode: '6',
                preserve_interword_spaces: '1'
              }
            );
            extractedText = text;
          }
        } catch (lensError) {
          console.error("Google Lens processing failed, falling back to Tesseract:", lensError);
          setProcessingStep("Google Lens unavailable, using Tesseract OCR...");
          
          // Fall back to Tesseract if Google Lens fails
          const { data: { text } } = await Tesseract.recognize(
            enhancedImageUrl, 
            'eng',
            { 
              tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,-()', 
              tessedit_pageseg_mode: '6', // Single uniform block of text
              preserve_interword_spaces: '1',
              tessedit_ocr_engine_mode: '1', // Use LSTM neural network only
              tessjs_create_hocr: '0',       // Disable HOCR output for faster processing
              tessjs_create_tsv: '0',        // Disable TSV output for faster processing
              tessjs_create_box: '0',        // Disable box output for faster processing
              tessjs_create_unlv: '0',       // Disable UNLV output for faster processing
              tessjs_create_osd: '0',        // Disable OSD output for faster processing
              textord_min_linesize: '2.5',   // Helps with small text
              tessedit_do_invert: '0'        // Don't invert image (already preprocessed)
            }
          );
          extractedText = text;
        }
      } else {
        // Always use Tesseract if Google Lens is disabled
        setProcessingStep("Extracting text from image using Tesseract OCR...");
        const { data: { text } } = await Tesseract.recognize(
          enhancedImageUrl, 
          'eng',
          { 
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,-()', 
            tessedit_pageseg_mode: '6', // Single uniform block of text
            preserve_interword_spaces: '1',
            tessedit_ocr_engine_mode: '1', // Use LSTM neural network only
            tessjs_create_hocr: '0',       // Disable HOCR output for faster processing
            tessjs_create_tsv: '0',        // Disable TSV output for faster processing
            tessjs_create_box: '0',        // Disable box output for faster processing
            tessjs_create_unlv: '0',       // Disable UNLV output for faster processing
            tessjs_create_osd: '0',        // Disable OSD output for faster processing
            textord_min_linesize: '2.5',   // Helps with small text
            tessedit_do_invert: '0'        // Don't invert image (already preprocessed)
          }
        );
        extractedText = text;
      }
      
      console.log("Extracted text:", extractedText);

      // Get user location
      setProcessingStep("Getting your location...");
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      // Send text + user location to backend with enhanced data
      setProcessingStep("Finding pharmacies with your medicines...");
      const response = await fetch('http://localhost:5000/api/process-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageText: extractedText,
          enhancedImage: enhancedImageUrl,
          detectedMedicines: detectedMedicines.length > 0 ? detectedMedicines : undefined,
          userLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          },
          confidence: 0.7,
          usedGoogleLens: useGoogleLens
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
          
          {/* Google Lens Toggle */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '15px'
          }}>
            <span style={{ marginRight: '10px', fontSize: '15px' }}>
              {useGoogleLens ? 'Using Google Lens (More Accurate)' : 'Using Tesseract OCR'}
            </span>
            <label className="switch" style={{ 
              position: 'relative',
              display: 'inline-block',
              width: '60px',
              height: '30px'
            }}>
              <input 
                type="checkbox" 
                checked={useGoogleLens}
                onChange={() => setUseGoogleLens(!useGoogleLens)}
                style={{ 
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{ 
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: useGoogleLens ? '#2196F3' : '#ccc',
                transition: '.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '22px',
                  width: '22px',
                  left: useGoogleLens ? '34px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '.4s',
                  borderRadius: '50%'
                }}></span>
              </span>
            </label>
          </div>
          
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
          
          {/* Extracted Medicines - Always show if medicines were detected */}
          {extractedMedicines.length > 0 && (
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
                  <ul style={{ paddingLeft: '20px' }}>
                    {result.pharmacies.map((pharmacy, idx) => (
                      <li key={idx} style={{ marginBottom: '8px', fontSize: '16px' }}>
                        {pharmacy.name} - {pharmacy.address}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : extractedMedicines.length > 0 ? (
            <div style={{ 
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3>No pharmacies found with the scanned medicines.</h3>
              <p>You can select a location on the map to search nearby pharmacies.</p>
              <MapContainer
                center={[6.0825, 80.2973]} // Sri Lanka coordinates
                zoom={13}
                style={{ height: "300px", width: "100%", borderRadius: "8px", marginTop: "20px" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationSelector position={mapPosition} setPosition={setMapPosition} />
              </MapContainer>
              
              {mapPosition && (
                <div style={{ marginTop: "15px" }}>
                  <p style={{ marginBottom: "10px" }}>
                    Selected Location: {mapPosition.lat.toFixed(4)}, {mapPosition.lng.toFixed(4)}
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        setError(null);
                        setProcessingStep("Searching nearby pharmacies...");
                        
                        const results = [];
                        
                        // Search for each detected medicine at the selected location
                        for (const medicine of extractedMedicines) {
                          const response = await fetch(
                            `http://localhost:5000/api/pharmacies/search?latitude=${mapPosition.lat}&longitude=${mapPosition.lng}&medicineName=${encodeURIComponent(medicine)}`
                          );
                          
                          if (response.ok) {
                            const pharmacies = await response.json();
                            
                            if (pharmacies.length > 0) {
                              results.push({
                                medicine,
                                pharmacies
                              });
                            }
                          }
                        }
                        
                        if (results.length > 0) {
                          setPharmacyResults(results);
                        } else {
                          setError("No pharmacies found near the selected location with your medicines.");
                        }
                      } catch (error) {
                        setError(`Error searching pharmacies: ${error.message}`);
                      } finally {
                        setIsLoading(false);
                        setProcessingStep(null);
                      }
                    }}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "16px"
                    }}
                    disabled={isLoading || !mapPosition}
                  >
                    Search Nearby Pharmacies
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionScanner;