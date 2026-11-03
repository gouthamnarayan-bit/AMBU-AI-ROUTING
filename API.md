# REST API Specification

## AI Ambulance Routing & Hospital Selection System

### 1. Base URL
All Next.js server-side API routes are accessible via:
```
http://localhost:3000/api
```

---

### 2. Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/emergency` | Execute end-to-end triage dispatch pipeline (discovery, ETA, AHP, TOPSIS, XAI). |
| `GET` | `/api/emergency` | Retrieve recent emergency cases or single case by `?caseId=...`. |
| `GET` | `/api/hospitals` | Discover nearby hospitals within radius `?lat=...&lng=...&radius=...`. |
| `POST` | `/api/hospitals` | Update hospital capacity and operational telemetry. |
| `POST` | `/api/routes` | Compute traffic-aware driving route between origin and hospital. |
| `POST` | `/api/ranking` | Execute isolated AHP-TOPSIS calculation on custom candidate set. |
| `GET` | `/api/availability` | Retrieve hospital bed and specialty availability status. |
| `POST` | `/api/availability` | Update live/simulated hospital bed counts and diversion flags. |

---

### 3. Detailed Endpoint Documentation

#### `POST /api/emergency`
**Description:** Central endpoint orchestrating patient intake, hospital discovery, travel time computation, AHP weighting, TOPSIS ranking, route generation, and Firestore persistence.

**Request Body:**
```json
{
  "patient": {
    "patientId": "PT-CARD-801",
    "age": 65,
    "gender": "MALE",
    "medicalCondition": "Acute STEMI, severe chest pressure, diaphoresis",
    "emergencyType": "CARDIAC",
    "severity": "CRITICAL",
    "additionalNotes": "Patient has stent in LAD; primary PCI required.",
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "address": "MG Road Metro Junction, Central Business District",
      "source": "PRESET_DEMO"
    },
    "requiresIcu": true,
    "requiresVentilator": false,
    "requiresTraumaCenter": false,
    "requiresSpecialty": ["CARDIOLOGY"]
  },
  "searchRadiusKm": 15,
  "trafficModel": "BEST_GUESS",
  "forceDemo": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "caseRecord": {
      "caseId": "CASE-2026-4821",
      "patientId": "PT-CARD-801",
      "createdAt": "2026-09-30T09:15:00.000Z",
      "selectedHospitalId": "hosp-001",
      "selectedHospitalName": "Metro Central Trauma & Heart Institute",
      "etaMinutes": 8,
      "distanceKm": 3.2,
      "decisionExplanation": "Metro Central was selected because it satisfies all mandatory emergency intake requirements...",
      "ahpConsistencyRatio": 0.042,
      "mode": "DEMO",
      "status": "ACTIVE"
    },
    "decisionResult": {
      "eligibleHospitals": [ ... ],
      "ineligibleHospitals": [ ... ],
      "topsisResult": {
        "rankedEligibleHospitals": [ ... ]
      },
      "explainableDecision": {
        "summaryText": "...",
        "factorCards": [ ... ]
      }
    },
    "recommendedRoute": {
      "distanceKm": 3.2,
      "trafficDurationMinutes": 8,
      "coordinates": [ [12.9716, 77.5946], ... ],
      "steps": [ ... ]
    },
    "mode": "DEMO"
  }
}
```

---

#### `GET /api/hospitals`
**Query Parameters:**
- `lat`: (number) Incident latitude (default: `12.9716`)
- `lng`: (number) Incident longitude (default: `77.5946`)
- `radius`: (number) Search radius in km (default: `25`, max: `50`)
- `forceDemo`: (boolean) Force simulation fallback (`true` | `false`)

**Response (200 OK):**
```json
{
  "success": true,
  "mode": "DEMO",
  "count": 8,
  "data": [
    {
      "id": "hosp-001",
      "name": "Metro Central Trauma & Heart Institute",
      "address": "104 Brigade Road, Central Zone",
      "latitude": 12.9734,
      "longitude": 77.6078,
      "distanceKm": 3.2,
      "travelTimeMinutes": 8,
      "icuBedsAvailable": 6,
      "availabilityStatus": "AVAILABLE"
    }
  ]
}
```

---

#### `POST /api/routes`
**Request Body:**
```json
{
  "origin": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "destination": {
    "id": "hosp-001",
    "latitude": 12.9734,
    "longitude": 77.6078,
    "address": "104 Brigade Road",
    "trafficLevel": "NORMAL"
  },
  "trafficModel": "BEST_GUESS"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "distanceKm": 3.2,
    "durationMinutes": 7,
    "trafficDurationMinutes": 8,
    "trafficLevel": "NORMAL",
    "coordinates": [ [12.9716, 77.5946], [12.9725, 77.6012], [12.9734, 77.6078] ],
    "steps": [
      {
        "instruction": "Depart emergency scene at origin. Engage priority siren.",
        "distanceMeters": 640,
        "durationSeconds": 120
      }
    ]
  }
}
```
