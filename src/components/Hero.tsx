import React, { useState } from 'react';
import { 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Star, 
  CheckCircle2, 
  ArrowRight,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const Hero: React.FC<{ onExploreServices: () => void }> = ({ onExploreServices }) => {
  const { 
    services, 
    doctors, 
    clinicSettings,
    setShowBookingModal, 
    setBookingPreselectedServiceId, 
    setBookingPreselectedDoctorId 
  } = useClinic();

  const [selectedService, setSelectedService] = useState<string>(services[0]?.id || '');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');

  const handleQuickBook = () => {
    if (selectedService) setBookingPreselectedServiceId(selectedService);
    if (selectedDoctor) setBookingPreselectedDoctorId(selectedDoctor);
    setShowBookingModal(true);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-teal-50/50 via-slate-50/30 to-white pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-100">
      {/* Background aesthetic decorative shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-teal-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-100/30 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading, Subtitle & Quick Booking Engine */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Accreditation Chip */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-teal-200/80 shadow-xs text-xs font-semibold text-teal-800">
              <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
              <span>Next-Gen Direct Scheduling Platform</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-normal">Real-Time Doctor Availability</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 font-display leading-[1.15]">
              World-Class Dental Care, <br />
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 bg-clip-text text-transparent">
                Directly On Your Schedule.
              </span>
            </h1>

            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
              Experience modern, pain-free dentistry backed by 3D computer navigation and digital aligners. Book directly with board-certified specialists and receive instant confirmation in seconds.
            </p>

            {/* Quick-Booking Interactive Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-lg shadow-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Direct Online Booking</h2>
                    <p className="text-xs text-slate-500">Live clinician calendar sync & 2-way mobile notification</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Slots Open This Week</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Service Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Dental Service
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-hidden transition-all"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Specialist
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-hidden transition-all"
                  >
                    <option value="">Any Available Specialist (Fastest)</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name.split(',')[0]} – {d.specialty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3 text-xs text-slate-500 w-full sm:w-auto">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    HIPAA 2FA Verified
                  </span>
                  <span>•</span>
                  <span>No waiting list</span>
                </div>

                <button
                  onClick={handleQuickBook}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-teal-700/20 active:scale-[0.98]"
                >
                  <span>Select Date & Available Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Trust highlights checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-600 font-medium">Digital 3D Intraoral Scanning</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-600 font-medium">Painless Laser & Micro-Drill</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-600 font-medium">Direct Doctor Mobile Alerts</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Clinic Showcase & Doctor Card Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-4/5 sm:aspect-square lg:aspect-4/5 group">
              <img
                src={localStorage.getItem('auradental_hero_image') || clinicSettings.logoUrl || '/clinic-hero.png'}
                alt="Lavanya Dental Clinic interior with treating dentist and modern suite"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

              {/* Floating Verified Patient Review Badge */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-slate-100 flex items-center gap-3 max-w-xs">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  ★ 4.9
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">Top-Rated Dental Practice</p>
                  <p className="text-[10px] text-slate-500">1,240+ verified patient reviews</p>
                </div>
              </div>

              {/* Floating Live Scheduling Stat */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md text-white rounded-2xl p-4 border border-slate-700/60 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-xs font-semibold text-emerald-300">Live Clinician Status</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Today, Sep 18</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400">Next open slot:</span>{' '}
                    <span className="font-semibold text-white">Tomorrow 10:15 AM</span>
                  </div>
                  <button 
                    onClick={onExploreServices}
                    className="text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1 hover:underline"
                  >
                    View All Services <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
