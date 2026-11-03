'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  EmergencyCategory,
  LocationCoordinates,
  PatientEmergencyDetails,
  SeverityLevel,
} from '@/types/emergency';
import { DEMO_SCENARIOS, DemoScenario, DEMO_CENTER_LOCATION } from '@/lib/simulation/demoData';
import {
  Siren,
  MapPin,
  Compass,
  AlertTriangle,
  Play,
  Crosshair,
  Sparkles,
  Search,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface EmergencyFormProps {
  onSubmit: (
    patient: PatientEmergencyDetails,
    radiusKm: number,
    trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC'
  ) => void;
  isLoading?: boolean;
}

export const EmergencyForm: React.FC<EmergencyFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  // Step Management (1: Patient details, 2: Location, 3: Review & Search)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Patient Fields
  const [patientId, setPatientId] = useState<string>(
    `PT-EMER-${Math.floor(100 + Math.random() * 900)}`
  );
  const [age, setAge] = useState<number>(65);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'>('MALE');
  const [emergencyType, setEmergencyType] = useState<EmergencyCategory>('CARDIAC');
  const [severity, setSeverity] = useState<SeverityLevel>('CRITICAL');
  const [medicalCondition, setMedicalCondition] = useState<string>(
    'Acute ST-Elevation Myocardial Infarction (STEMI), severe chest crushing pain, diaphoresis'
  );
  const [additionalNotes, setAdditionalNotes] = useState<string>(
    'Requires immediate coronary catheterization and intensive critical care monitoring.'
  );
  const [requiresIcu, setRequiresIcu] = useState<boolean>(true);
  const [requiresVentilator, setRequiresVentilator] = useState<boolean>(false);
  const [requiresTraumaCenter, setRequiresTraumaCenter] = useState<boolean>(false);

  // Location Fields
  const [latitude, setLatitude] = useState<number>(DEMO_CENTER_LOCATION.latitude);
  const [longitude, setLongitude] = useState<number>(DEMO_CENTER_LOCATION.longitude);
  const [address, setAddress] = useState<string>(DEMO_CENTER_LOCATION.address || 'MG Road Metro Junction, Central Business District');
  const [locationSource, setLocationSource] = useState<'GPS' | 'MANUAL' | 'MAP_CLICK' | 'PRESET_DEMO'>('PRESET_DEMO');
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  // Configuration Fields
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [trafficModel, setTrafficModel] = useState<'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC'>('BEST_GUESS');

  // Load a preset demo scenario
  const handleLoadScenario = (sc: DemoScenario) => {
    setPatientId(sc.patient.patientId);
    setAge(sc.patient.age);
    setGender(sc.patient.gender);
    setEmergencyType(sc.patient.emergencyType);
    setSeverity(sc.patient.severity);
    setMedicalCondition(sc.patient.medicalCondition);
    setAdditionalNotes(sc.patient.additionalNotes || '');
    setRequiresIcu(sc.patient.requiresIcu);
    setRequiresVentilator(sc.patient.requiresVentilator);
    setRequiresTraumaCenter(sc.patient.requiresTraumaCenter);

    setLatitude(sc.patient.location.latitude);
    setLongitude(sc.patient.location.longitude);
    setAddress(sc.patient.location.address || 'Emergency Incident Scene');
    setLocationSource('PRESET_DEMO');
  };

  // Browser GPS detection & reverse geocoding
  const handleGetBrowserGps = useCallback((forceAlert = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (forceAlert) alert('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocationSource('GPS');
        setGpsLoading(false);

        // Reverse-geocode to get real street address via our backend API
        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.address) {
              setAddress(data.address);
              return;
            }
          }
        } catch (e) {
          console.warn('Reverse geocoding error:', e);
        }

        setAddress(`Live GPS Incident Scene (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      },
      (err) => {
        console.warn('GPS location retrieval error:', err.message);
        setGpsLoading(false);
        if (forceAlert) {
          alert(`Could not acquire GPS (${err.message}). Please allow location access in your browser.`);
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, []);

  // Automatically request browser GPS on initial form load
  useEffect(() => {
    handleGetBrowserGps(false);
  }, [handleGetBrowserGps]);

  // Trigger submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const patientData: PatientEmergencyDetails = {
      patientId,
      age: Number(age),
      gender,
      medicalCondition,
      emergencyType,
      severity,
      additionalNotes,
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        address,
        source: locationSource,
      },
      requiresIcu,
      requiresVentilator,
      requiresTraumaCenter,
      requiresSpecialty: [emergencyType],
    };

    onSubmit(patientData, radiusKm, trafficModel);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quick Demo Scenarios Selector */}
      <div className="bg-slate-900 border border-blue-500/30 p-4 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>1-Click Evaluator Scenarios (Instant Demonstration)</span>
          </div>
          <span className="text-[11px] text-slate-400">Click to populate complete clinical case</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {DEMO_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleLoadScenario(sc)}
              className="text-left p-2.5 rounded-lg bg-slate-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-slate-700/60 transition-all text-xs group"
            >
              <div className="font-bold text-slate-200 group-hover:text-blue-300 truncate">
                {sc.name.split(':')[1] || sc.name}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                {sc.patient.emergencyType} • {sc.patient.severity}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Intake Form Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Step Tabs Header */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-3.5 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              currentStep === 1
                ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Patient & Symptoms</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`py-3.5 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              currentStep === 2
                ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Incident Location</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`py-3.5 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              currentStep === 3
                ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Search & Dispatch</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* STEP 1: PATIENT & EMERGENCY DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Location Status on Step 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl text-xs shadow-sm">
                <div className="flex items-center gap-2 text-slate-300 min-w-0">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-semibold text-slate-200 shrink-0">Incident Scene:</span>
                  <span className="text-slate-300 truncate">{address}</span>
                  {locationSource === 'GPS' && (
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full shrink-0">
                      ✓ Live GPS
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleGetBrowserGps(true)}
                  disabled={gpsLoading}
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                  <Crosshair className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'Detecting...' : 'Detect My Location'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Patient ID
                  </label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    min={1}
                    max={120}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Emergency Category
                  </label>
                  <select
                    value={emergencyType}
                    onChange={(e) => {
                      const type = e.target.value as EmergencyCategory;
                      setEmergencyType(type);
                      if (type === 'CARDIAC' || type === 'RESPIRATORY' || type === 'STROKE') {
                        setRequiresIcu(true);
                      }
                      if (type === 'TRAUMA' || type === 'ACCIDENT') {
                        setRequiresTraumaCenter(true);
                      }
                      if (type === 'RESPIRATORY') {
                        setRequiresVentilator(true);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-rose-500"
                  >
                    <option value="CARDIAC">Cardiac Emergency (STEMI / Arrest)</option>
                    <option value="TRAUMA">Trauma / Polytrauma</option>
                    <option value="ACCIDENT">Road Traffic Accident</option>
                    <option value="STROKE">Acute Stroke / Cerebrovascular</option>
                    <option value="RESPIRATORY">Respiratory Failure / Asthma</option>
                    <option value="BURN">Severe Burn Emergency</option>
                    <option value="GENERAL">General Medical Emergency</option>
                    <option value="OTHER">Other Acute Condition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Severity / Triage Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-rose-500"
                  >
                    <option value="CRITICAL">Critical (Immediate Life Threat)</option>
                    <option value="HIGH">High Priority (Urgent Stabilization)</option>
                    <option value="MEDIUM">Medium Priority (Stable Acute)</option>
                    <option value="LOW">Low Priority (Non-emergent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Primary Clinical Condition / Chief Complaint
                </label>
                <input
                  type="text"
                  value={medicalCondition}
                  onChange={(e) => setMedicalCondition(e.target.value)}
                  required
                  placeholder="e.g. Acute chest pain, shortness of breath, blood pressure 85/50"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Additional Clinical / Paramedic Notes
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Patient conscious but confused, IV access established, oxygen administered."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Hard Constraint Checklist */}
              <div className="bg-slate-800/50 border border-slate-700/60 p-3 rounded-lg">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Mandatory Facility Requirements (Hard Eligibility Filters)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresIcu}
                      onChange={(e) => setRequiresIcu(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Requires ICU Bed</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresVentilator}
                      onChange={(e) => setRequiresVentilator(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Requires Mechanical Ventilator</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresTraumaCenter}
                      onChange={(e) => setRequiresTraumaCenter(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Requires Level 1/2 Trauma Unit</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Next: Incident Location →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION COORDINATES */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 shadow-md">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      locationSource === 'GPS'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    <Compass className={`w-5 h-5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        {locationSource === 'GPS' ? 'Live GPS Location Active' : 'Default Reference Scene'}
                      </span>
                      {locationSource === 'GPS' ? (
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                          ✓ Live GPS Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                          Demo Preset
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-sm">
                      {address}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleGetBrowserGps(true)}
                  disabled={gpsLoading}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-blue-500/40 shadow transition-all flex items-center gap-1.5 self-start sm:self-center shrink-0"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'Acquiring GPS...' : 'Detect My Location'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Incident Street Address or Landmark
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="e.g. 104 Brigade Road, Near Junction"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  ← Back to Patient
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Next: Review & Search →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SEARCH RADIUS & DISPATCH BUTTON */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Summary of Emergency Intake
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Patient</span>
                    <strong className="text-slate-200">
                      {patientId} ({age}y, {gender})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Condition</span>
                    <strong className="text-rose-400 font-semibold">{emergencyType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Triage Severity</span>
                    <strong className="text-amber-400 font-semibold">{severity}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Location</span>
                    <strong className="text-slate-200 truncate block">{address}</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-400">
                      Hospital Search Radius
                    </label>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {radiusKm} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>5 km (Local)</span>
                    <span>25 km (Regional)</span>
                    <span>50 km (Max demo)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Traffic Model (Google Routes API / Demo)
                  </label>
                  <select
                    value={trafficModel}
                    onChange={(e) => setTrafficModel(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="BEST_GUESS">Best Guess (Live Historical Traffic)</option>
                    <option value="OPTIMISTIC">Optimistic (Clear Expressways)</option>
                    <option value="PESSIMISTIC">Pessimistic (Rush Hour Gridlock)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-950/40 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>EVALUATING MCDM ALGORITHMS...</span>
                    </>
                  ) : (
                    <>
                      <Siren className="w-5 h-5 animate-pulse" />
                      <span>FIND SUITABLE HOSPITAL (RUN AHP + TOPSIS)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
