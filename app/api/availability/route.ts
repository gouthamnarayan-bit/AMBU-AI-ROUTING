import { NextRequest, NextResponse } from 'next/server';
import { availabilityService } from '@/services/availabilityService';
import { hospitalService } from '@/services/hospitalService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get('hospitalId');

    if (hospitalId) {
      const data = await availabilityService.getHospitalAvailability(hospitalId);
      return NextResponse.json({ success: true, data });
    }

    const hospitals = await hospitalService.getAllDemoHospitals();
    return NextResponse.json({ success: true, data: hospitals });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospitalId, updates } = body;

    if (!hospitalId || !updates) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    await availabilityService.updateHospitalAvailability(hospitalId, updates);
    await hospitalService.updateDemoHospital(hospitalId, updates);

    return NextResponse.json({ success: true, message: 'Availability updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
