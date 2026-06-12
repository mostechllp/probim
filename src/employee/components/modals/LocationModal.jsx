// LocationModal.jsx
import { useState, useEffect } from 'react';
import { getLocationWithTimezone, getAddressFromCoordinates } from '../../services/locationServise';

const LocationModal = ({ isOpen, onClose, onConfirm, type = 'punch-in' }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchLocation();
    }
  }, [isOpen]);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get location with timezone
      const locationData = await getLocationWithTimezone();
      setLocation(locationData);
      
      // Get address from coordinates (if coordinates are available)
      if (locationData.latitude && locationData.longitude) {
        const addressData = await getAddressFromCoordinates(
          locationData.latitude, 
          locationData.longitude
        );
        setAddress(addressData);
      }
      
      console.log("Location with timezone:", locationData);
    } catch (err) {
      console.error("Location fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // LocationModal.jsx - Update handleConfirm
const handleConfirm = () => {
  if (location) {
    onConfirm({
      latitude: location.latitude,
      longitude: location.longitude,
      address: address?.display_name || `${location.latitude}, ${location.longitude}`,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
      timezone: location.timezone, // Now returns PHP-compatible (e.g., 'Asia/Kolkata')
      timezone_offset: location.timezone_offset,
      timezone_offset_minutes: location.timezone_offset_minutes // Add this
    });
  }
};

  const getAccuracyColor = () => {
    if (!location?.accuracy) return "text-gray-500";
    if (location.accuracy <= 50) return "text-green-500";
    if (location.accuracy <= 200) return "text-yellow-500";
    return "text-red-500";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Verify Your Location</h3>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-[var(--muted)]">
              Getting your location and timezone...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 my-4">
            <p className="text-red-500 text-sm">{error}</p>
            <div className="flex gap-2 mt-3">
              <button 
                onClick={fetchLocation}
                className="text-sm text-green-500 hover:underline"
              >
                Try Again
              </button>
              <button 
                onClick={onClose}
                className="text-sm text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!loading && !error && location && (
          <>
            <div className="bg-[var(--surface2)] rounded-lg p-4 my-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-map-marker-alt text-green-500 mt-1"></i>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-1">📍 Location Detected</p>
                  <p className="text-xs text-[var(--muted)] mb-2">
                    {address?.display_name || 
                     (location.latitude && location.longitude ? 
                      `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 
                      'Location not available')}
                  </p>
                  <div className="text-xs text-[var(--muted)] space-y-1">
                    {location.latitude && location.longitude && (
                      <p>Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                    )}
                    {location.accuracy && (
                      <p className={`${getAccuracyColor()} flex items-center gap-1`}>
                        <i className="fas fa-chart-line text-xs"></i>
                        Accuracy: {Math.round(location.accuracy)}m
                      </p>
                    )}
                    <p className="text-blue-500 flex items-center gap-1">
                      <i className="fas fa-clock text-xs"></i>
                      Timezone: {location.timezone || 'Unknown'}
                    </p>
                    <p className="text-purple-500 flex items-center gap-1">
                      <i className="fas fa-globe text-xs"></i>
                      UTC Offset: {location.timezone_offset || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--surface2)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Confirm {type === 'punch-in' ? 'Punch In' : 'Punch Out'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationModal;