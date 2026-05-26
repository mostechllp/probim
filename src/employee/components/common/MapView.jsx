import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = ({ latitude, longitude, address }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    // Initialize map once
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [latitude, longitude],
        15
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    // Update map view
    mapRef.current.setView([latitude, longitude], 15);

    // Remove old marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Add new marker
    markerRef.current = L.marker([latitude, longitude])
      .addTo(mapRef.current)
      .bindPopup(address || 'Your location')
      .openPopup();

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, address]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        height: '300px',
        width: '100%',
        borderRadius: '8px',
      }}
      className="mt-4"
    />
  );
};

export default MapView;