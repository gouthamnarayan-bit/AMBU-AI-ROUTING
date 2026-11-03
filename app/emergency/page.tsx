'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmergencyForm } from '@/components/emergency/EmergencyForm';
import { ResultDisplay } from '@/components/emergency/ResultDisplay';
import { PatientEmergencyDetails } from '@/types/emergency';
import { EmergencyExecutionOutput, emergencyService } from '@/services/emergencyService';

export default function EmergencyPage() {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [result, setResult] = useState<EmergencyExecutionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitEmergency = async (
    patient: PatientEmergencyDetails,
    radiusKm: number,
    trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC'
  ) => {
    setLoading(true);
    setError(null);
    setLoadingStep('Discovering nearby hospitals & querying availability...');

    try {
      // Step simulator for realistic UI feedback
      setTimeout(() => setLoadingStep('Calculating traffic-aware transit times & driving routes...'), 400);
      setTimeout(() => setLoadingStep('Evaluating hard clinical constraints & calculating AHP weights...'), 800);
      setTimeout(() => setLoadingStep('Executing TOPSIS algorithm and generating Explainable AI rationale...'), 1200);

      // Execute client/server pipeline
      const output = await emergencyService.processEmergencyCase(
        patient,
        radiusKm,
        trafficModel,
        false
      );

      setResult(output);
    } catch (err: any) {
      console.error('Emergency processing error:', err);
      setError(err.message || 'An error occurred while evaluating emergency decisions.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Title Header */}
        {!result && (
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Emergency Patient Intake & Triage
            </h1>
            <p className="text-xs text-slate-400">
              Input patient vitals and location, or select a pre-calibrated scenario to execute AHP criteria weighting and TOPSIS hospital ranking.
            </p>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white">
              Processing Emergency Medical Dispatch
            </h3>
            <p className="text-xs font-mono text-blue-400 animate-pulse">
              {loadingStep || 'Executing Decision Matrix Calculations...'}
            </p>
            <div className="text-[11px] text-slate-500">
              Applying Saaty AHP consistency verification and Hwang & Yoon TOPSIS Euclidean distances.
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="max-w-2xl mx-auto bg-rose-950/60 border border-rose-500/40 text-rose-300 p-4 rounded-xl text-xs space-y-2">
            <div className="font-bold">Dispatch Pipeline Error:</div>
            <div>{error}</div>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-rose-800 text-white rounded text-xs mt-2"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Result or Intake Form */}
        {!loading && result ? (
          <ResultDisplay executionOutput={result} onNewEmergency={handleReset} />
        ) : (
          !loading && (
            <EmergencyForm
              onSubmit={handleSubmitEmergency}
              isLoading={loading}
            />
          )
        )}
      </div>
    </AppLayout>
  );
}
