import React, { useState, useId } from 'react';
import { 
  X, 
  Clock, 
  ShieldCheck, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useClinic } from '../context/ClinicContext';
import { MedicalHistory } from '../types';

export const BookingModal: React.FC = () => {
  const { 
    showBookingModal, 
    setShowBookingModal,
    services, 
    doctors, 
    appointments,
    createAppointment,
    bookingPreselectedDoctorId,
    bookingPreselectedServiceId,
    setBookingPreselectedDoctorId,
    setBookingPreselectedServiceId,
  } = useClinic();

  const nameInputId = useId();
  const phoneInputId = useId();
  const emailInputId = useId();
  const complaintInputId = useId();

  // 3 steps: 1-Service/Doctor, 2-Date/Slot, 3-Patient Info → 4-Success
  const [step, setStep] = useState<number>(1);

  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    bookingPreselectedServiceId || services[0]?.id || ''
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    bookingPreselectedDoctorId || ''
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateString = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(defaultDateString);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [primaryComplaint, setPrimaryComplaint] = useState<string>('');

  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>({
    hasAllergies: false,
    allergyDetails: '',
    currentMedications: '',
    hasHeartCondition: false,
    hasDiabetes: false,
    hasBleedingDisorder: false,
    isPregnant: false,
    previousDentalAnxiety: false,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedApt, setConfirmedApt] = useState<any>(null);

  if (!showBookingModal) return null;

  const currentService = services.find(s => s.id === selectedServiceId) || services[0];
  const currentDoctor = doctors.find(d => d.id === selectedDoctorId);

  const generateAvailableTimeSlots = () => {
    const slots = ['09:00','09:45','10:30','11:15','13:00','13:45','14:30','15:15','16:00','16:45'];
    const booked = appointments.filter(a => {
      if (a.date !== selectedDate) return false;
      if (selectedDoctorId && a.doctorId !== selectedDoctorId) return false;
      return a.status !== 'Cancelled';
    }).map(a => a.timeSlot);
    return slots.map(time => ({ time, isAvailable: !booked.includes(time) }));
  };

  const availableSlots = generateAvailableTimeSlots();

  const handleFinalSubmit = async () => {
    if (!patientName.trim() || !patientPhone.trim() || !patientEmail.trim()) {
      alert('Please provide your full name, mobile number, and email address to proceed.');
      return;
    }
    setIsSubmitting(true);
    try {
      const assignedDoctorId = selectedDoctorId || (doctors[0]?.id || 'doc-1');
      const created = await createAppointment({
        patientName,
        patientPhone,
        patientEmail,
        doctorId: assignedDoctorId,
        serviceId: selectedServiceId,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        primaryComplaint: primaryComplaint || 'Routine examination & procedure consultation',
        medicalHistory,
        depositAmount: 0,
        depositPaid: false,
        paymentMethod: 'Clinic',
        otpVerified: true,
      });
      setConfirmedApt(created);
      setIsSubmitting(false);
      setStep(4);
      try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } }); } catch {}
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleClose = () => {
    setShowBookingModal(false);
    setBookingPreselectedDoctorId(null);
    setBookingPreselectedServiceId(null);
    setStep(1);
    setConfirmedApt(null);
  };

  const downloadIcsCalendar = () => {
    if (!confirmedApt) return;
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Lavanya Dental//Appointments//EN\nBEGIN:VEVENT\nSUMMARY:Lavanya Dental: ${currentService.name}\nDESCRIPTION:Appointment with ${currentDoctor?.name || 'Lavanya Dental Specialist'}. Code: ${confirmedApt.confirmationCode}. Payment: Pay at Clinic.\nDTSTART:${confirmedApt.date.replace(/-/g, '')}T${confirmedApt.timeSlot.replace(':', '')}00\nLOCATION:Lavanya Dental Clinic\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LavanyaDental_${confirmedApt.confirmationCode}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative">
          <button onClick={handleClose} className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Book an Appointment</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
            {step === 1 && 'Select Service & Preferred Specialist'}
            {step === 2 && 'Choose Date & Available Time Slot'}
            {step === 3 && 'Your Details'}
            {step === 4 && 'Appointment Confirmed!'}
          </h2>

          {step < 4 && (
            <div className="flex items-center gap-1.5 mt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-teal-400' : 'bg-slate-700'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Treatment
                </label>
                <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {services.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedServiceId(s.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        selectedServiceId === s.id
                          ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{s.name}</span>
                          {s.popular && (
                            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Popular</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{s.description}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.durationMinutes} mins</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-teal-700 font-semibold">
                            <ShieldCheck className="w-3 h-3" /> Pay at Clinic
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedServiceId === s.id ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'}`}>
                          {selectedServiceId === s.id && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Choose Specialist (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setSelectedDoctorId('')}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${selectedDoctorId === '' ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs">⚡</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">First Available Specialist</h4>
                      <p className="text-[11px] text-teal-700 font-medium">Fastest appointment</p>
                    </div>
                  </div>
                  {doctors.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${selectedDoctorId === doc.id ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <img src={doc.photoUrl} alt={doc.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{doc.name.split(',')[0]}</h4>
                          {doc.isAvailableToday ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded-full shrink-0">Available</span>
                          ) : (
                            <span className="text-[9px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded-full shrink-0">On Duty</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{doc.specialty}</p>
                        <p className="text-[10px] text-amber-600 font-semibold">★ {doc.rating} ({doc.reviewsCount})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTimeSlot(''); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Available Slots — {selectedDate}</label>
                  <span className="text-xs text-slate-500">{currentService.durationMinutes} mins</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {availableSlots.map(({ time, isAvailable }) => (
                    <button
                      key={time}
                      disabled={!isAvailable}
                      onClick={() => setSelectedTimeSlot(time)}
                      className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-1 ${
                        !isAvailable ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                        : selectedTimeSlot === time ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white hover:bg-teal-50 text-slate-800 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{time}</span>
                      <span className="text-[10px] font-normal opacity-80">{isAvailable ? 'Open' : 'Booked'}</span>
                    </button>
                  ))}
                </div>
                {!selectedTimeSlot && (
                  <p className="text-xs text-amber-700 mt-2 font-medium">Please pick a time slot to continue.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary banner */}
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">Booking Summary</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-slate-500">Service</span>
                    <p className="font-semibold text-slate-900">{currentService.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Date & Time</span>
                    <p className="font-semibold text-teal-800">{selectedDate} at {selectedTimeSlot}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Doctor</span>
                    <p className="font-semibold text-slate-900">{currentDoctor?.name?.split(',')[0] || 'First Available'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-semibold text-teal-800">Pay at Clinic</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={nameInputId} className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input id={nameInputId} type="text" required placeholder="e.g. Ravi Kumar" value={patientName} onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden" />
                </div>
                <div>
                  <label htmlFor={phoneInputId} className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input id={phoneInputId} type="tel" required placeholder="+91 99999 00000" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden" />
                </div>
              </div>

              <div>
                <label htmlFor={emailInputId} className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input id={emailInputId} type="email" required placeholder="name@example.com" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden" />
              </div>

              <div>
                <label htmlFor={complaintInputId} className="block text-xs font-semibold text-slate-700 mb-1">Symptoms / Reason (optional)</label>
                <textarea id={complaintInputId} rows={2} placeholder="Describe pain, location, or dental goal..."
                  value={primaryComplaint} onChange={(e) => setPrimaryComplaint(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden" />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-700 mb-2">Health Flags (select if applicable)</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'hasAllergies', label: 'Known Allergies' },
                    { key: 'hasHeartCondition', label: 'Heart Condition' },
                    { key: 'hasDiabetes', label: 'Diabetes' },
                    { key: 'previousDentalAnxiety', label: 'Dental Anxiety' },
                  ].map(({ key, label }) => (
                    <button key={key} type="button"
                      onClick={() => setMedicalHistory(prev => ({ ...prev, [key]: !prev[key as keyof MedicalHistory] }))}
                      className={`text-xs px-3 py-2 rounded-xl border font-medium transition-colors text-left ${
                        medicalHistory[key as keyof MedicalHistory]
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {medicalHistory[key as keyof MedicalHistory] ? '✓ ' : ''}{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && confirmedApt && (
            <div className="space-y-6 text-center py-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900 font-display">Appointment Booked!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  Your code: <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">{confirmedApt.confirmationCode}</span>. A confirmation has been sent to your email and phone.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-slate-500">Service</span><p className="font-semibold text-slate-900">{currentService.name}</p></div>
                  <div><span className="text-slate-500">Date & Time</span><p className="font-semibold text-teal-800">{confirmedApt.date} at {confirmedApt.timeSlot}</p></div>
                  <div><span className="text-slate-500">Doctor</span><p className="font-semibold text-slate-900">{currentDoctor?.name?.split(',')[0] || 'Assigned Specialist'}</p></div>
                  <div className="flex items-center gap-1.5 pt-2"><ShieldCheck className="w-4 h-4 text-teal-600" /><span className="font-bold text-teal-800">Pay at Clinic</span></div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                  Doctor notified instantly
                </div>
                <p className="text-xs text-emerald-800">
                  {currentDoctor?.name?.split(',')[0] || 'The assigned specialist'} has been alerted via the clinic mobile console.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button onClick={downloadIcsCalendar}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Add to Calendar</span>
                </button>
                <button onClick={handleClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm">
                  <span>Done</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer nav */}
        {step < 4 && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(prev => prev - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors">
                <ArrowLeft className="w-4 h-4" /><span>Back</span>
              </button>
            ) : <div></div>}

            <div className="flex items-center gap-3">
              {step === 1 && (
                <button type="button" onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-teal-700 text-white transition-all shadow-sm">
                  <span>Choose Date & Slot</span><ArrowRight className="w-4 h-4" />
                </button>
              )}
              {step === 2 && (
                <button type="button" disabled={!selectedTimeSlot} onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-teal-700 disabled:opacity-40 text-white transition-all shadow-sm">
                  <span>Continue</span><ArrowRight className="w-4 h-4" />
                </button>
              )}
              {step === 3 && (
                <button type="button" disabled={isSubmitting} onClick={handleFinalSubmit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-all shadow-md">
                  <span>{isSubmitting ? 'Confirming...' : 'Confirm Appointment'}</span>
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};