'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ModeIndicator } from '@/components/common/ModeIndicator';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import {
  Settings,
  ShieldCheck,
  Globe,
  Database,
  Key,
  Compass,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Navigation,
  Zap,
} from 'lucide-react';

export default function SettingsPage() {
  const [defaultRadius, setDefaultRadius] = useState<number>(15);
  const [defaultTrafficModel, setDefaultTrafficModel] = useState<string>('BEST_GUESS');

  const hasORSKey = Boolean(
    (process.env.NEXT_PUBLIC_OPENROUTE_SERVICE_API_KEY &&
      process.env.NEXT_PUBLIC_OPENROUTE_SERVICE_API_KEY.length > 10) ||
      process.env.OPENROUTE_SERVICE_API_KEY
  );

  const hasMapsKey = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY &&
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY !== 'demo-api-key'
  );
  const hasFirebase = isFirebaseConfigured();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-500" />
            <span>System Settings & API Configuration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Telemetry status of external API adapters, database connectivity, and routing parameters.
          </p>
        </div>

        {/* Operating Mode Status Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Active Operating State
            </span>
            <ModeIndicator mode={hasORSKey || hasMapsKey ? 'REAL_API' : 'DEMO'} />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The application features a <strong>resilient multi-provider routing architecture</strong>.
            With OpenRouteService (ORS) connected, ambulance dispatches compute real-world fastest road
            geometries and turn-by-turn maneuvers with emergency priority transit.
          </p>
        </div>

        {/* External Service Diagnostics */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            External API Service Integrations
          </h3>

          <div className="space-y-3 text-xs">
            {/* OpenRouteService (ORS) API */}
            <div className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="flex items-center gap-3">
                <Navigation className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span>OpenRouteService Directions (Live ORS)</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/30">
                      Primary Fast Route
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Fast & easy emergency directions, high-speed priority corridors, and turn-by-turn guidance
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                {hasORSKey ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Connected & Active
                  </span>
                ) : (
                  <span className="text-blue-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Demo Provider Active
                  </span>
                )}
              </div>
            </div>

            {/* Google Places API (New) */}
            <div className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="font-bold text-slate-200">Google Places API (New)</div>
                  <div className="text-[11px] text-slate-400">
                    Nearby hospital discovery and place details
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                {hasMapsKey ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </span>
                ) : (
                  <span className="text-blue-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Demo Provider Active
                  </span>
                )}
              </div>
            </div>

            {/* Google Routes API */}
            <div className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="flex items-center gap-3">
                <Compass className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="font-bold text-slate-200">Google Routes API (v2)</div>
                  <div className="text-[11px] text-slate-400">
                    Alternative traffic duration and polyline computation
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                {hasMapsKey ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </span>
                ) : (
                  <span className="text-blue-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Standby / Fallback
                  </span>
                )}
              </div>
            </div>

            {/* Firebase Authentication & Firestore */}
            <div className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="font-bold text-slate-200">Firebase Firestore & Auth</div>
                  <div className="text-[11px] text-slate-400">
                    Emergency case persistence and user role-based access
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                {hasFirebase ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </span>
                ) : (
                  <span className="text-blue-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Local Memory Store Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Routing Dispatch Presets */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            Dispatch Defaults
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Default Search Radius:{' '}
                <span className="font-mono font-bold text-blue-400">{defaultRadius} km</span>
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={defaultRadius}
                onChange={(e) => setDefaultRadius(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>5 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Default Traffic Estimation Model
              </label>
              <select
                value={defaultTrafficModel}
                onChange={(e) => setDefaultTrafficModel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              >
                <option value="BEST_GUESS">Best Guess (Dynamic historical & live conditions)</option>
                <option value="OPTIMISTIC">Optimistic (Free-flowing lanes)</option>
                <option value="PESSIMISTIC">Pessimistic (Peak congestion buffer)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
