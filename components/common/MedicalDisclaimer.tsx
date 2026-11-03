import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface DisclaimerProps {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<DisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs px-3 py-1.5 rounded flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong>Academic Prototype:</strong> Hospital availability data is simulated for demonstration unless connected to a verified clinical source.
        </span>
      </div>
    );
  }

  return (
    <aside aria-label="System Notice" className="bg-slate-800/80 border border-amber-500/30 text-slate-300 text-xs p-3 rounded-lg flex items-start gap-3 shadow-sm">
      <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded shrink-0 mt-0.5">
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div>
        <p className="font-semibold text-amber-300">
          Medical & Operational Safety Notice (CSE Capstone Prototype)
        </p>
        <p className="text-slate-400 mt-0.5 leading-relaxed">
          This system is an AI-assisted decision-support prototype built for academic demonstration. It does not replace emergency dispatchers, certified paramedics, or clinically validated triage systems. Availability data is simulated unless connected to live hospital EHR/FHIR endpoints.
        </p>
      </div>
    </aside>
  );
};
