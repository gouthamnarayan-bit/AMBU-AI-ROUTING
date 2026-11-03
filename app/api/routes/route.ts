import { NextRequest, NextResponse } from 'next/server';
import { routeService } from '@/services/routeService';
import { LocationCoordinates } from '@/types/emergency';
import { Hospital } from '@/types/hospital';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, trafficModel, forceDemo } = body as {
      origin: LocationCoordinates;
      destination: Hospital;
      trafficModel?: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC';
      forceDemo?: boolean;
    };

    if (!origin || !destination) {
      return NextResponse.json(
        { success: false, error: 'origin and destination required' },
        { status: 400 }
      );
    }

    const route = await routeService.calculateRoute(
      origin,
      destination,
      trafficModel || 'BEST_GUESS',
      forceDemo
    );

    return NextResponse.json({
      success: true,
      data: route,
    });
  } catch (error: any) {
    console.error('API /routes POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Routing failed' },
      { status: 500 }
    );
  }
}
