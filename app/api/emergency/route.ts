import { NextRequest, NextResponse } from 'next/server';
import { emergencyService } from '@/services/emergencyService';
import { getEmergencyCases, getEmergencyCaseById } from '@/lib/firebase/firestore';
import { PatientEmergencyDetails } from '@/types/emergency';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');

    if (caseId) {
      const caseData = await getEmergencyCaseById(caseId);
      if (!caseData) {
        return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: caseData });
    }

    const limitCount = parseInt(searchParams.get('limit') || '50', 10);
    const cases = await getEmergencyCases(limitCount);

    return NextResponse.json({
      success: true,
      count: cases.length,
      data: cases,
    });
  } catch (error: any) {
    console.error('API /emergency GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve cases' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patient, searchRadiusKm, trafficModel, forceDemo } = body as {
      patient: PatientEmergencyDetails;
      searchRadiusKm?: number;
      trafficModel?: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC';
      forceDemo?: boolean;
    };

    if (!patient || !patient.patientId || !patient.location) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient intake payload' },
        { status: 400 }
      );
    }

    const output = await emergencyService.processEmergencyCase(
      patient,
      searchRadiusKm || 25,
      trafficModel || 'BEST_GUESS',
      forceDemo ?? false
    );

    return NextResponse.json({
      success: true,
      data: output,
    });
  } catch (error: any) {
    console.error('API /emergency POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Emergency pipeline execution failed' },
      { status: 500 }
    );
  }
}
