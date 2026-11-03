'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Siren, Clock, Bell, UserCheck, ShieldAlert } from 'lucide-react';
import { ModeIndicator } from '../common/ModeIndicator';
import { getActiveUser } from '@/lib/firebase/auth';
import { UserProfile } from '@/types/user';

export const Navbar: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setUser(getActiveUser());
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Title */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform">
            <Siren className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-base sm:text-lg">
                AMBU-AI ROUTING
              </span>
              <span className="bg-rose-500/20 text-rose-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-rose-500/30">
                DISPATCH v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              AI-Based Ambulance Routing & MCDM Hospital Selection
            </p>
          </div>
        </Link>
      </div>

      {/* Center / Status */}
      <div className="flex items-center gap-4">
        <ModeIndicator mode="DEMO" />

        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr || '12:00:00 PM'}</span>
        </div>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/emergency"
          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-md shadow-rose-950/30 transition-all active:scale-95"
        >
          <ShieldAlert className="w-4 h-4" />
          <span className="hidden sm:inline">NEW EMERGENCY CASE</span>
        </Link>

        {user && (
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-300">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-200">{user.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {user.role} {user.badgeNumber ? `• ${user.badgeNumber}` : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
