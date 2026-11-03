import React from 'react';
import { AvailabilityLevel } from '@/types/hospital';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: AvailabilityLevel;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'AVAILABLE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Available
        </span>
      );
    case 'LIMITED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-500/40 ${className}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          Limited
        </span>
      );
    case 'UNAVAILABLE':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-500/40 ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          Unavailable
        </span>
      );
  }
};
