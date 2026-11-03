import { LocationCoordinates } from '@/types/emergency';
import { DEMO_CENTER_LOCATION } from '../simulation/demoData';

/**
 * Geocodes an address string to latitude/longitude.
 * Falls back to demo location if Google Geocoding API key is absent.
 */
export async function geocodeAddress(
  address: string
): Promise<LocationCoordinates> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    // Return demo location with input address
    return {
      latitude: DEMO_CENTER_LOCATION.latitude + (Math.random() - 0.5) * 0.015,
      longitude: DEMO_CENTER_LOCATION.longitude + (Math.random() - 0.5) * 0.015,
      address,
      source: 'MANUAL',
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding network error');

    const data = await res.json();
    if (data.status === 'OK' && data.results?.[0]) {
      const result = data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        address: result.formatted_address,
        source: 'MANUAL',
      };
    }
  } catch (err) {
    console.warn('Geocoding API unavailable, falling back to simulated coordinates:', err);
  }

  return {
    latitude: DEMO_CENTER_LOCATION.latitude,
    longitude: DEMO_CENTER_LOCATION.longitude,
    address,
    source: 'MANUAL',
  };
}

/**
 * Reverse geocodes coordinates to a human-readable street address.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return `Emergency Sector (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.results?.[0]) {
        return data.results[0].formatted_address;
      }
    }
  } catch (e) {
    // fallback
  }

  return `Emergency Scene (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}
