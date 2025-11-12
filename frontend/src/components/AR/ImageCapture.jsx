import React, { useState, useRef, useEffect } from 'react';
import './ImageCapture.css';

const ImageCapture = ({ onSave, onClose }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [objectName, setObjectName] = useState('');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera when component mounts
  useEffect(() => {
    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext && window.location.protocol !== 'https:') {
      setError(
        'Camera access requires HTTPS. ' +
        'HTTP URLs will not work for camera access on mobile devices. ' +
        'Please use HTTPS or localhost.'
      );
      return;
    }

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera found. Please connect a camera device.');
        } else if (!window.isSecureContext) {
          setError(
            'Camera access requires HTTPS. ' +
            'Please use HTTPS or localhost to access the camera.'
          );
        } else {
          setError('Failed to access camera. Please ensure camera permissions are granted.');
        }
      }
    };
    
    startCamera();
    
    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture image from video stream
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data as base64 string
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
    }
  };

  // Discard captured image and return to camera view
  const retakeImage = () => {
    setCapturedImage(null);
  };

  // Save captured image with object name
  const saveImage = () => {
    if (!objectName.trim()) {
      setError('Please enter a name for this object');
      return;
    }
    
    if (capturedImage && onSave) {
      onSave({
        name: objectName,
        image: capturedImage,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="image-capture">
      <div className="image-capture-container">
        <h2>Capture Reference Image</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="capture-area">
          {!capturedImage ? (
            // Camera view
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="capture-video"
              />
              <button 
                className="capture-button"
                onClick={captureImage}
              >
                Capture
              </button>
            </>
          ) : (
            // Image preview
            <>
              <div className="image-preview">
                <img src={capturedImage} alt="Captured" />
              </div>
              <div className="form-group">
                <label htmlFor="objectName">Object/Person Name:</label>
                <input
                  id="objectName"
                  type="text"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                  placeholder="Enter name (e.g., Your Name, My Laptop)"
                />
              </div>
              <div className="button-group">
                <button 
                  className="save-button"
                  onClick={saveImage}
                >
                  Save
                </button>
                <button 
                  className="retake-button"
                  onClick={retakeImage}
                >
                  Retake
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <button 
          className="close-button"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ImageCapture;