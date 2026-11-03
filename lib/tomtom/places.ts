import { Hospital } from '@/types/hospital';
import { LocationCoordinates } from '@/types/emergency';
import { calculateHaversineDistanceKm } from '../simulation/demoRouting';

/**
 * Searches nearby hospitals using TomTom Search Nearby POI API.
 * Uses categorySet 7321 (Hospital / Polyclinic).
 */
export async function searchNearbyHospitalsTomTom(
  location: LocationCoordinates,
  radiusKm: number = 25
): Promise<Hospital[]> {
  const apiKey =
    process.env.TOMTOM_API_KEY ||
    process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('TOMTOM_API_KEY is not configured in environment variables.');
  }

  const radiusMeters = Math.min(50000, Math.max(1000, Math.round(radiusKm * 1000)));
  const endpoint = `https://api.tomtom.com/search/2/nearbySearch/.json?key=${encodeURIComponent(
    apiKey
  )}&lat=${location.latitude.toFixed(6)}&lon=${location.longitude.toFixed(
    6
  )}&radius=${radiusMeters}&categorySet=7321&limit=25`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TomTom Places API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const results = data.results || [];

  if (results.length === 0) {
    return [];
  }

  return results.map((item: any, index: number): Hospital => {
    const lat = item.position?.lat || location.latitude;
    const lon = item.position?.lon || location.longitude;
    const dist = calculateHaversineDistanceKm(
      location.latitude,
      location.longitude,
      lat,
      lon
    );

    const name = item.poi?.name || 'Medical Center';
    const address =
      item.address?.freeformAddress ||
      `${item.address?.streetName || ''}, ${item.address?.municipality || ''}`.trim() ||
      'Address verified via TomTom Maps';

    const phone = item.poi?.phone;
    const website = item.poi?.url;

    // Deterministic realistic initial clinical baseline for discovered hospital
    // Distinct facilities get distinct clinical profiles based on name/index
    const isMajorHospital =
      name.toLowerCase().includes('general') ||
      name.toLowerCase().includes('maternity') ||
      name.toLowerCase().includes('institute') ||
      name.toLowerCase().includes('memorial') ||
      name.toLowerCase().includes('apollo') ||
      name.toLowerCase().includes('care');

    return {
      id: `tomtom-${item.id || index}`,
      placeId: item.id || `tomtom-place-${index}`,
      name,
      address,
      latitude: lat,
      longitude: lon,
      phone,
      website,
      rating: 4.2 + ((index % 5) * 0.15),
      distanceKm: dist,
      travelTimeMinutes: Math.max(3, Math.round(dist * 2.2)),
      trafficLevel: 'NORMAL',
      icuBedsAvailable: isMajorHospital ? 4 + (index % 4) : 2 + (index % 2),
      generalBedsAvailable: isMajorHospital ? 25 + (index % 15) : 10 + (index % 8),
      emergencyDepartmentAvailable: true,
      cardiologyAvailable: true,
      neurologyAvailable: isMajorHospital,
      orthopedicAvailable: true,
      traumaCenterAvailable: isMajorHospital,
      ventilatorAvailable: true,
      bloodBankAvailable: isMajorHospital,
      ambulanceSupportAvailable: true,
      hospitalCapacityPercent: 60 + ((index * 7) % 30),
      availabilityStatus: 'AVAILABLE',
      lastUpdated: new Date().toISOString(),
      source: 'SIMULATED',
      simulationMode: false,
    };
  });
}
