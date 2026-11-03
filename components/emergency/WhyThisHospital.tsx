import React from 'react';
import { ExplainableDecision } from '@/types/decision';
import {
  Zap,
  Stethoscope,
  Activity,
  AlertCircle,
  Navigation,
  Award,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface WhyThisHospitalProps {
  decision: ExplainableDecision;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5 text-amber-400" />,
  Stethoscope: <Stethoscope className="w-5 h-5 text-blue-400" />,
  Activity: <Activity className="w-5 h-5 text-emerald-400" />,
  AlertCircle: <AlertCircle className="w-5 h-5 text-rose-400" />,
  Navigation: <Navigation className="w-5 h-5 text-indigo-400" />,
  Award: <Award className="w-5 h-5 text-yellow-400" />,
};

export const WhyThisHospital: React.FC<WhyThisHospitalProps> = ({ decision }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Explainable AI (XAI) Decision Rationale</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Why {decision.selectedHospitalName}?
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs px-3 py-1.5 rounded-lg">
            <span>TOPSIS Score: </span>
            <strong className="font-mono text-sm">{decision.topsisScore.toFixed(3)}</strong>
          </div>
          <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg">
            Rank #1 Best Match
          </div>
        </div>
      </div>

      {/* Summary Paragraph */}
      <p className="text-slate-300 text-sm leading-relaxed bg-slate-800/40 p-4 rounded-lg border border-slate-800">
        {decision.summaryText}
      </p>

      {/* 6 Visual Factor Cards */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Key Decision Factor Breakdown
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {decision.factorCards.map((card, idx) => {
            const icon = ICON_MAP[card.icon] || <Info className="w-5 h-5 text-blue-400" />;
            const isPos = card.status === 'positive';
            const isWarn = card.status === 'warning';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isPos
                    ? 'bg-slate-800/50 border-emerald-500/30 hover:border-emerald-500/60'
                    : isWarn
                    ? 'bg-slate-800/50 border-amber-500/30 hover:border-amber-500/60'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{card.title}</span>
                  <div className="p-1.5 bg-slate-800 rounded-lg">{icon}</div>
                </div>

                <div className="mt-2 text-base font-bold text-slate-100">{card.value}</div>
                <p className="mt-1 text-xs text-slate-400 leading-normal">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Trade-offs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Positive Strengths */}
        <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-2.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Primary Justifications</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {decision.keyStrengths.map((str, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trade-offs & Operational Constraints */}
        <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-2.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Operational Considerations & Trade-offs</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {decision.tradeOffs.length > 0 ? (
              decision.tradeOffs.map((to, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span>{to}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">No significant operational trade-offs noted.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Excluded Candidates Rationale */}
      {decision.excludedHospitalsSummary.length > 0 && (
        <div className="border-t border-slate-800 pt-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Ineligible Candidate Facilities ({decision.excludedHospitalsSummary.length})
          </div>
          <div className="space-y-2">
            {decision.excludedHospitalsSummary.map((ex, i) => (
              <div
                key={i}
                className="bg-slate-800/40 border border-slate-800 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5"
              >
                <span className="font-semibold text-slate-200">{ex.hospitalName}</span>
                <span className="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                  {ex.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
