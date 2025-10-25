/**
 * Utility for managing custom object training with user-provided images
 */

// Store for reference images
const referenceImages = {
  // Format: 'object-name': [{ image: 'base64-data', timestamp: 'iso-date' }, ...]
};

/**
 * Save a reference image for a custom object
 * @param {string} objectName - Name of the object/person
 * @param {string} imageData - Base64 encoded image data
 * @param {string} timestamp - ISO timestamp when image was captured
 * @returns {boolean} - Success status
 */
export const saveReferenceImage = (objectName, imageData, timestamp) => {
  try {
    const key = objectName.toLowerCase();
    
    if (!referenceImages[key]) {
      referenceImages[key] = [];
    }
    
    referenceImages[key].push({
      image: imageData,
      timestamp: timestamp || new Date().toISOString()
    });
    
    // Save to localStorage for persistence
    localStorage.setItem('navigo_reference_images', JSON.stringify(referenceImages));
    
    return true;
  } catch (error) {
    console.error('Error saving reference image:', error);
    return false;
  }
};

/**
 * Load saved reference images from localStorage
 */
export const loadReferenceImages = () => {
  try {
    const saved = localStorage.getItem('navigo_reference_images');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach(key => {
        referenceImages[key] = parsed[key];
      });
    }
  } catch (error) {
    console.error('Error loading reference images:', error);
  }
};

/**
 * Get all reference images
 * @returns {Object} - Object with all reference images
 */
export const getAllReferenceImages = () => {
  return { ...referenceImages };
};

/**
 * Get reference images for a specific object
 * @param {string} objectName - Name of the object/person
 * @returns {Array} - Array of image objects for the specified object
 */
export const getObjectReferenceImages = (objectName) => {
  const key = objectName.toLowerCase();
  return referenceImages[key] || [];
};

/**
 * Delete a reference image
 * @param {string} objectName - Name of the object/person
 * @param {number} index - Index of the image to delete
 * @returns {boolean} - Success status
 */
export const deleteReferenceImage = (objectName, index) => {
  try {
    const key = objectName.toLowerCase();
    
    if (referenceImages[key] && referenceImages[key][index]) {
      referenceImages[key].splice(index, 1);
      
      // Remove the object if no images left
      if (referenceImages[key].length === 0) {
        delete referenceImages[key];
      }
      
      // Update localStorage
      localStorage.setItem('navigo_reference_images', JSON.stringify(referenceImages));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting reference image:', error);
    return false;
  }
};

/**
 * Connect to AI service for custom object training
 * This is a placeholder for the actual implementation that would
 * send images to the AI service for training
 * @param {string} objectName - Name of the object to train
 * @returns {Promise} - Promise that resolves when training is complete
 */
export const trainCustomObject = async (objectName) => {
  // This would be replaced with actual API call to AI service
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Training completed for object: ${objectName}`);
      resolve({
        success: true,
        objectName,
        message: `Successfully trained model to recognize ${objectName}`
      });
    }, 2000);
  });
};

// Load saved reference images on module import
loadReferenceImages();