'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { EmergencyExecutionOutput } from '@/services/emergencyService';
import { EmergencyMap } from '../map/EmergencyMap';
import { WhyThisHospital } from './WhyThisHospital';
import { StatusBadge } from '../common/StatusBadge';
import {
  Siren,
  MapPin,
  Clock,
  Navigation,
  FileText,
  Printer,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Download,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Zap,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Radio,
  Square,
} from 'lucide-react';

interface ResultDisplayProps {
  executionOutput: EmergencyExecutionOutput;
  onNewEmergency: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  executionOutput,
  onNewEmergency,
}) => {
  const { caseRecord, decisionResult, recommendedRoute } = executionOutput;
  const selectedHospital = decisionResult.selectedHospital;
  const topsisResult = decisionResult.topsisResult;
  const explainableDecision = decisionResult.explainableDecision;

  const [activeSelectedId, setActiveSelectedId] = useState<string>(
    selectedHospital?.id || ''
  );
  const [currentSelectedHospital, setCurrentSelectedHospital] = useState(
    selectedHospital || decisionResult.candidateHospitals[0]
  );
  const [currentRoute, setCurrentRoute] = useState<typeof recommendedRoute>(recommendedRoute);
  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(false);

  // Navigation states
  const [navigating, setNavigating] = useState<boolean>(false);
  const [transitProgress, setTransitProgress] = useState<number>(0);
  const [transitStatus, setTransitStatus] = useState<string>('DISPATCHED');
  const [showSteps, setShowSteps] = useState<boolean>(true);
  const [isAutoDriving, setIsAutoDriving] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<'1x' | '2x' | '5x'>('1x');
  const [isGpsTracking, setIsGpsTracking] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Helper to stop running auto-drive timer
  const clearAutoDrive = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsAutoDriving(false);
  }, []);

  // Helper to stop real GPS tracking
  const stopGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsGpsTracking(false);
  }, []);

  // Clean up timers & watchers on unmount
  useEffect(() => {
    return () => {
      clearAutoDrive();
      stopGpsTracking();
    };
  }, [clearAutoDrive, stopGpsTracking]);

  // Recalculates route and updates destination whenever user selects any hospital
  const handleSelectHospital = async (hospitalId: string) => {
    setActiveSelectedId(hospitalId);
    const targetHosp = decisionResult.candidateHospitals.find((h) => h.id === hospitalId);
    if (!targetHosp) return;

    setCurrentSelectedHospital(targetHosp);
    clearAutoDrive();
    stopGpsTracking();
    setNavigating(false);
    setTransitProgress(0);
    setTransitStatus('DISPATCHED');
    setIsRouteLoading(true);

    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: caseRecord.location,
          destination: targetHosp,
          trafficModel: 'BEST_GUESS',
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.data) {
          setCurrentRoute(resData.data);
          setIsRouteLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to calculate route to newly selected hospital:', err);
    } finally {
      setIsRouteLoading(false);
    }
  };

  // Start navigation: stays stationary at incident origin (0%) until operator commands
  const handleStartNavigation = () => {
    clearAutoDrive();
    stopGpsTracking();
    setNavigating(true);
    setTransitProgress(0);
    setTransitStatus('STATIONARY AT INCIDENT SCENE (READY)');
  };

  const handleStopNavigation = () => {
    clearAutoDrive();
    stopGpsTracking();
    setNavigating(false);
    setTransitProgress(0);
    setTransitStatus('DISPATCHED');
  };

  // Toggle Continuous Auto-Drive Simulation
  const handleToggleAutoDrive = () => {
    if (isAutoDriving) {
      clearAutoDrive();
      setTransitStatus(`PAUSED AT ${transitProgress}%`);
    } else {
      stopGpsTracking();
      if (transitProgress >= 100) {
        setTransitProgress(0);
      }
      setIsAutoDriving(true);
      setTransitStatus('AUTO-DRIVE SIMULATION ACTIVE');
    }
  };

  // Auto-drive interval management with variable speeds
  useEffect(() => {
    if (!isAutoDriving) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const stepInc = simSpeed === '5x' ? 5 : simSpeed === '2x' ? 2 : 1;
    const intervalMs = simSpeed === '5x' ? 600 : simSpeed === '2x' ? 800 : 1400;

    timerRef.current = setInterval(() => {
      setTransitProgress((prev) => {
        if (prev + stepInc >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setIsAutoDriving(false);
          setTransitStatus('ARRIVED AT TRAUMA BAY');
          return 100;
        }
        return prev + stepInc;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAutoDriving, simSpeed]);

  // Real Device GPS Tracking: moves ONLY when user physically moves
  const handleToggleGpsTracking = () => {
    if (isGpsTracking) {
      stopGpsTracking();
      setTransitStatus(`GPS TRACKING STOPPED (${transitProgress}%)`);
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    clearAutoDrive();
    setGpsError(null);
    setIsGpsTracking(true);
    setTransitStatus('CONNECTING LIVE GPS DEVICE...');

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (!currentRoute?.coordinates || currentRoute.coordinates.length < 2) {
          setTransitStatus(`LIVE GPS (${accuracy ? `±${Math.round(accuracy)}m` : 'Active'})`);
          return;
        }

        // Find closest coordinate point along the route polyline
        let minD = Infinity;
        let closestIdx = 0;
        currentRoute.coordinates.forEach((coord, idx) => {
          const latDiff = coord[0] - latitude;
          const lngDiff = coord[1] - longitude;
          const distSq = latDiff * latDiff + lngDiff * lngDiff;
          if (distSq < minD) {
            minD = distSq;
            closestIdx = idx;
          }
        });

        const newProg = Math.round(
          (closestIdx / (currentRoute.coordinates.length - 1)) * 100
        );
        setTransitProgress(newProg);

        if (newProg >= 98) {
          setTransitStatus('ARRIVED AT TRAUMA BAY');
        } else {
          setTransitStatus(`LIVE GPS DEVICE (ACCURACY ±${Math.round(accuracy || 10)}M)`);
        }
      },
      (err) => {
        console.warn('GPS Watch error:', err.message);
        setGpsError(err.message);
        stopGpsTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    watchIdRef.current = watchId;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadAuditJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(executionOutput, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${caseRecord.caseId}_audit_log.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!selectedHospital || !explainableDecision) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-2xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <Siren className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">No Eligible Hospital Found</h2>
        <p className="text-slate-400 text-sm">
          All candidate hospitals within the search radius failed mandatory clinical eligibility
          constraints (e.g. ICU beds, required specialty, or emergency department closure).
        </p>
        <button
          onClick={onNewEmergency}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
        >
          Modify Intake or Increase Radius
        </button>
      </div>
    );
  }

  const alternativeHospitals = topsisResult.rankedEligibleHospitals.filter(
    (h) => h.hospitalId !== activeSelectedId
  );

  const steps = currentRoute?.steps || [];
  const currentStepIdx =
    steps.length > 0
      ? Math.min(steps.length - 1, Math.floor((transitProgress / 100) * steps.length))
      : 0;
  const currentStep = steps[currentStepIdx];

  const handleNextStep = () => {
    clearAutoDrive();
    stopGpsTracking();
    if (steps.length > 0) {
      const nextIdx = Math.min(steps.length - 1, currentStepIdx + 1);
      const targetProgress = Math.min(100, Math.round(((nextIdx + 1) / steps.length) * 100));
      setTransitProgress(targetProgress);
      if (targetProgress >= 100) {
        setTransitStatus('ARRIVED AT TRAUMA BAY');
      } else {
        setTransitStatus(`WAYPOINT ${nextIdx + 1} OF ${steps.length}`);
      }
    } else {
      setTransitProgress((prev) => {
        const next = Math.min(100, prev + 10);
        if (next >= 100) setTransitStatus('ARRIVED AT TRAUMA BAY');
        return next;
      });
    }
  };

  const handlePrevStep = () => {
    clearAutoDrive();
    stopGpsTracking();
    if (steps.length > 0) {
      const prevIdx = Math.max(0, currentStepIdx - 1);
      const targetProgress = Math.max(0, Math.round((prevIdx / steps.length) * 100));
      setTransitProgress(targetProgress);
      if (targetProgress === 0) {
        setTransitStatus('STATIONARY AT INCIDENT SCENE');
      } else {
        setTransitStatus(`WAYPOINT ${prevIdx + 1} OF ${steps.length}`);
      }
    } else {
      setTransitProgress((prev) => Math.max(0, prev - 10));
    }
  };

  const handleSeek = (newProgress: number) => {
    clearAutoDrive();
    stopGpsTracking();
    const clamped = Math.max(0, Math.min(100, newProgress));
    setTransitProgress(clamped);
    if (clamped === 0) {
      setTransitStatus('STATIONARY AT INCIDENT SCENE');
    } else if (clamped >= 100) {
      setTransitStatus('ARRIVED AT TRAUMA BAY');
    } else {
      const sIdx = steps.length > 0 ? Math.min(steps.length - 1, Math.floor((clamped / 100) * steps.length)) : 0;
      setTransitStatus(`EN ROUTE (${clamped}%) • WAYPOINT ${sIdx + 1}/${Math.max(1, steps.length)}`);
    }
  };

  const handleResetRoute = () => {
    clearAutoDrive();
    stopGpsTracking();
    setTransitProgress(0);
    setTransitStatus('STATIONARY AT INCIDENT SCENE');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Action Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 text-rose-400 text-xs font-mono font-bold tracking-wider uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>Emergency Decision Result • Case #{caseRecord.caseId}</span>
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />{' '}
              {currentRoute?.provider?.includes('TomTom')
                ? 'TomTom Traffic-Aware Route'
                : currentRoute?.provider === 'OPENROUTE_SERVICE'
                ? 'OpenRouteService Live'
                : 'Emergency Route Active'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Route Target: {currentSelectedHospital.name}
            </h1>
            {isRouteLoading && (
              <span className="text-xs text-blue-400 font-mono animate-pulse bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Calculating Live Route...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>
              Estimated Transit ETA:{' '}
              <strong className="text-slate-200 font-mono text-sm">
                {currentRoute?.trafficDurationMinutes || currentSelectedHospital.travelTimeMinutes} minutes
              </strong>{' '}
              ({currentRoute?.distanceKm || currentSelectedHospital.distanceKm} km driving)
            </span>
            {selectedHospital && currentSelectedHospital.id !== selectedHospital.id && (
              <span className="text-emerald-400 font-semibold text-[11px] bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Custom Operator Selected
              </span>
            )}
          </p>
        </div>

        {/* Dispatch Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          {!navigating ? (
            <button
              onClick={handleStartNavigation}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              <span>START NAVIGATION</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAutoDriving
                      ? 'bg-emerald-400 animate-pulse'
                      : isGpsTracking
                      ? 'bg-blue-400 animate-ping'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="font-bold">
                  {isAutoDriving
                    ? 'AUTO-DRIVE'
                    : isGpsTracking
                    ? 'LIVE GPS'
                    : 'STATIONARY / READY'}
                </span>
              </div>
              <button
                onClick={handleStopNavigation}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
                title="Exit navigation"
              >
                Exit Nav
              </button>
            </div>
          )}

          <Link
            href={`/reports/${caseRecord.caseId}`}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Full Report</span>
          </Link>

          <button
            onClick={handleDownloadAuditJson}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download full mathematical decision payload as JSON"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>JSON Audit</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print</span>
          </button>

          <button
            onClick={onNewEmergency}
            className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* Transit Live Telemetry & Time-to-Time Movement Control Deck */}
      {navigating && (
        <div className="bg-slate-900 border border-emerald-500/40 p-5 rounded-2xl space-y-4 no-print shadow-2xl">
          {/* Header Status & Telemetry */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isAutoDriving
                    ? 'bg-emerald-400 animate-pulse'
                    : isGpsTracking
                    ? 'bg-blue-400 animate-ping'
                    : 'bg-amber-400'
                }`}
              />
              <span className="font-bold text-slate-100 uppercase tracking-wider font-mono">
                {transitStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">
                Waypoint {currentStepIdx + 1} of {Math.max(1, steps.length)}
              </span>
              <span className="font-mono bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg text-emerald-300 font-bold text-xs">
                {transitProgress}% Transit
              </span>
            </div>
          </div>

          {/* Interactive Progress Bar & Waypoint Scrubber */}
          <div className="space-y-1.5">
            <div className="relative w-full flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={transitProgress}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                title="Drag to manually scrub along route waypoints"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
              <span>📍 Origin (Incident Scene)</span>
              <span>Drag slider or click Next Step for time-to-time movement</span>
              <span>🏥 {currentSelectedHospital.name}</span>
            </div>
          </div>

          {/* Time-to-Time Movement Controls Deck */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            {/* Step-by-Step Waypoint Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevStep}
                disabled={transitProgress === 0}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Move back one waypoint"
              >
                <SkipBack className="w-3.5 h-3.5 text-blue-400" />
                <span>Prev Step</span>
              </button>

              <button
                onClick={handleNextStep}
                disabled={transitProgress >= 100}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-900/30"
                title="Advance to next waypoint (time-to-time step)"
              >
                <span>Next Step</span>
                <SkipForward className="w-3.5 h-3.5 text-white" />
              </button>

              <button
                onClick={handleResetRoute}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                title="Reset vehicle back to incident origin"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset</span>
              </button>
            </div>

            {/* Simulation Play/Pause & Speed */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleAutoDrive}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isAutoDriving
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/40'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                }`}
                title={isAutoDriving ? 'Pause auto-movement' : 'Simulate continuous movement'}
              >
                {isAutoDriving ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Auto-Drive</span>
                  </>
                )}
              </button>

              {/* Speed Selector */}
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-[11px] font-mono">
                {(['1x', '2x', '5x'] as const).map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSimSpeed(spd)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      simSpeed === spd
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {spd}
                  </button>
                ))}
              </div>
            </div>

            {/* Real Device GPS Tracking Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleGpsTracking}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isGpsTracking
                    ? 'bg-teal-950 border-teal-500 text-teal-300 shadow-md shadow-teal-950/50'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Track your real device GPS movement (only moves when your device actually moves)"
              >
                <Radio
                  className={`w-3.5 h-3.5 ${
                    isGpsTracking ? 'text-teal-400 animate-pulse' : 'text-slate-400'
                  }`}
                />
                <span>{isGpsTracking ? 'Real GPS Active' : 'Follow Real GPS'}</span>
              </button>

              <button
                onClick={handleStopNavigation}
                className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                title="Exit navigation mode"
              >
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </button>
            </div>
          </div>

          {gpsError && (
            <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
              GPS Notice: {gpsError}
            </div>
          )}

          {/* Current Step Driver Maneuver HUD Banner */}
          {currentStep && (
            <div className="bg-slate-800/80 border border-slate-700/70 p-3 rounded-lg flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400 text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  {currentStepIdx + 1}
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Next Maneuver Instruction
                  </div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">
                    {currentStep.instruction}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-400">Maneuver Distance</div>
                <div className="font-mono font-bold text-emerald-400 text-sm">
                  {currentStep.distanceMeters} m
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2-Column Grid: Patient Summary & Facility Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Details Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>Patient Emergency Profile</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Patient Identification</span>
              <strong className="text-slate-100 font-mono text-sm">
                {caseRecord.patientId}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Demographics</span>
              <strong className="text-slate-100">
                {caseRecord.patientData.age} yrs • {caseRecord.patientData.gender}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Emergency Category</span>
              <strong className="text-rose-400">{caseRecord.emergencyType}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Acuity Severity</span>
              <strong className="text-rose-400">{caseRecord.severity}</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">Clinical Presentation: </span>
            <span className="text-slate-200">
              {caseRecord.patientData.medicalCondition}
            </span>
          </div>
        </div>

        {/* Selected Hospital Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>
                {currentSelectedHospital.id === selectedHospital?.id
                  ? 'Optimized Destination Facility'
                  : 'Selected Hospital Destination'}
              </span>
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-bold">
              {currentSelectedHospital.id === selectedHospital?.id ? 'RECOMMENDED #1' : 'CUSTOM TARGET'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Open ICU Beds</span>
              <strong className="text-emerald-400 font-mono text-sm">
                {currentSelectedHospital.icuBedsAvailable} beds available
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Emergency Dept</span>
              <strong className="text-emerald-400">Ready & Operational</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Total Hospital Load</span>
              <strong className="text-slate-200">
                {currentSelectedHospital.hospitalCapacityPercent}% capacity
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Hospital Rating</span>
              <strong className="text-amber-400">
                ★ {currentSelectedHospital.rating.toFixed(1)} / 5.0
              </strong>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-xs flex justify-between items-center">
            <span className="text-slate-400">Address: {currentSelectedHospital.address}</span>
            <span className="font-mono text-blue-400 font-bold">
              ETA: {currentRoute?.trafficDurationMinutes || currentSelectedHospital.travelTimeMinutes} min
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Map with Polyline and Evaluated Hospitals */}
      <EmergencyMap
        origin={caseRecord.location}
        hospitals={decisionResult.candidateHospitals}
        selectedHospitalId={activeSelectedId}
        onSelectHospital={handleSelectHospital}
        route={currentRoute}
        hospitalScores={topsisResult.hospitalScores}
        height="480px"
        ambulanceProgress={transitProgress}
        isNavigating={navigating}
      />

      {/* Turn-by-Turn Route Navigation Instructions Queue */}
      {currentRoute && currentRoute.steps && currentRoute.steps.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div
            onClick={() => setShowSteps(!showSteps)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100 text-sm group-hover:text-blue-300 transition-colors">
                Turn-by-Turn Navigation to {currentSelectedHospital.name} ({currentRoute.steps.length} Waypoints)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-300 border border-slate-700">
                {currentRoute.provider?.includes('TomTom')
                  ? 'TomTom Live Engine'
                  : currentRoute.provider === 'OPENROUTE_SERVICE'
                  ? 'OpenRouteService Live'
                  : 'Fast Navigation Corridor'}
              </span>
              <span>Traffic Mode: {currentRoute.trafficModel}</span>
              {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {showSteps && (
            <div className="divide-y divide-slate-800/60 pt-2 text-xs">
              {recommendedRoute?.steps.map((st, i) => (
                <div key={i} className="py-2.5 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-emerald-400 shrink-0 text-[10px]">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium">{st.instruction}</p>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Segment Distance: {st.distanceMeters} m • Duration: ~
                      {Math.max(1, Math.round(st.durationSeconds / 60))} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explainable AI (Why This Hospital?) */}
      <WhyThisHospital decision={explainableDecision} />

      {/* Alternative Eligible Hospitals */}
      {alternativeHospitals.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-base">
              Alternative Eligible Facilities ({alternativeHospitals.length})
            </h3>
            <span className="text-xs text-slate-400">
              Ranked in descending order of TOPSIS closeness
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alternativeHospitals.map((item) => {
              const hosp = decisionResult.candidateHospitals.find(
                (h) => h.id === item.hospitalId
              );
              if (!hosp) return null;

              return (
                <div
                  key={item.hospitalId}
                  className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl hover:border-slate-600 transition-colors flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-400">
                        Rank #{item.rank}
                      </span>
                      <span className="font-mono text-xs text-slate-300">
                        Score: {item.topsisScore.toFixed(3)}
                      </span>
                    </div>
                    <div className="font-bold text-slate-100 text-sm mt-1">{hosp.name}</div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{hosp.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-700/50 pt-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">ETA</span>
                      <strong className="text-slate-200">
                        {hosp.travelTimeMinutes} min
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Distance</span>
                      <strong className="text-slate-200">{hosp.distanceKm} km</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectHospital(hosp.id)}
                    className={`w-full py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow ${
                      activeSelectedId === hosp.id
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                        : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                    }`}
                  >
                    <span>{activeSelectedId === hosp.id ? '✓ Showing Route on Map' : '🗺️ Route to this Hospital'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
