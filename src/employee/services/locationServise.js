export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let errorMessage = "Location access denied";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Please allow location access to punch in";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        reject(new Error(errorMessage));
      },
    );
  });
};

// Reverse geocoding using OpenStreetMap (free, no API key needed)
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    );
    const data = await response.json();
    return {
      display_name: data.display_name,
      road: data.address?.road,
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      country: data.address?.country,
      postcode: data.address?.postcode
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};