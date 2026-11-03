# System Limitations, Assumptions & Medical Safety Position

## AI Ambulance Routing & Hospital Selection System

### 1. Official Medical Safety Disclaimer
This software is an **academic engineering prototype** created for a Final Year Bachelor of Technology (B.Tech) Computer Science & Engineering capstone project.

- The system is **NOT** a certified Medical Device (FDA 510(k), CE-IVD, or MDR compliant).
- It is **NOT** intended to replace clinical judgment, certified Emergency Medical Technicians (EMTs), paramedic dispatchers, or official 911/112/999 command centers.
- All algorithms operate as **decision-support aids** providing recommendations rather than autonomous command mandates.

---

### 2. Operational Assumptions & Limitations

1. **Simulated Hospital Resource Telemetry:**
   - In demonstration mode, ICU beds, ventilator availability, and operational divert status are generated from realistic seeded values.
   - Real-world deployment requires integration with hospital Electronic Health Record (EHR) systems via HL7 v2, FHIR (Fast Healthcare Interoperability Resources), or government health registries (such as NDHM / ABDM in India or NHS Digital in the UK).
2. **Traffic & Routing Approximations:**
   - Routes calculated via Google Routes API or simulated road networks provide travel duration based on statistical traffic models (`BEST_GUESS`, `OPTIMISTIC`, `PESSIMISTIC`).
   - Actual ambulance travel times depend on sirens, emergency priority lane clearance, police escort, unexpected road blockages, and severe weather.
3. **MCDM Criteria Weights ($w_j$):**
   - The default baseline weights and patient-specific multipliers are derived from academic emergency medicine literature (e.g. American Heart Association STEMI Golden Hour protocols, ATLS guidelines).
   - They should be reviewed and customized by an accredited clinical oversight board for regional adaptation.
4. **Network & Cloud Service Dependability:**
   - When connected to Google Cloud and Firebase services, latency and quotas depend on external network stability. The architecture mitigates this through local fallback stores and demo providers.

---

### 3. Recommended Future Extensions

1. **FHIR / HL7 Interface Integration:**
   - Develop an authenticated bidirectional HL7 FHIR gateway to stream live hospital bed telemetry and surgical bay availability directly from hospital EHRs (Epic, Cerner).
2. **Vehicle IoT Telematics Integration:**
   - Ingest onboard OBD-II / CAN-bus ambulance telemetry (fuel status, oxygen tank level, medical crew on board).
3. **Smart City Traffic Light Preemption (V2I):**
   - Connect the routing engine to municipal Vehicle-to-Infrastructure (V2I) traffic light systems to trigger emergency green wave corridors along the selected route.
4. **Machine Learning Model Calibration:**
   - Use historical triage outcome datasets to refine AHP pairwise comparison matrices and TOPSIS criteria weights over time.
