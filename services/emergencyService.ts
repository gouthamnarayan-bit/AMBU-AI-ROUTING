import {
  EmergencyCaseRecord,
  LocationCoordinates,
  PatientEmergencyDetails,
  RouteDetails,
} from '@/types/emergency';
import { Hospital } from '@/types/hospital';
import { hospitalService } from './hospitalService';
import { routeService } from './routeService';
import { executeHybridDecisionPipeline, DecisionEngineExecutionResult } from '@/lib/decision-engine/hybridEngine';
import { saveEmergencyCase } from '@/lib/firebase/firestore';

export interface EmergencyExecutionOutput {
  caseRecord: EmergencyCaseRecord;
  decisionResult: DecisionEngineExecutionResult;
  recommendedRoute: RouteDetails | null;
  mode: 'DEMO' | 'REAL_API';
}

class EmergencyService {
  /**
   * Main end-to-end emergency routing pipeline execution.
   */
  async processEmergencyCase(
    patient: PatientEmergencyDetails,
    searchRadiusKm: number = 25,
    trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC' = 'BEST_GUESS',
    forceDemo: boolean = false
  ): Promise<EmergencyExecutionOutput> {
    const startTime = Date.now();
    console.log(`[EmergencyService] Initiating intake for patient ${patient.patientId} (${patient.emergencyType}, ${patient.severity})`);

    // Step 1: Discover nearby hospitals
    const { hospitals: initialCandidates, mode } = await hospitalService.findNearbyHospitals(
      patient.location,
      searchRadiusKm,
      forceDemo
    );

    console.log(`[EmergencyService] Discovered ${initialCandidates.length} candidate hospitals in ${mode} mode.`);

    // Step 2: Compute realistic traffic travel time and distance for each candidate
    const candidateHospitalsWithTraffic: Hospital[] = await Promise.all(
      initialCandidates.map(async (h) => {
        try {
          const route = await routeService.calculateRoute(
            patient.location,
            h,
            trafficModel,
            forceDemo
          );
          return {
            ...h,
            distanceKm: route.distanceKm,
            travelTimeMinutes: route.trafficDurationMinutes,
            trafficLevel: route.trafficLevel,
          };
        } catch (e) {
          return h;
        }
      })
    );

    // Step 3: Execute Hybrid AHP + TOPSIS Decision Pipeline with hard constraints & XAI
    const decisionResult = executeHybridDecisionPipeline(
      candidateHospitalsWithTraffic,
      patient
    );

    const selectedHospital = decisionResult.selectedHospital;
    let recommendedRoute: RouteDetails | null = null;

    // Step 4: Calculate comprehensive route for the selected hospital
    if (selectedHospital) {
      recommendedRoute = await routeService.calculateRoute(
        patient.location,
        selectedHospital,
        trafficModel,
        forceDemo
      );
    }

    // Step 5: Construct complete Case Record
    const caseId = `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const caseRecord: EmergencyCaseRecord = {
      caseId,
      patientId: patient.patientId,
      createdAt: new Date().toISOString(),
      patientData: patient,
      location: patient.location,
      emergencyType: patient.emergencyType,
      severity: patient.severity,
      candidateHospitalsCount: candidateHospitalsWithTraffic.length,
      eligibleHospitalsCount: decisionResult.eligibleHospitals.length,
      excludedHospitalsCount: decisionResult.ineligibleHospitals.length,
      selectedHospitalId: selectedHospital?.id || 'none',
      selectedHospitalName: selectedHospital?.name || 'No eligible hospital found',
      etaMinutes: selectedHospital?.travelTimeMinutes || 0,
      distanceKm: selectedHospital?.distanceKm || 0,
      decisionExplanation: decisionResult.explainableDecision?.summaryText || 'Evaluation completed.',
      ahpConsistencyRatio: decisionResult.ahpBaselineResult.consistencyRatio,
      mode,
      status: 'ACTIVE',
    };

    // Step 6: Persist case record to Firestore
    await saveEmergencyCase(caseRecord);

    console.log(`[EmergencyService] Emergency decision finalized in ${Date.now() - startTime}ms. Case ID: ${caseId}, Selected: ${selectedHospital?.name}`);

    return {
      caseRecord,
      decisionResult,
      recommendedRoute,
      mode,
    };
  }
}

export const emergencyService = new EmergencyService();
