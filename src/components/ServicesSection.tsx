import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  Tag, 
  HelpCircle 
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { ServiceCategory } from '../types';

export const ServicesSection: React.FC = () => {
  const { services, setShowBookingModal, setBookingPreselectedServiceId } = useClinic();
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

        {/* Services Grid */}
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

                {/* Clinical Recommendations */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Ideal Candidate For:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {(Array.isArray(service.recommendedFor) ? service.recommendedFor : []).map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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

      </div>
    </section>
  );
};
