import {
  DecisionFactorCard,
  ExplainableDecision,
  TOPSISHospitalScore,
  TOPSISResult,
} from '@/types/decision';
import { Hospital } from '@/types/hospital';
import { PatientEmergencyDetails } from '@/types/emergency';

/**
 * Builds Explainable Decision output for clinicians, dispatchers, and project viva evaluation.
 */
export function generateExplainableDecision(
  selectedScore: TOPSISHospitalScore,
  selectedHospital: Hospital,
  topsisResult: TOPSISResult,
  allHospitals: Hospital[],
  patient: PatientEmergencyDetails
): ExplainableDecision {
  const eligibleHospitals = topsisResult.rankedEligibleHospitals;
  const isFastest =
    eligibleHospitals.length > 0 &&
    eligibleHospitals.every(
      (h) =>
        allHospitals.find((item) => item.id === h.hospitalId)!.travelTimeMinutes >=
        selectedHospital.travelTimeMinutes
    );

  const keyStrengths: string[] = [];
  const tradeOffs: string[] = [];
  const factorCards: DecisionFactorCard[] = [];

  // Card 1: Fastest Eligible
  factorCards.push({
    title: 'Fastest Eligible',
    value: isFastest ? 'Yes (Lowest ETA)' : `${selectedHospital.travelTimeMinutes} mins`,
    status: isFastest ? 'positive' : 'neutral',
    icon: 'Zap',
    description: isFastest
      ? 'Shortest response and transit time among all eligible emergency care facilities.'
      : 'Competitive transit time balancing critical facility readiness.',
  });

  // Card 2: Specialty Match
  const specialtyMatchStr =
    patient.emergencyType === 'CARDIAC'
      ? selectedHospital.cardiologyAvailable
        ? 'Cardiology Ready'
        : 'General ED'
      : patient.emergencyType === 'STROKE'
      ? selectedHospital.neurologyAvailable
        ? 'Stroke / Neuro Ready'
        : 'General ED'
      : patient.emergencyType === 'TRAUMA' || patient.emergencyType === 'ACCIDENT'
      ? selectedHospital.traumaCenterAvailable
        ? 'Trauma Center Level 1/2'
        : 'Emergency Dept'
      : selectedHospital.emergencyDepartmentAvailable
      ? 'Emergency Dept Active'
      : 'Limited';

  factorCards.push({
    title: 'Specialty Match',
    value: specialtyMatchStr,
    status: 'positive',
    icon: 'Stethoscope',
    description: `Clinical specialty directly matches the ${patient.severity.toLowerCase()} ${patient.emergencyType.toLowerCase()} emergency requirement.`,
  });

  // Card 3: ICU Available
  factorCards.push({
    title: 'ICU Available',
    value: `${selectedHospital.icuBedsAvailable} Beds Open`,
    status: selectedHospital.icuBedsAvailable > 2 ? 'positive' : 'warning',
    icon: 'Activity',
    description:
      selectedHospital.icuBedsAvailable > 0
        ? `Immediate intensive care admission capacity with verified ventilator support.`
        : 'Critical bed capacity is tight; emergency resuscitation triage ready.',
  });

  // Card 4: Emergency Available
  factorCards.push({
    title: 'Emergency Dept',
    value: selectedHospital.emergencyDepartmentAvailable ? '24/7 Active' : 'Restricted',
    status: selectedHospital.emergencyDepartmentAvailable ? 'positive' : 'warning',
    icon: 'AlertCircle',
    description: 'Resuscitation bays, acute triage staff, and ambulance receiving bay active.',
  });

  // Card 5: Traffic ETA
  factorCards.push({
    title: 'Traffic ETA',
    value: `${selectedHospital.travelTimeMinutes} min (${selectedHospital.distanceKm} km)`,
    status: selectedHospital.trafficLevel === 'CONGESTED' ? 'warning' : 'positive',
    icon: 'Navigation',
    description: `Traffic model indicates ${selectedHospital.trafficLevel.toLowerCase()} roadway congestion along primary route.`,
  });

  // Card 6: Final TOPSIS Score
  factorCards.push({
    title: 'Final TOPSIS Score',
    value: `${selectedScore.topsisScore.toFixed(3)} (Rank #1)`,
    status: 'positive',
    icon: 'Award',
    description: `Highest relative closeness coefficient C* across 8 multi-criteria dimensions.`,
  });

  // Detailed Strengths
  keyStrengths.push(
    `Satisfies all mandatory clinical constraints for ${patient.severity} ${patient.emergencyType} emergencies.`
  );
  if (selectedHospital.icuBedsAvailable > 0) {
    keyStrengths.push(
      `Provides ${selectedHospital.icuBedsAvailable} available ICU beds with critical nursing support.`
    );
  }
  if (selectedHospital.ventilatorAvailable) {
    keyStrengths.push(`Active mechanical ventilator and blood bank capabilities on-site.`);
  }
  if (isFastest) {
    keyStrengths.push(
      `Shortest traffic-aware travel time (${selectedHospital.travelTimeMinutes} min), preserving the Golden Hour.`
    );
  }

  // Trade-offs
  if (selectedHospital.hospitalCapacityPercent > 75) {
    tradeOffs.push(
      `Hospital is at ${selectedHospital.hospitalCapacityPercent}% capacity; patient intake may experience moderate bed queueing.`
    );
  }
  if (selectedHospital.trafficLevel === 'HIGH' || selectedHospital.trafficLevel === 'CONGESTED') {
    tradeOffs.push(
      `Heavy traffic congestion along route; ambulance siren/signal clearance required.`
    );
  }
  if (!isFastest) {
    tradeOffs.push(
      `A closer facility exists, but it was ranked lower or excluded due to lack of specialty matching or ICU availability.`
    );
  }

  // Summary Text
  const summaryText = `${selectedHospital.name} was selected because it satisfies all mandatory emergency intake requirements, offers verified ${specialtyMatchStr}, maintains ${selectedHospital.icuBedsAvailable} open ICU beds, and achieves the highest overall TOPSIS closeness score of ${selectedScore.topsisScore.toFixed(3)} based on traffic-adjusted transit time (${selectedHospital.travelTimeMinutes} minutes) and clinical capability.`;

  // Clinical fit analysis
  const clinicalFitAnalysis = `For a ${patient.age}-year-old ${patient.gender.toLowerCase()} patient presenting with ${patient.severity.toLowerCase()} ${patient.emergencyType.toLowerCase()} symptoms, the system weighted travel time, specialty matching, and ICU readiness as primary priorities. ${selectedHospital.name} provides superior clinical capability to stabilize the patient upon arrival.`;

  // Excluded hospitals summary
  const excludedHospitalsSummary = topsisResult.excludedHospitals.map((ex) => {
    const rawHosp = allHospitals.find((h) => h.id === ex.hospitalId);
    return {
      hospitalId: ex.hospitalId,
      hospitalName: rawHosp?.name || ex.hospitalName,
      reason: ex.exclusionReasons?.join('; ') || 'Failed mandatory clinical eligibility.',
    };
  });

  return {
    selectedHospitalId: selectedHospital.id,
    selectedHospitalName: selectedHospital.name,
    summaryText,
    topsisScore: selectedScore.topsisScore,
    rank: selectedScore.rank,
    keyStrengths,
    tradeOffs,
    factorCards,
    clinicalFitAnalysis,
    excludedHospitalsSummary,
  };
}
