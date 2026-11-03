# Evaluator & Project Viva Demonstration Guide

## AI-Based Ambulance Routing and Hospital Selection System

### 1. Executive Summary for Examiners
This guide provides step-by-step instructions to demonstrate the complete emergency medical dispatch system during project viva and laboratory evaluations.

The application runs in **100% Zero-Configuration Demo Mode** out of the box. No external Google Maps API key, Firebase account, or credit card is required.

---

### 2. Quick 60-Second Demonstration Workflow

1. **Start the Application:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in Google Chrome or Edge.

2. **Login Page:**
   - Click **"Ambulance (Officer Rajesh Kumar)"** under *1-Click Evaluator Quick Login*.
   - You are immediately redirected to the Control Center Dashboard.

3. **Initiate an Emergency Case:**
   - Click **"NEW EMERGENCY CASE"** on the top navbar or sidebar.
   - Look at the top banner: **"1-Click Evaluator Scenarios"**.
   - Click **"Scenario 1: Critical Cardiac Emergency"**.
   - All patient fields, vitals, hard constraints (ICU required), and GPS coordinates populate instantly.

4. **Run the Hybrid AHP + TOPSIS Engine:**
   - Click **"Next: Incident Location"** &rarr; **"Next: Review & Search"** &rarr; Click the glowing red button:
     **"FIND SUITABLE HOSPITAL (RUN AHP + TOPSIS)"**.
   - The engine processes the case in milliseconds!

5. **Observe the Results:**
   - **Recommended Hospital:** *Metro Central Trauma & Heart Institute* (Selected Rank #1).
   - **Interactive Map:** Displays ambulance origin, selected destination, and the traffic-aware route polyline.
   - **Why This Hospital? (Explainable AI):** Inspect the 6 decision factor cards (*Fastest Eligible, Specialty Match, ICU Available, Emergency Dept, Traffic ETA, Final TOPSIS Score*).
   - **Start Navigation:** Click **"START NAVIGATION"** to simulate live siren dispatch with progressive transit tracking!
   - **Printable Report:** Click **"Full Report"** &rarr; view the academic PDF-ready clinical audit document.

---

### 3. Demonstrating All 5 Clinical Scenarios (Dynamic Re-Ranking)

Navigate to **"Decision Ranking"** (`/ranking`) on the sidebar to observe how the ranking mathematically adapts to each medical emergency:

| Scenario | Patient Diagnosis | Clinical Priority | Expected Rank #1 Winner | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Scenario 1** | 65yo Male (STEMI Cardiac) | Cardiology + ICU + Speed | **Metro Central Trauma & Heart** | Has 6 ICU beds, 24/7 Cath Lab, 8 min ETA ($C^*=0.842$). |
| **Scenario 2** | 28yo Female (Polytrauma) | Trauma Center + Blood Bank | **Grace Memorial Neuro & Trauma** | Level 1/2 Trauma accreditation, blood bank, orthopedic team. |
| **Scenario 3** | 72yo Female (Acute Stroke) | Neurology + Golden Window | **Metro Central** or **Grace Memorial** | Dedicated acute stroke neurology team, fast transit. |
| **Scenario 4** | 54yo Male (Status Asthmaticus) | ICU Beds + Ventilator | **Apex Super Specialty** / **Metro Central** | Active mechanical ventilators and open ICU beds. |
| **Scenario 5** | 34yo Male (Perforated Ulcer) | General Emergency Surgery | **St. Jude Emergency Center** | Closer facility (5 min ETA) with active General ED. |

---

### 4. Demonstrating Clinical Hard Constraints (Safety Filter)

During viva defense, examiners often ask:
> *"What happens if a hospital is closer, but has no ICU beds or its emergency department is closed?"*

**Show this live in 3 clicks:**
1. Navigate to **"Decision Ranking"** (`/ranking`).
2. Notice **St. Jude Emergency Center**:
   - It is only 2.1 km away with 5 mins ETA (closest hospital!).
   - However, for Scenario 1 (Critical Cardiac requiring ICU), St. Jude is flagged as **"Ineligible"** because it has `0 ICU beds`.
   - The system eliminates it from Rank #1 consideration, preventing fatal patient diversion!
3. Notice **Highland Acute Care Clinic**:
   - Only 1.2 km away (4 mins ETA).
   - Marked **"Ineligible"** because its Emergency Department is closed (`availabilityStatus: UNAVAILABLE`).
   - The UI clearly shows the exclusion reason: *"Emergency Department is currently closed or diverting admissions."*

---

### 5. Demonstrating Live Admin Resource Telemetry

1. Navigate to **"Admin Panel"** (`/admin`) &rarr; **"Hospital Resources & Beds"**.
2. Select **"St. Jude Emergency Medical Center"**.
3. Change **"Available ICU Beds"** from `0` to `5`.
4. Click **"SAVE AVAILABILITY STATE"**.
5. Return to **"New Emergency"** (`/emergency`) &rarr; run Scenario 1 again.
6. Observe that St. Jude is now instantly re-evaluated as **Eligible** and its Rank jumps up due to its low travel time!
