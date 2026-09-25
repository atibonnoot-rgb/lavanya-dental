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

export const Footer: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { setShowEmergencyModal, setShowBookingModal, clinicSettings } = useClinic();
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

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-12">
        
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          
          {/* Col 1: Brand & Credentials (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex flex-col items-start gap-1 cursor-pointer" onClick={() => onNavigateTab('home')}>
              <div className="bg-white px-5 py-3 rounded-2xl shadow-sm inline-flex flex-col items-center border border-slate-200/60 select-none">
                <img 
                  src={clinicSettings?.logoUrl?.trim() || clinicLogo || '/logo.png?v=2'} 
                  alt="Lavanya Dental Clinic" 
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('logo.png')) {
                      target.src = '/logo.png?v=2';
                    }
                  }}
                  className="h-10 sm:h-12 w-auto object-contain" 
                />
                <span className="text-[10.5px] sm:text-[12px] font-black tracking-[0.25em] text-[#0f2d59] uppercase font-sans text-center mt-1.5 leading-tight">
                  DENTAL CLINIC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Comprehensive Dental Surgery & Aesthetics</p>
            </div>

            <p className="text-slate-400 leading-relaxed">
              Dedicated to pain-free, biological dentistry supported by 3D computer navigation, digital smile simulations, and instant clinician mobile coordination.
            </p>

            <div className="flex items-center gap-3 pt-2 text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                HIPAA & GDPR Compliant
              </span>
              <span>•</span>
              <span className="text-slate-400">ADA Accredited</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigateTab('home')} className="hover:text-white transition-colors">Clinic Home</button></li>
              <li><button onClick={() => onNavigateTab('services')} className="hover:text-white transition-colors">Treatments & Pricing</button></li>
              <li><button onClick={() => onNavigateTab('doctors')} className="hover:text-white transition-colors">Specialist Faculty</button></li>
              <li><button onClick={() => onNavigateTab('gallery')} className="hover:text-white transition-colors">Smile Transformations</button></li>
              <li><button onClick={() => onNavigateTab('patient-portal')} className="hover:text-white transition-colors">My Appointments</button></li>
              <li><button onClick={() => onNavigateTab('care-guides')} className="hover:text-white transition-colors">Post-Op Care Guides</button></li>
            </ul>
          </div>

          {/* Col 3: Hours & Emergency (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Operating Hours</h4>
            <ul className="space-y-1.5 text-slate-400">
              {dayLabels.map(([key, label]) => {
                const day = (hours && hours[key]) ? hours[key] : { open: key !== 'sunday', start: '08:00', end: '18:00' };
                return (
                  <li key={key} className="flex justify-between gap-2">
                    <span className="capitalize">{label}:</span>
                    <strong className={`font-normal ${day?.open ? 'text-slate-200' : 'text-rose-400'}`}>
                      {day?.open ? `${day.start} – ${day.end}` : 'Closed'}
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
            <div className="space-y-2 text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>{clinicSettings.address}</span>
              </p>
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
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} {clinicSettings.clinicName} — Clinic & Appointment Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>HIPAA Notice of Privacy Practices</span>
            <span>•</span>
            <span>GDPR Data Protection</span>
            <span>•</span>
            <span>Encrypted Relational Storage (AES-256)</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
