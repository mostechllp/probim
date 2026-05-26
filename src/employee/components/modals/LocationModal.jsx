import { useState, useEffect } from 'react';
import { getAddressFromCoordinates, getCurrentLocation } from '../../services/locationServise';

const LocationModal = ({ isOpen, onClose, onConfirm, type = 'punch-in' }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/immutability
      fetchLocation();
    }
  }, [isOpen]);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get GPS coordinates
      const coords = await getCurrentLocation();
      setLocation(coords);
      
      // Get address from coordinates
      const addressData = await getAddressFromCoordinates(coords.latitude, coords.longitude);
      setAddress(addressData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (location && address) {
      onConfirm({
        latitude: location.latitude,
        longitude: location.longitude,
        address: address.display_name,
        timestamp: location.timestamp
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface)] rounded-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-xl font-bold mb-4">Verify Your Location</h3>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-[var(--muted)]">Getting your location...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 my-4">
            <p className="text-red-500 text-sm">{error}</p>
            <button 
              onClick={fetchLocation}
              className="mt-2 text-sm text-green-500 hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && location && address && (
          <>
            <div className="bg-[var(--surface2)] rounded-lg p-4 my-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-map-marker-alt text-green-500 mt-1"></i>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-1">📍 Location Detected</p>
                  <p className="text-xs text-[var(--muted)] mb-2">{address.display_name}</p>
                  <div className="text-xs text-[var(--muted)]">
                    <p>Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--surface2)]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
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