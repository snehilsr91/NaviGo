import { readdirSync, existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to photos directory
const photosBasePath = join(__dirname, "../../assets/Photos");
const imagesBasePath = join(photosBasePath, "Images");

/**
 * Helper function to sanitize place name for URL
 */
function sanitizePlaceName(placeName) {
  return encodeURIComponent(placeName);
}

/**
 * Helper function to get place name from URL
 */
function getPlaceNameFromUrl(urlEncodedName) {
  try {
    return decodeURIComponent(urlEncodedName);
  } catch (e) {
    return urlEncodedName;
  }
}

/**
 * Get photos for a specific place (supports both Images subdirectory and main Photos directory)
 */
export const getPlacePhotos = async (req, res) => {
  try {
    const { placeName } = req.params;
    const decodedPlaceName = getPlaceNameFromUrl(placeName);

    // Try Images subdirectory first (organized places)
    let buildingPath = join(imagesBasePath, decodedPlaceName);
    if (!existsSync(buildingPath) || !statSync(buildingPath).isDirectory()) {
      // Fall back to main Photos directory (like Shankaracharya Bhavan)
      buildingPath = join(photosBasePath, decodedPlaceName);
    }

    if (!existsSync(buildingPath) || !statSync(buildingPath).isDirectory()) {
      return res.status(404).json({
        success: false,
        error: "Place not found",
        message: `No photos directory found for: ${decodedPlaceName}`,
      });
    }

    // Read all files from the directory
    const files = readdirSync(buildingPath);

    // Filter image files
    const imageFiles = files.filter((file) => {
      const ext = file.toLowerCase().split(".").pop();
      return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    });

    // Create URLs for each photo
    const photos = imageFiles.map((file) => {
      return `/api/buildings/photos/${sanitizePlaceName(
        decodedPlaceName
      )}/${encodeURIComponent(file)}`;
    });

    return res.json({
      success: true,
      place: decodedPlaceName,
      count: photos.length,
      photos: photos,
    });
  } catch (error) {
    console.error(`Error fetching photos for place:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch photos",
      message: error.message,
    });
  }
};

/**
 * Get photos for Shankaracharya Bhavan (for backward compatibility)
 */
export const getShankaracharyaBhavanPhotos = async (req, res) => {
  req.params.placeName = "Shankaracharya Bhavan";
  return getPlacePhotos(req, res);
};

/**
 * Get a specific photo file for any place
 */
export const getPhotoFile = async (req, res) => {
  try {
    const { placeName, filename } = req.params;
    const decodedPlaceName = getPlaceNameFromUrl(placeName);
    const decodedFilename = getPlaceNameFromUrl(filename);

    // Try Images subdirectory first
    let photoPath = join(imagesBasePath, decodedPlaceName, decodedFilename);
    if (!existsSync(photoPath)) {
      // Fall back to main Photos directory
      photoPath = join(photosBasePath, decodedPlaceName, decodedFilename);
    }

    if (!existsSync(photoPath)) {
      return res.status(404).json({
        success: false,
        error: "Photo not found",
      });
    }

    // Set proper headers for image serving
    const ext = decodedFilename.toLowerCase().split('.').pop();
    const contentTypeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    
    const contentType = contentTypeMap[ext] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the file (photoPath is already absolute)
    res.sendFile(photoPath, (err) => {
      if (err) {
        console.error("Error sending photo:", err);
        if (!res.headersSent) {
          res.status(404).json({
            success: false,
            error: "Photo not found",
          });
        }
      }
    });
  } catch (error) {
    console.error("Error serving photo:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to serve photo",
    });
  }
};

/**
 * Get all places with photos (from both Images subdirectory and main Photos directory)
 */
export const getAllBuildingsWithPhotos = async (req, res) => {
  try {
    const placesMap = new Map();

    // Get places from Images subdirectory (organized places)
    if (existsSync(imagesBasePath)) {
      const imagePlaces = readdirSync(imagesBasePath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => {
          const placePath = join(imagesBasePath, dirent.name);
          const files = readdirSync(placePath);
          const imageFiles = files.filter((file) => {
            const ext = file.toLowerCase().split(".").pop();
            return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
          });

          return {
            name: dirent.name,
            photoCount: imageFiles.length,
            photoUrls: imageFiles.map(
              (file) =>
                `/api/buildings/photos/${sanitizePlaceName(
                  dirent.name
                )}/${encodeURIComponent(file)}`
            ),
          };
        });

      imagePlaces.forEach((place) => {
        placesMap.set(place.name, place);
      });
    }

    // Get places from main Photos directory (like Shankaracharya Bhavan)
    if (existsSync(photosBasePath)) {
      const mainPlaces = readdirSync(photosBasePath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory() && dirent.name !== "Images")
        .map((dirent) => {
          const placePath = join(photosBasePath, dirent.name);
          const files = readdirSync(placePath);
          const imageFiles = files.filter((file) => {
            const ext = file.toLowerCase().split(".").pop();
            return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
          });

          return {
            name: dirent.name,
            photoCount: imageFiles.length,
            photoUrls: imageFiles.map(
              (file) =>
                `/api/buildings/photos/${sanitizePlaceName(
                  dirent.name
                )}/${encodeURIComponent(file)}`
            ),
          };
        });

      mainPlaces.forEach((place) => {
        // Merge or add to map
        if (placesMap.has(place.name)) {
          const existing = placesMap.get(place.name);
          existing.photoCount += place.photoCount;
          existing.photoUrls = [...existing.photoUrls, ...place.photoUrls];
        } else {
          placesMap.set(place.name, place);
        }
      });
    }

    const places = Array.from(placesMap.values());

    return res.json({
      success: true,
      places: places,
      count: places.length,
    });
  } catch (error) {
    console.error("Error fetching places:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch places",
      message: error.message,
    });
  }
};
