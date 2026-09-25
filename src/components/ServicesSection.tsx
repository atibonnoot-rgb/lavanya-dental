import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  UserCheck,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const ServicesSection: React.FC = () => {
  const { services, isLoading, setShowBookingModal, setBookingPreselectedServiceId } = useClinic();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Treatments' },
    { id: 'Preventive', label: 'Preventive & Hygiene' },
    { id: 'Cosmetic', label: 'Cosmetic & Veneers' },
    { id: 'Orthodontics', label: 'Clear Aligners' },
    { id: 'Surgical & Implants', label: '3D Implants' },
    { id: 'Emergency & Endodontics', label: 'Emergency & Root Canal' },
  ];

  const filteredServices = services.filter(s => {
    if (selectedCategory === 'ALL') return true;
    return s.category === selectedCategory;
  });

  const handleBookService = (serviceId: string) => {
    setBookingPreselectedServiceId(serviceId);
    setShowBookingModal(true);
  };

  return (
    <section id="services" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Comprehensive Clinical Excellence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
            Specialized Dental Services
          </h2>
          <p className="text-slate-600 text-base">
            Every procedure is planned using 3D digital imaging and computer guidance. Consultation fees are discussed at the clinic.
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-slate-50 rounded-3xl p-6 border border-slate-200 animate-pulse">
                <div className="h-5 bg-slate-200 rounded-lg w-1/3 mb-4" />
                <div className="h-5 bg-slate-200 rounded-lg w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded-lg w-full mb-1" />
                <div className="h-3 bg-slate-100 rounded-lg w-5/6 mb-6" />
                <div className="h-3 bg-slate-100 rounded-lg w-full mb-1" />
                <div className="h-3 bg-slate-100 rounded-lg w-2/3 mb-6" />
                <div className="h-10 bg-slate-200 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-slate-700">No services in this category yet.</p>
            <p className="text-xs mt-1">Services are managed via the admin panel.</p>
          </div>
        ) : (
          /* Services Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => (
              <div
                key={service.id}
                className="bg-slate-50/70 hover:bg-white rounded-3xl p-6 border border-slate-200/90 hover:border-teal-400 hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                      {service.category}
                    </span>
                    {service.popular && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                        Most Requested
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Key indicators: duration, insurance */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{service.durationMinutes || 30} mins visit</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      <span>Insurance: {service.insuranceCovered || '100% Covered'}</span>
                    </div>
                  </div>

                  {/* ── Ideal Candidate For ── */}
                  {Array.isArray(service.recommendedFor) && service.recommendedFor.filter(r => r.trim() !== '').length > 0 && (
                    <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                          Ideal Candidate For
                        </span>
                      </div>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {service.recommendedFor.filter(r => r.trim() !== '').map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Booking Trigger */}
                <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-teal-700 font-semibold bg-teal-50 border border-teal-200 px-2.5 py-1.5 rounded-xl">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Pay at Clinic</span>
                  </div>

                  <button
                    onClick={() => handleBookService(service.id)}
                    className="inline-flex items-center gap-1.5 bg-slate-900 group-hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm group-hover:shadow-teal-700/20 active:scale-95"
                  >
                    <span>Book Slot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
