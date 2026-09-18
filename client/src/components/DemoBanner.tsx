import React from 'react';
import { Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const DemoBanner: React.FC = () => {
  const { isDemo, user } = useAuth();

  if (!isDemo) return null;

  return (
    <div className="bg-amber-500 text-slate-950 font-medium text-xs px-4 py-1.5 text-center flex items-center justify-center gap-2 shadow-sm">
      <Info className="w-3.5 h-3.5 text-slate-950 shrink-0" />
      <span>
        <strong>DEMO DATA — NOT REAL PATIENT INFORMATION</strong> (Viewing fictional patient records for: {user?.name})
      </span>
    </div>
  );
};
