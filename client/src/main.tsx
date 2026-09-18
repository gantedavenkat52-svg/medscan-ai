import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { MobileNav } from './components/MobileNav.js';
import { EmergencyBanner } from './components/EmergencyBanner.js';
import { DisclaimerFooter } from './components/DisclaimerFooter.js';
import { LandingPage } from './pages/LandingPage.js';
import { AuthModal } from './pages/AuthModal.js';
import { Dashboard } from './pages/Dashboard.js';
import { DailyHealthReport } from './pages/DailyHealthReport.js';
import { FindCare } from './pages/FindCare.js';
import { HealthTimeline } from './pages/HealthTimeline.js';
import { LabReportAnalyzer } from './pages/LabReportAnalyzer.js';
import { SymptomChecker } from './pages/SymptomChecker.js';
import { ProfilePage } from './pages/ProfilePage.js';
import './index.css';

const PlaceholderPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <section className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
    <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
  </section>
);

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [authOpen, setAuthOpen] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">Loading MedScan AI...</div>;
  }

  if (!isAuthenticated) {
    return (
      <>
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} onOpenAuth={() => setAuthOpen(true)} />
        <LandingPage onOpenAuth={() => setAuthOpen(true)} onExploreDemo={() => setAuthOpen(true)} />
        <DisclaimerFooter />
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  const page = {
    dashboard: <Dashboard onNavigate={setCurrentTab} />,
    symptoms: <SymptomChecker />,
    labs: <LabReportAnalyzer />,
    daily: <DailyHealthReport />,
    timeline: <HealthTimeline />,
    care: <FindCare />,
    assistant: <PlaceholderPage title="MedScan Assistant" description="The educational assistant service is available through the API. A dedicated conversation view is not included in this build yet." />,
    profile: <ProfilePage />,
    admin: <PlaceholderPage title="Admin Console" description="Administrative endpoints are connected. A dedicated admin console is not included in this build yet." />
  }[currentTab as 'dashboard' | 'symptoms' | 'labs' | 'daily' | 'timeline' | 'care' | 'assistant' | 'profile' | 'admin'] || <Dashboard onNavigate={setCurrentTab} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} onOpenAuth={() => setAuthOpen(true)} />
      <EmergencyBanner />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{page}</main>
      <DisclaimerFooter />
      <MobileNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  </React.StrictMode>
);