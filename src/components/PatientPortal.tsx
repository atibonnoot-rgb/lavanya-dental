import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  HeartPulse, 
  RotateCcw, 
  Lock,
  X
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { POST_CARE_GUIDES } from '../data/mockData';
import { Appointment } from '../types';

export const PatientPortal: React.FC = () => {
  const { 
    doctors, 
    services, 
    findAppointmentByCodeOrPhone, 
    setShowBookingModal 
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchError, setSearchError] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Check if current browser session just booked an appointment
  useEffect(() => {
    try {
      const recentCode = sessionStorage.getItem('lavanya_recent_booking_code');
      if (recentCode) {
        const found = findAppointmentByCodeOrPhone(recentCode);
        if (found.length > 0) {
          setSelectedAppointment(found[0]);
          setSearchQuery(recentCode);
        }
      }
    } catch {}
  }, []);

  const [selectedCareGuideId, setSelectedCareGuideId] = useState<string>('guide-extraction');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchError('Please enter your confirmation code or registered mobile number.');
      return;
    }

    const cleanDigits = trimmed.replace(/\D/g, '');
    if (trimmed.length < 4 && cleanDigits.length < 10) {
      setSearchError('Please enter a full confirmation code (e.g. LD-1234) or 10-digit mobile number.');
      return;
    }

    const results = findAppointmentByCodeOrPhone(trimmed);
    if (results.length > 0) {
      setSelectedAppointment(results[0]);
      setSearchError('');
    } else {
      setSelectedAppointment(null);
      setSearchError(`No appointment found for "${trimmed}". Please verify your confirmation code or mobile number.`);
    }
  };

  const handleClearSelected = () => {
    setSelectedAppointment(null);
    setSearchQuery('');
    setSearchError('');
    try {
      sessionStorage.removeItem('lavanya_recent_booking_code');
    } catch {}
  };

  const currentDoctor = selectedAppointment 
    ? doctors.find(d => d.id === selectedAppointment.doctorId) 
    : null;

  const currentService = selectedAppointment 
    ? services.find(s => s.id === selectedAppointment.serviceId) 
    : null;

  const activeCareGuide = POST_CARE_GUIDES.find(g => g.id === selectedCareGuideId) || POST_CARE_GUIDES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Encrypted Patient Portal • Private Health Information</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
            My Appointments &amp; Recovery Records
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Look up your verified treatment schedule, doctor notes, and post-procedure recovery instructions.
          </p>
        </div>

        <button
          onClick={() => setShowBookingModal(true)}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Another Visit</span>
        </button>
      </div>

      {/* Appointment Lookup Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-teal-600" />
              Secure Appointment Lookup
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your booking confirmation code (e.g. <strong>LD-8921</strong>) or your 10-digit registered mobile number.
            </p>
          </div>

          {selectedAppointment && (
            <button
              onClick={handleClearSelected}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors self-start sm:self-auto"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock / Clear Records</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. LD-1234 or 9885611128"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchError) setSearchError('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0"
          >
            Find My Records
          </button>
        </form>

        {searchError && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Main Content Layout: Active Appointment Details & Post-Care Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 Columns: Selected Appointment Card */}
        <div className="lg:col-span-7 space-y-6">
          {selectedAppointment ? (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-md space-y-6 animate-in fade-in duration-200">
              
              {/* Header card with status badge */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                      {selectedAppointment.confirmationCode}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      selectedAppointment.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      selectedAppointment.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                      selectedAppointment.status === 'Rescheduled' ? 'bg-blue-100 text-blue-800' :
                      selectedAppointment.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      Status: {selectedAppointment.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900 mt-2">
                    {currentService?.name || 'Dental Consultation'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Booked on {new Date(selectedAppointment.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-semibold">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>{selectedAppointment.date} at {selectedAppointment.timeSlot}</span>
                  </div>
                </div>
              </div>

              {/* Doctor Details */}
              {currentDoctor && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <img
                    src={currentDoctor.photoUrl}
                    alt={currentDoctor.name}
                    className="w-14 h-14 rounded-2xl object-cover shadow-xs shrink-0"
                  />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900">{currentDoctor.name}</h4>
                    <p className="text-xs text-teal-700 font-medium">{currentDoctor.title}</p>
                    <p className="text-[11px] text-slate-500">{currentDoctor.degrees}</p>
                  </div>
                </div>
              )}

              {/* Reschedule notice if applicable */}
              {selectedAppointment.status === 'Rescheduled' && selectedAppointment.rescheduledTo && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                    Doctor Proposed Alternative Time
                  </span>
                  <p>
                    The doctor suggested moving your visit to <strong>{selectedAppointment.rescheduledTo.date} at {selectedAppointment.rescheduledTo.timeSlot}</strong>.
                  </p>
                </div>
              )}

              {/* Clinical Complaint & Medical History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Patient Complaint &amp; Pre-Visit Intake
                </h4>
                <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-700 space-y-2 border border-slate-200/60">
                  <p><strong>Primary Complaint:</strong> {selectedAppointment.primaryComplaint}</p>
                  <p><strong>Patient Name:</strong> {selectedAppointment.patientName}</p>
                  <p><strong>Phone:</strong> {selectedAppointment.patientPhone}</p>
                  {selectedAppointment.medicalHistory.hasAllergies && (
                    <p className="text-rose-600 font-semibold">
                      ⚠️ Allergy Alert: {selectedAppointment.medicalHistory.allergyDetails || 'Documented allergy'}
                    </p>
                  )}
                  {selectedAppointment.medicalHistory.hasHeartCondition && (
                    <p className="text-amber-700 font-medium">
                      ⚠️ Cardiac Alert: Pre-medication protocol may apply.
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Receipt Info */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-teal-900">Payment: Pay at Clinic</span>
                  <p className="text-teal-700 text-[11px]">Settled following consultation and diagnostic check</p>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-100 px-2.5 py-1 rounded-full">
                  VERIFIED SLOT ✓
                </span>
              </div>

              {/* Clinical Doctor Notes if completed */}
              {selectedAppointment.doctorNotes && (
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-800 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-slate-900">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Doctor's Post-Procedure Notes
                  </span>
                  <p className="italic text-slate-700">"{selectedAppointment.doctorNotes}"</p>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <User className="w-7 h-7 text-slate-400" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-800">No Patient Record Active</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your appointment confirmation code above to look up your scheduled visit, treatment instructions, and clinical details.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Post-Procedure Care Instructions Library */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Post-Procedure Care Library</h3>
                <p className="text-xs text-slate-500">Doctor-verified recovery instructions</p>
              </div>
            </div>

            {/* Guide Selector Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {POST_CARE_GUIDES.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedCareGuideId(g.id)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition-colors ${
                    selectedCareGuideId === g.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {g.procedure.split(' ')[0]} Care
                </button>
              ))}
            </div>

            {/* Selected Care Guide Content */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{activeCareGuide.procedure}</h4>
                <p className="text-xs text-teal-700 font-semibold mt-0.5">
                  Timeline: {activeCareGuide.recoveryTimeline}
                </p>
              </div>

              {/* Immediate Care instructions */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  ✓ What You Should Do (First 24-48 Hours)
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {activeCareGuide.immediateCare.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What NOT to do */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                  ✗ Strict Precautions (Avoid)
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {activeCareGuide.doNotDo.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Emergency Signs */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-rose-950">
                <span className="font-bold flex items-center gap-1 text-rose-900">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Call Us Immediately If You Notice:
                </span>
                <ul className="space-y-1 pl-4 list-disc text-[11px] text-rose-800">
                  {activeCareGuide.emergencySigns.map((sign, idx) => (
                    <li key={idx}>{sign}</li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
