import React, { useState, useEffect } from 'react';
import { 
  Activity, Stethoscope, FlaskConical, CalendarDays, 
  Calendar, Plus, Clock, Filter, ArrowRight, X, CheckCircle2
} from 'lucide-react';
import { api } from '../api/client.js';
import { TimelineEvent } from '../types.js';

export const HealthTimeline: React.FC = () => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Manual event modal
  const [modalOpen, setModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventType, setEventType] = useState<'appointment' | 'daily_report' | 'symptom' | 'lab_report'>('appointment');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadTimeline();
  }, [filterType]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const data = await api.getTimeline(filterType);
      setTimeline(data);
    } catch (err) {
      console.error('Failed to load health timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle) return;

    try {
      await api.addTimelineEvent({
        event_type: eventType,
        title: eventTitle,
        description: eventDesc,
        date: eventDate
      });
      setModalOpen(false);
      setEventTitle('');
      setEventDesc('');
      loadTimeline();
    } catch (e) {
      console.error(e);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'symptom':
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'lab_report':
        return <FlaskConical className="w-4 h-4 text-teal-600" />;
      case 'daily_report':
        return <CalendarDays className="w-4 h-4 text-sky-600" />;
      case 'appointment':
      default:
        return <Activity className="w-4 h-4 text-purple-600" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'symptom':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'lab_report':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'daily_report':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'appointment':
      default:
        return 'bg-purple-50 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">My Health Timeline</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chronological aggregation of symptoms, lab reports, daily vitals, and physician visits.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Consultation / Note</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Records' },
          { id: 'daily_report', label: 'Daily Vitals & Reports' },
          { id: 'symptom', label: 'Symptom Checks' },
          { id: 'lab_report', label: 'Lab Reports' },
          { id: 'appointment', label: 'Doctor Visits' }
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilterType(chip.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              filterType === chip.id
                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading health records...</div>
        ) : timeline.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-2">
            <p>No timeline records matching the filter.</p>
          </div>
        ) : (
          <div className="relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 space-y-8">
            {timeline.map((event) => (
              <div key={event.id} className="relative pl-9 space-y-2 group">
                {/* Dot / Icon */}
                <div className="absolute left-0 top-0.5 w-7 h-7 rounded-full bg-white border-2 border-slate-300 group-hover:border-brand-500 flex items-center justify-center transition">
                  {getEventIcon(event.event_type)}
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 group-hover:border-slate-300 group-hover:bg-slate-50 transition space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{event.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getBadgeColor(event.event_type)}`}>
                        {event.event_type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Clinical Note or Visit</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="appointment">Doctor / Clinical Visit</option>
                  <option value="daily_report">General Health Note</option>
                  <option value="symptom">Symptom Note</option>
                  <option value="lab_report">Lab Result Record</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Follow-up with Dr. Evelyn Vance"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="e.g. Doctor reviewed blood work, advised continuing hydration, scheduled follow-up in 6 months."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold"
                >
                  Save to Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
