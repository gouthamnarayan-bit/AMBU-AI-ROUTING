'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
          <div className="px-6 pt-4 no-print">
            <MedicalDisclaimer compact />
          </div>

          <div className="flex-1 p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
