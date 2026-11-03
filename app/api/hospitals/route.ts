import { NextRequest, NextResponse } from 'next/server';
import { hospitalService } from '@/services/hospitalService';
import { LocationCoordinates } from '@/types/emergency';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '12.9716');
    const lng = parseFloat(searchParams.get('lng') || '77.5946');
    const radius = parseFloat(searchParams.get('radius') || '25');
    const forceDemo = searchParams.get('forceDemo') === 'true';

    const location: LocationCoordinates = {
      latitude: lat,
      longitude: lng,
      source: 'GPS',
    };

    const result = await hospitalService.findNearbyHospitals(location, radius, forceDemo);

    return NextResponse.json({
      success: true,
      mode: result.mode,
      count: result.hospitals.length,
      data: result.hospitals,
    });
  } catch (error: any) {
    console.error('API /hospitals GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search hospitals' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospitalId, updates } = body;

    if (!hospitalId || !updates) {
      return NextResponse.json(
        { success: false, error: 'hospitalId and updates required' },
        { status: 400 }
      );
    }

    const success = await hospitalService.updateDemoHospital(hospitalId, updates);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
