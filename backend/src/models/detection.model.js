import mongoose from 'mongoose';

const DetectionSchema = new mongoose.Schema({
  objects: [{
    class: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      required: true
    },
    position: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    }
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Detection = mongoose.model('Detection', DetectionSchema);

export default Detection;