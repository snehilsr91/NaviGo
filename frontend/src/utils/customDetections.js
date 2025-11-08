// Custom detection mappings for personalized labels
const customDetections = {
  // Map standard COCO-SSD classes to custom labels
  // Format: 'standard-class': 'custom-label'
  'person': 'Person',  // Replace with actual name
  'laptop': 'MacBook Pro',
  'cell phone': 'iPhone',
  'backpack': 'Campus Backpack',
  'bottle': 'Water Bottle',
  'cup': 'Coffee Cup',
  'chair': 'Campus Seat',
  'bicycle': 'Campus Bike',
  'car': 'Vehicle',
  'bus': 'Campus Shuttle',
  
  // Add more custom mappings as needed
  // 'building': 'Library',
  // 'building': 'Computer Science Department',
};

// Function to get custom label if available, otherwise return original
export const getCustomLabel = (standardLabel) => {
  return customDetections[standardLabel.toLowerCase()] || standardLabel;
};

// Function to check if an object should be highlighted as important
export const isImportantObject = (label) => {
  // List of objects that should be highlighted
  const importantObjects = ['person', 'laptop', 'cell phone', 'backpack', 'bicycle', 'bus', 'car'];
  return importantObjects.includes(label.toLowerCase());
};

// Function to add or update a custom label
export const addCustomLabel = (standardLabel, customLabel) => {
  customDetections[standardLabel.toLowerCase()] = customLabel;
};

export default customDetections;