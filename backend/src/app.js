import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import placesRoutes from "./routes/places.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import detectionsRoutes from "./routes/detections.routes.js";
import buildingReviewsRoutes from "./routes/buildingReviews.routes.js";
import { ask } from "./controllers/assistantController.js"; 
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/places", placesRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/detections", detectionsRoutes);
app.use("/api/buildings", buildingReviewsRoutes);

app.get("/api/assistant/ask", ask);

export default app;
