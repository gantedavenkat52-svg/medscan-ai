import React from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  return (
    <div className="bg-rose-50 border-b border-rose-200 text-rose-900 px-4 py-2 text-xs md:text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong className="font-semibold text-rose-950">Medical Emergency Notice:</strong> If you are experiencing a life-threatening medical emergency in the United States, call <strong>911</strong> or go to the nearest emergency department immediately.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline text-rose-700 font-medium">Do not rely on AI for emergencies.</span>
          <a
            href="tel:911"
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-medium hover:bg-rose-700 transition"
          >
            <PhoneCall className="w-3 h-3" />
            <span>Call 911</span>
          </a>
        </div>
      </div>
    </div>
  );
};
