'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DECISION_CRITERIA } from '@/lib/decision-engine/criteria';
import { RANDOM_INDEX_TABLE } from '@/lib/ahp/ahp';
import {
  BookOpen,
  Calculator,
  Workflow,
  Sparkles,
  Award,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export default function AlgorithmPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Academic Research & Viva Examination Reference</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            MCDM Decision Architecture: Hybrid AHP-TOPSIS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Formal mathematical specification of the Analytic Hierarchy Process and Technique for Order Preference by Similarity to Ideal Solution for emergency hospital selection.
          </p>
        </div>

        {/* Viva High-Level Flow (13 Steps) */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Workflow className="w-5 h-5 text-blue-400" />
            <span>How the System Works (Viva Explanation in 13 Steps)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              '1. Paramedic / Operator enters patient triage information (age, emergency type, severity, notes).',
              '2. Incident coordinates are captured via browser GPS, manual address geocoding, or map click.',
              '3. Nearby hospitals within configurable radius (5-50km) are discovered via Google Places (New) or Demo provider.',
              '4. Hospital details (address, place ID, website, rating) are retrieved.',
              '5. Real-time / simulated availability is checked (ICU beds, general beds, emergency status, specialties).',
              '6. Traffic-aware driving routes and ETAs are calculated via Google Routes API or simulated road network.',
              '7. Hard eligibility constraints eliminate unsuitable facilities (closed ED, lack of ICU when required).',
              '8. Analytic Hierarchy Process (AHP) constructs pairwise comparison matrix across 8 criteria.',
              '9. Principal eigenvalue and Consistency Ratio (CR &le; 0.10) are verified for mathematical validity.',
              '10. Criteria weights are dynamically adjusted according to patient emergency condition (Cardiac, Trauma, Stroke, etc.).',
              '11. TOPSIS normalizes the decision matrix, determines Ideal Best (V+) and Worst (V-), and calculates Closeness (C*).',
              '12. Highest-ranked eligible hospital is selected, and traffic navigation route is generated.',
              '13. Transparent Explainable AI (XAI) rationale is generated and audit case is saved to Cloud Firestore.',
            ].map((step, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-300 leading-relaxed"
              >
                {step}
              </div>
            ))}
          </div>
        </section>

        {/* 8 Decision Criteria Definition Table */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <span>Evaluation Criteria Classification</span>
          </h2>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Criterion Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Default Weight</th>
                  <th className="py-2.5 px-3">Optimization Objective</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {DECISION_CRITERIA.map((c) => (
                  <tr key={c.key} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                      {c.code}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {c.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.type === 'COST'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {(c.defaultWeight * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {c.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Mathematical Formulation: AHP */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>Analytic Hierarchy Process (AHP) Mathematics</span>
          </h2>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>
              Developed by Thomas L. Saaty (1980), AHP derives priority weights through pairwise comparison matrices A = [a_ij] (size n x n), where a_ii = 1 and a_ji = 1 / a_ij.
            </p>

            <div className="bg-slate-800/60 p-4 rounded-xl font-mono text-slate-200 space-y-2 border border-slate-700/60">
              <div><strong>1. Column Normalization:</strong> r_ij = a_ij / sum_k(a_kj)</div>
              <div><strong>2. Priority Vector (Weights):</strong> w_i = (1/n) * sum_j(r_ij)</div>
              <div><strong>3. Principal Eigenvalue:</strong> lambda_max = (1/n) * sum_i( (A * w)_i / w_i )</div>
              <div><strong>4. Consistency Index (CI):</strong> CI = (lambda_max - n) / (n - 1)</div>
              <div><strong>5. Consistency Ratio (CR):</strong> CR = CI / RI</div>
            </div>

            <p>
              <strong>Consistency Condition:</strong> If CR &le; 0.10, the pairwise comparisons are considered mathematically consistent and the derived priority vector is accepted. If CR &gt; 0.10, the system generates a warning and requests revision.
            </p>

            <div className="pt-2">
              <span className="text-slate-400 block text-[11px] font-bold mb-1">
                Saaty Random Index (RI) Lookup Table:
              </span>
              <div className="flex flex-wrap gap-2 font-mono text-[11px]">
                {Object.entries(RANDOM_INDEX_TABLE).map(([n, ri]) => (
                  <span key={n} className="bg-slate-800 px-2 py-1 rounded border border-slate-700">
                    n={n}: <strong>{ri}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Mathematical Formulation: TOPSIS */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>TOPSIS Algorithm Mathematics</span>
          </h2>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>
              Developed by Ching-Lai Hwang and Kwangsun Yoon (1981), TOPSIS selects alternatives that have the shortest Euclidean distance from the Positive Ideal Solution (V+) and the farthest distance from the Negative Ideal Solution (V-).
            </p>

            <div className="bg-slate-800/60 p-4 rounded-xl font-mono text-slate-200 space-y-2 border border-slate-700/60">
              <div><strong>1. Vector Normalization:</strong> r_ij = x_ij / sqrt( sum_k(x_kj^2) )</div>
              <div><strong>2. Weighted Decision Matrix:</strong> v_ij = w_j * r_ij</div>
              <div><strong>3. Positive Ideal Solution (V+):</strong> Benefit: max_i(v_ij); Cost: min_i(v_ij)</div>
              <div><strong>4. Negative Ideal Solution (V-):</strong> Benefit: min_i(v_ij); Cost: max_i(v_ij)</div>
              <div><strong>5. Euclidean Separation:</strong> S_i+ = sqrt( sum_j (v_ij - v_j+)^2 ), S_i- = sqrt( sum_j (v_ij - v_j-)^2 )</div>
              <div><strong>6. Relative Closeness Coefficient:</strong> C_i* = S_i- / (S_i+ + S_i-) &nbsp; (0 &le; C_i* &le; 1)</div>
            </div>

            <p>
              <strong>Ranking Rule:</strong> Candidate hospitals are ranked in descending order of C_i*. The hospital with the highest C_i* that satisfies all hard eligibility constraints is selected as Rank #1.
            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
