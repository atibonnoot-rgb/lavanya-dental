import React, { useState } from 'react';
import { 
  Calendar, 
  ShieldCheck, 
  User, 
  Stethoscope, 
  Building2, 
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

interface HeaderProps {
  onNavigateTab: (tabId: string) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateTab, activeTab }) => {
  const { 
    currentRole, 
    setCurrentRole, 
    setShowBookingModal, 
    setShowEmergencyModal,
    unreadCountForSelectedDoctor,
    doctors,
    selectedDoctorId,
    setSelectedDoctorId,
    clinicSettings
  } = useClinic();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services & Pricing' },
    { id: 'doctors', label: 'Dental Specialists' },
    { id: 'gallery', label: 'Before & After' },
    { id: 'patient-portal', label: 'My Appointments' },
    { id: 'care-guides', label: 'Post-Op Care' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top strip — Open Now & HIPAA badge */}
      <div className="bg-slate-900 text-slate-300 py-1 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-teal-400 font-medium text-[11px] sm:text-xs">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            {clinicSettings?.hours?.monday?.open ? 'Open Now' : 'Open Now'}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] sm:text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            HIPAA &amp; GDPR Certified
          </span>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          {/* Logo & Brand Lockup */}
          <div className="flex flex-col items-start justify-center cursor-pointer min-w-0 shrink group py-1" onClick={() => onNavigateTab('home')}>
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Lavanya Dental Clinic" 
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
              />
            </div>
            <span className="text-[9.5px] sm:text-[11px] font-black tracking-[0.22em] text-[#0f2d59] uppercase -mt-0.5 ml-0.5 font-sans select-none">
              DENTAL CLINIC
            </span>
          </div>

          {/* Desktop Nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => onNavigateTab(link.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === link.id && currentRole === 'patient'
                    ? 'text-teal-700 bg-teal-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Header Right Action Area: Book Now button + Hamburger Menu toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Book Now Button — Always visible in frame with text & icon */}
            <button
              onClick={() => {
                if (currentRole !== 'patient') setCurrentRole('patient');
                setShowBookingModal(true);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-teal-600/20 transition-all active:scale-[0.97] shrink-0 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Book Now</span>
            </button>

            {/* Hamburger menu button — Always visible in top header frame */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-colors shrink-0 flex items-center justify-center"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Hamburger Menu Dropdown (contains Patient / Clinician / Admin tabs & nav links) */}
      {mobileMenuOpen && (
        <div className="bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-4 shadow-xl">
          {/* Persona / Portal Role Switcher */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2">
              Select Portal / View
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { 
                  setCurrentRole('patient'); 
                  setMobileMenuOpen(false); 
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  currentRole === 'patient' 
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Patient</span>
              </button>

              <button
                onClick={() => { 
                  setCurrentRole('doctor'); 
                  setMobileMenuOpen(false); 
                }}
                className={`relative flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  currentRole === 'doctor' 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Stethoscope className="w-4 h-4 shrink-0" />
                <span>Clinician</span>
                {unreadCountForSelectedDoctor > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1 border border-white"></span>
                )}
              </button>

              <button
                onClick={() => { 
                  setCurrentRole('admin'); 
                  setMobileMenuOpen(false); 
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  currentRole === 'admin' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Admin</span>
              </button>
            </div>

            {/* Clinician Profile Selector (if Clinician active) */}
            {currentRole === 'doctor' && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <label className="block text-xs font-semibold text-emerald-900 mb-1">
                  Clinician Profile:
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full text-xs bg-white border border-emerald-300 text-emerald-900 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3">
              Navigation
            </p>
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigateTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === link.id && currentRole === 'patient'
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

