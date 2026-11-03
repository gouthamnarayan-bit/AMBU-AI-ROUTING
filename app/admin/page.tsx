'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AvailabilityEditor } from '@/components/admin/AvailabilityEditor';
import { WeightConfigurator } from '@/components/admin/WeightConfigurator';
import { DEMO_HOSPITALS } from '@/lib/simulation/demoData';
import { Hospital } from '@/types/hospital';
import { hospitalService } from '@/services/hospitalService';
import {
  Sliders,
  Building2,
  Cpu,
  Layers,
  Shield,
  Activity,
  CheckCircle,
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'AVAILABILITY' | 'WEIGHTS'>('AVAILABILITY');
  const [hospitals, setHospitals] = useState<Hospital[]>(DEMO_HOSPITALS);

  const handleUpdateHospital = async (
    hospitalId: string,
    updates: Partial<Hospital>
  ): Promise<boolean> => {
    const ok = await hospitalService.updateDemoHospital(hospitalId, updates);
    if (ok) {
      setHospitals((prev) =>
        prev.map((h) => (h.id === hospitalId ? { ...h, ...updates } : h))
      );
    }
    return ok;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Shield className="w-7 h-7 text-amber-500" />
              <span>Metropolitan EMS Administration Panel</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure hospital resource availability, clinical department diverts, and AHP multi-criteria parameters.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('AVAILABILITY')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'AVAILABILITY'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospital Resources & Beds</span>
            </button>

            <button
              onClick={() => setActiveTab('WEIGHTS')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'WEIGHTS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>AHP Decision Weights</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'AVAILABILITY' && (
          <AvailabilityEditor
            hospitals={hospitals}
            onUpdateHospital={handleUpdateHospital}
          />
        )}

        {activeTab === 'WEIGHTS' && <WeightConfigurator />}
      </div>
    </AppLayout>
  );
}
