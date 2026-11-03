import { db, isFirebaseConfigured } from './config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  deleteDoc,
} from 'firebase/firestore';
import { EmergencyCaseRecord } from '@/types/emergency';
import { Hospital } from '@/types/hospital';
import { DEMO_HOSPITALS } from '../simulation/demoData';

// In-Memory / Local Cache for Demo & Offline Mode
const inMemoryCases: EmergencyCaseRecord[] = [];
const inMemoryHospitals: Map<string, Hospital> = new Map(
  DEMO_HOSPITALS.map((h) => [h.id, h])
);

// Pre-seed some realistic historical emergency cases for immediate demonstration
const SEEDED_CASES: EmergencyCaseRecord[] = [
  {
    caseId: 'CASE-2026-0091',
    patientId: 'PT-CARD-710',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    patientData: {
      patientId: 'PT-CARD-710',
      age: 63,
      gender: 'MALE',
      medicalCondition: 'Acute Coronary Syndrome, crushing retrosternal pain, diaphoresis',
      emergencyType: 'CARDIAC',
      severity: 'CRITICAL',
      location: { latitude: 12.9716, longitude: 77.5946, address: 'Residency Road, Central District' },
      requiresIcu: true,
      requiresVentilator: false,
      requiresTraumaCenter: false,
      requiresSpecialty: ['CARDIOLOGY'],
    },
    location: { latitude: 12.9716, longitude: 77.5946, address: 'Residency Road, Central District' },
    emergencyType: 'CARDIAC',
    severity: 'CRITICAL',
    candidateHospitalsCount: 8,
    eligibleHospitalsCount: 4,
    excludedHospitalsCount: 4,
    selectedHospitalId: 'hosp-001',
    selectedHospitalName: 'Metro Central Trauma & Heart Institute',
    etaMinutes: 8,
    distanceKm: 3.2,
    decisionExplanation: 'Selected for top TOPSIS score (0.842), 6 open ICU beds, and direct cardiac catheterization readiness.',
    ahpConsistencyRatio: 0.042,
    mode: 'DEMO',
    status: 'COMPLETED',
  },
  {
    caseId: 'CASE-2026-0089',
    patientId: 'PT-TRAUMA-552',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    patientData: {
      patientId: 'PT-TRAUMA-552',
      age: 31,
      gender: 'MALE',
      medicalCondition: 'High-velocity motorcycle collision, multiple fractures, hypovolemic shock',
      emergencyType: 'TRAUMA',
      severity: 'CRITICAL',
      location: { latitude: 12.9658, longitude: 77.6189, address: 'Victoria Layout, East Junction' },
      requiresIcu: true,
      requiresVentilator: true,
      requiresTraumaCenter: true,
      requiresSpecialty: ['TRAUMA_CENTER'],
    },
    location: { latitude: 12.9658, longitude: 77.6189, address: 'Victoria Layout, East Junction' },
    emergencyType: 'TRAUMA',
    severity: 'CRITICAL',
    candidateHospitalsCount: 8,
    eligibleHospitalsCount: 3,
    excludedHospitalsCount: 5,
    selectedHospitalId: 'hosp-004',
    selectedHospitalName: 'Grace Memorial Neuro & Trauma Center',
    etaMinutes: 14,
    distanceKm: 6.8,
    decisionExplanation: 'Highest ranked eligible Level 1 Trauma Facility with blood bank and ventilator availability.',
    ahpConsistencyRatio: 0.038,
    mode: 'DEMO',
    status: 'ARRIVED',
  },
  {
    caseId: 'CASE-2026-0085',
    patientId: 'PT-STROKE-319',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    patientData: {
      patientId: 'PT-STROKE-319',
      age: 70,
      gender: 'FEMALE',
      medicalCondition: 'Sudden left hemiparesis and dysarthria within 40 mins',
      emergencyType: 'STROKE',
      severity: 'CRITICAL',
      location: { latitude: 12.9812, longitude: 77.6115, address: 'Commercial Street Area' },
      requiresIcu: true,
      requiresVentilator: false,
      requiresTraumaCenter: false,
      requiresSpecialty: ['NEUROLOGY'],
    },
    location: { latitude: 12.9812, longitude: 77.6115, address: 'Commercial Street Area' },
    emergencyType: 'STROKE',
    severity: 'CRITICAL',
    candidateHospitalsCount: 8,
    eligibleHospitalsCount: 3,
    excludedHospitalsCount: 5,
    selectedHospitalId: 'hosp-001',
    selectedHospitalName: 'Metro Central Trauma & Heart Institute',
    etaMinutes: 7,
    distanceKm: 2.9,
    decisionExplanation: 'Prioritized rapid neuro CT access and thrombolysis readiness within Golden Window.',
    ahpConsistencyRatio: 0.045,
    mode: 'DEMO',
    status: 'COMPLETED',
  },
];

inMemoryCases.push(...SEEDED_CASES);

/**
 * Saves completed emergency case decision to Firestore or in-memory fallback.
 */
export async function saveEmergencyCase(
  caseRecord: EmergencyCaseRecord
): Promise<boolean> {
  inMemoryCases.unshift(caseRecord);

  if (isFirebaseConfigured() && db) {
    try {
      const caseRef = doc(db, 'emergencyCases', caseRecord.caseId);
      await setDoc(caseRef, caseRecord);
      return true;
    } catch (e) {
      console.warn('Firestore write failed, case safely retained in local store:', e);
    }
  }

  return true;
}

/**
 * Retrieves all emergency cases, ordered by creation date descending.
 */
export async function getEmergencyCases(
  limitCount: number = 50
): Promise<EmergencyCaseRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'emergencyCases'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      const cases: EmergencyCaseRecord[] = [];
      snapshot.forEach((doc) => cases.push(doc.data() as EmergencyCaseRecord));
      if (cases.length > 0) return cases;
    } catch (e) {
      console.warn('Firestore fetch failed, returning in-memory cases:', e);
    }
  }

  return inMemoryCases.slice(0, limitCount);
}

/**
 * Retrieves single emergency case by Case ID.
 */
export async function getEmergencyCaseById(
  caseId: string
): Promise<EmergencyCaseRecord | null> {
  const foundLocal = inMemoryCases.find((c) => c.caseId === caseId);
  if (foundLocal) return foundLocal;

  if (isFirebaseConfigured() && db) {
    try {
      const caseRef = doc(db, 'emergencyCases', caseId);
      const docSnap = await getDoc(caseRef);
      if (docSnap.exists()) {
        return docSnap.data() as EmergencyCaseRecord;
      }
    } catch (e) {
      console.warn('Firestore get case error:', e);
    }
  }

  return null;
}
