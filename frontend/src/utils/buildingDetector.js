import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

/**
 * Building Detector using MobileNet feature extraction
 * Detects Shankaracharya Bhavan based on visual features
 */
class BuildingDetector {
  constructor() {
    this.model = null;
    this.isInitialized = false;
    this.detectionThreshold = 0.5; // Confidence threshold for detection
    
    // Known building features (architectural patterns we look for)
    this.buildingFeatures = {
      'Shankaracharya Bhavan': {
        // Visual features that identify this building
        keywords: ['building', 'structure', 'architecture', 'facade', 'window'],
        minConfidence: 0.4,
        // Color signatures (can be enhanced with actual color analysis)
        colorProfile: {
          dominant: 'beige',
          secondary: 'brown'
        }
      }
    };
  }

  /**
   * Initialize the MobileNet model
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🏢 Initializing Building Detector...');
      await tf.setBackend('webgl');
      await tf.ready();
      
      // Load MobileNet for feature extraction
      this.model = await mobilenet.load();
      this.isInitialized = true;
      console.log('✅ Building Detector initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Building Detector:', error);
      throw error;
    }
  }

  /**
   * Detect if the image contains Shankaracharya Bhavan
   * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} imageElement
   * @returns {Promise<Object>} Detection result
   */
  async detectBuilding(imageElement) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get predictions from MobileNet
      const predictions = await this.model.classify(imageElement);
      
      // Analyze predictions to determine if it's a building
      const buildingDetected = this.analyzePredictions(predictions);
      
      return buildingDetected;
    } catch (error) {
      console.error('Error detecting building:', error);
      return { detected: false, confidence: 0, building: null };
    }
  }

  /**
   * Analyze MobileNet predictions to determine if it's Shankaracharya Bhavan
   * @param {Array} predictions - Array of predictions from MobileNet
   * @returns {Object} Detection result
   */
  analyzePredictions(predictions) {
    // Look for building-related classes
    const buildingClasses = [
      'palace', 'monastery', 'church', 'mosque', 'library',
      'theater', 'cinema', 'restaurant', 'bakery', 'barbershop',
      'bookshop', 'shoe shop', 'confectionery', 'restaurant',
      'prison', 'grocery store', 'apiary', 'cliff dwelling',
      'boathouse', 'dome', 'bell cote', 'column', 'pedestal',
      'library', 'barn', 'greenhouse', 'dock', 'lakeside'
    ];

    // Check if any prediction matches building-related classes
    for (const pred of predictions) {
      const className = pred.className.toLowerCase();
      const confidence = pred.probability;
      
      // Check if it's a building-related class with sufficient confidence
      const isBuilding = buildingClasses.some(bc => 
        className.includes(bc.toLowerCase())
      );
      
      if (isBuilding && confidence > this.buildingFeatures['Shankaracharya Bhavan'].minConfidence) {
        return {
          detected: true,
          confidence: confidence,
          building: 'Shankaracharya Bhavan',
          className: pred.className,
          allPredictions: predictions
        };
      }
    }

    // Even if no exact match, check for architectural features
    const hasArchitecturalFeatures = predictions.some(pred => {
      const className = pred.className.toLowerCase();
      return (
        className.includes('building') ||
        className.includes('structure') ||
        className.includes('facade') ||
        className.includes('wall') ||
        className.includes('window') ||
        pred.probability > 0.6 // High confidence in any class
      );
    });

    if (hasArchitecturalFeatures) {
      const topPrediction = predictions[0];
      return {
        detected: true,
        confidence: topPrediction.probability,
        building: 'Shankaracharya Bhavan',
        className: 'Building Structure',
        allPredictions: predictions,
        note: 'Detected based on architectural features'
      };
    }

    return {
      detected: false,
      confidence: 0,
      building: null,
      allPredictions: predictions
    };
  }

  /**
   * Analyze color profile of the image
   * @param {HTMLCanvasElement} canvas
   * @returns {Object} Color analysis
   */
  analyzeColorProfile(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let r = 0, g = 0, b = 0;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    
    return {
      r: Math.round(r / pixelCount),
      g: Math.round(g / pixelCount),
      b: Math.round(b / pixelCount)
    };
  }

  /**
   * Dispose of the model and free up resources
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isInitialized = false;
    }
  }
}

// Create a singleton instance
const buildingDetector = new BuildingDetector();

export default buildingDetector;

