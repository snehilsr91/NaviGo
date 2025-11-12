import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to photos directory
const photosBasePath = join(__dirname, "../../assets/Photos");

/**
 * Get photos for Shankaracharya Bhavan
 */
export const getShankaracharyaBhavanPhotos = async (req, res) => {
  try {
    const buildingPath = join(photosBasePath, "Shankaracharya Bhavan");
    
    // Read all files from the directory
    const files = readdirSync(buildingPath);
    
    // Filter image files
    const imageFiles = files.filter(file => {
      const ext = file.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    });
    
    // Create URLs for each photo
    const photos = imageFiles.map(file => {
      return `/api/buildings/photos/shankaracharya-bhavan/${encodeURIComponent(file)}`;
    });
    
    return res.json({
      success: true,
      building: 'Shankaracharya Bhavan',
      count: photos.length,
      photos: photos
    });
  } catch (error) {
    console.error("Error fetching Shankaracharya Bhavan photos:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch photos",
      message: error.message
    });
  }
};

/**
 * Get a specific photo file
 */
export const getPhotoFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const photoPath = join(photosBasePath, "Shankaracharya Bhavan", filename);
    
    // Send the file
    res.sendFile(photoPath, (err) => {
      if (err) {
        console.error("Error sending photo:", err);
        res.status(404).json({
          success: false,
          error: "Photo not found"
        });
      }
    });
  } catch (error) {
    console.error("Error serving photo:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to serve photo"
    });
  }
};

/**
 * Get all buildings with photos
 */
export const getAllBuildingsWithPhotos = async (req, res) => {
  try {
    const buildings = readdirSync(photosBasePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    const buildingsWithCounts = buildings.map(building => {
      const buildingPath = join(photosBasePath, building);
      const files = readdirSync(buildingPath);
      const imageFiles = files.filter(file => {
        const ext = file.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
      });
      
      return {
        name: building,
        photoCount: imageFiles.length
      };
    });
    
    return res.json({
      success: true,
      buildings: buildingsWithCounts
    });
  } catch (error) {
    console.error("Error fetching buildings:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch buildings"
    });
  }
};

