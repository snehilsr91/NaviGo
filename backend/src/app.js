import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import placesRoutes from "./routes/places.routes.js";
import detectionsRoutes from "./routes/detections.routes.js";
import buildingReviewsRoutes from "./routes/buildingReviews.routes.js";
import { ask } from "./controllers/assistantController.js"; 
import { connectDB, isConnected } from "./utils/connectDB.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// MongoDB connection middleware - ensures DB is connected before API routes
// This runs before all routes and ensures MongoDB is connected for database operations
app.use(async (req, res, next) => {
  // Skip DB connection for health check, root, and assistant endpoints (assistant doesn't use DB)
  if (req.path === '/health' || req.path === '/' || req.path === '/api/assistant/ask') {
    return next();
  }

  // For API routes that use MongoDB, ensure connection is established
  if (req.path.startsWith('/api')) {
    try {
      // Check if already connected
      if (!isConnected()) {
        console.log(`🔄 Establishing MongoDB connection for ${req.method} ${req.path}`);
        await connectDB();
      }
      next();
    } catch (err) {
      console.error('❌ DB connection failed in middleware:', err.message);
      // Return error response instead of continuing
      return res.status(503).json({
        error: 'Database unavailable',
        message: 'Unable to connect to database. Please try again later.',
        details: err.message,
      });
    }
  } else {
    next();
  }
});

// Routes
app.use("/api/places", placesRoutes);
app.use("/api/detections", detectionsRoutes);
app.use("/api/buildings", buildingReviewsRoutes);

app.get("/api/assistant/ask", ask);

export default app;
