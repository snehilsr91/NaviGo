import { askCampus } from './campusQA.js';

export async function askBackend(q) {
  // First, try the local rule-based campus QA for quick responses
  // This provides instant answers for campus-related questions
  const campusAnswer = askCampus(q);
  const lowerQ = q.toLowerCase();
  const isCampusQuery = 
    lowerQ.includes('campus') ||
    lowerQ.includes('building') ||
    lowerQ.includes('department') ||
    lowerQ.includes('library') ||
    lowerQ.includes('canteen') ||
    lowerQ.includes('hostel') ||
    lowerQ.includes('bhavan') ||
    lowerQ.includes('college') ||
    lowerQ.includes('lab') ||
    lowerQ.includes('mess') ||
    lowerQ.includes('parking') ||
    lowerQ.includes('bakery') ||
    lowerQ.includes('food court') ||
    lowerQ.includes('gopi') ||
    lowerQ.includes('coca cola');
  
  // If it's a campus query and we got a valid answer from local QA, use it
  // but still try backend for more comprehensive AI-powered responses
  if (isCampusQuery && campusAnswer && !campusAnswer.includes('could not find')) {
    // We'll still try backend, but could use this as fallback
    console.log('📍 Local campus QA found answer:', campusAnswer);
  }
  
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
      // Production: Use local campus QA as fallback if backend is not available
      if (isCampusQuery && campusAnswer && !campusAnswer.includes('could not find')) {
        console.log('⚠️ Using local campus QA as fallback');
        return { reply: campusAnswer };
      }
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
    // Fallback to local campus QA if backend fails and it's a campus query
    if (isCampusQuery && campusAnswer && !campusAnswer.includes('could not find')) {
      console.log('🔄 Using local campus QA as fallback due to backend error');
      return { reply: campusAnswer };
    }
    throw error;
  }
}