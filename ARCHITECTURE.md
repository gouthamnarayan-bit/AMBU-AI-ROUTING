# System Architecture & Technical Specification

## AI-Based Ambulance Routing and Hospital Selection System

### 1. System Overview
The system employs a layered, service-oriented architecture designed for mission-critical emergency medical dispatch and hospital triage. It couples real-time GIS mapping and traffic-aware routing with deterministic Multi-Criteria Decision-Making (MCDM) algorithms (AHP and TOPSIS) to select the optimal acute medical facility for time-critical emergency patients.

---

### 2. High-Level System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Presentation Layer (Next.js 14 / React / Tailwind)"]
        UI_Dashboard["Ambulance Control Dashboard"]
        UI_Intake["Emergency Intake Form"]
        UI_Map["Interactive Map (Leaflet / Google Maps)"]
        UI_XAI["Explainable AI Breakdown (Factor Cards)"]
        UI_Admin["Admin & Availability Panel"]
    end

    subgraph API ["Next.js Server API Routes"]
        API_Emerg["/api/emergency"]
        API_Hosp["/api/hospitals"]
        API_Route["/api/routes"]
        API_Rank["/api/ranking"]
        API_Avail["/api/availability"]
    end

    subgraph ServiceLayer ["Business Logic Services"]
        SVC_Emerg["EmergencyService"]
        SVC_Hosp["HospitalService"]
        SVC_Route["RouteService"]
        SVC_Avail["AvailabilityService"]
    end

    subgraph DecisionEngine ["Deterministic Decision Engine"]
        ENG_Elig["Clinical Hard Constraints (Eligibility Filter)"]
        ENG_AHP["Analytic Hierarchy Process (AHP - Pairwise & CR)"]
        ENG_Weights["Patient-Specific Clinical Weight Adjuster"]
        ENG_TOPSIS["TOPSIS Closeness Coefficient (C*) Calculator"]
        ENG_XAI["Explainable AI Generator"]
    end

    subgraph Providers ["Provider Abstraction Layer"]
        P_Google["Google APIs (Places New & Routes v2)"]
        P_Demo["Demo Simulation Engine (Deterministic Telemetry)"]
    end

    subgraph Persistence ["Data Access Layer"]
        DB_Firestore["Cloud Firestore (Real API Mode)"]
        DB_Local["In-Memory Resilient Cache (Demo Mode)"]
    end

    Client --> API
    API --> ServiceLayer
    ServiceLayer --> DecisionEngine
    ServiceLayer --> Providers
    ServiceLayer --> Persistence
```

---

### 3. Core Emergency Decision Flow

```mermaid
sequenceDiagram
    autonumber
    actor Dispatcher as Paramedic / Dispatcher
    participant Intake as Emergency Form
    participant Svc as EmergencyService
    participant HospProv as HospitalProvider
    participant RouteProv as RouteService
    participant AHP as AHP Engine
    participant TOPSIS as TOPSIS Engine
    participant XAI as Explainability Engine
    participant DB as Cloud Firestore

    Dispatcher->>Intake: Enter Patient Vitals & GPS Location
    Intake->>Svc: processEmergencyCase(patient, radius, trafficModel)
    Svc->>HospProv: findNearbyHospitals(location, radius)
    HospProv-->>Svc: Candidate Hospitals (e.g. 8 facilities)
    Svc->>RouteProv: calculateRoute(origin, hospital, trafficModel)
    RouteProv-->>Svc: Traffic-adjusted ETA & Driving Distance
    Svc->>AHP: runAHP() & adjustWeightsForPatient(patient)
    AHP-->>Svc: Normalized Priority Weights (w_j, CR <= 0.10)
    Svc->>TOPSIS: evaluateHospitalEligibility() & rankHospitalsWithTOPSIS()
    TOPSIS-->>Svc: Ranked Eligible Hospitals (C_i*) & Excluded Reasons
    Svc->>XAI: generateExplainableDecision(selectedScore, hospital, topsis)
    XAI-->>Svc: Clinical Rationale & Factor Cards
    Svc->>RouteProv: calculateRoute(origin, selectedHospital)
    RouteProv-->>Svc: Full Turn-by-Turn Steps & Coordinates
    Svc->>DB: saveEmergencyCase(record)
    Svc-->>Intake: Return Full Result (Map, Route, XAI, Alternatives)
    Intake-->>Dispatcher: Display Recommended Destination & Start Navigation
```

---

### 4. Layered Architectural Decomposition

| Layer | Directory / Modules | Primary Responsibility |
| :--- | :--- | :--- |
| **1. Presentation Layer** | `/app`, `/components` | Responsive dashboard, multi-step intake, interactive GIS maps, XAI factor cards, printable reports. |
| **2. API Layer** | `/app/api/*` | Validated server endpoints for emergency intake, routing computation, and hospital queries. |
| **3. Business Logic Layer** | `/services/*` | Domain workflows orchestrating triage intake, provider switching, and telemetry aggregation. |
| **4. Decision Engine** | `/lib/ahp`, `/lib/topsis`, `/lib/decision-engine` | Pure mathematical models for pairwise AHP consistency, patient weights, and TOPSIS vector ranking. |
| **5. External Services Layer** | `/lib/google-maps`, `/services/providers` | Google Places API (New) & Routes API v2 client adapters with graceful demo fallbacks. |
| **6. Data Access Layer** | `/lib/firebase` | Cloud Firestore persistence with role-based security rules and offline memory cache. |
| **7. Configuration Layer** | `/lib/simulation`, `/types` | Strongly-typed interfaces, default criteria calibrations, and preset clinical scenarios. |

---

### 5. Resilient Provider Fallback Strategy

The application guarantees uninterrupted uptime through the **Provider Pattern**:

1. **Hospital Discovery:**
   - Primary: `GoogleHospitalProvider` calling `https://places.googleapis.com/v1/places:searchNearby`.
   - Fallback: `DemoHospitalProvider` using 8 curated test hospitals with realistic coordinates, capacity, and bed counts.
2. **Ambulance Routing:**
   - Primary: `GoogleRoutingProvider` calling `https://routes.googleapis.com/directions/v2:computeRoutes` (`TRAFFIC_AWARE_OPTIMAL`).
   - Fallback: `DemoRoutingProvider` using Haversine driving multipliers, realistic road grid interpolation, and turn-by-turn guidance.
3. **Database Storage:**
   - Primary: Cloud Firestore `emergencyCases` collection.
   - Fallback: High-performance in-memory cache retaining recent dispatches and reports.
