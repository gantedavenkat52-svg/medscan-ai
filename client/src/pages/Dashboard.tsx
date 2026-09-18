import React, { useState, useEffect } from 'react';
import { 
  Activity, Stethoscope, FlaskConical, CalendarDays, 
  MapPin, Building2, Microscope, ArrowRight, Clock,
  Calendar, CheckCircle2, AlertCircle, Sparkles, Smile,
  Frown, Meh, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import { DailyHealthReport, LabReport, SymptomAssessment, TimelineEvent } from '../types.js';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);

  const [latestDaily, setLatestDaily] = useState<DailyHealthReport | null>(null);
  const [recentSymptoms, setRecentSymptoms] = useState<SymptomAssessment[]>([]);
  const [recentLabs, setRecentLabs] = useState<LabReport[]>([]);
  const [recentTimeline, setRecentTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const loadDashboardData = async () => {
      try {
        const [daily, symptoms, labs, timeline] = await Promise.all([
          api.getLatestDailyReport().catch(() => null),
          api.getSymptomHistory().catch(() => []),
          api.getLabReports().catch(() => []),
          api.getTimeline().catch(() => [])
        ]);

        setLatestDaily(daily);
        setRecentSymptoms(symptoms.slice(0, 2));
        setRecentLabs(labs.slice(0, 2));
        setRecentTimeline(timeline.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const quickActions = [
    {
      id: 'symptoms',
      title: 'Check Symptoms',
      desc: 'Evaluate symptoms with conservative safety guidance.',
      icon: Stethoscope,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Safety First'
    },
    {
      id: 'labs',
      title: 'Analyze Lab Report',
      desc: 'Review laboratory test values & reference ranges.',
      icon: FlaskConical,
      color: 'from-teal-600 to-emerald-600',
      badge: 'PDF / OCR'
    },
    {
      id: 'daily',
      title: 'Daily Health Report',
      desc: 'Track energy, sleep, water, exercise & vitals.',
      icon: CalendarDays,
      color: 'from-sky-600 to-cyan-600',
      badge: 'Track Day-to-Day'
    },
    {
      id: 'care-doctors',
      title: 'Find a Doctor',
      desc: 'Filter qualified doctors by specialty and city.',
      icon: MapPin,
      color: 'from-purple-600 to-violet-600',
      badge: 'Telehealth & In-Person'
    },
    {
      id: 'care-hospitals',
      title: 'Find a Hospital',
      desc: 'Locate facilities with verified 24/7 emergency rooms.',
      icon: Building2,
      color: 'from-rose-600 to-red-600',
      badge: '24/7 ER Verified'
    },
    {
      id: 'care-labs',
      title: 'Find a Diagnostic Lab',
      desc: 'Locate testing centers & home sample collection.',
      icon: Microscope,
      color: 'from-amber-600 to-orange-600',
      badge: 'Home Collection'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 rounded-2xl text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MedScan AI Personal Health Space</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {greeting}, {user?.name || 'Patient'}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            How are you feeling today? Access your health actions, laboratory interpretations, and safety assistance below.
          </p>

          {/* Feeling Quick Selector */}
          <div className="pt-2">
            <span className="block text-xs text-slate-400 font-medium mb-2">
              Quick Mood & Status Check-in:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Great & Energetic', icon: Smile, color: 'hover:border-emerald-400' },
                { label: 'Good / Normal', icon: Sun, color: 'hover:border-sky-400' },
                { label: 'Okay / Neutral', icon: Meh, color: 'hover:border-amber-400' },
                { label: 'Fatigued / Low Sleep', icon: Moon, color: 'hover:border-indigo-400' },
                { label: 'Unwell / Symptoms', icon: Frown, color: 'hover:border-rose-400' },
              ].map((item, idx) => {
                const isSelected = selectedFeeling === item.label;
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedFeeling(item.label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-brand-500 border-brand-400 text-white shadow-sm'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 ' + item.color
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quick Health Actions</h2>
            <p className="text-xs text-slate-500">Choose a service to begin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={() => {
                  if (action.id.startsWith('care-')) {
                    onNavigate('care');
                  } else {
                    onNavigate(action.id);
                  }
                }}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-400 transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {action.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-700 transition">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      {action.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Daily Health Overview */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm">Today's Health Status</h3>
            </div>
            <button
              onClick={() => onNavigate('daily')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Update
            </button>
          </div>

          {latestDaily ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-100 leading-relaxed">
                <span className="font-semibold text-slate-900 block mb-1">Status Summary:</span>
                {latestDaily.ai_summary}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Energy</span>
                  <span className="font-bold text-slate-900 text-sm">{latestDaily.energy_level} / 5</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Sleep</span>
                  <span className="font-bold text-slate-900 text-sm">{latestDaily.sleep_hours} hrs</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Water</span>
                  <span className="font-bold text-slate-900 text-sm">{latestDaily.water_intake_liters} L</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {latestDaily.vitals?.bp_systolic ? `${latestDaily.vitals.bp_systolic}/${latestDaily.vitals.bp_diastolic}` : 'Not logged'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 space-y-2">
              <p>No health report logged for today yet.</p>
              <button
                onClick={() => onNavigate('daily')}
                className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 font-semibold text-xs hover:bg-brand-100 transition"
              >
                Log Today's Health
              </button>
            </div>
          )}
        </div>

        {/* Recent Lab Reports Summary */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm">Recent Lab Reports</h3>
            </div>
            <button
              onClick={() => onNavigate('labs')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              View All
            </button>
          </div>

          {recentLabs.length > 0 ? (
            <div className="space-y-2.5">
              {recentLabs.map((lab) => {
                const reviewCount = lab.results.filter(r => r.status === 'review').length;
                return (
                  <div
                    key={lab.id}
                    onClick={() => onNavigate('labs')}
                    className="p-3 rounded-lg border border-slate-200 hover:border-brand-300 transition cursor-pointer bg-slate-50/50 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{lab.report_type}</span>
                      <span className="text-[10px] text-slate-500">{lab.report_date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{lab.lab_name}</p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {lab.results.length} Tests Analyzed
                      </span>
                      {reviewCount > 0 ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                          {reviewCount} for Review
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          All Within Range
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 space-y-2">
              <p>No lab reports uploaded yet.</p>
              <button
                onClick={() => onNavigate('labs')}
                className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 font-semibold text-xs hover:bg-brand-100 transition"
              >
                Analyze a Report
              </button>
            </div>
          )}
        </div>

        {/* Health Timeline Preview */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm">Health Timeline</h3>
            </div>
            <button
              onClick={() => onNavigate('timeline')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Full Timeline
            </button>
          </div>

          {recentTimeline.length > 0 ? (
            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {recentTimeline.map((item) => (
                <div key={item.id} className="relative pl-6 text-xs space-y-0.5">
                  <div className="absolute left-1 top-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.title}</span>
                    <span className="text-[10px] text-slate-400">{item.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 space-y-2">
              <p>Your health events timeline will appear here.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
