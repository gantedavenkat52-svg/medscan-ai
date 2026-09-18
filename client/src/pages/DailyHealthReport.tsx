import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, Plus, CheckCircle2, AlertCircle, 
  ArrowRight, Clock, Droplets, Moon, Dumbbell, 
  Heart, Thermometer, Activity, Sparkles, RefreshCw
} from 'lucide-react';
import { api } from '../api/client.js';
import { DailyHealthReport as IDailyReport } from '../types.js';

export const DailyHealthReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');
  const [reports, setReports] = useState<IDailyReport[]>([]);
  const [latestReport, setLatestReport] = useState<IDailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [energyLevel, setEnergyLevel] = useState<number>(4);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<string>('Good');
  const [waterIntake, setWaterIntake] = useState<number>(2.2);
  const [exerciseMinutes, setExerciseMinutes] = useState<number>(30);
  const [mood, setMood] = useState<string>('Balanced');
  const [symptomsText, setSymptomsText] = useState<string>('');

  // Optional Vitals
  const [tempF, setTempF] = useState<string>('98.4');
  const [bpSys, setBpSys] = useState<string>('118');
  const [bpDia, setBpDia] = useState<string>('76');
  const [glucose, setGlucose] = useState<string>('92');
  const [heartRate, setHeartRate] = useState<string>('68');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await api.getDailyReports();
      setReports(data);
      if (data.length > 0) {
        setLatestReport(data[0]);
      }
    } catch (err) {
      console.error('Failed to load daily reports:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const symptomsList = symptomsText
        ? symptomsText.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const vitalsObj: any = {};
      if (tempF) vitalsObj.temperature_f = parseFloat(tempF);
      if (bpSys) vitalsObj.bp_systolic = parseInt(bpSys);
      if (bpDia) vitalsObj.bp_diastolic = parseInt(bpDia);
      if (glucose) vitalsObj.blood_glucose_mgdl = parseFloat(glucose);
      if (heartRate) vitalsObj.resting_heart_rate = parseInt(heartRate);

      const saved = await api.saveDailyReport({
        date,
        energy_level: energyLevel,
        sleep_hours: sleepHours,
        sleep_quality: sleepQuality,
        water_intake_liters: waterIntake,
        exercise_minutes: exerciseMinutes,
        mood,
        symptoms_reported: symptomsList,
        vitals: Object.keys(vitalsObj).length > 0 ? vitalsObj : undefined
      });

      setLatestReport(saved);
      setSuccessMsg("Today's health report successfully logged and analyzed.");
      await loadReports();
    } catch (err: any) {
      setError(err.message || 'Failed to save daily report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">My Daily Health Report</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track daily metrics, observe changes over time, and review educational observations.
          </p>
        </div>

        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('log')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'log' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Log Entry
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            History ({reports.length})
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* History View */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Past Daily Health Reports</h2>
          {reports.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No reports logged yet.</p>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{rep.date}</span>
                    <span className="text-xs text-slate-500">Energy: {rep.energy_level}/5 • Mood: {rep.mood}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Sleep</span>
                      <span className="font-bold text-slate-800">{rep.sleep_hours} hrs ({rep.sleep_quality})</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Water</span>
                      <span className="font-bold text-slate-800">{rep.water_intake_liters} L</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Activity</span>
                      <span className="font-bold text-slate-800">{rep.exercise_minutes} mins</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
                      <span className="font-bold text-slate-800">
                        {rep.vitals?.bp_systolic ? `${rep.vitals.bp_systolic}/${rep.vitals.bp_diastolic}` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
                    <strong className="block text-slate-900 mb-0.5">Educational Observation:</strong>
                    {rep.ai_summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Log Form & Current Report View */
        <div className="space-y-6">
          
          {/* Form Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Record Today's Health Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Clearly distinguishes user-reported facts from AI-generated educational observations.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: Date & Energy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Overall Energy Level: <span className="text-brand-600 font-black">{energyLevel} / 5</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1: Exhausted</span>
                    <span>3: Moderate</span>
                    <span>5: High Energy</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Sleep & Hydration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sleep Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sleep Quality</label>
                  <select
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Restorative">Restorative / Deep</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Restless">Restless / Interrupted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Water Intake (Liters)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={waterIntake}
                    onChange={(e) => setWaterIntake(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Row 3: Exercise & Mood */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exercise / Activity (Minutes)</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={exerciseMinutes}
                    onChange={(e) => setExerciseMinutes(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mood</label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Energetic and focused">Energetic and focused</option>
                    <option value="Balanced">Balanced / Calm</option>
                    <option value="Slightly fatigued">Slightly fatigued</option>
                    <option value="Stressed">Stressed / Anxious</option>
                    <option value="Low mood">Low mood</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Any symptoms today */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Any symptoms experienced today? (Optional, comma-separated)
                </label>
                <input
                  type="text"
                  value={symptomsText}
                  onChange={(e) => setSymptomsText(e.target.value)}
                  placeholder="e.g. Mild tension headache, sinus congestion"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Row 5: Vitals Collapsible */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Optional Vitals & Measurements
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tempF}
                      onChange={(e) => setTempF(e.target.value)}
                      placeholder="98.6"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">BP (Systolic)</label>
                    <input
                      type="number"
                      value={bpSys}
                      onChange={(e) => setBpSys(e.target.value)}
                      placeholder="120"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">BP (Diastolic)</label>
                    <input
                      type="number"
                      value={bpDia}
                      onChange={(e) => setBpDia(e.target.value)}
                      placeholder="80"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Glucose (mg/dL)</label>
                    <input
                      type="number"
                      value={glucose}
                      onChange={(e) => setGlucose(e.target.value)}
                      placeholder="95"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving & Summarizing...</span>
                    </>
                  ) : (
                    <span>Save Daily Health Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Generated Report Summary Card */}
          {latestReport && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block">
                    Report Summary
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Health Entry for {latestReport.date}
                  </h3>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
                  Logged at {new Date(latestReport.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* USER REPORTED INFO vs AI EDUCATIONAL OBSERVATIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Column 1: User Reported Facts */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-slate-700" />
                    <span>User-Reported Information</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li><strong>Energy:</strong> {latestReport.energy_level} / 5</li>
                    <li><strong>Sleep:</strong> {latestReport.sleep_hours} hrs ({latestReport.sleep_quality})</li>
                    <li><strong>Water Intake:</strong> {latestReport.water_intake_liters} Liters</li>
                    <li><strong>Physical Activity:</strong> {latestReport.exercise_minutes} Minutes</li>
                    <li><strong>Mood:</strong> {latestReport.mood}</li>
                    {latestReport.symptoms_reported?.length > 0 ? (
                      <li><strong>Reported Symptoms:</strong> {latestReport.symptoms_reported.join(', ')}</li>
                    ) : (
                      <li><strong>Reported Symptoms:</strong> None noted</li>
                    )}
                    {latestReport.vitals && (
                      <li className="pt-1 text-[11px] text-slate-500">
                        Vitals: BP {latestReport.vitals.bp_systolic}/{latestReport.vitals.bp_diastolic} mmHg • Temp {latestReport.vitals.temperature_f}°F • Glucose {latestReport.vitals.blood_glucose_mgdl} mg/dL
                      </li>
                    )}
                  </ul>
                </div>

                {/* Column 2: AI Generated Educational Observations */}
                <div className="p-4 rounded-xl bg-brand-50/70 border border-brand-200 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-200 text-brand-950 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span>AI Educational Observations</span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {latestReport.ai_summary}
                  </p>

                  {latestReport.ai_changes?.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-brand-900 block">Day-over-Day Changes:</span>
                      <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                        {latestReport.ai_changes.map((ch, idx) => (
                          <li key={idx}>{ch}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestReport.ai_recommendations?.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-brand-900 block">Supportive Lifestyle Recommendations:</span>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {latestReport.ai_recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-500 italic border border-slate-200">
                *Notice: Daily health reports reflect self-reported logs and general educational observations. They do not constitute a medical diagnosis or treatment plan.
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
