import ngrok from 'ngrok';

let activeTunnelUrl = null;

/**
 * Starts an ngrok tunnel for the frontend
 * @param {number} port - The port to tunnel
 * @returns {Promise<string>} - The public URL
 */
export async function startNgrokTunnel(port) {
  try {
    if (!process.env.NGROK_AUTH_TOKEN) {
      console.warn('\n⚠️  NGROK_AUTH_TOKEN not found in environment variables.');
      console.warn('💡 To enable HTTPS tunnel for camera access, set NGROK_AUTH_TOKEN in your .env file');
      console.warn('💡 Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken');
      console.warn(`💡 Currently accessible at: http://localhost:${port} (camera will NOT work on HTTP)`);
      return null;
    }

    const options = {
      addr: port,
      region: process.env.NGROK_REGION || 'in',
      authtoken: process.env.NGROK_AUTH_TOKEN,
    };
    
    const url = await ngrok.connect(options);
    activeTunnelUrl = url;
    
    // Wait a moment for Vite's initial output to finish, then display prominently
    setTimeout(() => {
      const separator = '='.repeat(70);
      console.log('\n');
      console.log(separator);
      console.log('✨✨✨  NGROK HTTPS TUNNEL ACTIVE  ✨✨✨');
      console.log(separator);
      console.log('');
      console.log('📱 HTTPS URL (USE THIS ON MOBILE FOR CAMERA ACCESS):');
      console.log('');
      console.log('   ' + url);
      console.log('');
      console.log(separator);
      console.log('');
      console.log('🌐 Local URL (HTTP - camera will NOT work):');
      console.log('   http://localhost:' + port);
      console.log('');
      console.log('⚠️  IMPORTANT: Use the HTTPS URL above for camera access!');
      console.log('⚠️  HTTP URLs will NOT work for camera on mobile devices.');
      console.log('');
      console.log(separator);
      console.log('\n');
    }, 1000);
    
    return url;
  } catch (error) {
    console.error('\n❌ Error starting ngrok tunnel:', error.message);
    console.log('💡 Make sure NGROK_AUTH_TOKEN is set correctly');
    console.log('💡 You can still access the app locally at http://localhost:' + port);
    console.log('⚠️  Camera will NOT work on HTTP - you need HTTPS (ngrok)');
    return null;
  }
}

/**
 * Stops the ngrok tunnel
 */
export async function stopNgrokTunnel() {
  try {
    await ngrok.disconnect();
    activeTunnelUrl = null;
    console.log('Ngrok tunnel closed');
  } catch (error) {
    console.error('Error closing ngrok tunnel:', error);
  }
}

/**
 * Gets the current active tunnel URL
 * @returns {string|null} - The active tunnel URL or null
 */
export function getActiveTunnelUrl() {
  return activeTunnelUrl;
}