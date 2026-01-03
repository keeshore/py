import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '260px', borderRadius: '16px', overflow: 'hidden' };

export default function MapPicker({ value, onChange, readOnly = false }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useLoadScript({ googleMapsApiKey: apiKey || '' });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Function to get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation && !readOnly) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation({ lat, lng });
          if (onChange) {
            onChange({ lat, lng });
          }
          setIsGettingLocation(false);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          alert('Unable to get your location. Please check location permissions in your browser settings.');
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  // Auto-get location on mount if no value is set
  useEffect(() => {
    if (!value?.lat && !value?.lng && !readOnly) {
      getCurrentLocation();
    }
  }, []);

  const center = value?.lat && value?.lng 
    ? { lat: Number(value.lat), lng: Number(value.lng) } 
    : currentLocation || { lat: 28.6139, lng: 77.209 };

  const handleClick = useCallback(
    e => {
      if (readOnly) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      onChange && onChange({ lat, lng });
    },
    [onChange, readOnly]
  );

  // If no API key, show button to get location
  if (!apiKey) {
    return (
      <div style={{ 
        background: 'var(--bg-tertiary)', 
        padding: '1.5rem', 
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid var(--border)'
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Google Maps API key not configured.
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {value?.lat && value?.lng 
            ? `Current location: ${Number(value.lat).toFixed(6)}, ${Number(value.lng).toFixed(6)}`
            : 'Click button below to detect your location automatically'
          }
        </p>
        {!readOnly && (
          <button 
            type="button"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            style={{ marginBottom: '0.5rem' }}
          >
            {isGettingLocation ? 'Detecting Location...' : '📍 Get My Current Location'}
          </button>
        )}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Or enter coordinates manually in the fields below
        </p>
      </div>
    );
  }

  if (!isLoaded) return <div className="muted">Loading map…</div>;

  if (isGettingLocation) {
    return <div className="muted">Getting your current location…</div>;
  }

  return (
    <div>
      <GoogleMap 
        mapContainerStyle={containerStyle} 
        center={center} 
        zoom={14} 
        onClick={handleClick} 
        options={{ 
          disableDefaultUI: false, 
          draggable: !readOnly, 
          gestureHandling: readOnly ? 'none' : 'auto',
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: false
        }}
      >
        {value?.lat && value?.lng && (
          <Marker 
            position={{ lat: Number(value.lat), lng: Number(value.lng) }}
            draggable={!readOnly}
            onDragEnd={(e) => {
              if (!readOnly) {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                onChange && onChange({ lat, lng });
              }
            }}
          />
        )}
      </GoogleMap>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-secondary)'
        }}>
          {readOnly ? 'Location is read-only' : 'Click on map or drag marker'}
        </p>
        {!readOnly && (
          <button 
            type="button"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            {isGettingLocation ? 'Detecting...' : '📍 Use Current Location'}
          </button>
        )}
      </div>
    </div>
  );
}
