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
import { TREATMENT_ICON_MAP } from './TreatmentIcons';
import { ReviewsSection } from './ReviewsSection';

export const ServicesSection: React.FC = () => {
  const { services, isLoading, setShowBookingModal, setBookingPreselectedServiceId } = useClinic();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Treatments' },
    { id: 'Oral & Maxillofacial Surgeries', label: 'Oral & Maxillofacial Surgeries' },
    { id: 'Preventive', label: 'Preventive & Hygiene' },
    { id: 'Cosmetic', label: 'Cosmetic & Aesthetics' },
    { id: 'Orthodontics', label: 'Aligners & Braces' },
    { id: 'Restorative', label: 'Bridges & Dentures' },
    { id: 'Surgical & Implants', label: 'Dental Implants & Extractions' },
    { id: 'Emergency & Endodontics', label: 'Root Canal & Emergency' },
  ];

  // Specific 12 treatments ordered exactly as in the reference image
  const TREATMENT_DISPLAY_ORDER = [
    { id: 'serv-aligner', name: 'Aligner' },
    { id: 'serv-dental-implants', name: 'Dental Implants' },
    { id: 'serv-root-canal', name: 'Root Canal' },
    { id: 'serv-bridges', name: 'Bridges' },
    { id: 'serv-braces', name: 'Braces' },
    { id: 'serv-dental-bonding', name: 'Dental Bonding' },
    { id: 'serv-tooth-extraction', name: 'Tooth Extraction' },
    { id: 'serv-teeth-whitening', name: 'Teeth Whitening' },
    { id: 'serv-dental-jewellery', name: 'Dental Jewellery' },
    { id: 'serv-complete-dentures', name: 'Complete Dentures' },
    { id: 'serv-dental-cleaning', name: 'Dental Cleaning and scaling' },
    { id: 'serv-dental-veneers', name: 'Dental Veneers' },
    { id: 'serv-oral-maxillofacial', name: 'Oral & Maxillofacial Surgeries' },
    { id: 'serv-fractures-jaw', name: 'Fractures of Jaw' },
    { id: 'serv-tumors-jaw', name: 'Tumors of Jaw' },
    { id: 'serv-jaw-defects', name: 'Jaw Defects' },
  ];

  const filteredServices = services.filter(s => {
    if (selectedCategory === 'ALL') return true;
    return s.category === selectedCategory;
  });

  const handleBookService = (serviceId: string) => {
    setBookingPreselectedServiceId(serviceId);
    setShowBookingModal(true);
  };

  const handleSelectTreatmentCard = (serviceId: string) => {
    setActiveHighlightId(serviceId);
    setSelectedCategory('ALL');
    const elem = document.getElementById(serviceId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div>
      {/* ══ DENTAL TREATMENTS OFFERED IN LAVANYA (Exact from Reference Image) ══ */}
      <section id="services-grid" className="pt-16 sm:pt-24 pb-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#064E3B] tracking-tight text-center mb-8 sm:mb-10 font-display">
            Dental Treatments Offered in Lavanya
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {TREATMENT_DISPLAY_ORDER.map(item => {
              const IconComp = TREATMENT_ICON_MAP[item.id];
              const isSelected = activeHighlightId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTreatmentCard(item.id)}
                  className={`group flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border transition-all duration-200 text-center ${
                    isSelected 
                      ? 'border-emerald-600 shadow-md shadow-emerald-900/10 ring-2 ring-emerald-600/20 bg-emerald-50/40' 
                      : 'border-slate-200/90 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/5'
                  }`}
                >
                  <div className="flex-1 flex items-center justify-center mb-3">
                    {IconComp ? (
                      <IconComp className="w-12 h-12 sm:w-14 sm:h-14 transition-transform duration-200 group-hover:scale-105" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold">
                        {item.name[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-[13px] font-semibold text-slate-800 group-hover:text-emerald-800 transition-colors leading-tight">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ PATIENT EXPERIENCES & FEEDBACK (Between the treatments grid and consultations) ══ */}
      <ReviewsSection />

      {/* ══ DETAILED TREATMENT INFORMATION & CONSULTATIONS ══ */}
      <section id="services" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Comprehensive Clinical Excellence</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
              Detailed Treatment Information & Consultations
            </h3>
            <p className="text-slate-600 text-sm sm:text-base">
              Every procedure is planned using 3D digital imaging and computer guidance. Book your dedicated consultation slot below.
            </p>
          </div>

        {/* Category Filter Chips */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setActiveHighlightId(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-900 text-white shadow-md'
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
            {filteredServices.map(service => {
              const IconComp = TREATMENT_ICON_MAP[service.id];
              const isHighlighted = activeHighlightId === service.id;

              return (
                <div
                  key={service.id}
                  id={service.id}
                  className={`relative bg-slate-50/70 hover:bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between group overflow-hidden ${
                    isHighlighted
                      ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-xl bg-white'
                      : 'border-slate-200/90 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/5'
                  }`}
                >
                  {/* Green Treatment Icon on the top right corner of the service block */}
                  {IconComp && (
                    <div className="absolute top-5 right-5 p-1 bg-emerald-50/70 rounded-2xl border border-emerald-100 shadow-xs group-hover:scale-110 group-hover:border-emerald-300 group-hover:shadow-md transition-all duration-300">
                      <IconComp className="w-12 h-12 sm:w-14 sm:h-14" />
                    </div>
                  )}

                  <div className="space-y-4 pr-16 sm:pr-20">
                    {/* Category & Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
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
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    {/* Key indicators: duration, insurance */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{service.durationMinutes || 30} mins visit</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Insurance: {service.insuranceCovered || 'Partial'}</span>
                      </div>
                    </div>

                    {/* ── Ideal Candidate For ── */}
                    {Array.isArray(service.recommendedFor) && service.recommendedFor.filter(r => r.trim() !== '').length > 0 && (
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
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
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Consultation at Clinic</span>
                    </div>

                    <button
                      onClick={() => handleBookService(service.id)}
                      className="inline-flex items-center gap-1.5 bg-slate-900 group-hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm group-hover:shadow-emerald-900/20 active:scale-95"
                    >
                      <span>Book Slot</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
    </div>
  );
};
