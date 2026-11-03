'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithEmailPassword, loginWithDemoRole } from '@/lib/firebase/auth';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { Siren, Shield, UserCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginWithEmailPassword(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'AMBULANCE_OPERATOR' | 'ADMIN') => {
    setLoading(true);
    try {
      await loginWithDemoRole(role);
      router.push('/dashboard');
    } catch (e: any) {
      setError('Demo authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-rose-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-xl shadow-rose-950/50 mx-auto">
            <Siren className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AMBU-AI SYSTEM
          </h1>
          <p className="text-xs text-slate-400">
            Emergency Ambulance Routing & Hospital Selection Control Center
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          {error && (
            <div className="bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Operator / Dispatch Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="operator@ambulance.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN WITH CREDENTIALS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider justify-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>1-Click Evaluator Quick Login</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('AMBULANCE_OPERATOR')}
                disabled={loading}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-left transition-all text-xs group"
              >
                <div className="font-bold flex items-center gap-1.5 text-blue-400 group-hover:text-blue-300">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Ambulance</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Officer Rajesh Kumar
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                disabled={loading}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-left transition-all text-xs group"
              >
                <div className="font-bold flex items-center gap-1.5 text-emerald-400 group-hover:text-emerald-300">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Director</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Dr. Sarah Mitchell
                </div>
              </button>
            </div>
          </div>
        </div>

        <MedicalDisclaimer compact />
      </div>
    </div>
  );
}
