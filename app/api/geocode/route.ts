import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocodeTomTom, geocodeAddressTomTom } from '@/lib/tomtom/geocoding';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const address = searchParams.get('address');

    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const formattedAddress = await reverseGeocodeTomTom(lat, lng);
      return NextResponse.json({
        success: true,
        address: formattedAddress,
        latitude: lat,
        longitude: lng,
      });
    }

    if (address) {
      const coords = await geocodeAddressTomTom(address);
      if (coords) {
        return NextResponse.json({
          success: true,
          ...coords,
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Provide either lat/lng or address' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Geocoding request failed' },
      { status: 500 }
    );
  }
}
