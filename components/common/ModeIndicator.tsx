import React from 'react';
import { Cpu, Globe } from 'lucide-react';

interface ModeIndicatorProps {
  mode: 'DEMO' | 'REAL_API';
  interactive?: boolean;
  onToggle?: () => void;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({
  mode,
  interactive = false,
  onToggle,
}) => {
  const isDemo = mode === 'DEMO';

  return (
    <div
      onClick={interactive ? onToggle : undefined}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border transition-all ${
        interactive ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''
      } ${
        isDemo
          ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
          : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
      }`}
      title={
        isDemo
          ? 'Running in Demo/Simulation Mode (deterministic test data, no external API keys required)'
          : 'Running in Real API Mode (connected to live Google Maps/Places & Routes APIs)'
      }
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isDemo ? 'bg-blue-400' : 'bg-emerald-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isDemo ? 'bg-blue-500' : 'bg-emerald-500'
          }`}
        />
      </span>

      {isDemo ? (
        <>
          <Cpu className="w-3.5 h-3.5" />
          <span>DEMO / SIMULATION MODE</span>
        </>
      ) : (
        <>
          <Globe className="w-3.5 h-3.5" />
          <span>REAL API MODE</span>
        </>
      )}
    </div>
  );
};
