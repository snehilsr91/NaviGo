import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { getCustomLabel, isImportantObject } from '../../utils/customDetections';
import CustomLabelForm from './CustomLabelForm';
import ImageCapture from './ImageCapture';
import { saveReferenceImage, trainCustomObject } from '../../utils/customObjectTraining';
import detectionsApi from '../../services/api';
import './ObjectDetector.css';

const ObjectDetector = ({ onDetection, onAddPOI }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [model, setModel] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState([]);
  const [error, setError] = useState(null);
  const [fps, setFps] = useState(0);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [showImageCapture, setShowImageCapture] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' (front) or 'environment' (back)
  const [isInitializing, setIsInitializing] = useState(false); // Start as false to show button immediately
  const requestRef = useRef();
  const previousTimeRef = useRef();
  
  // Handle saving reference image
  const handleSaveReferenceImage = async (data) => {
    try {
      // Save the reference image
      saveReferenceImage(data.name, data.image, data.timestamp);
      
      // Start training process
      setIsTraining(true);
      await trainCustomObject(data.name);
      setIsTraining(false);
      
      // Close image capture
      setShowImageCapture(false);
      
      // Show success message
      alert(`Successfully saved reference image for ${data.name}. The model will now recognize this object.`);
    } catch (err) {
      console.error('Error saving reference image:', err);
      setError('Failed to save reference image');
      setIsTraining(false);
    }
  };
  
  // Load TensorFlow.js and COCO-SSD model with optimized settings
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Enable WebGL backend for better performance
        await tf.setBackend('webgl');
        console.log('Using TensorFlow.js backend:', tf.getBackend());
        
        // Load a lighter model for better performance
        const modelConfig = {
          base: 'lite_mobilenet_v2', // Use lite model for better performance
        };
        
        // Load the model
        const loadedModel = await cocossd.load(modelConfig);
        setModel(loadedModel);
        console.log('COCO-SSD model loaded successfully');
        // Don't set isInitializing false here - let the user control when to start
      } catch (err) {
        console.error('Error loading COCO-SSD model:', err);
        setError('Failed to load object detection model');
        // Don't set isInitializing false here - error state is handled separately
      }
    };
    
    loadModel();
    
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      // Cancel any pending animation frames
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  // Start camera with optimized settings
  const startCamera = async (facing = facingMode) => {
    setIsInitializing(true); // Start initialization when user clicks start
    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext && window.location.protocol !== 'https:') {
      setError(
        'Camera access requires HTTPS. ' +
        'Please use the ngrok HTTPS URL shown in the terminal when you started the dev server. ' +
        'HTTP URLs will not work for camera access on mobile devices.'
      );
      return;
    }

    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Use lower resolution and framerate for better performance on mobile
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        // Clear previous srcObject
        videoRef.current.srcObject = null;
        
        // Set new stream
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready and play
        const playVideo = async () => {
          if (!videoRef.current) return;
          
          try {
            // Ensure video is ready
            if (videoRef.current.readyState < 2) {
              // Wait for metadata to load
              await new Promise((resolve) => {
                if (videoRef.current.readyState >= 2) {
                  resolve();
                } else {
                  videoRef.current.onloadedmetadata = resolve;
                  videoRef.current.onloadeddata = resolve;
                  // Timeout fallback
                  setTimeout(resolve, 1000);
                }
              });
            }
            
            // Play the video
            await videoRef.current.play();
            
            setCameraActive(true);
            setError(null);
            
            // Auto-start detection when camera is ready
            setIsDetecting(true);
            
          } catch (playErr) {
            console.error('Error playing video:', playErr);
            // Try once more after a brief delay
            setTimeout(async () => {
              if (videoRef.current && videoRef.current.srcObject) {
                try {
                  await videoRef.current.play();
                  setCameraActive(true);
                  setError(null);
                  setIsDetecting(true);
                } catch (retryErr) {
                  console.error('Retry failed:', retryErr);
                  setError('Failed to start camera video. Please try refreshing the page.');
                }
              }
            }, 300);
          }
        };

        // Start playing video
        playVideo();
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
          'Please use the ngrok HTTPS URL shown in the terminal when you started the dev server.'
        );
      } else {
        setError('Failed to access camera. Please ensure camera permissions are granted.');
      }
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsDetecting(false);
    setIsInitializing(false);
  };

  // Switch camera (front/back)
  const switchCamera = async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    setIsDetecting(false);
    await startCamera(newFacingMode);
  };
  
  // Toggle detection
  const toggleDetection = () => {
    if (!cameraActive) {
      startCamera();
    } else {
      setIsDetecting(!isDetecting);
    }
  };

  // Handle camera errors gracefully
  useEffect(() => {
    if (error && !cameraActive) {
      // If there's an error and camera is not active, ensure we're not stuck in initializing state
      setIsInitializing(false);
    }
  }, [error, cameraActive]);

  // Remove auto-start to prevent button from disappearing immediately
  // User must manually click the start button to begin camera access
  
  // Send detections to backend
  const sendDetectionsToBackend = async () => {
    try {
      await detectionsApi.create({
        detections: detections.map(d => ({
          class: d.class,
          customLabel: d.customLabel,
          confidence: d.confidence,
          position: d.position,
          isImportant: d.isImportant
        }))
      });
      console.log('Detections sent to backend');
      alert('Detections sent to backend successfully!');
    } catch (error) {
      console.error('Error sending detections:', error);
      alert('Failed to send detections to backend');
    }
  };
  
  // Perform object detection with optimized performance
  useEffect(() => {
    if (!model || !cameraActive || !isDetecting) return;
    
    let animationFrameId;
    let lastProcessedTime = 0;
    const processingInterval = 100; // Process frames every 100ms for better performance
    
    const detectObjects = async (timestamp) => {
      if (!previousTimeRef.current) previousTimeRef.current = timestamp;
      const deltaTime = timestamp - previousTimeRef.current;
      previousTimeRef.current = timestamp;
      
      // Calculate FPS
      setFps(Math.round(1000 / deltaTime));
      
      // Only process frames at specified interval
      if (timestamp - lastProcessedTime > processingInterval) {
        lastProcessedTime = timestamp;
        
        if (
          videoRef.current &&
          videoRef.current.readyState === 4 &&
          canvasRef.current
        ) {
          // Get video dimensions
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;
          
          // Set canvas dimensions
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;
          
          // Detect objects
          const predictions = await model.detect(videoRef.current);
          
          // Draw bounding boxes and labels
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          
          // Set font properties
          ctx.font = '16px Arial';
          ctx.textBaseline = 'top';
          
          // Process and draw each prediction
          const processedDetections = predictions.map(prediction => {
            const [x, y, width, height] = prediction.bbox;
            const standardClass = prediction.class;
            const customClass = getCustomLabel(standardClass);
            const text = `${customClass} (${Math.round(prediction.score * 100)}%)`;
            
            // Determine if this is an important object
            const isImportant = isImportantObject(standardClass);
            
            // Choose color based on importance
            ctx.strokeStyle = isImportant ? '#FF0000' : '#00FFFF';
            ctx.lineWidth = isImportant ? 3 : 2;
            ctx.strokeRect(x, y, width, height);
            
            // Draw background for text
            ctx.fillStyle = isImportant ? '#FF0000' : '#00FFFF';
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(x, y - 20, textWidth + 10, 20);
            
            // Draw text
            ctx.fillStyle = '#000000';
            ctx.fillText(text, x + 5, y - 18);
            
            return {
              class: standardClass,
              customLabel: customClass,
              confidence: prediction.score,
              position: { x, y, width, height },
              isImportant
            };
          });
          
          setDetections(processedDetections);
          if (onDetection) onDetection(processedDetections);
        }
      }
      
      // Continue detection loop
      if (isDetecting) {
        animationFrameId = requestAnimationFrame(detectObjects);
      }
    };
    
    animationFrameId = requestAnimationFrame(detectObjects);
    
    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [model, cameraActive, isDetecting, onDetection]);
  
  return (
    <div className="object-detector">
      <div className="video-container">
        <video
          ref={videoRef}
          className="video"
          autoPlay
          playsInline
          muted
          style={{ backgroundColor: '#000', width: '100%', height: '100%' }}
        />
        <canvas
          ref={canvasRef}
          className="canvas"
        />
        
        {/* Loading indicator */}
        {isInitializing && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Starting camera...</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>Please wait...</p>
          </div>
        )}
        
        {/* Performance indicator */}
        {isDetecting && cameraActive && (
          <div className="fps-counter">
            FPS: {fps}
          </div>
        )}
        
        {/* Training indicator */}
        {isTraining && (
          <div className="training-indicator">
            Training model... Please wait
          </div>
        )}
        
        {/* Controls */}
        <div className="controls">
          {cameraActive ? (
            <>
              <button 
                onClick={toggleDetection} 
                className="control-button primary"
                disabled={isInitializing}
              >
                {isDetecting ? '⏸ Pause' : '▶ Resume'}
              </button>
              
              <button 
                onClick={switchCamera} 
                className="control-button switch"
                disabled={isInitializing}
                title={facingMode === 'environment' ? 'Switch to Front Camera' : 'Switch to Back Camera'}
              >
                🔄 {facingMode === 'environment' ? 'Front' : 'Back'}
              </button>
              
              <button 
                onClick={stopCamera} 
                className="control-button stop"
                disabled={isInitializing}
              >
                Stop
              </button>
            </>
          ) : (
            <button 
              onClick={startCamera} 
              className="control-button primary"
              disabled={isInitializing}
            >
              {isInitializing ? 'Starting...' : 'Start Camera'}
            </button>
          )}
        </div>
        
        {/* Secondary Controls - Collapsible on mobile */}
        {cameraActive && (
          <div className="secondary-controls">
            <button 
              onClick={sendDetectionsToBackend} 
              className="control-button secondary"
              disabled={detections.length === 0 || isInitializing}
            >
              💾 Save
            </button>
            
            <button 
              onClick={() => setShowLabelForm(true)} 
              className="control-button secondary"
              disabled={isInitializing}
            >
              🏷 Labels
            </button>
            
            <button 
              onClick={() => setShowImageCapture(true)} 
              className="control-button secondary"
              disabled={isInitializing}
            >
              📷 Capture
            </button>
          </div>
        )}
        
        {/* Error message */}
        {error && <div className="error">{error}</div>}
        
        {/* Custom label form */}
        {showLabelForm && (
          <CustomLabelForm onClose={() => setShowLabelForm(false)} />
        )}
        
        {/* Image capture component */}
        {showImageCapture && (
          <ImageCapture 
            onSave={handleSaveReferenceImage}
            onClose={() => setShowImageCapture(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ObjectDetector;