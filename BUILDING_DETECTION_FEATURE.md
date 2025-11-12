# Building Detection Feature - Shankaracharya Bhavan

## Overview
The NaviGo AR navigation app now includes an intelligent building detection feature that uses TensorFlow.js to identify Shankaracharya Bhavan when it appears in the camera view. When detected, users can view building information, photos, reviews, and navigate to it on the map.

## Features

### 🎯 Core Functionality
1. **Real-time Building Detection**: Uses TensorFlow.js MobileNet to detect Shankaracharya Bhavan from camera feed
2. **Smart Modal Interface**: Beautiful modal appears when building is detected
3. **Building Information**: View details about the building including departments and floors
4. **Photo Gallery**: Browse through photos of Shankaracharya Bhavan
5. **Reviews & Comments**: Read user reviews and comments about the building
6. **Map Integration**: Navigate directly to the building on the interactive map

### 📱 How It Works

#### Detection Process
1. User starts AR detection mode
2. Camera feed is analyzed every 3 seconds using MobileNet model
3. When building features are detected with sufficient confidence, a modal pops up
4. User can then explore building information, photos, and navigate to it

#### Technical Stack
- **Frontend**:
  - TensorFlow.js for machine learning
  - @tensorflow-models/mobilenet for image classification
  - @tensorflow-models/coco-ssd for object detection
  - React for UI components
  - Tailwind CSS for styling

- **Backend**:
  - Express.js for API routes
  - File system for photo storage
  - MongoDB for reviews (optional)

## File Structure

### Frontend Files
```
frontend/
├── src/
│   ├── components/
│   │   └── AR/
│   │       ├── BuildingDetectionModal.jsx    # Modal UI for detected building
│   │       └── ObjectDetectorSimple.jsx      # Updated with building detection
│   ├── utils/
│   │   └── buildingDetector.js               # Building detection logic
│   └── data/
│       └── buildings.js                       # Building coordinates data
```

### Backend Files
```
backend/
├── src/
│   ├── controllers/
│   │   └── buildingPhotos.controller.js      # Photo API controller
│   ├── routes/
│   │   └── buildingPhotos.routes.js          # Photo routes
│   └── app.js                                 # Updated with photo routes
└── assets/
    └── Photos/
        └── Shankaracharya Bhavan/             # Building photos directory
            ├── WhatsApp Image 2025-11-11 at 16.47.40.jpeg
            ├── WhatsApp Image 2025-11-11 at 16.47.41.jpeg
            └── ... (12 photos total)
```

## API Endpoints

### Get Shankaracharya Bhavan Photos
```
GET /api/buildings/shankaracharya-bhavan/photos
```
**Response:**
```json
{
  "success": true,
  "building": "Shankaracharya Bhavan",
  "count": 12,
  "photos": [
    "/api/buildings/photos/shankaracharya-bhavan/WhatsApp%20Image%202025-11-11%20at%2016.47.40.jpeg",
    ...
  ]
}
```

### Get Specific Photo
```
GET /api/buildings/photos/shankaracharya-bhavan/:filename
```
Returns the image file.

### Get All Buildings with Photos
```
GET /api/buildings/all-with-photos
```
**Response:**
```json
{
  "success": true,
  "buildings": [
    {
      "name": "Shankaracharya Bhavan",
      "photoCount": 12
    }
  ]
}
```

## Usage Instructions

### For Users
1. **Start AR Navigation**: 
   - Go to the homepage and click "Start AR Navigation"
   - Or use the navbar to navigate to AR page

2. **Enable Detection**:
   - Click "Start Detection" button
   - Allow camera permissions when prompted

3. **Point at Building**:
   - Point your camera at Shankaracharya Bhavan
   - Wait for detection (happens every 3 seconds)

4. **Interact with Modal**:
   - When detected, a modal will appear
   - Browse through tabs: Info, Photos, Reviews
   - Click "View on Map" to navigate to the building on map
   - Click "Reviews" to see user comments

### For Developers

#### Adding More Buildings
1. **Add photos** to `backend/assets/Photos/[Building Name]/`

2. **Update buildingDetector.js** to include the new building:
```javascript
this.buildingFeatures = {
  'Building Name': {
    keywords: ['building', 'structure', ...],
    minConfidence: 0.4,
    colorProfile: {
      dominant: 'color',
      secondary: 'color'
    }
  }
};
```

3. **Update BuildingDetectionModal.jsx** with building info:
```javascript
const buildingInfo = {
  'Building Name': {
    name: 'Building Name',
    description: '...',
    departments: [...],
    mapLabel: 'Building Name'
  }
};
```

4. **Add building to** `frontend/src/data/buildings.js`:
```javascript
{ id: 'building-id', name: 'Building Name', position: { lat: ..., lng: ... } }
```

#### Customizing Detection
Adjust detection parameters in `buildingDetector.js`:
- `detectionThreshold`: Overall confidence threshold
- `minConfidence`: Building-specific confidence
- Detection interval: Change `3000` ms in ObjectDetectorSimple.jsx

## Performance Optimization

### Current Optimizations
1. **Model Loading**: MobileNet Lite version for faster processing
2. **Detection Interval**: 3-second intervals to reduce CPU usage
3. **WebGL Backend**: Hardware acceleration when available
4. **Lazy Loading**: Building detector initialized only when needed

### Recommended Settings
- **Camera Resolution**: 640x480 (ideal balance)
- **Frame Rate**: 15-30 FPS
- **Detection Frequency**: Every 3 seconds

## Troubleshooting

### Building Not Detected
- **Solution**: Ensure good lighting and clear view of building
- Try moving closer or adjusting angle
- Check console for detection logs

### Modal Not Appearing
- **Check**: Browser console for errors
- Verify TensorFlow.js models loaded successfully
- Ensure camera permissions are granted

### Photos Not Loading
- **Check**: Backend server is running
- Verify photo files exist in `backend/assets/Photos/Shankaracharya Bhavan/`
- Check API endpoint returns correct URLs

### Low FPS / Performance Issues
- **Reduce** camera resolution
- **Increase** detection interval (5-10 seconds)
- **Close** other browser tabs
- **Use** Chrome/Edge for better WebGL support

## Future Enhancements

### Planned Features
1. ✅ Multi-building detection
2. ✅ Indoor navigation markers
3. ✅ AR arrows pointing to building
4. ✅ Distance estimation
5. ✅ Augmented information overlays
6. ✅ User-contributed photos
7. ✅ Voice-guided navigation

### Training Custom Model
For better accuracy, consider training a custom model:
1. Collect 200+ images of Shankaracharya Bhavan
2. Use TensorFlow.js Model Maker or Teachable Machine
3. Export and integrate into buildingDetector.js

## Credits
- **TensorFlow.js**: Google Brain Team
- **MobileNet**: Google Research
- **COCO-SSD**: Microsoft & Google
- **Photos**: National Institute of Engineering, Mysore

## License
This feature is part of the NaviGo AR Navigation project.

---

**Last Updated**: November 12, 2025
**Version**: 1.0.0

