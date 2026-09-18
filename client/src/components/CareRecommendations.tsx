import React, { useEffect, useState } from 'react';
import { Building2, MapPin, Star, Stethoscope } from 'lucide-react';
import { api } from '../api/client.js';
import { Doctor, Hospital } from '../types.js';

interface CareRecommendationsProps {
  conditions?: string[];
  flaggedTests?: string[];
  urgent?: boolean;
}

interface RecommendationData {
  educational_notice: string;
  specialties: string[];
  doctors: Doctor[];
  hospitals: Hospital[];
  ranked_by: string;
}

export const CareRecommendations: React.FC<CareRecommendationsProps> = ({ conditions = [], flaggedTests = [], urgent = false }) => {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getCareRecommendations({ conditions, flaggedTests, urgent })
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [conditions.join('|'), flaggedTests.join('|'), urgent]);

  if (loading) return <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-500">Finding relevant care options...</div>;
  if (!data) return null;

  return (
    <section className="space-y-4">
      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
        <div className="flex items-start gap-2">
          <Stethoscope className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-indigo-950">Relevant specialists and hospitals</h3>
            <p className="text-xs text-indigo-900 mt-1">{data.educational_notice}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {data.specialties.map((specialty) => (
                <span key={specialty} className="px-2 py-1 rounded-full bg-white border border-indigo-200 text-[11px] font-semibold text-indigo-800">{specialty}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {urgent && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900">Urgent symptoms detected. Call local emergency services or go to the nearest emergency department now. Directory rankings should not delay emergency care.</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecommendationList title="Top matching specialists" empty="No matching specialist is listed yet.">
          {data.doctors.slice(0, 3).map((doctor) => (
            <div key={doctor.id} className="flex items-start justify-between gap-3 border-t border-slate-100 pt-3">
              <div><p className="text-xs font-bold text-slate-900">{doctor.name}</p><p className="text-[11px] text-brand-700 font-semibold">{doctor.specialty}</p><p className="text-[11px] text-slate-500">{doctor.hospital_affiliation}</p></div>
              <Rating rating={doctor.rating} reviews={doctor.review_count} />
            </div>
          ))}
        </RecommendationList>
        <RecommendationList title="Highest-rated hospitals" empty="No matching hospital is listed yet.">
          {data.hospitals.slice(0, 3).map((hospital) => (
            <div key={hospital.id} className="flex items-start justify-between gap-3 border-t border-slate-100 pt-3">
              <div><p className="text-xs font-bold text-slate-900 flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-slate-400" />{hospital.name}</p><p className="text-[11px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{hospital.city} · {hospital.distance_km} km</p></div>
              <Rating rating={hospital.rating} reviews={hospital.review_count} />
            </div>
          ))}
        </RecommendationList>
      </div>
      <p className="text-[11px] text-slate-500 italic">{data.ranked_by} Ratings are fictional demo data and are not a medical endorsement.</p>
    </section>
  );
};

const RecommendationList: React.FC<{ title: string; empty: string; children: React.ReactNode }> = ({ title, empty, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"><div className="flex items-center justify-between"><h4 className="text-sm font-bold text-slate-900">{title}</h4><span className="text-[10px] text-slate-500">Rating first</span></div>{children || <p className="text-xs text-slate-500">{empty}</p>}</div>
);

const Rating: React.FC<{ rating: number; reviews: number }> = ({ rating, reviews }) => (
  <span className="shrink-0 text-right"><span className="flex items-center gap-1 text-xs font-bold text-amber-700"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{rating.toFixed(1)}</span><span className="block text-[10px] text-slate-400">{reviews} reviews</span></span>
);