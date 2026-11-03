'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Ambulance Control Center...</span>
      </div>
    </div>
  );
}
