import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { getCustomLabel, isImportantObject } from '../../utils/customDetections';
import buildingDetector from '../../utils/buildingDetector';
import BuildingDetectionModal from './BuildingDetectionModal';
import './ObjectDetectorSimple.css';

const ObjectDetectorSimple = ({ onDetection }) => {
  const navigate = useNavigate();
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
            ctx.strokeStyle = isImportant ? '#ef4444' : '#a855f7';
            ctx.lineWidth = isImportant ? 3 : 2;
            ctx.strokeRect(x, y, width, height);

            // Draw label background
            ctx.fillStyle = isImportant ? '#ef4444' : '#a855f7';
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
  }, [model, cameraActive, isDetecting, onDetection, buildingCheckInterval, showBuildingModal]);

  return (
    <>
      <div className="ar-detector-container">
        {/* Header Section */}
        <div className="ar-header">
          <div className="ar-header-content">
            <div className="ar-header-left">
              <button
                onClick={() => navigate('/')}
                className="back-button"
                aria-label="Back to home"
              >
                <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back</span>
              </button>
            </div>
            <div className="ar-header-center">
              <h2 className="ar-title">AR Detection</h2>
              <p className="ar-subtitle">Real-time place recognition</p>
            </div>
            <div className="ar-header-right">
              {cameraActive && (
                <div className="status-indicator">
                  <div className={`status-dot ${isDetecting ? 'active' : 'paused'}`}></div>
                  <span className="status-text">{isDetecting ? 'Active' : 'Paused'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Camera Section */}
        <div className="ar-camera-section">
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
              
              {/* Placeholder */}
              {!cameraActive && (
                <div className="camera-placeholder">
                  <div className="placeholder-content">
                    <div className="placeholder-icon-wrapper">
                      <svg className="camera-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="placeholder-title">Camera Ready</h3>
                    <p className="placeholder-description">Point your camera at a location to detect and identify places</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="error-overlay">
                  <div className="error-content">
                    <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="error-text">{error}</p>
                  </div>
                </div>
              )}

              {/* Status Overlays */}
              {cameraActive && (
                <>
                  <div className="fps-badge">
                    <span className="fps-label">FPS</span>
                    <span className="fps-value">{fps}</span>
                  </div>
                  
                  {buildingDetected && (
                    <div className="detection-badge">
                      <span className="detection-icon">🏛️</span>
                      <span className="detection-text">Place Detected!</span>
                    </div>
                  )}

                  {!isModelLoaded && (
                    <div className="loading-overlay">
                      <div className="loading-spinner"></div>
                      <p>Loading AI model...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Controls Section */}
          <div className="ar-controls">
            <button
              onClick={toggleDetection}
              className={`primary-button ${cameraActive ? (isDetecting ? 'stop' : 'pause') : 'start'}`}
              disabled={!isModelLoaded}
            >
              {!cameraActive ? (
                <>
                  <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Start Detection</span>
                </>
              ) : isDetecting ? (
                <>
                  <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                  </svg>
                  <span>Pause Detection</span>
                </>
              ) : (
                <>
                  <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Resume Detection</span>
                </>
              )}
            </button>
            
            {cameraActive && (
              <button
                onClick={stopCamera}
                className="secondary-button"
                aria-label="Stop camera"
              >
                <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Stop Camera</span>
              </button>
            )}
          </div>

          {/* Info Section */}
          {!cameraActive && (
            <div className="ar-info">
              <div className="info-card">
                <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="info-content">
                  <h4 className="info-title">How it works</h4>
                  <p className="info-text">Point your camera at buildings or places around campus. Our AI will identify them automatically using advanced image recognition technology.</p>
                </div>
              </div>
            </div>
          )}
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
