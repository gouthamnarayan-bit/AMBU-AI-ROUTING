'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  AlertOctagon,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileQuestion,
} from 'lucide-react';

export default function LimitationsPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4" />
            <span>Academic Prototype & Governance Disclosure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            System Assumptions, Scope & Limitations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mandatory operational boundaries and ethical considerations for the B.Tech CSE Final Year Capstone Project.
          </p>
        </div>

        {/* Primary Medical Safety Position */}
        <section className="bg-rose-950/20 border-2 border-rose-500/30 p-6 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5" />
            <span>Official Medical Safety Disclaimer</span>
          </div>

          <p className="text-xs text-rose-200 leading-relaxed">
            This software system is an <strong>academic research and decision-support prototype</strong> designed to illustrate the application of multi-criteria decision-making algorithms (AHP and TOPSIS) to emergency medical dispatch. It is <strong>NOT</strong> an FDA/CE-cleared medical device, nor has it undergone randomized clinical validation.
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            The system must not be utilized as the sole decision-maker for life-critical dispatch or hospital diversion. It is intended to assist, not replace, certified emergency medical technicians (EMTs), paramedic dispatch controllers, and certified physician medical directors.
          </p>
        </section>

        {/* Detailed Limitations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Simulated Availability */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Simulated Resource Telemetry</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              In demonstration mode, ICU bed counts, ventilator availability, and operational divert statuses are generated through realistic simulation seeds. While the software provides HL7/FHIR-ready architecture, live integration requires signed data-sharing agreements with hospital networks.
            </p>
          </div>

          {/* Traffic & ETA Estimates */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Traffic ETA Estimation Error</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Traffic travel times calculated via Google Routes API or simulated road vectors represent probabilistic estimates based on historical and near-future traffic models (BEST_GUESS). Real-world ambulance sirens, priority green corridors, weather, and sudden road closures may cause actual transit times to vary.
            </p>
          </div>

          {/* Prototype AHP Weights */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Calibrated Decision Parameters</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Default pairwise comparison matrix values (a_ij) and patient-specific severity multipliers are established based on published emergency literature (Golden Hour concept, STEMI door-to-balloon guidelines). They do not constitute universally validated clinical guidelines.
            </p>
          </div>

          {/* Cloud API & Network Dependency */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>External Service Availability</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Real API mode depends on network connectivity and Google Cloud / Firebase API availability. The application includes graceful local fallback handlers, ensuring zero crashes even when internet connectivity or API quota limits are encountered.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
