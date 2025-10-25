/**
 * Ngrok service for exposing local server to the internet
 */
const ngrok = require('ngrok');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Start ngrok tunnel
 * @param {number} port - The port to expose
 * @returns {Promise<string>} - The public URL
 */
const startNgrok = async (port) => {
  try {
    // Get auth token from environment variables if available
    const authtoken = process.env.NGROK_AUTH_TOKEN;
    
    const options = {
      addr: port,
      // Use basic auth if credentials are provided
      basic_auth: process.env.NGROK_BASIC_AUTH,
      // Use authtoken if provided
      authtoken: authtoken
    };
    
    // Start ngrok
    const url = await ngrok.connect(options);
    console.log(`✨ Ngrok tunnel is running at: ${url}`);
    return url;
  } catch (error) {
    console.error('Error starting ngrok:', error);
    // Return null if ngrok fails, so the app can still run locally
    return null;
  }
};

/**
 * Stop ngrok tunnel
 */
const stopNgrok = async () => {
  try {
    await ngrok.kill();
    console.log('Ngrok tunnel closed');
  } catch (error) {
    console.error('Error stopping ngrok:', error);
  }
};

module.exports = {
  startNgrok,
  stopNgrok
};