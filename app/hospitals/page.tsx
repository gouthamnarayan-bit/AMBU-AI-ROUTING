'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { DEMO_HOSPITALS } from '@/lib/simulation/demoData';
import { Hospital, AvailabilityLevel } from '@/types/hospital';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Phone,
  Globe,
  Clock,
  Activity,
  Bed,
  CheckCircle,
  Siren,
  Sliders,
} from 'lucide-react';

export default function HospitalsPage() {
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [icuOnly, setIcuOnly] = useState(false);

  const filtered = DEMO_HOSPITALS.filter((h) => {
    if (statusFilter !== 'ALL' && h.availabilityStatus !== statusFilter) return false;
    if (icuOnly && h.icuBedsAvailable <= 0) return false;

    if (specialtyFilter === 'CARDIO' && !h.cardiologyAvailable) return false;
    if (specialtyFilter === 'NEURO' && !h.neurologyAvailable) return false;
    if (specialtyFilter === 'TRAUMA' && !h.traumaCenterAvailable) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = h.name.toLowerCase().includes(q);
      const matchAddr = h.address.toLowerCase().includes(q);
      return matchName || matchAddr;
    }

    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-7 h-7 text-emerald-500" />
              <span>Hospital Facilities Registry</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live directory of participating emergency medical centers, trauma bays, and acute specialty capabilities.
            </p>
          </div>

          <Link
            href="/admin"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Manage Bed Availability</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search hospital name or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs">
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Clinical Specialties</option>
                <option value="CARDIO">Cardiology / Cath Lab</option>
                <option value="NEURO">Neurology / Stroke</option>
                <option value="TRAUMA">Accredited Trauma Unit</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Operational Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="LIMITED">Limited</option>
                <option value="UNAVAILABLE">Unavailable / Divert</option>
              </select>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={icuOnly}
                  onChange={(e) => setIcuOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>ICU Beds &gt; 0</span>
              </label>
            </div>
          </div>
        </div>

        {/* Hospital Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((h) => (
            <div
              key={h.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    ID: {h.id}
                  </span>
                  <StatusBadge status={h.availabilityStatus} />
                </div>

                <h3 className="font-bold text-slate-100 text-base leading-snug">
                  {h.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{h.address}</span>
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-slate-800/40 p-3 rounded-lg border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">ICU Beds</span>
                  <strong className={`font-mono ${h.icuBedsAvailable > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {h.icuBedsAvailable} open
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">General</span>
                  <strong className="text-slate-200 font-mono">
                    {h.generalBedsAvailable} beds
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Capacity</span>
                  <strong className="text-slate-200 font-mono">
                    {h.hospitalCapacityPercent}%
                  </strong>
                </div>
              </div>

              {/* Specialties Badges */}
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {h.cardiologyAvailable && (
                  <span className="px-2 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-500/30 rounded">
                    Cardiology
                  </span>
                )}
                {h.neurologyAvailable && (
                  <span className="px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-500/30 rounded">
                    Neurology
                  </span>
                )}
                {h.traumaCenterAvailable && (
                  <span className="px-2 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-500/30 rounded">
                    Trauma Level 1/2
                  </span>
                )}
                {h.ventilatorAvailable && (
                  <span className="px-2 py-0.5 bg-teal-950/60 text-teal-300 border border-teal-500/30 rounded">
                    Ventilator
                  </span>
                )}
                {h.bloodBankAvailable && (
                  <span className="px-2 py-0.5 bg-red-950/60 text-red-300 border border-red-500/30 rounded">
                    Blood Bank
                  </span>
                )}
              </div>

              {/* Footer Rating & Contact */}
              <div className="pt-3 border-t border-slate-800 text-xs flex items-center justify-between text-slate-400">
                <span className="text-amber-400 font-mono font-bold">
                  ★ {h.rating.toFixed(1)} / 5.0
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {h.phone || '+91 80 4000 0000'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
