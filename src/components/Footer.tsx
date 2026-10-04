import React from 'react';
import { 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Award, 
  CheckCircle2 
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import clinicLogo from '../assets/logo.png';
import clinicLogoWebP from '../assets/logo.webp';

export const Footer: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { setShowEmergencyModal, setShowBookingModal, clinicSettings, setCurrentRole } = useClinic();
  const { hours } = clinicSettings;
  const dayLabels: [keyof typeof hours, string][] = [
    ['monday', 'Monday'],
    ['tuesday', 'Tuesday'],
    ['wednesday', 'Wednesday'],
    ['thursday', 'Thursday'],
    ['friday', 'Friday'],
    ['saturday', 'Saturday'],
    ['sunday', 'Sunday'],
  ];

  const formatTimeSlot = (timeStr?: string) => {
    if (!timeStr) return '';
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <footer className="bg-slate-950 text-slate-300 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-12">
        
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          
          {/* Col 1: Brand & Credentials (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex flex-col items-start gap-1 cursor-pointer" onClick={() => onNavigateTab('home')}>
              <div className="bg-white px-5 py-3 rounded-2xl shadow-sm inline-flex flex-col items-center border border-slate-200/60 select-none">
                <picture>
                  <source srcSet={clinicLogoWebP} type="image/webp" />
                  <img 
                    src={clinicLogo} 
                    alt="Lavanya Dental Clinic" 
                    width={244}
                    height={98}
                    className="h-14 sm:h-16 md:h-12 w-auto object-contain" 
                  />
                </picture>
                <span className="text-[10.5px] sm:text-[12px] font-black tracking-[0.25em] text-[#0f2d59] uppercase font-sans text-center mt-1.5 leading-tight">
                  DENTAL CLINIC
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 font-medium">Comprehensive Dental Surgery & Aesthetics</p>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Dedicated to pain-free, biological dentistry supported by 3D computer navigation, digital smile simulations, and instant clinician mobile coordination.
            </p>

            <div className="flex items-center gap-3 pt-2 text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                HIPAA & GDPR Compliant
              </span>
              <span>•</span>
              <span className="text-slate-300">ADA Accredited</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-slate-300">
              <li><button onClick={() => onNavigateTab('home')} className="hover:text-white transition-colors">Clinic Home</button></li>
              <li><button onClick={() => onNavigateTab('services')} className="hover:text-white transition-colors">Treatments</button></li>
              <li><button onClick={() => onNavigateTab('why-us')} className="hover:text-white transition-colors">Why Choose Us</button></li>
              <li><button onClick={() => onNavigateTab('doctors')} className="hover:text-white transition-colors">Specialist Dentists</button></li>
              <li><button onClick={() => onNavigateTab('gallery')} className="hover:text-white transition-colors">Smile Transformations</button></li>
              <li><button onClick={() => onNavigateTab('areas-served')} className="hover:text-white transition-colors">Areas We Serve</button></li>
              <li><button onClick={() => onNavigateTab('faq')} className="hover:text-white transition-colors">Hyderabad Dental FAQs</button></li>
              <li><button onClick={() => onNavigateTab('patient-portal')} className="hover:text-white transition-colors">My Appointments</button></li>
              <li><button onClick={() => onNavigateTab('care-guides')} className="hover:text-white transition-colors">Post-Op Care Guides</button></li>
            </ul>
          </div>

          {/* Col 3: Hours & Emergency (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Operating Hours</h4>
            <ul className="space-y-1.5 text-slate-300">
              {dayLabels.map(([key, label]) => {
                const day = (hours && hours[key]) ? hours[key] : { open: true, start: key === 'sunday' ? '11:00' : '10:30', end: key === 'sunday' ? '13:00' : '20:30' };
                return (
                  <li key={key} className="flex justify-between gap-2">
                    <span className="capitalize">{label}:</span>
                    <strong className={`font-normal ${day?.open ? 'text-slate-200' : 'text-rose-400'}`}>
                      {day?.open ? `${formatTimeSlot(day.start)} – ${formatTimeSlot(day.end)}` : 'Closed'}
                    </strong>
                  </li>
                );
              })}
            </ul>

            <div className="pt-2">
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="text-rose-400 hover:text-rose-300 font-bold block transition-colors"
              >
                🚨 24/7 Dental Emergency Triage Hotline
              </button>
            </div>
          </div>

          {/* Col 4: Location & Contact (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Clinic Location</h4>
            <div className="space-y-2 text-slate-300">
              <a 
                href="https://maps.app.goo.gl/6xQioN2UgJ4wPccJ9" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-start gap-2 hover:text-teal-300 transition-colors group"
                title="View Lavanya Dental Clinic on Google Maps"
              >
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span>{clinicSettings.address}</span>
              </a>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{clinicSettings.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{clinicSettings.email}</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright & legal compliance statement */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-300">
          <p>© {new Date().getFullYear()} {clinicSettings.clinicName} — Clinic & Appointment Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>HIPAA Notice of Privacy Practices</span>
            <span>•</span>
            <span>GDPR Data Protection</span>
            <span>•</span>
            <span>Encrypted Relational Storage (AES-256)</span>
            <span>•</span>
            <button
              onClick={() => setCurrentRole('admin')}
              className="text-slate-300 hover:text-white transition-colors text-[10px] cursor-pointer underline underline-offset-2"
              title="Staff Login"
            >
              Staff Login
            </button>
            {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
              <>
                <span>•</span>
                <a
                  href="#billing"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors text-[10px] cursor-pointer font-bold inline-flex items-center gap-1"
                  title="Open Localhost Bill Generator"
                >
                  🧾 Local Bill Generator
                </a>
              </>
            )}
          </div>
        </div>

        {/* Developer Credit & Availability Badge */}
        <div className="pt-4 flex justify-center pb-2">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all text-[11px] text-slate-300 shadow-sm backdrop-blur-xs">
            <span className="flex items-center gap-1.5">
              <span>⚡</span>
              <span>Engineered by <span className="text-slate-200 font-medium">Aditya Chikatamalla</span></span>
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300">Available for hire</span>
              <a 
                href="tel:7396561933" 
                className="text-emerald-400 hover:text-emerald-300 font-mono font-medium transition-colors hover:underline tracking-tight"
                title="Call Aditya Chikatamalla"
              >
                7396561933
              </a>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
