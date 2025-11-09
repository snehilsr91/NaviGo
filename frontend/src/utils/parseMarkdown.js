// Utility to parse simple markdown and extract location info
export function parseMarkdown(text) {
  // Parse bold text (**text**)
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  return html;
}

// Extract building names and locations from text for map buttons
export function extractLocations(text) {
  const locations = [];
  
  // Specific building names and important locations
  const specificBuildings = [
    'Ramanujacharya Bhavan',
    'Madhavacharya Bhavan', 
    'Shankaracharya Bhavan',
    'Main Building',
    'Central Library',
    'Library',
    'Canteen',
    'Hostel',
    'Auditorium',
    'Sports Complex'
  ];
  
  // Check for specific building names first
  specificBuildings.forEach(building => {
    const regex = new RegExp(`\\b${building}\\b`, 'gi');
    if (text.match(regex)) {
      locations.push(building);
    }
  });
  
  // Remove duplicates and filter out generic terms if specific buildings are found
  const uniqueLocations = [...new Set(locations)];
  
  // If we found specific buildings, don't show generic buttons
  if (uniqueLocations.length > 0) {
    return uniqueLocations;
  }
  
  // Only show generic terms if no specific buildings were found
  const genericTerms = ['Library', 'Canteen', 'Hostel'];
  genericTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    if (text.match(regex)) {
      locations.push(term);
    }
  });
  
  return [...new Set(locations)];
}