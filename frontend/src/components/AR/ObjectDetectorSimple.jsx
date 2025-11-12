import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { getCustomLabel, isImportantObject } from '../../utils/customDetections';
import buildingDetector from '../../utils/buildingDetector';
import BuildingDetectionModal from './BuildingDetectionModal';
import './ObjectDetectorSimple.css';

const ObjectDetectorSimple = ({ onDetection }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  
  const [model, setModel] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [fps, setFps] = useState(0);
  const [detections, setDetections] = useState([]);
  const [buildingDetected, setBuildingDetected] = useState(null);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [buildingCheckInterval, setBuildingCheckInterval] = useState(0);

  // Load model once on mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.setBackend('webgl');
        const loadedModel = await cocossd.load({ base: 'lite_mobilenet_v2' });
        setModel(loadedModel);
        setIsModelLoaded(true);
        console.log('Model loaded successfully');
        
        // Initialize building detector
        await buildingDetector.initialize();
        console.log('Building detector initialized');
      } catch (err) {
        console.error('Failed to load model:', err);
        setError('Failed to load object detection model');
      }
    };

    loadModel();

    // Cleanup on unmount
    return () => {
      stopCamera();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Start camera
  const startCamera = async () => {
    if (!isModelLoaded) {
      setError('Model not loaded yet. Please wait...');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          setError(null);
          // Auto-start detection
          setIsDetecting(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else {
        setError('Failed to access camera. Please ensure camera permissions are granted.');
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    setIsDetecting(false);
    setCameraActive(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Toggle detection
  const toggleDetection = () => {
    if (!cameraActive) {
      startCamera();
    } else {
      setIsDetecting(!isDetecting);
    }
  };

  // Detection loop
  useEffect(() => {
    if (!model || !cameraActive || !isDetecting) return;

    let lastTime = 0;
    const detectFrame = async (timestamp) => {
      if (!model || !cameraActive || !isDetecting) return;

      if (timestamp - lastTime > 100) { // Process every 100ms
        lastTime = timestamp;
        
        if (videoRef.current && videoRef.current.readyState === 4 && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          // Set canvas size
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Detect objects
          const predictions = await model.detect(video);
          
          // Check for building detection every 3 seconds
          if (timestamp - buildingCheckInterval > 3000) {
            setBuildingCheckInterval(timestamp);
            try {
              const buildingResult = await buildingDetector.detectBuilding(video);
              if (buildingResult.detected && !showBuildingModal) {
                setBuildingDetected(buildingResult);
                setShowBuildingModal(true);
                console.log('🏛️ Building detected:', buildingResult);
              }
            } catch (err) {
              console.error('Building detection error:', err);
            }
          }

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw detections
          const processedDetections = predictions.map(prediction => {
            const [x, y, width, height] = prediction.bbox;
            const standardClass = prediction.class;
            const customClass = getCustomLabel(standardClass);
            const isImportant = isImportantObject(standardClass);
            
            // Draw box
            ctx.strokeStyle = isImportant ? '#ef4444' : '#06b6d4';
            ctx.lineWidth = isImportant ? 3 : 2;
            ctx.strokeRect(x, y, width, height);

            // Draw label background
            ctx.fillStyle = isImportant ? '#ef4444' : '#06b6d4';
            const text = `${customClass} (${Math.round(prediction.score * 100)}%)`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(x, y - 24, textWidth + 12, 24);

            // Draw text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(text, x + 6, y - 8);

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

      // Calculate FPS
      setFps(Math.round(1000 / (timestamp - lastTime)));

      // Continue loop
      if (isDetecting && cameraActive) {
        animationRef.current = requestAnimationFrame(detectFrame);
      }
    };

    animationRef.current = requestAnimationFrame(detectFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [model, cameraActive, isDetecting, onDetection]);

  return (
    <>
      <div className="object-detector">
        <div className="camera-frame">
          <div className="video-container">
            <video
              ref={videoRef}
              className="video"
              autoPlay
              muted
              playsInline
              style={{ display: cameraActive ? 'block' : 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="canvas"
              style={{ display: cameraActive ? 'block' : 'none' }}
            />
            {!cameraActive && (
              <div className="camera-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon-wrapper">
                    <div className="placeholder-icon">📹</div>
                  </div>
                  <p className="placeholder-text">Camera Ready</p>
                  <p className="placeholder-subtext">Click Start Detection to begin</p>
                </div>
              </div>
            )}
            {error && (
              <div className="error">
                <div className="error-content">
                  <div className="error-icon">⚠️</div>
                  <p className="error-text">{error}</p>
                </div>
              </div>
            )}
            {cameraActive && (
              <div className="fps-counter">
                FPS: {fps}
              </div>
            )}
            {buildingDetected && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
                🏛️ Building Detected!
              </div>
            )}
          </div>
        </div>

        <div className="external-controls">
          <div className="controls">
            <button
              onClick={toggleDetection}
              className={`control-button ${cameraActive ? 'stop' : ''}`}
              disabled={!isModelLoaded}
            >
              {!cameraActive ? '🚀 Start Detection' : isDetecting ? '⏹️ Stop Detection' : '▶️ Resume Detection'}
            </button>
          </div>
        </div>
      </div>

      {/* Building Detection Modal */}
      <BuildingDetectionModal
        isOpen={showBuildingModal}
        onClose={() => {
          setShowBuildingModal(false);
          setBuildingDetected(null);
        }}
        building={buildingDetected?.building}
        confidence={buildingDetected?.confidence || 0}
      />
    </>
  );
};

export default ObjectDetectorSimple;