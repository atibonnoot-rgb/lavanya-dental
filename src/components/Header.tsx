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
      {/* Top strip — Open Today Status */}
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
          <span className="text-slate-400 text-xs font-medium">
            Lavanya Dental Care Pavilion
          </span>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand — Straightened & Cleaned */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => onNavigateTab('home')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20 overflow-hidden shrink-0">
              {clinicSettings.logoUrl ? (
                <img src={clinicSettings.logoUrl} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C8.5 2 5.5 4.5 5.5 8c0 2.5 1 4.5 2 7 1 2.5 2.5 7 4.5 7s3.5-4.5 4.5-7c1-2.5 2-4.5 2-7 0-3.5-3-6-6.5-6zm0 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-base sm:text-xl font-bold tracking-tight text-slate-900 font-display leading-tight">
                {clinicSettings.clinicName}
              </span>
              <p className="text-xs text-slate-500 leading-tight">{clinicSettings.tagline}</p>
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

          {/* Hamburger + Role selector & CTA */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Mobile / Tablet menu hamburger — positioned to the LEFT of the persona switcher */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Persona Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
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

            {/* Book Visit */}
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
        </div>
      )}
    </header>
  );
};
