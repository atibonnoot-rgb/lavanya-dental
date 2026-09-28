import React, { useState } from 'react';
import { 
  Calendar, 
  ShieldCheck, 
  User, 
  Menu,
  X,
  Phone,
  LayoutDashboard
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import clinicLogo from '../assets/logo.png';

interface HeaderProps {
  onNavigateTab: (tabId: string) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateTab, activeTab }) => {
  const { 
    currentRole, 
    setCurrentRole, 
    setShowBookingModal, 
    clinicSettings
  } = useClinic();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Treatments' },
    { id: 'why-us', label: 'Why Us' },
    { id: 'doctors', label: 'Specialists' },
    { id: 'gallery', label: 'Smile Gallery' },
    { id: 'areas-served', label: 'Areas Served' },
    { id: 'faq', label: 'FAQs' },
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
            Open Now
          </span>
          <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] sm:text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            HIPAA &amp; GDPR Certified
          </span>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-20 gap-3">
          {/* Logo & Brand Lockup */}
          <div
            className="flex flex-col items-center justify-center cursor-pointer min-w-0 shrink group py-1 select-none"
            onClick={() => onNavigateTab('home')}
          >
            <div className="flex items-center justify-center">
              <img
                src={clinicLogo}
                alt="Lavanya Dental Clinic"
                className="h-14 sm:h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <span className="text-[10px] sm:text-[11.5px] font-black tracking-[0.25em] text-[#0f2d59] uppercase font-sans text-center leading-tight mt-0.5">
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

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Phone */}
            <a
              href="tel:9885611128"
              aria-label="Call 9885611128"
              title="Call Lavanya Dental: 9885611128"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-sm transition-all duration-200 active:scale-95 shrink-0"
            >
              <Phone className="w-4 h-4 shrink-0" />
            </a>

            {/* Book Now */}
            <button
              onClick={() => {
                if (currentRole !== 'patient') setCurrentRole('patient');
                setShowBookingModal(true);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.97] shrink-0 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Book Now</span>
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-colors shrink-0 flex items-center justify-center"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Hamburger Dropdown */}
      {mobileMenuOpen && (
        <div className="bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-4 shadow-xl">

          {/* Quick Actions section */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              Quick Actions
            </p>

            {/* Patient Portal */}
            <button
              onClick={() => {
                setCurrentRole('patient');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                currentRole === 'patient'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Patient Portal</span>
            </button>

            {/* Admin Panel — directly opens login page */}
            <button
              onClick={() => {
                setCurrentRole('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border bg-white text-slate-600 border-slate-200 hover:border-slate-800 hover:bg-slate-900 hover:text-white transition-all group"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Admin Panel</span>
            </button>
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
