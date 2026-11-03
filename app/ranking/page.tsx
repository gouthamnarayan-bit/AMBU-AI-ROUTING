'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RankingTable } from '@/components/ranking/RankingTable';
import { SensitivityAnalysis } from '@/components/ranking/SensitivityAnalysis';
import { executeHybridDecisionPipeline } from '@/lib/decision-engine/hybridEngine';
import { DEMO_HOSPITALS, DEMO_SCENARIOS } from '@/lib/simulation/demoData';
import { DECISION_CRITERIA } from '@/lib/decision-engine/criteria';
import {
  TableProperties,
  Sliders,
  Sparkles,
  BarChart3,
  ListOrdered,
} from 'lucide-react';

export default function RankingPage() {
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'TABLE' | 'SENSITIVITY'>('TABLE');
  const currentScenario = DEMO_SCENARIOS[selectedScenarioIdx];

  // Run decision pipeline for selected scenario
  const execution = executeHybridDecisionPipeline(
    DEMO_HOSPITALS,
    currentScenario.patient
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header and Mode Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <TableProperties className="w-7 h-7 text-blue-500" />
              <span>Multi-Criteria Decision Ranking Laboratory</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Transparent comparative analysis of candidate facilities via Analytic Hierarchy Process (AHP) and TOPSIS vector ranking.
            </p>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('TABLE')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'TABLE'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Full Decision Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('SENSITIVITY')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'SENSITIVITY'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Sensitivity Laboratory</span>
            </button>
          </div>
        </div>

        {/* Clinical Scenario Selector */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Select Patient Clinical Context to View Dynamic Re-Ranking:</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {DEMO_SCENARIOS.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenarioIdx(idx)}
                className={`text-left p-3 rounded-xl border text-xs transition-all ${
                  selectedScenarioIdx === idx
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold truncate">
                  {sc.name.split(':')[1] || sc.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {sc.patient.emergencyType} • {sc.patient.severity}
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400 italic pt-1">
            Active Context: {currentScenario.description}
          </p>
        </div>

        {/* Tab 1: Full Decision Matrix & Calibrated Weights */}
        {activeTab === 'TABLE' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider">
                  Patient-Calibrated Criteria Weights (w_j, normalized sum = 1.0)
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  AHP Matrix CR = {execution.ahpBaselineResult.consistencyRatio.toFixed(3)} (Consistent)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {DECISION_CRITERIA.map((c) => {
                  const weight = execution.adjustedWeights[c.key] || 0.1;
                  const pct = (weight * 100).toFixed(1);

                  return (
                    <div
                      key={c.key}
                      className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50 text-center"
                    >
                      <div className="text-[10px] text-slate-400 font-mono font-bold">
                        {c.code}
                      </div>
                      <div className="text-sm font-bold text-blue-400 font-mono my-0.5">
                        {pct}%
                      </div>
                      <div className="text-[10px] text-slate-300 truncate" title={c.name}>
                        {c.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <RankingTable
              topsisResult={execution.topsisResult}
              hospitals={execution.candidateHospitals}
              selectedHospitalId={execution.selectedHospital?.id}
            />
          </div>
        )}

        {/* Tab 2: Sensitivity Analysis Laboratory */}
        {activeTab === 'SENSITIVITY' && (
          <SensitivityAnalysis
            initialWeights={execution.adjustedWeights}
            hospitals={execution.candidateHospitals}
            patient={currentScenario.patient}
          />
        )}
      </div>
    </AppLayout>
  );
}
