import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, UploadCloud, FileText, CheckCircle2, 
  AlertTriangle, ArrowRight, RefreshCw, ChevronDown, 
  ChevronUp, LineChart as ChartIcon, History, Sparkles, Info
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../api/client.js';
import { LabReport, LabResult } from '../types.js';
import { CareRecommendations } from '../components/CareRecommendations.js';

export const LabReportAnalyzer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'history' | 'trends'>('analyzer');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentReport, setCurrentReport] = useState<LabReport | null>(null);
  const [reportsHistory, setReportsHistory] = useState<LabReport[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [selectedTrendMarker, setSelectedTrendMarker] = useState<string>('Fasting Blood Glucose');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [history, sampleTemplates, trends] = await Promise.all([
        api.getLabReports().catch(() => []),
        api.getSampleTemplates().catch(() => []),
        api.getMarkerTrends().catch(() => null)
      ]);
      setReportsHistory(history);
      setSamples(sampleTemplates);
      if (sampleTemplates.length > 0) {
        setSelectedSampleId(sampleTemplates[0].id);
      }
      setTrendData(trends?.trends || null);
      if (history.length > 0) {
        setCurrentReport(history[0]);
      }
    } catch (err) {
      console.error('Failed to load lab data:', err);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const report = await api.uploadLabReport(formData);
      setCurrentReport(report);
      setFile(null);
      await loadInitialData();
    } catch (err: any) {
      setError(err.message || 'Failed to analyze lab report');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSample = async (sampleId: string) => {
    setLoading(true);
    setError(null);

    try {
      const report = await api.analyzeSampleReport(sampleId);
      setCurrentReport(report);
      await loadInitialData();
    } catch (err: any) {
      setError(err.message || 'Failed to analyze sample report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Lab Report Analyzer</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Extract values, review lab-specific reference ranges, and understand test results in plain language.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'analyzer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analyzer
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'trends' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Marker Trends
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past Reports ({reportsHistory.length})
          </button>
        </div>
      </div>

      {/* TRENDS TAB */}
      {activeTab === 'trends' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Historical Biomarker Trends</h2>
            <p className="text-xs text-slate-500">
              Track how specific laboratory markers have varied across recorded entries.
            </p>
          </div>

          {/* Marker Select Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              'Fasting Blood Glucose', 
              'Total Cholesterol', 
              '25-Hydroxy Vitamin D', 
              'Hemoglobin'
            ].map((marker) => (
              <button
                key={marker}
                onClick={() => setSelectedTrendMarker(marker)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  selectedTrendMarker === marker
                    ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {marker}
              </button>
            ))}
          </div>

          {/* Chart View */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            {trendData && trendData[selectedTrendMarker]?.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData[selectedTrendMarker]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0284c7"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#0284c7' }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                Not enough historical entries for {selectedTrendMarker} yet. Upload multiple reports over time to observe trends.
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-500 italic border border-slate-200">
            *Notice: Trends are for tracking changes over time and do not constitute a medical diagnosis. Variations can occur due to hydration, fasting state, laboratory methods, or lifestyle factors.
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Previous Laboratory Reports</h2>
          {reportsHistory.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No lab reports on file yet.</p>
          ) : (
            <div className="space-y-3">
              {reportsHistory.map((rep) => {
                const reviewCount = rep.results.filter(r => r.status === 'review').length;
                return (
                  <div
                    key={rep.id}
                    onClick={() => {
                      setCurrentReport(rep);
                      setActiveTab('analyzer');
                    }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-brand-300 transition cursor-pointer bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{rep.report_type}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {rep.lab_name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{rep.report_date} • {rep.results.length} markers</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {reviewCount > 0 ? (
                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full">
                          {reviewCount} for Review
                        </span>
                      ) : (
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                          Within Range
                        </span>
                      )}
                      <span className="text-xs font-semibold text-brand-600 flex items-center gap-0.5">
                        View <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ANALYZER TAB */}
      {activeTab === 'analyzer' && (
        <div className="space-y-6">
          
          {/* Upload & Sample Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Upload File Card */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload Laboratory Document</h3>
                <p className="text-xs text-slate-500">Supports PDF, PNG, or JPG (max 15MB)</p>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-3">
                <label className="border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100/70 transition">
                  <UploadCloud className="w-8 h-8 text-brand-600" />
                  <span className="text-xs font-semibold text-slate-700 text-center">
                    {file ? file.name : 'Click or drag your lab report here'}
                  </span>
                  <span className="text-[11px] text-slate-400">PDF, JPG, or PNG</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>

                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!file || loading}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Reading & Interpreting Values...</span>
                    </>
                  ) : (
                    <span>Analyze Uploaded Report</span>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Demo Sample Selector */}
            <div className="lg:col-span-5 bg-gradient-to-br from-brand-50 to-sky-50 rounded-2xl p-6 border border-brand-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 mb-1">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>Instant Demo Lab Panels</span>
                </div>
                <p className="text-xs text-slate-600">
                  Try the analyzer instantly using realistic sample test panels:
                </p>
              </div>

              <div className="space-y-2">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleRunSample(s.id)}
                    disabled={loading}
                    className="w-full text-left p-2.5 rounded-xl bg-white border border-brand-200 hover:border-brand-400 text-xs font-medium text-slate-800 hover:bg-slate-50 transition shadow-xs flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">{s.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-slate-500 block text-center">
                Pre-calibrated reference intervals extracted from lab standards.
              </span>
            </div>

          </div>

          {/* Current Report Display */}
          {currentReport && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block">
                    Report Analysis
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    {currentReport.report_type}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Laboratory: {currentReport.lab_name} • Date: {currentReport.report_date}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold border border-slate-200">
                    OCR Confidence: {currentReport.ocr_confidence}%
                  </span>
                </div>
              </div>

              {/* Low confidence warning if document is blurry */}
              {currentReport.is_low_confidence && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">OCR Read Notice:</strong> Some information could not be read reliably from this document. Please verify all laboratory values against your original printed physical report.
                  </div>
                </div>
              )}

              {/* Overall Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1">
                <span className="font-bold text-slate-900 block">Report Overview:</span>
                <p>{currentReport.overall_summary}</p>
              </div>

              <CareRecommendations
                flaggedTests={currentReport.results.filter((result) => result.status === 'review').map((result) => result.test_name)}
              />

              {/* Structured Results Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Test Name</th>
                      <th className="p-3.5">Reported Result</th>
                      <th className="p-3.5">Laboratory Reference Range</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentReport.results.map((res) => {
                      const isExpanded = expandedTestId === res.id;
                      return (
                        <React.Fragment key={res.id}>
                          <tr className={`hover:bg-slate-50 transition ${res.status === 'review' ? 'bg-amber-50/30' : ''}`}>
                            <td className="p-3.5 font-bold text-slate-900">{res.test_name}</td>
                            <td className="p-3.5 font-semibold text-slate-800">
                              {res.result_value} {res.unit}
                            </td>
                            <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                              {res.reference_range}
                            </td>
                            <td className="p-3.5">
                              {res.status === 'review' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  🟡 Review
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  🟢 Within Range
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => setExpandedTestId(isExpanded ? null : res.id)}
                                className="text-xs font-semibold text-brand-600 hover:text-brand-800 inline-flex items-center gap-0.5"
                              >
                                <span>{isExpanded ? 'Hide' : 'Explain'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Plain English Detail Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50">
                              <td colSpan={5} className="p-4 space-y-3">
                                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
                                  <div>
                                    <span className="font-bold text-slate-900 block mb-0.5">What is this test?</span>
                                    <p className="text-slate-600 leading-relaxed">{res.test_explanation}</p>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                    <div>
                                      <span className="font-bold text-slate-900 block mb-0.5">General Interpretation:</span>
                                      <p className="text-slate-600">{res.general_interpretation}</p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 block mb-0.5">Suggested Next Step:</span>
                                      <p className="text-slate-600">{res.suggested_next_step}</p>
                                    </div>
                                  </div>

                                  {res.possible_reasons?.length > 0 && (
                                    <div className="pt-2 border-t border-slate-100">
                                      <span className="font-bold text-slate-900 block mb-1">
                                        Possible Factors & Considerations:
                                      </span>
                                      <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                                        {res.possible_reasons.map((reason, i) => (
                                          <li key={i}>{reason}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Educational Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500 italic space-y-1">
                <p>
                  *Important Note on Reference Ranges: MedScan AI prioritizes the reference ranges printed directly on your specific laboratory report because normal ranges vary by laboratory method, equipment, age, and individual physiology.
                </p>
                <p>
                  A value outside a reference interval does not by itself diagnose a condition. Always discuss your laboratory results with your doctor in complete clinical context.
                </p>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
