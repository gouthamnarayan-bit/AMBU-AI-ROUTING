'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Siren,
  MapPin,
  TableProperties,
  Building2,
  History,
  FileText,
  Sliders,
  Settings,
  BookOpen,
  AlertOctagon,
  LogOut,
} from 'lucide-react';
import { logoutUser } from '@/lib/firebase/auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/emergency', label: 'New Emergency', icon: Siren, highlight: true },
  { href: '/live-map', label: 'Live Map', icon: MapPin },
  { href: '/ranking', label: 'Decision Ranking', icon: TableProperties },
  { href: '/hospitals', label: 'Hospitals Registry', icon: Building2 },
  { href: '/history', label: 'Case History', icon: History },
  { href: '/reports', label: 'Emergency Reports', icon: FileText },
  { href: '/admin', label: 'Admin Panel', icon: Sliders },
  { href: '/settings', label: 'Settings & APIs', icon: Settings },
  { href: '/algorithm', label: 'Algorithm & Viva', icon: BookOpen },
  { href: '/limitations', label: 'System Limitations', icon: AlertOctagon },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Control Center
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                item.highlight && !isActive
                  ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                  : isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-white' : item.highlight ? 'text-rose-400' : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Switch Operator / Logout</span>
        </button>
      </div>
    </aside>
  );
};
