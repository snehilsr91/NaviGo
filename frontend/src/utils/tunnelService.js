import { startNgrokTunnel, stopNgrokTunnel } from './ngrokService.js';

let activeTunnelUrl = null;

/**
 * Starts an ngrok tunnel for the frontend
 * @param {number} port - The port to tunnel
 * @returns {Promise<string | null>} - The public URL, or null on failure
 */
export async function startTunnel(port) {
  try {
    activeTunnelUrl = await startNgrokTunnel(port);
    return activeTunnelUrl;
  } catch (error) {
    console.error('Error starting ngrok tunnel:', error);
    console.log('💡 You can still access the app locally at http://localhost:' + port);
    activeTunnelUrl = null;
    return null;
  }
}

/**
 * Stops the active ngrok tunnel if one exists
 */
export async function stopTunnel() {
  if (!activeTunnelUrl) {
    return;
  }

  try {
    await stopNgrokTunnel();
    activeTunnelUrl = null;
  } catch (error) {
    console.error('Error closing ngrok tunnel:', error);
  }
}