import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

/**
 * Place Detector using MobileNet feature extraction and image similarity
 * Detects any place based on reference images
 */
class BuildingDetector {
  constructor() {
    this.model = null;
    this.isInitialized = false;
    this.referenceFeatures = new Map(); // Map<placeName, Array<featureVectors>>
    this.placesLoaded = false;
    this.detectionThreshold = 0.65; // Cosine similarity threshold (0.65 = 65% similarity)
    this.maxReferenceImages = 5; // Limit reference images per place for performance
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    this.apiBaseUrl = API_URL.replace('/api', '');
  }

  /**
   * Initialize the MobileNet model
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🏢 Initializing Place Detector...');
      await tf.setBackend('webgl');
      await tf.ready();
      
      // Load MobileNet for feature extraction
      this.model = await mobilenet.load();
      this.isInitialized = true;
      console.log('✅ Place Detector initialized successfully');
      
      // Load reference images for all places
      await this.loadAllPlaces();
    } catch (error) {
      console.error('❌ Failed to initialize Place Detector:', error);
      throw error;
    }
  }

  /**
   * Load all places and their reference images from backend
   */
  async loadAllPlaces() {
    if (this.placesLoaded) {
      return;
    }

    try {
      console.log('📸 Loading reference images for all places...');
      const response = await fetch(`${this.apiBaseUrl}/api/buildings/all-with-photos`);
      const data = await response.json();
      
      if (!data.success || !data.places) {
        console.warn('⚠️ No places found or error loading places');
        return;
      }

      console.log(`📁 Found ${data.places.length} places with photos`);
      
      // Load reference images for each place
      for (const place of data.places) {
        if (place.photoUrls && place.photoUrls.length > 0) {
          await this.loadReferenceImagesForPlace(place.name, place.photoUrls);
        }
      }
      
      this.placesLoaded = true;
      console.log(`✅ Loaded reference images for ${this.referenceFeatures.size} places`);
    } catch (error) {
      console.error('❌ Error loading places:', error);
    }
  }

  /**
   * Load and extract features from reference images for a specific place
   */
  async loadReferenceImagesForPlace(placeName, photoUrls) {
    try {
      const featureVectors = [];
      const imageUrlsToLoad = photoUrls.slice(0, this.maxReferenceImages); // Limit for performance
      
      console.log(`  Loading ${imageUrlsToLoad.length} reference images for: ${placeName}`);
      
      for (const photoUrl of imageUrlsToLoad) {
        try {
          const fullUrl = photoUrl.startsWith('http') 
            ? photoUrl 
            : `${this.apiBaseUrl}${photoUrl}`;
          
          // Load image with timeout
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Image loading timeout'));
            }, 10000); // 10 second timeout
            
            img.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            img.onerror = (err) => {
              clearTimeout(timeout);
              reject(new Error(`Failed to load image: ${fullUrl}`));
            };
            img.src = fullUrl;
          });
          
          // Extract feature vector using MobileNet
          const features = await this.extractFeatures(img);
          if (features) {
            featureVectors.push(features);
          }
        } catch (err) {
          console.warn(`    Failed to load image ${photoUrl}:`, err.message);
        }
      }
      
      if (featureVectors.length > 0) {
        this.referenceFeatures.set(placeName, featureVectors);
        console.log(`    ✅ Loaded ${featureVectors.length} reference feature vectors for ${placeName}`);
      }
    } catch (error) {
      console.error(`❌ Error loading reference images for ${placeName}:`, error);
    }
  }

  /**
   * Extract feature vector from an image using MobileNet
   * Returns a tensor representing the image features
   */
  async extractFeatures(imageElement) {
    try {
      if (!this.model) {
        await this.initialize();
      }
      
      // Use MobileNet's infer method to get feature vector
      // This returns a 1024-dimensional feature vector
      const embedding = this.model.infer(imageElement, true); // true = return embeddings
      
      // Normalize the feature vector for better cosine similarity comparison
      const normalized = tf.div(embedding, tf.norm(embedding, 'euclidean'));
      const features = await normalized.data();
      
      // Dispose tensors to free memory
      embedding.dispose();
      normalized.dispose();
      
      return Array.from(features);
    } catch (error) {
      console.error('Error extracting features:', error);
      return null;
    }
  }

  /**
   * Calculate cosine similarity between two feature vectors
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }
    
    return dotProduct / (norm1 * norm2);
  }

  /**
   * Detect which place is in the image by comparing with reference images
   * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} imageElement
   * @returns {Promise<Object>} Detection result
   */
  async detectBuilding(imageElement) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.referenceFeatures.size === 0) {
      console.warn('⚠️ No reference images loaded yet');
      return { detected: false, confidence: 0, building: null };
    }

    try {
      // Extract features from current frame
      const currentFeatures = await this.extractFeatures(imageElement);
      if (!currentFeatures) {
        return { detected: false, confidence: 0, building: null };
      }
      
      // Compare with all reference images
      let bestMatch = {
        place: null,
        similarity: 0,
        matches: 0
      };
      
      for (const [placeName, referenceVectors] of this.referenceFeatures.entries()) {
        let maxSimilarity = 0;
        let matches = 0;
        
        // Compare with all reference images for this place
        for (const referenceVector of referenceVectors) {
          const similarity = this.cosineSimilarity(currentFeatures, referenceVector);
          maxSimilarity = Math.max(maxSimilarity, similarity);
          
          if (similarity > this.detectionThreshold) {
            matches++;
          }
        }
        
        // Average similarity across all references
        const avgSimilarity = referenceVectors.reduce((sum, ref) => 
          sum + this.cosineSimilarity(currentFeatures, ref), 0) / referenceVectors.length;
        
        // Use both max similarity and average similarity
        const combinedSimilarity = (maxSimilarity * 0.7) + (avgSimilarity * 0.3);
        
        if (combinedSimilarity > bestMatch.similarity) {
          bestMatch = {
            place: placeName,
            similarity: combinedSimilarity,
            matches: matches
          };
        }
      }
      
      // Check if similarity meets threshold
      if (bestMatch.similarity >= this.detectionThreshold && bestMatch.place) {
        return {
          detected: true,
          confidence: bestMatch.similarity,
          building: bestMatch.place,
          matches: bestMatch.matches,
          note: `Matched with ${bestMatch.matches} reference image(s)`
        };
      }
      
      return {
        detected: false,
        confidence: bestMatch.similarity,
        building: null,
        bestMatch: bestMatch.place,
        note: 'Similarity below threshold'
      };
    } catch (error) {
      console.error('Error detecting place:', error);
      return { detected: false, confidence: 0, building: null };
    }
  }

  /**
   * Reload reference images (useful after adding new places)
   */
  async reloadPlaces() {
    this.placesLoaded = false;
    this.referenceFeatures.clear();
    await this.loadAllPlaces();
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
    this.referenceFeatures.clear();
    this.placesLoaded = false;
  }
}

// Create a singleton instance
const buildingDetector = new BuildingDetector();

export default buildingDetector;
