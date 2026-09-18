import React, { useState, useId } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  CreditCard, 
  ArrowLeft, 
  ArrowRight,
  Stethoscope,
  Sparkles,
  Lock,
  Download,
  CheckCircle2,
  FileText
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
    setShowDoctorMobileSimulator
  } = useClinic();

  const nameInputId = useId();
  const phoneInputId = useId();
  const emailInputId = useId();
  const complaintInputId = useId();
  const insuranceProviderInputId = useId();
  const insurancePolicyInputId = useId();
  const cardNumberInputId = useId();
  const cardExpiryInputId = useId();
  const cardCvcInputId = useId();

  // Wizard Steps: 1: Service & Doctor, 2: Date & Slot, 3: Patient Intake & Health History, 4: OTP Verification, 5: Deposit & Summary, 6: Success
  const [step, setStep] = useState<number>(1);

  // Form selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    bookingPreselectedServiceId || services[0]?.id || ''
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    bookingPreselectedDoctorId || ''
  );

  // Date & Slot state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateString = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(defaultDateString);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  // Patient details
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [primaryComplaint, setPrimaryComplaint] = useState<string>('');

  // Medical history
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

  // Insurance details
  const [hasInsurance, setHasInsurance] = useState<boolean>(false);
  const [insuranceProvider, setInsuranceProvider] = useState<string>('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState<string>('');

  // OTP 2FA State
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(60);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Clinic'>('Card');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('891');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Confirmed Appointment Result
  const [confirmedApt, setConfirmedApt] = useState<any>(null);

  if (!showBookingModal) return null;

  const currentService = services.find(s => s.id === selectedServiceId) || services[0];
  const currentDoctor = doctors.find(d => d.id === selectedDoctorId);

  // Generate slots for selected date & doctor
  const generateAvailableTimeSlots = () => {
    const slots = [
      '09:00', '09:45', '10:30', '11:15', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45'
    ];

    // Filter out slots already taken for this doctor and date
    const booked = appointments.filter(a => {
      if (a.date !== selectedDate) return false;
      if (selectedDoctorId && a.doctorId !== selectedDoctorId) return false;
      return a.status !== 'Cancelled';
    }).map(a => a.timeSlot);

    return slots.map(time => ({
      time,
      isAvailable: !booked.includes(time)
    }));
  };

  const availableSlots = generateAvailableTimeSlots();

  // Send OTP
  const handleProceedToPayment = () => {
    if (!patientName.trim() || !patientPhone.trim() || !patientEmail.trim()) {
      alert('Please provide your full name, mobile number, and email address to proceed.');
      return;
    }

    setStep(4);
  };

  const handleFinalSubmit = async () => {
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
        insuranceProvider: hasInsurance ? insuranceProvider : undefined,
        insurancePolicyNumber: hasInsurance ? insurancePolicyNumber : undefined,
        depositAmount: currentService.depositRequired,
        depositPaid: paymentMethod === 'Card',
        paymentMethod,
        otpVerified: true,
      });

      setConfirmedApt(created);
      setIsSubmitting(false);
      setStep(5); // Success Step

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert('An unexpected error occurred while booking. Please try again.');
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
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AuraDental Clinic//Appointments//EN
BEGIN:VEVENT
SUMMARY:AuraDental: ${currentService.name}
DESCRIPTION:Appointment with ${currentDoctor?.name || 'AuraDental Specialist'}. Confirmation: ${confirmedApt.confirmationCode}
DTSTART:${confirmedApt.date.replace(/-/g, '')}T${confirmedApt.timeSlot.replace(':', '')}00
LOCATION:AuraDental Clinic, 450 Health Pavilion Blvd, Suite 300
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AuraDental_${confirmedApt.confirmationCode}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header & Progress Indicator */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct Patient Booking Engine</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
            {step === 1 && 'Select Service & Preferred Specialist'}
            {step === 2 && 'Choose Date & Available Time Slot'}
            {step === 3 && 'Patient Information'}
            {step === 4 && 'Confirm Booking & Secure Deposit'}
            {step === 5 && 'Appointment Scheduled Successfully!'}
          </h2>

          {/* Stepper bar */}
          <div className="flex items-center gap-1.5 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step >= s ? 'bg-teal-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">

          {/* STEP 1: SERVICE & DOCTOR */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Procedure / Dental Treatment
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
                            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{s.description}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                          <span className="font-medium text-teal-700">${s.priceEstimate} est.</span>
                          <span>•</span>
                          <span>{s.durationMinutes} mins</span>
                          <span>•</span>
                          <span className="text-slate-500">Insurance: {s.insuranceCovered}</span>
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selectedServiceId === s.id
                            ? 'border-teal-600 bg-teal-600 text-white'
                            : 'border-slate-300'
                        }`}>
                          {selectedServiceId === s.id && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Choose Treating Specialist (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setSelectedDoctorId('')}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                      selectedDoctorId === ''
                        ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">First Available Specialist</h4>
                      <p className="text-[11px] text-teal-700 font-medium">Fastest appointment booking</p>
                    </div>
                  </div>

                  {doctors.filter(doc => doc.isAvailableToday).map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                        selectedDoctorId === doc.id
                          ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={doc.photoUrl}
                        alt={doc.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{doc.name.split(',')[0]}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{doc.specialty}</p>
                        <p className="text-[10px] text-amber-600 font-semibold">★ {doc.rating} ({doc.reviewsCount})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DATE & TIME SLOT */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Preferred Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTimeSlot('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Available Time Slots for {selectedDate}
                  </label>
                  <span className="text-xs text-slate-500">Duration: {currentService.durationMinutes} mins</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {availableSlots.map(({ time, isAvailable }) => (
                    <button
                      key={time}
                      disabled={!isAvailable}
                      onClick={() => setSelectedTimeSlot(time)}
                      className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-1 ${
                        !isAvailable
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                          : selectedTimeSlot === time
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white hover:bg-teal-50 text-slate-800 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{time}</span>
                      <span className="text-[10px] font-normal opacity-80">
                        {isAvailable ? 'Available' : 'Booked'}
                      </span>
                    </button>
                  ))}
                </div>

                {!selectedTimeSlot && (
                  <p className="text-xs text-amber-700 mt-2 font-medium">
                    Please select one of the available time slots above to continue.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PATIENT CONTACT INFORMATION */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={nameInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    id={nameInputId}
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor={phoneInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    id={phoneInputId}
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={emailInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  id={emailInputId}
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label htmlFor={complaintInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Complaint / Dental Symptoms
                </label>
                <textarea
                  id={complaintInputId}
                  rows={2}
                  placeholder="Describe any pain, duration, tooth location, or aesthetic goals..."
                  value={primaryComplaint}
                  onChange={(e) => setPrimaryComplaint(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>

              {/* Optional Insurance */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Do you have dental insurance?</span>
                  <button
                    type="button"
                    onClick={() => setHasInsurance(!hasInsurance)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                      hasInsurance ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {hasInsurance ? 'Yes, Add Policy' : 'No / Self-Pay'}
                  </button>
                </div>

                {hasInsurance && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label htmlFor={insuranceProviderInputId} className="block text-[11px] font-medium text-slate-600 mb-1">
                        Insurance Provider
                      </label>
                      <input
                        id={insuranceProviderInputId}
                        type="text"
                        placeholder="e.g. Delta Dental, Aetna, Cigna"
                        value={insuranceProvider}
                        onChange={(e) => setInsuranceProvider(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-hidden"
                      />
                    </div>
                    <div>
                      <label htmlFor={insurancePolicyInputId} className="block text-[11px] font-medium text-slate-600 mb-1">
                        Member / Policy ID
                      </label>
                      <input
                        id={insurancePolicyInputId}
                        type="text"
                        placeholder="e.g. DD-8472910"
                        value={insurancePolicyNumber}
                        onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: DEPOSIT & SUMMARY */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500">Service</h4>
                    <p className="text-sm font-bold text-slate-900">{currentService.name}</p>
                  </div>
                  <span className="text-sm font-extrabold text-teal-800">${currentService.priceEstimate}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Treating Clinician:</span>
                    <p className="font-bold text-slate-800">{currentDoctor?.name || 'Assigned Specialist'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Scheduled Time:</span>
                    <p className="font-bold text-teal-800">{selectedDate} at {selectedTimeSlot}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Patient:</span>
                    <p className="font-bold text-slate-800">{patientName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Required Deposit:</span>
                    <p className="font-bold text-slate-900">${currentService.depositRequired} (Applied to bill)</p>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Deposit Payment Option
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPaymentMethod('Card')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      paymentMethod === 'Card'
                        ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Card Online</p>
                      <p className="text-[10px] text-slate-500">PCI-DSS Encrypted</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('Clinic')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      paymentMethod === 'Clinic'
                        ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Pay at Clinic</p>
                      <p className="text-[10px] text-slate-500">Deposit upon arrival</p>
                    </div>
                  </div>
                </div>
              </div>

              {paymentMethod === 'Card' && (
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Lock className="w-3.5 h-3.5 text-teal-600" />
                      Encrypted Gateway
                    </span>
                    <span className="font-mono text-[11px]">Test Mode Active</span>
                  </div>

                  <div>
                    <label htmlFor={cardNumberInputId} className="block text-[11px] font-medium text-slate-600 mb-1">
                      Card Number
                    </label>
                    <input
                      id={cardNumberInputId}
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={cardExpiryInputId} className="block text-[11px] font-medium text-slate-600 mb-1">
                        Expiry Date
                      </label>
                      <input
                        id={cardExpiryInputId}
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono outline-hidden"
                      />
                    </div>
                    <div>
                      <label htmlFor={cardCvcInputId} className="block text-[11px] font-medium text-slate-600 mb-1">
                        CVC
                      </label>
                      <input
                        id={cardCvcInputId}
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: CONFIRMATION & REAL-TIME DISPATCH */}
          {step === 5 && confirmedApt && (
            <div className="space-y-6 text-center py-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900 font-display">
                  Appointment Scheduled!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  Confirmation code <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">{confirmedApt.confirmationCode}</span>. A copy of this confirmation has been sent to your phone and email.
                </p>
              </div>

              {/* Real-time Push Status Indicator */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Instant Doctor Alert Dispatched
                  </span>
                  <span className="font-mono text-emerald-700 text-[11px]">Latency: 1.2s</span>
                </div>
                <p className="text-xs text-emerald-800">
                  {currentDoctor?.name || 'The assigned specialist'} was alerted via real-time mobile push. You can test the doctor's live response on their smartphone simulator right now!
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowDoctorMobileSimulator(true);
                      handleClose();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span>Open Doctor Mobile Simulator & Confirm Slot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={downloadIcsCalendar}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .ICS Calendar</span>
                </button>

                <button
                  onClick={handleClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  <span>Done</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        {step < 5 && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-3">
              {step === 1 && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-teal-700 text-white transition-all shadow-sm"
                >
                  <span>Choose Date & Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  disabled={!selectedTimeSlot}
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-teal-700 disabled:opacity-40 text-white transition-all shadow-sm"
                >
                  <span>Continue to Intake</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 4 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-all shadow-md"
                >
                  <span>{isSubmitting ? 'Confirming Appointment...' : `Pay Deposit & Book ($${currentService.depositRequired})`}</span>
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
