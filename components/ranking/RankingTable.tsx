'use client';

import React, { useState } from 'react';
import { TOPSISHospitalScore, TOPSISResult } from '@/types/decision';
import { Hospital } from '@/types/hospital';
import { StatusBadge } from '../common/StatusBadge';
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  Award,
  Clock,
  Navigation,
} from 'lucide-react';

interface RankingTableProps {
  topsisResult: TOPSISResult;
  hospitals: Hospital[];
  selectedHospitalId?: string;
  onSelectHospital?: (hospitalId: string) => void;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  topsisResult,
  hospitals,
  selectedHospitalId,
  onSelectHospital,
}) => {
  const [search, setSearch] = useState('');
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scores = topsisResult.hospitalScores;

  const filtered = scores.filter((item) => {
    const hosp = hospitals.find((h) => h.id === item.hospitalId);
    if (!hosp) return false;

    if (filterEligibleOnly && !item.isEligible) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = hosp.name.toLowerCase().includes(q);
      const matchAddr = hosp.address.toLowerCase().includes(q);
      return matchName || matchAddr;
    }

    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-4 p-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search facility name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={filterEligibleOnly}
              onChange={(e) => setFilterEligibleOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Show Eligible Only</span>
          </label>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] bg-slate-800/40">
              <th className="py-3 px-3">Rank</th>
              <th className="py-3 px-3">Hospital Facility</th>
              <th className="py-3 px-3">Eligibility</th>
              <th className="py-3 px-3">Distance</th>
              <th className="py-3 px-3">Traffic ETA</th>
              <th className="py-3 px-3">Specialty</th>
              <th className="py-3 px-3">ICU Beds</th>
              <th className="py-3 px-3">Emergency</th>
              <th className="py-3 px-3">Equipment</th>
              <th className="py-3 px-3">Rating</th>
              <th className="py-3 px-3 text-right">TOPSIS Score</th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((item) => {
              const hosp = hospitals.find((h) => h.id === item.hospitalId);
              if (!hosp) return null;

              const isSelected = item.hospitalId === selectedHospitalId;
              const isExpanded = expandedId === item.hospitalId;

              return (
                <React.Fragment key={item.hospitalId}>
                  <tr
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected
                        ? 'bg-blue-950/30 border-l-4 border-l-blue-500'
                        : !item.isEligible
                        ? 'opacity-60 bg-slate-900/50'
                        : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 font-mono font-bold">
                      {item.isEligible ? (
                        item.rank === 1 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                            <Award className="w-3.5 h-3.5" /> #1
                          </span>
                        ) : (
                          <span className="text-slate-300">#{item.rank}</span>
                        )
                      ) : (
                        <span className="text-slate-500">EXCL</span>
                      )}
                    </td>

                    {/* Hospital Name */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>{hosp.name}</span>
                        {isSelected && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {hosp.address}
                      </div>
                    </td>

                    {/* Eligibility */}
                    <td className="py-3 px-3">
                      {item.isEligible ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Eligible
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-rose-400 font-medium"
                          title={item.exclusionReasons?.join(', ')}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Ineligible
                        </span>
                      )}
                    </td>

                    {/* Distance */}
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {hosp.distanceKm} km
                    </td>

                    {/* Traffic ETA */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-100 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span>{hosp.travelTimeMinutes} min</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {hosp.trafficLevel}
                      </span>
                    </td>

                    {/* Specialty */}
                    <td className="py-3 px-3">
                      {hosp.cardiologyAvailable || hosp.neurologyAvailable || hosp.traumaCenterAvailable ? (
                        <span className="text-slate-200">
                          {hosp.cardiologyAvailable ? 'Cardio ' : ''}
                          {hosp.neurologyAvailable ? 'Neuro ' : ''}
                          {hosp.traumaCenterAvailable ? 'Trauma' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500">General</span>
                      )}
                    </td>

                    {/* ICU Beds */}
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold ${
                          hosp.icuBedsAvailable > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {hosp.icuBedsAvailable} beds
                      </span>
                    </td>

                    {/* Emergency Department */}
                    <td className="py-3 px-3">
                      <StatusBadge status={hosp.availabilityStatus} />
                    </td>

                    {/* Equipment */}
                    <td className="py-3 px-3 text-[11px] text-slate-300">
                      {hosp.ventilatorAvailable ? 'Ventilator' : 'Standard'}
                    </td>

                    {/* Rating */}
                    <td className="py-3 px-3 font-mono text-amber-400">
                      ★ {hosp.rating.toFixed(1)}
                    </td>

                    {/* TOPSIS Score */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-mono font-bold text-sm text-blue-400">
                        {item.topsisScore.toFixed(3)}
                      </span>
                    </td>

                    {/* Expand Trigger */}
                    <td className="py-3 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.hospitalId)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <tr className="bg-slate-800/30">
                      <td colSpan={12} className="p-4 border-b border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Raw Vector Scores */}
                          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="font-semibold text-slate-300 text-[11px] uppercase">
                              Normalized Matrix Values (r_ij)
                            </div>
                            {Object.entries(item.normalizedValues).map(([k, v]) => (
                              <div key={k} className="flex justify-between font-mono text-[11px]">
                                <span className="text-slate-400">{k.split('_')[1]}:</span>
                                <span className="text-slate-200">{v.toFixed(4)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Weighted Values */}
                          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="font-semibold text-slate-300 text-[11px] uppercase">
                              Weighted Values (v_ij)
                            </div>
                            {Object.entries(item.weightedValues).map(([k, v]) => (
                              <div key={k} className="flex justify-between font-mono text-[11px]">
                                <span className="text-slate-400">{k.split('_')[1]}:</span>
                                <span className="text-blue-300">{v.toFixed(4)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Distances & Action */}
                          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="font-semibold text-slate-300 text-[11px] uppercase">
                                Ideal Separation Measures
                              </div>
                              <div className="flex justify-between font-mono text-[11px]">
                                <span className="text-slate-400">Distance to Best ($S_i^+$):</span>
                                <span className="text-emerald-400">
                                  {item.distanceToPositiveIdeal.toFixed(4)}
                                </span>
                              </div>
                              <div className="flex justify-between font-mono text-[11px]">
                                <span className="text-slate-400">Distance to Worst ($S_i^-$):</span>
                                <span className="text-rose-400">
                                  {item.distanceToNegativeIdeal.toFixed(4)}
                                </span>
                              </div>
                              <div className="flex justify-between font-mono text-[11px] border-t border-slate-800 pt-1">
                                <span className="text-slate-400">Closeness $C_i^*$:</span>
                                <span className="font-bold text-blue-400">
                                  {item.closenessCoefficient.toFixed(4)}
                                </span>
                              </div>

                              {!item.isEligible && item.exclusionReasons && (
                                <div className="mt-2 text-rose-400 text-[11px] bg-rose-950/40 p-2 rounded border border-rose-500/30">
                                  <strong>Exclusion Reason:</strong>
                                  <div>{item.exclusionReasons.join('; ')}</div>
                                </div>
                              )}
                            </div>

                            {onSelectHospital && item.isEligible && (
                              <button
                                onClick={() => onSelectHospital(item.hospitalId)}
                                className="mt-3 w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs flex items-center justify-center gap-1.5"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>Select This Facility</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
