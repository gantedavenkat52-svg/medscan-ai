import React, { useState } from 'react';
import { Activity, ArrowRight, CalendarDays, CheckCircle2, Clock3, FileText, FlaskConical, HeartPulse, MapPin, Search, ShieldCheck, Sparkles, Stethoscope, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onExploreDemo }) => {
  const { demoLogin } = useAuth();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('Metropolis');
  const openDirectory = () => onOpenAuth('login');
  const handleDemoClick = async () => { try { await demoLogin(); } catch { onExploreDemo(); } };

  const careServices = [
    { icon: Stethoscope, title: 'Find Doctors', description: 'Browse nearby specialists and book available appointment slots.' },
    { icon: Video, title: 'Video Consultation', description: 'Choose doctors offering telehealth appointments for convenient care.' },
    { icon: FlaskConical, title: 'Book Lab Tests', description: 'Find diagnostic labs and request home sample collection.' },
    { icon: HeartPulse, title: 'Emergency Care', description: 'Locate hospitals with verified 24/7 emergency services.' }
  ];
  const healthTools = [
    { icon: Sparkles, label: 'AI Symptom Checker', text: 'Organize symptoms with conservative safety guidance.' },
    { icon: FileText, label: 'Lab Report Analyzer', text: 'Turn complex report values into plain-language context.' },
    { icon: CalendarDays, label: 'Daily Health Report', text: 'Track sleep, energy, hydration, and vitals over time.' }
  ];

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-900 selection:bg-brand-100 selection:text-brand-900">
      <section className="relative overflow-hidden bg-[#eaf7f7] border-b border-teal-100">
        <div className="absolute -right-28 -top-32 h-96 w-96 rounded-full bg-teal-200/35 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-amber-100/50 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-20 lg:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-800 mb-5"><ShieldCheck className="w-4 h-4" /> Trusted care discovery with MedScan AI</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.06] text-slate-950">Find the right care,<span className="block text-teal-700">with clarity.</span></h1>
            <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">Search nearby doctors, hospitals, and diagnostic labs, then use MedScan AI to understand your health information before your visit.</p>
          </div>
          <div id="doctor-search" className="relative mt-9 max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 p-3">
            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_auto] gap-2">
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white"><Search className="w-5 h-5 text-teal-700 shrink-0" /><span className="sr-only">Search doctors or specialties</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Doctor, specialty, or clinic" className="w-full text-sm outline-none placeholder:text-slate-400" /></label>
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white"><MapPin className="w-5 h-5 text-teal-700 shrink-0" /><span className="sr-only">Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or postcode" className="w-full text-sm outline-none placeholder:text-slate-400" /></label>
              <button onClick={openDirectory} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white hover:bg-teal-800 transition">Search care <ArrowRight className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-2 pt-3 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified directory data</span><span className="inline-flex items-center gap-1.5"><Clock3 className="w-3.5 h-3.5 text-emerald-600" /> Appointment slots shown clearly</span><span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Non-diagnostic by design</span></div>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-slate-600"><span className="font-semibold text-slate-700">Popular searches</span>{['Primary care', 'Cardiology', 'Dermatology', 'Lab tests'].map((item) => <button key={item} onClick={openDirectory} className="rounded-full border border-teal-200 bg-white/70 px-3 py-1.5 hover:border-teal-400 hover:text-teal-800 transition">{item}</button>)}</div>
        </div>
      </section>
      <section className="bg-white border-b border-slate-200"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6"><div className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-teal-700 mt-0.5" /><div><p className="text-sm font-bold">Safety-first guidance</p><p className="mt-1 text-xs text-slate-500">Urgent warning signs are surfaced early.</p></div></div><div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-teal-700 mt-0.5" /><div><p className="text-sm font-bold">Care close to you</p><p className="mt-1 text-xs text-slate-500">Doctors, hospitals, and labs in one place.</p></div></div><div className="flex items-start gap-3"><Activity className="w-5 h-5 text-teal-700 mt-0.5" /><div><p className="text-sm font-bold">Your health in context</p><p className="mt-1 text-xs text-slate-500">Keep reports and appointments together.</p></div></div></div></section>
      <section id="care-services" className="py-16 lg:py-20"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Care, your way</p><h2 className="mt-2 text-2xl sm:text-3xl font-extrabold">What do you need today?</h2></div><button onClick={openDirectory} className="text-sm font-bold text-teal-700 hover:text-teal-900">View all care <ArrowRight className="inline w-4 h-4" /></button></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{careServices.map(({ icon: Icon, title, description }) => <button key={title} onClick={openDirectory} className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg transition"><div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center"><Icon className="w-5 h-5" /></div><h3 className="mt-4 text-base font-bold">{title}</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-teal-700">Explore <ArrowRight className="w-3.5 h-3.5" /></span></button>)}</div></div></section>
      <section id="medscan-tools" className="py-16 bg-slate-950 text-white"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-10 items-center"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-300">The MedScan difference</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight">Make every doctor visit more useful.</h2><p className="mt-4 text-sm leading-relaxed text-slate-300">Understand symptoms, review lab reports, track daily health, and arrive with better questions for your clinician.</p><button onClick={handleDemoClick} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-teal-400 transition"><Sparkles className="w-4 h-4" /> Explore the demo <ArrowRight className="w-4 h-4" /></button></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{healthTools.map(({ icon: Icon, label, text }) => <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4"><Icon className="w-5 h-5 text-teal-300" /><h3 className="mt-5 text-sm font-bold">{label}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{text}</p></div>)}</div></div></section>
      <section className="py-10 bg-amber-50 border-b border-amber-100"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4"><p className="text-xs leading-relaxed text-slate-700"><strong>Important:</strong> MedScan AI provides educational health information, not diagnoses or prescriptions. For severe or worsening symptoms, contact local emergency services.</p><button onClick={() => onOpenAuth('register')} className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition">Create your free account <ArrowRight className="w-3.5 h-3.5" /></button></div></section>
    </div>
  );
};
