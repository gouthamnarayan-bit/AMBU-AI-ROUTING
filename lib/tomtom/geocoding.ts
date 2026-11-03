import { LocationCoordinates } from '@/types/emergency';

/**
 * Reverse geocodes coordinates to a human-readable street address using TomTom API.
 */
export async function reverseGeocodeTomTom(lat: number, lon: number): Promise<string> {
  const apiKey =
    process.env.TOMTOM_API_KEY ||
    process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

  if (!apiKey) {
    return `Incident Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  }

  try {
    const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat.toFixed(6)},${lon.toFixed(6)}.json?key=${encodeURIComponent(
      apiKey
    )}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const first = data.addresses?.[0];
      if (first?.address?.freeformAddress) {
        return first.address.freeformAddress;
      }
    }
  } catch (err) {
    console.warn('TomTom reverse geocoding failed:', err);
  }

  return `Incident Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
}

/**
 * Geocodes an address or landmark string to coordinates using TomTom API.
 */
export async function geocodeAddressTomTom(query: string): Promise<LocationCoordinates | null> {
  const apiKey =
    process.env.TOMTOM_API_KEY ||
    process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

  if (!apiKey) return null;

  try {
    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query)}.json?key=${encodeURIComponent(
      apiKey
    )}&limit=1`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const first = data.results?.[0];
      if (first?.position) {
        return {
          latitude: first.position.lat,
          longitude: first.position.lon,
          address: first.address?.freeformAddress || query,
          source: 'MANUAL',
        };
      }
    }
  } catch (err) {
    console.warn('TomTom geocoding failed:', err);
  }

  return null;
}
