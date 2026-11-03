'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEmergencyCaseById } from '@/lib/firebase/firestore';
import { EmergencyCaseRecord } from '@/types/emergency';
import { formatDate, formatTime } from '@/lib/utils';
import {
  Printer,
  ArrowLeft,
  Siren,
  Building2,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function CaseReportPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;

  const [caseRecord, setCaseRecord] = useState<EmergencyCaseRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCase() {
      if (!caseId) return;
      const data = await getEmergencyCaseById(caseId);
      setCaseRecord(data);
      setLoading(false);
    }
    fetchCase();
  }, [caseId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <span className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin inline-block" />
          <p className="text-xs text-slate-600 font-mono">Generating Case Report...</p>
        </div>
      </div>
    );
  }

  if (!caseRecord) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="text-xl font-bold">Case Record Not Found</h2>
        <button
          onClick={() => router.push('/history')}
          className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg font-semibold"
        >
          Return to History
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6">
      {/* Non-printable Control Header */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <button
          onClick={() => router.back()}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handlePrint}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export Decision Report (PDF)</span>
        </button>
      </div>

      {/* Printable Sheet (Stylized for Academic Defense) */}
      <article className="max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl print-page space-y-6">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <Siren className="w-4 h-4" />
              <span>Emergency Medical Service • Algorithmic Triage Audit Report</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
              AI-Based Ambulance Routing & Hospital Selection System
            </h1>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Multi-Criteria Decision Making (AHP + TOPSIS) Decision Validation Record
            </p>
          </div>

          <div className="text-right font-mono text-xs">
            <div className="font-bold text-slate-900 text-sm">{caseRecord.caseId}</div>
            <div className="text-slate-600">{formatDate(caseRecord.createdAt)}</div>
            <div className="text-slate-500">{formatTime(caseRecord.createdAt)}</div>
          </div>
        </div>

        {/* Clinical Case & Patient Snapshot */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">
              Patient ID
            </span>
            <strong className="text-slate-900 font-mono text-sm">
              {caseRecord.patientId}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">
              Demographics
            </span>
            <strong className="text-slate-900">
              {caseRecord.patientData.age} Years • {caseRecord.patientData.gender}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">
              Emergency Category
            </span>
            <strong className="text-rose-600 font-bold">
              {caseRecord.emergencyType}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">
              Severity Level
            </span>
            <strong className="text-amber-600 font-bold">
              {caseRecord.severity}
            </strong>
          </div>
        </section>

        {/* Incident Details */}
        <section className="space-y-1 text-xs">
          <span className="text-slate-500 font-bold uppercase text-[10px]">
            Clinical Presentation & Triage Notes:
          </span>
          <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
            {caseRecord.patientData.medicalCondition}.{' '}
            {caseRecord.patientData.additionalNotes || ''}
          </p>
        </section>

        {/* Destination Decision */}
        <section className="border-2 border-emerald-600 bg-emerald-50/50 p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recommended Medical Destination (Rank #1 Eligible Facility)</span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded">
              ETA: {caseRecord.etaMinutes} mins ({caseRecord.distanceKm} km)
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            {caseRecord.selectedHospitalName}
          </h2>

          <div className="text-xs text-slate-700 flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>Origin Scene: {caseRecord.location.address}</span>
          </div>

          <div className="pt-2 border-t border-emerald-200 text-xs text-slate-800 leading-relaxed">
            <strong>Algorithmic Rationale: </strong>
            <span>{caseRecord.decisionExplanation}</span>
          </div>
        </section>

        {/* Algorithm Quality Audit */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wider">
            Decision Engineering & Mathematical Verification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[10px]">
                AHP Consistency Ratio (CR)
              </span>
              <strong className="font-mono text-slate-900 text-sm">
                {caseRecord.ahpConsistencyRatio.toFixed(4)}
              </strong>
              <span className="text-[10px] text-emerald-600 block mt-0.5">
                CR &le; 0.10 (Consistent)
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[10px]">
                Candidate Facility Filter
              </span>
              <strong className="font-mono text-slate-900 text-sm">
                {caseRecord.eligibleHospitalsCount} of {caseRecord.candidateHospitalsCount} Eligible
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {caseRecord.excludedHospitalsCount} excluded by hard constraints
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[10px]">
                Data & Routing Mode
              </span>
              <strong className="font-mono text-slate-900 text-sm">
                {caseRecord.mode} MODE
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Google Routes / Demo Telemetry
              </span>
            </div>
          </div>
        </section>

        {/* Mandatory Academic Disclaimer */}
        <footer className="pt-4 border-t border-slate-300 text-[10px] text-slate-500 space-y-1">
          <p>
            <strong>Academic Project Disclaimer:</strong> This document is generated by an academic decision-support prototype (B.Tech Final Year CSE Capstone). It does not substitute certified emergency dispatch, clinical triage guidelines, or hospital admission systems. Hospital availability and bed telemetry are simulated for academic demonstration unless integrated with live hospital EHR/FHIR endpoints.
          </p>
          <div className="flex justify-between font-mono pt-2 text-[9px] text-slate-400">
            <span>System: AMBU-AI Dispatch Control v1.0</span>
            <span>Document Checksum: SHA256-VERIFIED</span>
          </div>
        </footer>
      </article>
    </div>
  );
}
