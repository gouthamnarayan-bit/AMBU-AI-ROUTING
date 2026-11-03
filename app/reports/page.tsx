'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { getEmergencyCases } from '@/lib/firebase/firestore';
import { EmergencyCaseRecord } from '@/types/emergency';
import { formatDate } from '@/lib/utils';
import { FileText, Printer, ArrowRight } from 'lucide-react';

export default function ReportsIndexPage() {
  const [cases, setCases] = useState<EmergencyCaseRecord[]>([]);

  useEffect(() => {
    getEmergencyCases(50).then(setCases);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-500" />
            <span>Emergency Decision Reports Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Printable audit records and mathematical triage summaries for project evaluation and clinical defense.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c) => (
            <div
              key={c.caseId}
              className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-mono font-bold text-blue-400">
                    {c.caseId}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <h3 className="font-bold text-slate-100 text-sm">
                  {c.selectedHospitalName}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {c.emergencyType} ({c.severity}) • ETA: {c.etaMinutes} mins
                </p>
              </div>

              <Link
                href={`/reports/${c.caseId}`}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Open Printable Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
