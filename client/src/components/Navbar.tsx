import React, { useState } from 'react';
import { 
  Activity, Stethoscope, FlaskConical, CalendarDays, 
  MapPin, MessageSquare, User, ShieldAlert, LogOut, Menu, X, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenAuth }) => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'symptoms', label: 'Symptom Checker', icon: Stethoscope },
    { id: 'labs', label: 'Lab Analyzer', icon: FlaskConical },
    { id: 'daily', label: 'Daily Report', icon: CalendarDays },
    { id: 'timeline', label: 'Health Timeline', icon: Activity },
    { id: 'care', label: 'Find Care', icon: MapPin },
    { id: 'assistant', label: 'MedScan Assistant', icon: MessageSquare },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  MedScan<span className="text-brand-600 font-black">AI</span>
                </span>
                <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-brand-200 uppercase tracking-wider">
                  MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block leading-none">
                Understand Your Health. Make Better Decisions.
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          {isAuthenticated ? (
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#doctor-search" className="hover:text-brand-600 transition">Find a Doctor</a>
              <a href="#care-services" className="hover:text-brand-600 transition">Care Services</a>
              <a href="#medscan-tools" className="hover:text-brand-600 transition">MedScan AI Tools</a>
            </div>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Admin button if role is admin */}
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      currentTab === 'admin'
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}

                {/* Profile button */}
                <button
                  onClick={() => handleNavClick('profile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    currentTab === 'profile'
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden md:inline font-medium">{user?.name || 'Profile'}</span>
                </button>

                {/* Logout */}
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={demoLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 hover:bg-brand-100 transition shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>One-Click Demo</span>
                </button>
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition shadow-sm"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drop-down drawer */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
