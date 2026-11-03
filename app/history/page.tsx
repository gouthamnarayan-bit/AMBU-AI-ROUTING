'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { HistoryList } from '@/components/history/HistoryList';
import { EmergencyCaseRecord } from '@/types/emergency';
import { getEmergencyCases } from '@/lib/firebase/firestore';
import { History, ShieldAlert } from 'lucide-react';

export default function HistoryPage() {
  const [cases, setCases] = useState<EmergencyCaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      const data = await getEmergencyCases(100);
      setCases(data);
      setLoading(false);
    }
    loadCases();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <History className="w-7 h-7 text-indigo-500" />
              <span>Emergency Case & Decision History</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Audit log of dispatched ambulance emergencies, mathematical criteria weights, and hospital selections.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Loading case archives...
          </div>
        ) : (
          <HistoryList cases={cases} />
        )}
      </div>
    </AppLayout>
  );
}
