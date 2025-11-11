export async function askBackend(q) {
  // Get API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // In production, VITE_API_URL must be set
  if (!apiUrl) {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      // Development fallback
      const devUrl = 'http://localhost:5000/api';
      console.warn(`⚠️ VITE_API_URL not set, using development fallback: ${devUrl}`);
    } else {
      // Production error
      console.error('❌ VITE_API_URL environment variable is not set!');
      throw new Error('API URL not configured. Please set VITE_API_URL environment variable in your deployment settings.');
    }
  }
  
  const baseUrl = apiUrl || 'http://localhost:5000/api';
  const url = `${baseUrl}/assistant/ask?q=${encodeURIComponent(q)}`;
  
  console.log('🔍 Fetching from:', url);
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    // Check if response is OK
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Expected JSON but got:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response. Make sure the backend is accessible.');
    }
    
    const data = await res.json();
    console.log('✅ API response received:', data);
    return data; // { matches: [...] } or { reply: string }
  } catch (error) {
    console.error('❌ API request failed:', error);
    throw error;
  }
}