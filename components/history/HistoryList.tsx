'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EmergencyCaseRecord, EmergencyCategory } from '@/types/emergency';
import { formatDate, formatTime } from '@/lib/utils';
import {
  Search,
  Filter,
  FileText,
  Clock,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface HistoryListProps {
  cases: EmergencyCaseRecord[];
}

export const HistoryList: React.FC<HistoryListProps> = ({ cases }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = cases.filter((c) => {
    if (filterType !== 'ALL' && c.emergencyType !== filterType) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCase = c.caseId.toLowerCase().includes(q);
      const matchPt = c.patientId.toLowerCase().includes(q);
      const matchHosp = c.selectedHospitalName.toLowerCase().includes(q);
      return matchCase || matchPt || matchHosp;
    }

    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-4 p-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Case ID, Patient, or Hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Emergency Types</option>
            <option value="CARDIAC">Cardiac</option>
            <option value="TRAUMA">Trauma</option>
            <option value="STROKE">Stroke</option>
            <option value="RESPIRATORY">Respiratory</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
      </div>

      {/* Case Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] bg-slate-800/40">
              <th className="py-3 px-3">Case ID</th>
              <th className="py-3 px-3">Date & Time</th>
              <th className="py-3 px-3">Patient Profile</th>
              <th className="py-3 px-3">Emergency Type</th>
              <th className="py-3 px-3">Triage</th>
              <th className="py-3 px-3">Selected Destination Facility</th>
              <th className="py-3 px-3">ETA</th>
              <th className="py-3 px-3">Decision Quality</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No emergency cases found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.caseId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-blue-400">
                    {c.caseId}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <div>{formatDate(c.createdAt)}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {formatTime(c.createdAt)}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200 font-mono">
                      {c.patientId}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {c.patientData.age}y • {c.patientData.gender}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {c.emergencyType}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        c.severity === 'CRITICAL'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                          : c.severity === 'HIGH'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                      }`}
                    >
                      {c.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200">
                      {c.selectedHospitalName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">
                      {c.location.address}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-slate-100 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>{c.etaMinutes} min</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {c.distanceKm} km
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-[11px] text-slate-300">
                      CR: <span className="font-mono">{c.ahpConsistencyRatio.toFixed(3)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {c.eligibleHospitalsCount} of {c.candidateHospitalsCount} eligible
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/reports/${c.caseId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition-colors"
                    >
                      <FileText className="w-3 h-3 text-blue-400" />
                      <span>Report</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
