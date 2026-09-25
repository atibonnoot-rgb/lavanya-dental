import React from 'react';
import { 
  Award, 
  Star, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const DoctorsSection: React.FC = () => {
  const { doctors, setShowBookingModal, setBookingPreselectedDoctorId } = useClinic();

  const handleBookWithDoctor = (docId: string) => {
    setBookingPreselectedDoctorId(docId);
    setShowBookingModal(true);
  };

  const availableDoctors = doctors.filter(doc => doc.isAvailableToday);

  return (
    <section id="doctors" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200">
            <Award className="w-3.5 h-3.5" />
            <span>Board-Certified Dental Faculty</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
            Meet Your Clinical Care Team
          </h2>
          <p className="text-slate-600 text-base">
            Trained at world-renowned institutions with a shared commitment to minimally invasive patient comfort.
          </p>
        </div>

        {/* Doctors Grid */}
        {doctors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto shadow-sm">
            <p className="text-slate-700 text-sm font-semibold">No doctors registered yet.</p>
            <p className="text-xs text-slate-500 mt-1">Please add doctor profiles in the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map(doc => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Photo with Overlay Rating */}
                  <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-slate-100">
                    <img
                      src={doc.photoUrl}
                      alt={doc.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>

                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs rounded-full px-2.5 py-1 flex items-center gap-1 shadow-md">
                      <Star className="w-3 h-3 text-amber-500 fill-current" />
                      <span className="text-xs font-bold text-slate-900">{doc.rating ?? 4.9}</span>
                      <span className="text-[10px] text-slate-500">({doc.reviewsCount ?? 120})</span>
                    </div>

                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                      {(doc.experienceYears === 14 || doc.id === 'doc-1') ? 25 : (doc.experienceYears || 25)} Years Exp
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                      <p className="text-xs font-semibold text-teal-700 mt-0.5">{doc.title}</p>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {doc.bio}
                    </p>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>Hours: {doc.workingHours?.start || '08:30'} – {doc.workingHours?.end || '17:00'}</span>
                      </p>
                      {doc.isAvailableToday ? (
                        <p className="flex items-center gap-1.5 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Accepting Patients Today</span>
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5 text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>Next Available Tomorrow</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Book Button */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleBookWithDoctor(doc.id)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book with {doc.name.split(' ')[1] || doc.name}</span>
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
