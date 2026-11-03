# Final-Year CSE Project Viva & Oral Defense Q&A Guide

## AI-Based Ambulance Routing and Hospital Selection System

This document prepares candidates for technical viva voce examination, project defense, and external faculty reviews.

---

### Q1: What is the core problem this project solves?
**Answer:**
Traditional emergency navigation tools (like standard Google Maps or civilian GPS) only calculate the shortest distance or fastest driving time to the nearest geographic facility. However, in emergency medical situations, the nearest hospital may lack open ICU beds, may not have an active cardiac catheterization lab or stroke neurologist, or its emergency department may be on full diversion. 

Sending an acute patient to an unprepared facility causes fatal inter-hospital transfer delays (violating the Golden Hour). This system solves this by integrating **real-time clinical telemetry, hard eligibility constraints, traffic-aware routing, and Multi-Criteria Decision-Making (AHP + TOPSIS)** to find the *most clinically suitable and fastest reachable* hospital.

---

### Q2: Why not just use Machine Learning or an LLM (e.g., ChatGPT / Gemini) for hospital ranking?
**Answer:**
1. **Determinism & Reproducibility:** In emergency healthcare, decision algorithms must be deterministic and verifiable. A mathematical model (AHP-TOPSIS) gives identical, mathematically provable scores for identical inputs. LLMs suffer from non-deterministic outputs and hallucinations.
2. **Explainability & Auditability:** Every step of AHP (consistency ratio, priority vector) and TOPSIS (Euclidean distance to ideal best/worst) can be mathematically audited in court or during clinical mortality reviews.
3. **Sub-second Real-time Execution:** Calculating vector norms and matrix distances takes less than 5 milliseconds locally on the device without requiring cloud LLM latency or network round-trips.

---

### Q3: What is the role of AHP vs TOPSIS in your hybrid model?
**Answer:**
- **AHP (Analytic Hierarchy Process):** Used to determine the **criteria weights ($w_j$)**. It uses pairwise comparisons between criteria ($C_1..C_8$) and mathematically validates that human preferences are logically consistent ($CR \le 0.10$).
- **TOPSIS:** Uses those weights to **rank the actual candidate hospitals**. It evaluates each hospital across all criteria simultaneously and calculates their geometric closeness ($C_i^*$) to the theoretical ideal solution.

---

### Q4: What are the 8 decision criteria and their optimization types?
**Answer:**
1. **C1: Travel Time (Cost - Minimization):** Traffic-adjusted ambulance transit time in minutes.
2. **C2: Physical Distance (Cost - Minimization):** Road driving distance in kilometers.
3. **C3: Emergency Department Availability (Benefit - Maximization):** Acute resuscitation bay readiness.
4. **C4: Specialty Match (Benefit - Maximization):** Clinical alignment (Cardiology, Neurology, Trauma).
5. **C5: ICU Availability (Benefit - Maximization):** Number of available intensive care unit beds.
6. **C6: Available Hospital Capacity (Benefit - Maximization):** Headroom $(100 - \text{occupancy}\%)$.
7. **C7: Equipment Availability (Benefit - Maximization):** Ventilators, CT scanners, blood bank.
8. **C8: Hospital Rating (Benefit - Maximization):** Clinical accreditation and patient outcome score.

---

### Q5: How do you verify AHP Consistency? What is the mathematical threshold?
**Answer:**
We compute:
1. Column-normalized pairwise matrix $r_{ij} = \frac{a_{ij}}{\sum_k a_{kj}}$
2. Priority vector $w_i = \frac{1}{n} \sum_j r_{ij}$
3. Principal eigenvalue: $\lambda_{\max} = \frac{1}{n} \sum_i \frac{(A \cdot w)_i}{w_i}$
4. Consistency Index: $CI = \frac{\lambda_{\max} - n}{n - 1}$
5. Consistency Ratio: $CR = \frac{CI}{RI(n)}$

Where $RI$ is Saaty's standard Random Index (for $n=8$, $RI = 1.41$).
- **Condition:** If $CR \le 0.10$, the judgments are accepted as consistent. If $CR > 0.10$, the comparisons exhibit contradictory circular logic and must be revised.

---

### Q6: How does TOPSIS distinguish between Benefit and Cost criteria?
**Answer:**
When defining the Positive Ideal Solution ($V^+$) and Negative Ideal Solution ($V^-$):
- For **Benefit Criteria** (e.g. ICU beds, Specialty match, Rating):
  $$v_j^+ = \max_i(v_{ij}), \qquad v_j^- = \min_i(v_{ij})$$
- For **Cost Criteria** (e.g. Travel Time, Distance):
  $$v_j^+ = \min_i(v_{ij}), \qquad v_j^- = \max_i(v_{ij})$$

Thus, the ideal best hospital minimizes travel time while maximizing clinical capabilities.

---

### Q7: Explain the TOPSIS Closeness Coefficient ($C_i^*$).
**Answer:**
After calculating the Euclidean distance from the Positive Ideal ($S_i^+$) and Negative Ideal ($S_i^-$):
$$C_i^* = \frac{S_i^-}{S_i^+ + S_i^-}, \quad \text{where } 0 \le C_i^* \le 1$$
- If a hospital is identical to the positive ideal, $S_i^+ = 0 \implies C_i^* = 1.0$.
- If a hospital is identical to the worst possible benchmark, $S_i^- = 0 \implies C_i^* = 0.0$.
- The candidate hospital with the highest $C_i^*$ among all eligible facilities is selected as Rank #1.

---

### Q8: What are Clinical Hard Constraints and why are they necessary?
**Answer:**
TOPSIS is a compensatory model, meaning a very high score in one criterion (e.g. extremely short distance) could mathematically compensate for a low score in another (e.g. zero ICU beds). In emergency medicine, this is unacceptable. A patient in acute STEMI arrest cannot be taken to a clinic 2 minutes away if it has no defibrillators or cardiac catheterization equipment.

Therefore, our system applies **Hard Clinical Eligibility Constraints before TOPSIS**:
- If patient requires ICU $\implies$ hospital must have $ICU > 0$.
- If Emergency Department is closed or diverting $\implies$ hospital is eliminated.
- If condition is Cardiac $\implies$ Cardiology department is mandatory.
Ineligible facilities are excluded from Rank #1 consideration and tagged with clear medical exclusion reasons.

---

### Q9: How do criteria weights adapt to patient conditions?
**Answer:**
The system uses clinical multipliers:
- **Cardiac (STEMI / Arrest):** Scales Cardiology match ($\times 1.75$), ICU availability ($\times 1.50$), and Travel Time ($\times 1.25$).
- **Polytrauma:** Scales Level 1/2 Trauma unit ($\times 1.70$), Emergency bay ($\times 1.40$), and Blood bank ($\times 1.25$).
- **Acute Ischemic Stroke:** Scales Neurology ($\times 1.80$) and rapid transit ($\times 1.40$) to preserve the 4.5-hour thrombolytic window.
All weights are automatically re-normalized so $\sum w_j = 1.000$.

---

### Q10: How does the application guarantee zero crashes when API keys are missing?
**Answer:**
We implement the **Provider Pattern**:
- `HospitalService` delegates to either `GoogleHospitalProvider` or `DemoHospitalProvider`.
- `RouteService` delegates to either `GoogleRoutingProvider` or `DemoRoutingProvider`.
- `Firestore` falls back to an in-memory resilient JavaScript store.
If external API keys are not supplied in `.env.local`, the system automatically detects this and switches to **Demo / Simulation Mode** without throwing exceptions or showing broken UI states.

---

### Q11: What is Explainable AI (XAI) in your system?
**Answer:**
The system never provides a "black-box" decision. It generates:
1. **Summary Text:** A natural-language sentence explaining the winning criteria combination.
2. **6 Decision Factor Cards:** Fast visual breakdown (*Fastest Eligible, Specialty Match, ICU Available, Emergency Available, Traffic ETA, Final Score*).
3. **Clinical Strengths & Trade-offs:** Highlights why the facility was selected and notes operational cautions (e.g. *"Hospital is at 78% capacity"*).
4. **Exclusion Rationale:** Detailed reasons why closer alternative facilities were rejected.

---

### Q12: What Google Cloud APIs are used and why?
**Answer:**
- **Google Places API (New):** Uses `places:searchNearby` with field masks to retrieve verified hospital places, addresses, ratings, and locations.
- **Google Routes API (v2):** Uses `computeRoutes` with `TRAFFIC_AWARE_OPTIMAL` routing preference and near-future departure timestamps for traffic-aware travel duration and polyline steps.

---

### Q13: What software architecture pattern is used?
**Answer:**
A **7-Layer Clean Architecture**:
1. Presentation Layer (Next.js / React / Tailwind)
2. API Layer (Server-side Next.js route handlers)
3. Business Logic Layer (`EmergencyService`, `HospitalService`, `RouteService`)
4. Decision Engine (`lib/ahp`, `lib/topsis`, `lib/decision-engine`)
5. External Services Layer (Google Places & Routes clients)
6. Data Access Layer (Cloud Firestore + In-memory cache)
7. Configuration Layer (Scenarios, defaults, TypeScript interfaces)

---

### Q14: How is database security handled?
**Answer:**
Cloud Firestore security rules (`firestore.rules`) enforce Role-Based Access Control (RBAC):
- `AMBULANCE_OPERATOR`: Can create and read emergency cases and view hospital availability.
- `ADMIN`: Full read/write access to update bed counts, adjust AHP criteria weights, and manage facilities.
- Unauthenticated requests are rejected.

---

### Q15: How was the project tested?
**Answer:**
Automated testing via **Vitest** with **30 passing tests** across 7 test suites:
- AHP matrix normalization, priority vector, and CR validation.
- TOPSIS normalization, ideal best/worst, separation measures, and closeness scores.
- Edge cases: zero distance, identical values, single candidate, divert status.
- Patient-specific dynamic weight adjustments across clinical categories.
- End-to-end self-verification suite testing Cardiac, Trauma, and Stroke triage flows.
