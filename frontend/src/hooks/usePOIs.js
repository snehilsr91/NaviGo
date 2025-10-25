import { useState, useEffect } from 'react';
import axios from 'axios';

export const usePOIs = () => {
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // For now, use mock data
    // Later this will fetch from the backend API
    const mockPOIs = [
      { id: 1, name: 'Library', lat: 0, lng: 0, type: 'building' },
      { id: 2, name: 'Cafeteria', lat: 0.0001, lng: 0.0001, type: 'building' },
      { id: 3, name: 'Computer Lab', lat: -0.0001, lng: 0.0001, type: 'building' }
    ];
    
    setPois(mockPOIs);
    setLoading(false);
  }, []);

  const addPOI = async (poi) => {
    try {
      // This will be replaced with an actual API call
      // const response = await axios.post('/api/detections', poi);
      setPois([...pois, poi]);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return { pois, loading, error, addPOI };
};