'use client';

import React, { useState } from 'react';
import { CriterionKey, AHPResult } from '@/types/decision';
import { DECISION_CRITERIA, CRITERIA_KEYS } from '@/lib/decision-engine/criteria';
import { runAHP, DEFAULT_PAIRWISE_JUDGMENTS } from '@/lib/ahp/ahp';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

export const WeightConfigurator: React.FC = () => {
  const [comparisons, setComparisons] = useState<Record<string, number>>(
    DEFAULT_PAIRWISE_JUDGMENTS
  );
  const [ahpResult, setAhpResult] = useState<AHPResult>(() => runAHP(CRITERIA_KEYS, DEFAULT_PAIRWISE_JUDGMENTS));

  const handleComparisonChange = (key: string, val: number) => {
    const updated = { ...comparisons, [key]: val };
    setComparisons(updated);
    const newAhp = runAHP(CRITERIA_KEYS, updated);
    setAhpResult(newAhp);
  };

  const handleResetDefaults = () => {
    setComparisons(DEFAULT_PAIRWISE_JUDGMENTS);
    const defaultAhp = runAHP(CRITERIA_KEYS, DEFAULT_PAIRWISE_JUDGMENTS);
    setAhpResult(defaultAhp);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <span>AHP Criteria Weights & Consistency Verification</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analytic Hierarchy Process (Saaty, 1980) determines priority weights via pairwise comparison matrix.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Consistency Validation Banner */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3 ${
          ahpResult.isConsistent
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
        }`}
      >
        <div className="p-1 rounded shrink-0">
          {ahpResult.isConsistent ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
        </div>
        <div className="text-xs space-y-1">
          <div className="font-bold text-sm">
            {ahpResult.isConsistent
              ? 'AHP Consistency Verified (CR <= 0.10)'
              : 'Warning: Inconsistent Pairwise Comparisons (CR > 0.10)'}
          </div>
          <p className="leading-relaxed opacity-90">{ahpResult.explanation}</p>
          <div className="flex flex-wrap gap-4 font-mono text-[11px] pt-1">
            <span>
              Principal Eigenvalue (λ_max): <strong>{ahpResult.lambdaMax.toFixed(4)}</strong>
            </span>
            <span>
              Consistency Index (CI): <strong>{ahpResult.consistencyIndex.toFixed(4)}</strong>
            </span>
            <span>
              Random Index (RI, n=8): <strong>{ahpResult.randomConsistencyIndex.toFixed(2)}</strong>
            </span>
            <span>
              Consistency Ratio (CR):{' '}
              <strong className={ahpResult.isConsistent ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                {ahpResult.consistencyRatio.toFixed(4)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Calculated Priority Vector Display */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Calculated AHP Priority Weights (Normalized Vector)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DECISION_CRITERIA.map((c) => {
            const weight = ahpResult.priorityWeights[c.key] || c.defaultWeight;
            const percent = (weight * 100).toFixed(1);

            return (
              <div
                key={c.key}
                className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-lg"
              >
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                  <span className="font-mono font-bold text-blue-400">{c.code}</span>
                  <span className="font-mono font-bold text-slate-200">{percent}%</span>
                </div>
                <div className="font-semibold text-slate-200 text-xs truncate">
                  {c.name}
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, Number(percent) * 3)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Key Pairwise Sliders */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Key Saaty 1-9 Pairwise Judgments (Click or Slide to Adjust)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {[
            {
              id: 'C1_TRAVEL_TIME:C2_DISTANCE',
              label: 'Travel Time (C1) vs Physical Distance (C2)',
              left: 'Distance',
              right: 'Travel Time',
            },
            {
              id: 'C1_TRAVEL_TIME:C4_SPECIALTY_MATCH',
              label: 'Travel Time (C1) vs Specialty Match (C4)',
              left: 'Specialty',
              right: 'Travel Time',
            },
            {
              id: 'C1_TRAVEL_TIME:C5_ICU_AVAILABILITY',
              label: 'Travel Time (C1) vs ICU Availability (C5)',
              left: 'ICU Beds',
              right: 'Travel Time',
            },
            {
              id: 'C4_SPECIALTY_MATCH:C5_ICU_AVAILABILITY',
              label: 'Specialty Match (C4) vs ICU Availability (C5)',
              left: 'ICU Beds',
              right: 'Specialty Match',
            },
          ].map((item) => {
            const val = comparisons[item.id] || 1;

            return (
              <div
                key={item.id}
                className="bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-xl space-y-2"
              >
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>{item.label}</span>
                  <span className="font-mono text-blue-400">{val.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>{item.left}</span>
                  <input
                    type="range"
                    min={0.2}
                    max={5.0}
                    step={0.1}
                    value={val}
                    onChange={(e) =>
                      handleComparisonChange(item.id, Number(e.target.value))
                    }
                    className="flex-1 accent-indigo-500 cursor-pointer"
                  />
                  <span>{item.right}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
