import { NextRequest, NextResponse } from 'next/server';
import { executeHybridDecisionPipeline } from '@/lib/decision-engine/hybridEngine';
import { Hospital } from '@/types/hospital';
import { PatientEmergencyDetails } from '@/types/emergency';
import { DEMO_HOSPITALS, DEMO_SCENARIOS } from '@/lib/simulation/demoData';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hospitals: Hospital[] = body.hospitals || DEMO_HOSPITALS;
    const patient: PatientEmergencyDetails =
      body.patient || DEMO_SCENARIOS[0].patient;
    const customComparisons: Record<string, number> | undefined =
      body.customComparisons;

    const result = executeHybridDecisionPipeline(
      hospitals,
      patient,
      customComparisons
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('API /ranking POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Ranking calculation failed' },
      { status: 500 }
    );
  }
}
