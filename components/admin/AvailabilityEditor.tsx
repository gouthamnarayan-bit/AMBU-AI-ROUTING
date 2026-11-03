'use client';

import React, { useState } from 'react';
import { Hospital, AvailabilityLevel } from '@/types/hospital';
import { StatusBadge } from '../common/StatusBadge';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Activity,
  Bed,
  Heart,
  Brain,
  Bone,
  Wind,
  Droplet,
  Truck,
} from 'lucide-react';

interface AvailabilityEditorProps {
  hospitals: Hospital[];
  onUpdateHospital: (hospitalId: string, updates: Partial<Hospital>) => Promise<boolean>;
}

export const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({
  hospitals,
  onUpdateHospital,
}) => {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    hospitals[0]?.id || ''
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const currentHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  // Editable local state
  const [icuBeds, setIcuBeds] = useState<number>(currentHospital?.icuBedsAvailable || 0);
  const [genBeds, setGenBeds] = useState<number>(currentHospital?.generalBedsAvailable || 0);
  const [capacity, setCapacity] = useState<number>(currentHospital?.hospitalCapacityPercent || 70);
  const [status, setStatus] = useState<AvailabilityLevel>(currentHospital?.availabilityStatus || 'AVAILABLE');
  const [edAvailable, setEdAvailable] = useState<boolean>(currentHospital?.emergencyDepartmentAvailable ?? true);
  const [cardio, setCardio] = useState<boolean>(currentHospital?.cardiologyAvailable ?? true);
  const [neuro, setNeuro] = useState<boolean>(currentHospital?.neurologyAvailable ?? true);
  const [ortho, setOrtho] = useState<boolean>(currentHospital?.orthopedicAvailable ?? true);
  const [trauma, setTrauma] = useState<boolean>(currentHospital?.traumaCenterAvailable ?? true);
  const [vent, setVent] = useState<boolean>(currentHospital?.ventilatorAvailable ?? true);
  const [blood, setBlood] = useState<boolean>(currentHospital?.bloodBankAvailable ?? true);
  const [ambulance, setAmbulance] = useState<boolean>(currentHospital?.ambulanceSupportAvailable ?? true);

  // Sync state when selection changes
  const handleSelectChange = (id: string) => {
    setSelectedHospitalId(id);
    const h = hospitals.find((item) => item.id === id);
    if (h) {
      setIcuBeds(h.icuBedsAvailable);
      setGenBeds(h.generalBedsAvailable);
      setCapacity(h.hospitalCapacityPercent);
      setStatus(h.availabilityStatus);
      setEdAvailable(h.emergencyDepartmentAvailable);
      setCardio(h.cardiologyAvailable);
      setNeuro(h.neurologyAvailable);
      setOrtho(h.orthopedicAvailable);
      setTrauma(h.traumaCenterAvailable);
      setVent(h.ventilatorAvailable);
      setBlood(h.bloodBankAvailable);
      setAmbulance(h.ambulanceSupportAvailable);
      setSavedSuccess(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHospital) return;

    setSaving(true);
    setSavedSuccess(false);

    const updates: Partial<Hospital> = {
      icuBedsAvailable: Number(icuBeds),
      generalBedsAvailable: Number(genBeds),
      hospitalCapacityPercent: Number(capacity),
      availabilityStatus: status,
      emergencyDepartmentAvailable: edAvailable,
      cardiologyAvailable: cardio,
      neurologyAvailable: neuro,
      orthopedicAvailable: ortho,
      traumaCenterAvailable: trauma,
      ventilatorAvailable: vent,
      bloodBankAvailable: blood,
      ambulanceSupportAvailable: ambulance,
    };

    const ok = await onUpdateHospital(currentHospital.id, updates);
    setSaving(false);
    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  if (!currentHospital) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span>Hospital Resource & Availability Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate live bed counts, emergency diverts, and clinical specialty readiness for MCDM ranking testing.
          </p>
        </div>

        {/* Hospital Selector */}
        <select
          value={selectedHospitalId}
          onChange={(e) => handleSelectChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500"
        >
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Operational Capacity */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Inpatient & Critical Care Capacity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Available ICU Beds
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={icuBeds}
                onChange={(e) => setIcuBeds(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                General Ward Beds
              </label>
              <input
                type="number"
                min={0}
                max={200}
                value={genBeds}
                onChange={(e) => setGenBeds(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Hospital Capacity ({capacity}%)
              </label>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full accent-blue-500 mt-2 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Overall Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AvailabilityLevel)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="AVAILABLE">Available (Open Admissions)</option>
                <option value="LIMITED">Limited (Near Saturation)</option>
                <option value="UNAVAILABLE">Unavailable (Divert Status)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clinical Specialty & Equipment Switches */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Clinical Department & Equipment Readiness
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <label className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                checked={edAvailable}
                onChange={(e) => setEdAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-200">Emergency Dept (24/7)</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                checked={cardio}
                onChange={(e) => setCardio(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-200">Cardiology / Cath Lab</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                checked={neuro}
                onChange={(e) => setNeuro(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-200">Neurology / Stroke</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                checked={trauma}
                onChange={(e) => setTrauma(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-200">Trauma Center (Level 1/2)</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                checked={ortho}
                onChange={(e) => setOrtho(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-200">Orthopedic Surgery</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                checked={vent}
                onChange={(e) => setVent(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-200">Mechanical Ventilator</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                checked={blood}
                onChange={(e) => setBlood(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-200">Blood Bank Unit</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                checked={ambulance}
                onChange={(e) => setAmbulance(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-200">Ambulance Bay Bay Support</span>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {savedSuccess && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Availability telemetry updated successfully!
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'UPDATING...' : 'SAVE AVAILABILITY STATE'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
