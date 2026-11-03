'use client';

import React, { useState } from 'react';
import { CriterionKey, TOPSISResult } from '@/types/decision';
import { Hospital } from '@/types/hospital';
import { DECISION_CRITERIA, CRITERIA_KEYS } from '@/lib/decision-engine/criteria';
import { rankHospitalsWithTOPSIS, RawHospitalRow } from '@/lib/topsis/topsis';
import { buildCriterionValues } from '@/lib/decision-engine/hybridEngine';
import { PatientEmergencyDetails } from '@/types/emergency';
import { evaluateHospitalEligibility } from '@/lib/decision-engine/eligibility';
import { Sliders, RotateCcw, Award, TrendingUp, BarChart3, Info } from 'lucide-react';

interface SensitivityAnalysisProps {
  initialWeights: Record<CriterionKey, number>;
  hospitals: Hospital[];
  patient: PatientEmergencyDetails;
}

export const SensitivityAnalysis: React.FC<SensitivityAnalysisProps> = ({
  initialWeights,
  hospitals,
  patient,
}) => {
  const [weights, setWeights] = useState<Record<CriterionKey, number>>({ ...initialWeights });

  // Update a single criterion weight and re-normalize
  const handleWeightChange = (key: CriterionKey, newVal: number) => {
    const updated = { ...weights, [key]: newVal };
    const sum = Object.values(updated).reduce((a, b) => a + b, 0);

    const normalized: Record<CriterionKey, number> = {} as Record<CriterionKey, number>;
    for (const c of CRITERIA_KEYS) {
      normalized[c] = Math.round((updated[c] / sum) * 10000) / 10000;
    }
    setWeights(normalized);
  };

  const handleReset = () => {
    setWeights({ ...initialWeights });
  };

  // Re-run TOPSIS dynamically with modified weights
  const rawRows: RawHospitalRow[] = hospitals.map((h) => {
    const el = evaluateHospitalEligibility(h, patient);
    return {
      hospitalId: h.id,
      hospitalName: h.name,
      isEligible: el.isEligible,
      exclusionReasons: el.exclusionReasons,
      values: buildCriterionValues(h, patient),
    };
  });

  const criteriaTypes = Object.fromEntries(
    DECISION_CRITERIA.map((c) => [c.key, c.type])
  ) as Record<CriterionKey, 'COST' | 'BENEFIT'>;

  const dynamicResult: TOPSISResult = rankHospitalsWithTOPSIS(
    rawRows,
    weights,
    CRITERIA_KEYS,
    criteriaTypes
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Interactive Multi-Criteria Sensitivity Laboratory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Adjust individual criterion weights in real time to observe how TOPSIS closeness scores and hospital rankings adapt dynamically.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Initial Weights</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders Panel */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Live Criteria Weight Adjusters
          </h3>

          <div className="space-y-3">
            {DECISION_CRITERIA.map((c) => {
              const currentW = weights[c.key] || 0.1;
              const pct = (currentW * 100).toFixed(1);

              return (
                <div key={c.key} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">
                      {c.code}: {c.name}
                    </span>
                    <span className="font-mono font-bold text-blue-400">{pct}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0.01}
                      max={0.8}
                      step={0.01}
                      value={currentW}
                      onChange={(e) => handleWeightChange(c.key, Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic TOPSIS Outcome Bar Chart */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Dynamic TOPSIS Closeness Ranking (C_i*)</span>
            <span className="text-[10px] text-slate-400 font-normal">Auto-recalculated</span>
          </h3>

          <div className="space-y-2.5">
            {dynamicResult.rankedEligibleHospitals.map((h, idx) => {
              const scorePct = Math.round(h.topsisScore * 100);

              return (
                <div
                  key={h.hospitalId}
                  className={`p-3 rounded-xl border transition-all ${
                    idx === 0
                      ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md'
                      : 'bg-slate-800/40 border-slate-700/50'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-bold ${
                          idx === 0 ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-400'
                        }`}
                      >
                        {idx === 0 && <Award className="w-3.5 h-3.5" />}
                        #{idx + 1}
                      </span>
                      <strong className="text-slate-100">{h.hospitalName}</strong>
                    </div>
                    <span className="font-mono font-bold text-blue-400">
                      {h.topsisScore.toFixed(4)}
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-700/60 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        idx === 0 ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(5, scorePct)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>S+ (Distance to Best): {h.distanceToPositiveIdeal.toFixed(3)}</span>
                    <span>S- (Distance to Worst): {h.distanceToNegativeIdeal.toFixed(3)}</span>
                  </div>
                </div>
              );
            })}

            {dynamicResult.excludedHospitals.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Excluded from Ranking by Hard Clinical Constraints ({dynamicResult.excludedHospitals.length})
                </span>
                <div className="space-y-1">
                  {dynamicResult.excludedHospitals.map((ex) => (
                    <div
                      key={ex.hospitalId}
                      className="px-2.5 py-1.5 bg-slate-800/30 rounded border border-slate-800 text-[10px] text-slate-500 flex justify-between"
                    >
                      <span>{ex.hospitalName}</span>
                      <span className="text-rose-400">{ex.exclusionReasons?.[0] || 'Ineligible'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
