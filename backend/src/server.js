import mongoose from "mongoose";
import app from "./app.js";
import dotenv from "dotenv";
import ngrok from "ngrok";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/navigo";

// Start the server regardless of MongoDB connection
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start ngrok tunnel
  startNgrokTunnel(PORT);
});

// Try to connect to MongoDB
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.log("Server running without MongoDB connection");
  });

// Function to start ngrok tunnel
async function startNgrokTunnel(port) {
  try {
    const options = {
      addr: port,
      region: process.env.NGROK_REGION || 'us',
      authtoken: process.env.NGROK_AUTH_TOKEN,
    };
    
    const url = await ngrok.connect(options);
    console.log(`\n✨ Ngrok tunnel established at: ${url}`);
    console.log(`📱 Test your app on your mobile device at: ${url}`);
    console.log(`🔗 API endpoint: ${url}/api`);
    
    // Save the URL to be accessible from other parts of the application
    global.ngrokUrl = url;
  } catch (error) {
    console.error('Error starting ngrok tunnel:', error);
    console.log('💡 You can still access the app locally at http://localhost:' + port);
  }
}
