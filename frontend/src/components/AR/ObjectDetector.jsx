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
  const [model, setModel] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState([]);
  const [error, setError] = useState(null);
  const [fps, setFps] = useState(0);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [showImageCapture, setShowImageCapture] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
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
      } catch (err) {
        console.error('Error loading COCO-SSD model:', err);
        setError('Failed to load object detection model');
      }
    };
    
    loadModel();
    
    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      // Cancel any pending animation frames
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  // Start camera with optimized settings
  const startCamera = async () => {
    try {
      // Use lower resolution and framerate for better performance
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
      setIsDetecting(false);
    }
  };
  
  // Toggle detection
  const toggleDetection = () => {
    if (!cameraActive) {
      startCamera();
      setIsDetecting(true);
    } else {
      setIsDetecting(!isDetecting);
    }
  };
  
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
        />
        <canvas
          ref={canvasRef}
          className="canvas"
        />
        
        {/* Performance indicator */}
        {isDetecting && (
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
          <button onClick={toggleDetection} className="control-button">
            {!cameraActive ? 'Start Camera' : isDetecting ? 'Pause Detection' : 'Resume Detection'}
          </button>
          
          {cameraActive && (
            <>
              <button onClick={stopCamera} className="control-button stop">
                Stop Camera
              </button>
              
              <button 
                onClick={sendDetectionsToBackend} 
                className="control-button"
                disabled={detections.length === 0}
              >
                Save Detections
              </button>
              
              <button onClick={() => setShowLabelForm(true)} className="control-button customize">
                Customize Labels
              </button>
              
              <button onClick={() => setShowImageCapture(true)} className="control-button capture">
                Capture Reference Image
              </button>
            </>
          )}
        </div>
        
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