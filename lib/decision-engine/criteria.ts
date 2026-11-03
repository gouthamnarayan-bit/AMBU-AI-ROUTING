import { CriterionDefinition, CriterionKey } from '@/types/decision';

export const DECISION_CRITERIA: CriterionDefinition[] = [
  {
    key: 'C1_TRAVEL_TIME',
    code: 'C1',
    name: 'Travel Time',
    type: 'COST',
    defaultWeight: 0.25,
    description: 'Traffic-adjusted travel time for ambulance to reach hospital (minutes)',
  },
  {
    key: 'C2_DISTANCE',
    code: 'C2',
    name: 'Distance',
    type: 'COST',
    defaultWeight: 0.10,
    description: 'Physical driving distance to hospital (kilometers)',
  },
  {
    key: 'C3_EMERGENCY_AVAILABILITY',
    code: 'C3',
    name: 'Emergency Dept Availability',
    type: 'BENEFIT',
    defaultWeight: 0.15,
    description: 'Operational readiness of emergency resuscitation & triage',
  },
  {
    key: 'C4_SPECIALTY_MATCH',
    code: 'C4',
    name: 'Specialty Match',
    type: 'BENEFIT',
    defaultWeight: 0.20,
    description: 'Readiness of dedicated clinical department matching emergency',
  },
  {
    key: 'C5_ICU_AVAILABILITY',
    code: 'C5',
    name: 'ICU Availability',
    type: 'BENEFIT',
    defaultWeight: 0.15,
    description: 'Available intensive care unit beds and critical nursing support',
  },
  {
    key: 'C6_HOSPITAL_CAPACITY',
    code: 'C6',
    name: 'Available Hospital Capacity',
    type: 'BENEFIT',
    defaultWeight: 0.05,
    description: 'Inpatient and acute ward absorption capacity (lower occupancy = higher score)',
  },
  {
    key: 'C7_EQUIPMENT_AVAILABILITY',
    code: 'C7',
    name: 'Equipment Availability',
    type: 'BENEFIT',
    defaultWeight: 0.05,
    description: 'Ventilators, CT/MRI, blood bank, cath lab & life-support equipment',
  },
  {
    key: 'C8_HOSPITAL_RATING',
    code: 'C8',
    name: 'Hospital Rating',
    type: 'BENEFIT',
    defaultWeight: 0.05,
    description: 'Accreditation, clinical reputation and patient outcome score',
  },
];

export const CRITERIA_KEYS: CriterionKey[] = DECISION_CRITERIA.map((c) => c.key);

export const CRITERIA_MAP = new Map<CriterionKey, CriterionDefinition>(
  DECISION_CRITERIA.map((c) => [c.key, c])
);
