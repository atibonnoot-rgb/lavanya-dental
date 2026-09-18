import React, { useState } from 'react';
import { 
  Phone, 
  Calendar, 
  ShieldCheck, 
  User, 
  Stethoscope, 
  Building2, 
  AlertTriangle,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { UserRole } from '../types';

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
      {/* Top strip — Open Today only on mobile, HIPAA badge on desktop */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-teal-400 font-medium">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            {clinicSettings.hours.monday.open
              ? `Open Today: ${clinicSettings.hours.monday.start} – ${clinicSettings.hours.monday.end}`
              : 'Closed Today'}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            HIPAA &amp; GDPR Certified • TLS 1.3 / AES-256
          </span>
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="hidden sm:inline-flex items-center gap-1 text-rose-300 hover:text-rose-200 font-medium transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Emergency: (800) 555-DENT</span>
          </button>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateTab('home')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20 overflow-hidden shrink-0">
              {clinicSettings.logoUrl ? (
                <img src={clinicSettings.logoUrl} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C8.5 2 5.5 4.5 5.5 8c0 2.5 1 4.5 2 7 1 2.5 2.5 7 4.5 7s3.5-4.5 4.5-7c1-2.5 2-4.5 2-7 0-3.5-3-6-6.5-6zm0 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-xl font-bold tracking-tight text-slate-900 font-display">{clinicSettings.clinicName}</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-700 rounded-md border border-teal-200 shrink-0">
                  CLINIC &amp; SURGERY
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">{clinicSettings.tagline}</p>
            </div>
          </div>

          {/* Desktop Nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => onNavigateTab(link.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === link.id && currentRole === 'patient'
                    ? 'text-teal-700 bg-teal-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Role selector & CTA */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Persona Switcher — hidden on mobile screens */}
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl items-center border border-slate-200">
              <button
                onClick={() => setCurrentRole('patient')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === 'patient'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Patient Booking"
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient</span>
              </button>

              <button
                onClick={() => setCurrentRole('doctor')}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === 'doctor'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Doctor Portal"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Clinician</span>
                {unreadCountForSelectedDoctor > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-1 right-1"></span>
                )}
              </button>

              <button
                onClick={() => setCurrentRole('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === 'admin'
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Admin Panel"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Doctor Picker (shown if doctor role is active) */}
            {currentRole === 'doctor' && (
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="hidden sm:block text-xs bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg px-2 py-1.5 font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name.split(',')[0]}
                  </option>
                ))}
              </select>
            )}

            {/* Book Visit — icon only on mobile, full button on sm+ */}
            <button
              onClick={() => {
                if (currentRole !== 'patient') setCurrentRole('patient');
                setShowBookingModal(true);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-2.5 sm:px-4 py-2 rounded-xl text-sm font-semibold shadow-sm shadow-teal-600/20 transition-all active:scale-[0.97] shrink-0"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Book Visit</span>
            </button>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drop menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => {
                onNavigateTab(link.id);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {/* Role switcher in mobile menu */}
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-3 pt-1">Switch View</p>
            <div className="flex gap-2 px-3">
              <button
                onClick={() => { setCurrentRole('patient'); setMobileMenuOpen(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${currentRole === 'patient' ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                <User className="w-3.5 h-3.5" /> Patient
              </button>
              <button
                onClick={() => { setCurrentRole('doctor'); setMobileMenuOpen(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${currentRole === 'doctor' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                <Stethoscope className="w-3.5 h-3.5" /> Doctor
              </button>
              <button
                onClick={() => { setCurrentRole('admin'); setMobileMenuOpen(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${currentRole === 'admin' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                <Building2 className="w-3.5 h-3.5" /> Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
