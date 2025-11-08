import express from "express";
import cors from "cors";
import placesRoutes from "./routes/places.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import detectionsRoutes from "./routes/detections.routes.js";
import { ask } from "./controllers/assistantController.js"; 
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/places", placesRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/detections", detectionsRoutes);

app.get("/api/assistant/ask", ask);

export default app;
