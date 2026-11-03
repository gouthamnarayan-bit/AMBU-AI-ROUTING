# Test Suite Documentation & Verification Matrix

## AI Ambulance Routing & Hospital Selection System

### 1. Test Architecture
The test suite utilizes **Vitest**, providing instant TypeScript execution and rigorous unit and integration testing of the mathematical decision algorithms, clinical constraint engines, and routing providers.

### 2. Running Tests Locally
To execute the automated test suite:
```bash
npm test
```

To run with coverage or in watch mode:
```bash
npx vitest run --reporter=verbose
```

---

### 3. Test Suites & Verification Matrix (27 Tests)

| Test Suite | File Path | Tests Passed | Key Capabilities Verified |
| :--- | :--- | :--- | :--- |
| **AHP Decision Engine** | `tests/ahp.test.ts` | 5 | Identity matrix generation; column normalization ($\sum r_{ij}=1$); priority vector calculation; Saaty consistency verification ($CR \le 0.10$); circular inconsistency detection ($CR > 0.10$). |
| **TOPSIS Algorithm** | `tests/topsis.test.ts` | 5 | Euclidean column norms; vector normalization; ideal best ($V^+$) & worst ($V^-$) computation for Benefit and Cost criteria; closeness coefficient ($C_i^*$); rank ordering; zero-denominator and identical values handling. |
| **Clinical Eligibility** | `tests/eligibility.test.ts` | 5 | ICU bed constraint checking; Emergency Department closed/divert rejection; Cardiology matching for acute STEMI; Level 1/2 Trauma unit filtering; human-readable exclusion rationale generation. |
| **Patient Weights** | `tests/patientWeights.test.ts` | 4 | Dynamic criteria scaling across Cardiac, Trauma, Stroke, and Respiratory categories; sum-to-one re-normalization verification. |
| **Ambulance Routing** | `tests/routing.test.ts` | 4 | Haversine distance accuracy; GPS polyline waypoints interpolation; turn-by-turn navigation instructions generation; traffic model multipliers (BEST_GUESS, OPTIMISTIC, PESSIMISTIC). |
| **Hybrid Pipeline E2E** | `tests/hybridEngine.test.ts` | 4 | Full end-to-end integration across all 8 candidate hospitals; STEMI cardiac selection; Polytrauma selection; Stroke neurology selection; Status Asthmaticus ventilator selection; XAI factor cards verification. |

**Total:** 6 test files, 27 tests passing.

---

### 4. Edge Cases Tested

1. **Zero Available Beds / Divert Status:**
   - Evaluated in `tests/eligibility.test.ts`. Confirms that a hospital at 100% capacity with 0 ICU beds is partitioned into the ineligible set and never selected as Rank #1.
2. **Identical Facility Scores:**
   - Evaluated in `tests/topsis.test.ts`. When two candidate hospitals have identical performance metrics across all 8 criteria ($S_i^+ = S_i^-$), the closeness coefficient formula resolves cleanly to $C_i^* = 0.50$ without division-by-zero crashes.
3. **Single Candidate Facility:**
   - Evaluated in `tests/topsis.test.ts`. Confirms single-candidate sets are handled robustly without matrix dimension errors.
4. **Inconsistent AHP Judgments:**
   - Evaluated in `tests/ahp.test.ts`. Circular judgments (e.g. $A > B$, $B > C$, but $C \gg A$) result in $CR > 0.10$, triggering the validation warning flag.
5. **Missing Cloud API Credentials:**
   - Evaluated in `services/hospitalService.ts` and `services/routeService.ts`. The system seamlessly activates the `DemoHospitalProvider` and `DemoRoutingProvider` with deterministic fallback telemetry.
