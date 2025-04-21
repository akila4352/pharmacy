import React, { useState, useRef } from 'react';
import Header from '../../common/header/Header'; 
const PrescriptionScanner = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleCapture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      setCapturedImage(reader.result);
      
      // Create form data
      const formData = new FormData();
      formData.append('prescriptionImage', file);

      try {
        const response = await fetch('http://localhost:5000/api/process-prescription', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        setExtractedData(data);
      } catch (error) {
        console.error('Error processing prescription:', error);
        alert('Error processing prescription image');
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    < div> <Header />
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: 'white'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          Prescription Scanner
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            style={{ display: 'none' }}
          />
          
          <button 
            onClick={() => fileInputRef.current.click()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            disabled={isLoading}
          >
            📸 {isLoading ? 'Processing...' : 'Capture Prescription'}
          </button>

          {capturedImage && (
            <div style={{ width: '100%' }}>
              <img 
                src={capturedImage} 
                alt="Captured prescription"
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            </div>
          )}

          {extractedData && (
            <div style={{ 
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h3 style={{ marginBottom: '8px' }}>Extracted Data:</h3>
              <pre style={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default PrescriptionScanner;