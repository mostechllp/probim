
// Store location data from LocationModal
export const storeLocationData = (locationData) => {
  try {
    localStorage.setItem('punch-location-data', JSON.stringify({
      ...locationData,
      stored_at: new Date().toISOString()
    }));
    console.log('📍 Location data stored successfully:', locationData);
  } catch (error) {
    console.error('Error storing location data:', error);
  }
};

// Get stored location data
export const getStoredLocationData = () => {
  try {
    const data = localStorage.getItem('punch-location-data');
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error getting stored location data:', error);
    return null;
  }
};

// Clear stored location data
export const clearStoredLocationData = () => {
  try {
    localStorage.removeItem('punch-location-data');
    console.log('📍 Location data cleared');
  } catch (error) {
    console.error('Error clearing location data:', error);
  }
};

// Check if location data exists
export const hasStoredLocationData = () => {
  return !!localStorage.getItem('punch-location-data');
};