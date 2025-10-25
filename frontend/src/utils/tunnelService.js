import localtunnel from 'localtunnel';

/**
 * Starts a localtunnel for the frontend
 * @param {number} port - The port to tunnel
 * @returns {Promise<string>} - The public URL
 */
export async function startTunnel(port) {
  try {
    const tunnel = await localtunnel({ port });
    
    console.log(`\n✨ Frontend tunnel established at: ${tunnel.url}`);
    console.log(`📱 Access your app on any device at: ${tunnel.url}`);
    
    // Handle tunnel close events
    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
    
    return tunnel;
  } catch (error) {
    console.error('Error starting tunnel:', error);
    console.log('💡 You can still access the app locally at http://localhost:' + port);
    return null;
  }
}

/**
 * Stops the tunnel
 * @param {Object} tunnel - The tunnel instance to close
 */
export async function stopTunnel(tunnel) {
  if (tunnel) {
    try {
      tunnel.close();
    } catch (error) {
      console.error('Error closing tunnel:', error);
    }
  }
}