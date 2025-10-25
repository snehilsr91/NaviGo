import ngrok from 'ngrok';

/**
 * Starts an ngrok tunnel for the frontend
 * @param {number} port - The port to tunnel
 * @returns {Promise<string>} - The public URL
 */
export async function startNgrokTunnel(port) {
  try {
    const options = {
      addr: port,
      region: process.env.NGROK_REGION || 'in',
      authtoken: process.env.NGROK_AUTH_TOKEN,
    };
    
    const url = await ngrok.connect(options);
    console.log(`\n✨ Frontend ngrok tunnel established at: ${url}`);
    console.log(`📱 Access your app on any device at: ${url}`);
    
    return url;
  } catch (error) {
    console.error('Error starting ngrok tunnel:', error);
    console.log('💡 You can still access the app locally at http://localhost:' + port);
    return null;
  }
}

/**
 * Stops the ngrok tunnel
 */
export async function stopNgrokTunnel() {
  try {
    await ngrok.disconnect();
    console.log('Ngrok tunnel closed');
  } catch (error) {
    console.error('Error closing ngrok tunnel:', error);
  }
}