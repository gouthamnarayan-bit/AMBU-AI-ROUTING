'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmergencyCaseRecord } from '@/types/emergency';
import { Hospital } from '@/types/hospital';
import { getEmergencyCases } from '@/lib/firebase/firestore';
import { DEMO_HOSPITALS } from '@/lib/simulation/demoData';
import { formatDate, formatTime } from '@/lib/utils';
import {
  Siren,
  Activity,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  Heart,
  Brain,
  Shield,
  FileText,
  Sliders,
} from 'lucide-react';

export default function DashboardPage() {
  const [cases, setCases] = useState<EmergencyCaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getEmergencyCases(10);
      setCases(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalCases = cases.length;
  const activeCases = cases.filter((c) => c.status === 'ACTIVE' || c.status === 'DISPATCHED').length;
  const avgEta =
    cases.length > 0
      ? Math.round(
          (cases.reduce((sum, c) => sum + c.etaMinutes, 0) / cases.length) * 10
        ) / 10
      : 8.5;

  // Emergency category counts for chart breakdown
  const categoryCounts = cases.reduce((acc, c) => {
    acc[c.emergencyType] = (acc[c.emergencyType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome & Live Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Emergency Dispatch & Routing Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time multi-criteria decision engine for emergency medical transport and acute hospital selection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/emergency"
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/40 transition-all flex items-center gap-2 active:scale-95"
            >
              <Siren className="w-4 h-4 animate-pulse" />
              <span>NEW EMERGENCY CASE</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Cases */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Emergencies
              </span>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-2">
              {totalCases}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">100%</span>
              <span>deterministic AHP-TOPSIS processed</span>
            </div>
          </div>

          {/* Active Dispatches */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active En Route
              </span>
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
                <Siren className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-2">
              {activeCases}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Priority sirens engaged</span>
            </div>
          </div>

          {/* Evaluated Facilities */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Hospitals Monitored
              </span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-2">
              {DEMO_HOSPITALS.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Verified clinical telemetry & ICU tracking
            </div>
          </div>

          {/* Average ETA */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Average Transit ETA
              </span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-2">
              {avgEta}{' '}
              <span className="text-sm font-normal text-slate-400">mins</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Traffic-adjusted ambulance routing
            </div>
          </div>
        </div>

        {/* Quick Nav Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/hospitals"
            className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 rounded-lg text-blue-400 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-200 text-sm">Hospitals Registry</div>
                <div className="text-[11px] text-slate-400">Browse live capacity & specialties</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            href="/ranking"
            className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 rounded-lg text-emerald-400 group-hover:scale-105 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-200 text-sm">Decision Laboratory</div>
                <div className="text-[11px] text-slate-400">Simulate AHP weights & TOPSIS ranking</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            href="/admin"
            className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 rounded-lg text-amber-400 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-200 text-sm">Admin Control Panel</div>
                <div className="text-[11px] text-slate-400">Manage bed availability & criteria</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>
        </div>

        {/* 2-Column Analytics: Emergency Category Breakdown & Recent Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Emergency Category Distribution Chart Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Emergency Case Distribution
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">BY CATEGORY</span>
            </div>

            <div className="space-y-3">
              {[
                { type: 'CARDIAC', label: 'Cardiac Emergency', color: 'bg-rose-500', count: categoryCounts['CARDIAC'] || 1 },
                { type: 'TRAUMA', label: 'Polytrauma & Injury', color: 'bg-amber-500', count: categoryCounts['TRAUMA'] || 1 },
                { type: 'STROKE', label: 'Acute Stroke', color: 'bg-purple-500', count: categoryCounts['STROKE'] || 1 },
                { type: 'RESPIRATORY', label: 'Respiratory Distress', color: 'bg-teal-500', count: categoryCounts['RESPIRATORY'] || 0 },
                { type: 'GENERAL', label: 'General / Abdominal', color: 'bg-blue-500', count: categoryCounts['GENERAL'] || 0 },
              ].map((item) => {
                const total = Math.max(1, totalCases);
                const pct = Math.round((item.count / total) * 100);

                return (
                  <div key={item.type} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>{item.label}</span>
                      <span className="font-mono text-slate-400">
                        {item.count} cases ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              Cardiac, Trauma, and Stroke triage cases require specialized facility capability matching and rapid transit times.
            </div>
          </div>

          {/* Recent Emergency Cases Table */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Recent Emergency Triage History
                </h2>
                <p className="text-[11px] text-slate-400">
                  Past algorithmic decisions and selected facilities
                </p>
              </div>

              <Link
                href="/history"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                View Full History →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                    <th className="pb-2">Case ID</th>
                    <th className="pb-2">Condition</th>
                    <th className="pb-2">Selected Hospital</th>
                    <th className="pb-2">ETA</th>
                    <th className="pb-2 text-right">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cases.slice(0, 5).map((c) => (
                    <tr key={c.caseId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 font-mono font-bold text-blue-400">
                        {c.caseId}
                      </td>
                      <td className="py-2.5">
                        <span className="font-semibold text-slate-200">
                          {c.emergencyType}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {c.patientData.age}y {c.patientData.gender} • {c.severity}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="font-semibold text-slate-200">
                          {c.selectedHospitalName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">
                          {c.decisionExplanation}
                        </div>
                      </td>
                      <td className="py-2.5 font-mono font-bold text-slate-200">
                        {c.etaMinutes} min
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/reports/${c.caseId}`}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[10px]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
