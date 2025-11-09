export async function askBackend(q) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const url = `${apiUrl}/assistant/ask?q=${encodeURIComponent(q)}`;
  
  const res = await fetch(url);
  
  // Check if response is OK
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  // Check if response is JSON
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error('Expected JSON but got:', text.substring(0, 200));
    throw new Error('Server returned non-JSON response. Make sure the backend is running on port 5000.');
  }
  
  return await res.json(); // { matches: [...] } or { reply: string }
}