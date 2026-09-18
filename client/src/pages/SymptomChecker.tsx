import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, AlertTriangle, ShieldCheck, Plus, X, 
  ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, 
  Clock, AlertCircle, Info, CalendarPlus, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../api/client.js';
import { SymptomAssessment, UrgencyLevel } from '../types.js';
import { CareRecommendations } from '../components/CareRecommendations.js';

const POPULAR_SYMPTOMS = [
  'Headache', 'Fatigue', 'Fever', 'Dry Cough', 'Nausea', 
  'Lower Back Pain', 'Sore Throat', 'Dizziness', 'Joint Stiffness',
  'Mild Eye Strain', 'Nasal Congestion', 'Stomach Cramps',
  'Chest Discomfort', 'Shortness of breath'
];

export const SymptomChecker: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');

  // Context form
  const [ageRange, setAgeRange] = useState('30-45');
  const [duration, setDuration] = useState('2-3 days');
  const [severity, setSeverity] = useState(4);
  const [onset, setOnset] = useState('Gradual onset');
  const [existingConditions, setExistingConditions] = useState('');
  const [medications, setMedications] = useState('');

  // Analysis state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SymptomAssessment | null>(null);
  const [savedToTimeline, setSavedToTimeline] = useState(false);

  // History tab
  const [history, setHistory] = useState<SymptomAssessment[]>([]);
  const [activeTab, setActiveTab] = useState<'checker' | 'history'>('checker');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.getSymptomHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load symptom history:', err);
    }
  };

  const handleAddSymptom = (sym: string) => {
    const trimmed = sym.trim();
    if (!trimmed) return;
    if (!symptoms.includes(trimmed)) {
      setSymptoms([...symptoms, trimmed]);
    }
    setInputText('');
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleRunAnalysis = async () => {
    if (symptoms.length === 0) {
      setError('Please add at least one symptom.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assessment = await api.checkSymptoms({
        symptoms,
        context: {
          age_range: ageRange,
          duration,
          severity,
          onset,
          existing_conditions: existingConditions ? existingConditions.split(',').map(s => s.trim()) : [],
          medications: medications ? medications.split(',').map(s => s.trim()) : []
        },
        saveToTimeline: true
      });

      setResult(assessment);
      setSavedToTimeline(true);
      setStep(3);
      loadHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to complete symptom analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSymptoms([]);
    setInputText('');
    setResult(null);
    setSeverity(4);
    setError(null);
  };

  const renderUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'urgent':
        return (
          <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-base text-rose-700">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>🔴 Seek Urgent Medical Attention</span>
            </div>
            <p className="text-xs sm:text-sm text-rose-900 leading-relaxed font-medium">
              Your reported symptoms or description triggered conservative emergency warning rules. Please do not wait for online tools. Call 911 in the United States or your local emergency number elsewhere, or go to the nearest emergency department right away.
            </p>
          </div>
        );
      case 'consult':
        return (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>🟡 Consider Speaking with a Healthcare Professional</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Based on the duration, severity, or pattern of symptoms reported, a clinical evaluation by a primary care physician or specialist is recommended.
            </p>
          </div>
        );
      case 'routine':
      default:
        return (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>🟢 General Information / Routine Consultation</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Reported symptoms appear consistent with common, mild physiological variations. Monitor your symptoms and maintain supportive self-care.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">AI Symptom Checker</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize symptoms and understand possible associated conditions with conservative safety checks.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('checker')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'checker' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Check
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past Assessments ({history.length})
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* History View */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Previous Symptom Assessments</h2>
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No past symptom assessments on record.</p>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      item.urgency === 'urgent' ? 'bg-rose-100 text-rose-800' :
                      item.urgency === 'consult' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.urgency}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.symptoms.map((s, idx) => (
                      <span key={idx} className="bg-white px-2.5 py-0.5 rounded text-xs font-semibold text-slate-700 border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-700">{item.symptom_summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 3-Step Checker Flow */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Step Progress Bar */}
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-brand-600 font-bold' : ''}`}>
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px]">1</span>
              <span>Enter Symptoms</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-200" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-brand-600 font-bold' : ''}`}>
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px]">2</span>
              <span>Context & Severity</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-200" />
            <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-brand-600 font-bold' : ''}`}>
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px]">3</span>
              <span>Safe Guidance</span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Enter Symptoms */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">What symptoms are you experiencing?</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Type a symptom or select from common examples below. You can enter multiple symptoms.
                  </p>
                </div>

                {/* Input box */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSymptom(inputText);
                      }
                    }}
                    placeholder="e.g. Headache, Dry cough, Afternoon fatigue..."
                    className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={() => handleAddSymptom(inputText)}
                    className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Selected Symptoms Chips */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Selected Symptoms ({symptoms.length}):
                  </label>
                  {symptoms.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                      No symptoms added yet. Click on suggestions below or type your symptoms.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {symptoms.map((s, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-900 text-xs font-semibold"
                        >
                          <span>{s}</span>
                          <button
                            onClick={() => handleRemoveSymptom(idx)}
                            className="p-0.5 hover:bg-brand-200 rounded text-brand-700 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Popular suggestions */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-500 block">Common suggestions:</span>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SYMPTOMS.map((item, idx) => {
                      const isAdded = symptoms.includes(item);
                      return (
                        <button
                          key={idx}
                          onClick={() => isAdded ? setSymptoms(symptoms.filter(s => s !== item)) : handleAddSymptom(item)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                            isAdded
                              ? 'bg-brand-600 border-brand-600 text-white font-medium'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    disabled={symptoms.length === 0}
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-40"
                  >
                    <span>Next: Add Context</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Context Gathering */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add Clinical Context (Optional)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Providing basic context helps refine conservative guidance. Do not provide sensitive details unnecessarily.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Age Range</label>
                    <select
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Under 18">Under 18</option>
                      <option value="18-29">18 - 29</option>
                      <option value="30-45">30 - 45</option>
                      <option value="46-60">46 - 60</option>
                      <option value="60+">60+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Started today">Started today</option>
                      <option value="2-3 days">2 - 3 days</option>
                      <option value="1-2 weeks">1 - 2 weeks</option>
                      <option value="Over a month">Over a month</option>
                    </select>
                  </div>
                </div>

                {/* Severity Slider */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Symptom Severity (1 to 10):</span>
                    <span className="font-black text-sm text-brand-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {severity} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>1: Mild / Barely noticeable</span>
                    <span>5: Moderate discomfort</span>
                    <span>10: Severe / Excruciating</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">When or how did it start? (Onset)</label>
                  <input
                    type="text"
                    value={onset}
                    onChange={(e) => setOnset(e.target.value)}
                    placeholder="e.g. Gradual onset after long screen hours, woke up with it..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Relevant Existing Conditions</label>
                    <input
                      type="text"
                      value={existingConditions}
                      onChange={(e) => setExistingConditions(e.target.value)}
                      placeholder="e.g. Asthma, Allergies, Hypertension"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Relevant Medications / Allergies</label>
                    <input
                      type="text"
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      placeholder="e.g. Cetirizine, Vitamin D"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    disabled={loading}
                    onClick={handleRunAnalysis}
                    className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluating Safety & Patterns...</span>
                      </>
                    ) : (
                      <>
                        <span>Analyze Symptoms</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Safe Guidance Output */}
            {step === 3 && result && (
              <div className="space-y-6">
                
                {/* Urgency Badge */}
                {renderUrgencyBadge(result.urgency)}

                {/* Symptom Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reported Symptoms</span>
                  <p className="text-xs sm:text-sm text-slate-800 font-medium">{result.symptom_summary}</p>
                </div>

                {/* Possible Conditions (Non-Diagnostic) */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Possible conditions associated with these symptoms:
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Educational correlation only. This is not a diagnosis.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {result.possible_conditions.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm">{item.condition_name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                            Educational
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.simple_explanation}</p>
                        
                        <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                          <p className="text-slate-700">
                            <strong className="text-slate-900">Why associated:</strong> {item.why_associated}
                          </p>
                          {item.common_additional_symptoms?.length > 0 && (
                            <p className="text-slate-700">
                              <strong className="text-slate-900">Common additional symptoms:</strong> {item.common_additional_symptoms.join(', ')}
                            </p>
                          )}
                          <p className="text-amber-800 font-medium">
                            <strong>When to seek professional care:</strong> {item.when_to_seek_care}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* General Recommendations */}
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
                  <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                    General Supportive Recommendations
                  </h4>
                  <ul className="space-y-1.5 text-xs text-sky-900">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <CareRecommendations
                  conditions={result.possible_conditions.map((condition) => condition.condition_name)}
                  urgent={result.urgency === 'urgent'}
                />

                {/* Disclaimer */}
                <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-500 italic border border-slate-200">
                  {result.disclaimer}
                </div>

                {/* Actions bottom */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Check Other Symptoms</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {savedToTimeline && (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Added to Timeline
                      </span>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
