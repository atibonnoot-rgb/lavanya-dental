import React, { useState } from 'react';
import { 
  Smartphone, 
  Check, 
  X, 
  Clock, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Stethoscope, 
  CheckCircle2, 
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { Appointment } from '../types';
import { playNotificationSound } from '../lib/sound';

interface DoctorMobileCompanionProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const DoctorMobileCompanion: React.FC<DoctorMobileCompanionProps> = ({ 
  isModal = false, 
  onClose 
}) => {
  const { 
    selectedDoctorId, 
    setSelectedDoctorId, 
    doctors, 
    appointments, 
    services,
    doctorNotifications, 
    confirmAppointmentByDoctor, 
    declineAppointmentByDoctor, 
    rescheduleAppointmentByDoctor,
    completeAppointment,
    deleteAppointment,
    toggleDoctorAvailability,
    markNotificationRead 
  } = useClinic();

  const isAllDoctors = selectedDoctorId === 'all';
  const currentDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0] || {
    id: 'all',
    name: 'All Specialists',
    title: 'Staff Clinicians',
    specialty: 'Complete Clinic Schedule',
    photoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&auto=format&fit=crop&q=80',
    isAvailableToday: true,
    workingHours: { start: '08:30', end: '19:00' },
  };

  const [activeTab, setActiveTab] = useState<'schedule' | 'alerts' | 'profile'>('alerts');
  const [selectedAppointmentForAction, setSelectedAppointmentForAction] = useState<Appointment | null>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState<boolean>(false);
  const [newRescheduleDate, setNewRescheduleDate] = useState<string>('2026-09-21');
  const [newRescheduleSlot, setNewRescheduleSlot] = useState<string>('11:00');
  const [declineReason, setDeclineReason] = useState<string>('Schedule conflict / Emergency surgery block');
  const [showDeclineConfirm, setShowDeclineConfirm] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Appointments for this doctor or all doctors
  const doctorAppointments = isAllDoctors 
    ? appointments 
    : (currentDoctor ? appointments.filter(a => a.doctorId === currentDoctor.id) : appointments);
  const pendingAppointments = doctorAppointments.filter(a => a.status === 'Pending');
  const confirmedAppointments = doctorAppointments.filter(a => a.status === 'Confirmed');
  
  // Notifications for this doctor or all doctors
  const notifications = isAllDoctors 
    ? doctorNotifications 
    : (currentDoctor ? doctorNotifications.filter(n => n.doctorId === currentDoctor.id) : doctorNotifications);

  const handle1TapConfirm = (aptId: string) => {
    confirmAppointmentByDoctor(aptId);
    setSelectedAppointmentForAction(null);
  };

  const handleDecline = (aptId: string) => {
    declineAppointmentByDoctor(aptId, declineReason);
    setShowDeclineConfirm(false);
    setSelectedAppointmentForAction(null);
  };

  const handleReschedule = (aptId: string) => {
    rescheduleAppointmentByDoctor(aptId, newRescheduleDate, newRescheduleSlot);
    setRescheduleModalOpen(false);
    setSelectedAppointmentForAction(null);
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteAppointment = async (aptId: string, patientName: string) => {
    if (!window.confirm(`Are you sure you want to delete the appointment for "${patientName}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(aptId);
    try {
      await deleteAppointment(aptId);
    } catch (e) {
      console.warn('Delete appointment local notice:', e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${isModal ? 'fixed inset-0 z-50 p-4 bg-slate-950/70 backdrop-blur-xs' : 'w-full py-8'}`}>
      
      {/* Smartphone Device Mockup Shell */}
      <div className="relative w-full max-w-[390px] h-[780px] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-white/10 flex flex-col overflow-hidden text-slate-900 font-sans select-none">
        
        {/* Dynamic Island / Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-30 flex items-center justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/50"></div>
          <div className="w-3 h-3 rounded-full bg-teal-950 border border-teal-600/30"></div>
        </div>

        {/* Status Bar */}
        <div className="pt-2 px-6 pb-2 flex items-center justify-between text-[11px] font-semibold text-slate-300 z-20">
          <span>9:41</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-teal-400 font-bold tracking-wider">5G</span>
            <div className="w-5 h-2.5 rounded-xs border border-slate-400 p-0.5 flex items-center">
              <div className="h-full w-3 bg-teal-400 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Modal Close Button (if rendered in floating modal) */}
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-40 bg-slate-800 text-slate-300 hover:text-white p-1 rounded-full text-xs"
            title="Close companion"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Mobile App View Container */}
        <div className="flex-1 bg-slate-100 rounded-[36px] overflow-hidden flex flex-col relative border border-slate-200">
          
          {/* Mobile Top Bar */}
          <div className="bg-slate-900 text-white p-4 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-teal-400 shrink-0">
                  <img src={currentDoctor.photoUrl} alt={currentDoctor.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xs font-bold leading-tight truncate w-36">{currentDoctor.name.split(',')[0]}</h3>
                  <p className="text-[10px] text-teal-400 font-medium">On-Duty • {currentDoctor.specialty.split('&')[0]}</p>
                </div>
              </div>

              {/* Doctor switcher within phone */}
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="bg-slate-800 text-[10px] text-teal-300 rounded-lg px-2 py-1 border border-slate-700 outline-hidden font-medium"
              >
                <option value="all">⭐ All Doctors ({appointments.length})</option>
                {doctors.map(d => {
                  const count = appointments.filter(a => a.doctorId === d.id).length;
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name.split(',')[0]} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Availability & Push Sound Toggle */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[11px]">
              <button
                onClick={() => currentDoctor.id !== 'all' && toggleDoctorAvailability(currentDoctor.id)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold transition-colors ${
                  currentDoctor.isAvailableToday 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' 
                    : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${currentDoctor.isAvailableToday ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span>{currentDoctor.isAvailableToday ? 'Accepting Patients' : 'Paused / In Surgery'}</span>
              </button>

              <button
                onClick={() => {
                  if (!soundEnabled) {
                    playNotificationSound();
                  }
                  setSoundEnabled(!soundEnabled);
                }}
                className="text-slate-400 hover:text-white p-1"
                title="Toggle notification chime sound"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-teal-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Sub Navigation Segmented Tabs */}
          <div className="bg-white px-3 py-2 border-b border-slate-200 flex items-center justify-around text-xs font-semibold">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`relative py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'alerts' ? 'bg-teal-50 text-teal-800' : 'text-slate-500'
              }`}
            >
              <span>Alerts</span>
              {pendingAppointments.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-bold">
                  {pendingAppointments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'schedule' ? 'bg-teal-50 text-teal-800' : 'text-slate-500'
              }`}
            >
              <span>Daily Schedule</span>
              <span className="ml-1 text-[10px] text-slate-400">({doctorAppointments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'profile' ? 'bg-teal-50 text-teal-800' : 'text-slate-500'
              }`}
            >
              <span>Sync & Hours</span>
            </button>
          </div>

          {/* Mobile Screen Body Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
            
            {/* ALERTS TAB: Pending Bookings needing 1-Tap Confirmation (PRD 4.2 / 6.1) */}
            {activeTab === 'alerts' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase px-1">
                  <span>Pending Booking Approvals</span>
                  <span className="text-teal-700">{pendingAppointments.length} Action Needed</span>
                </div>

                {pendingAppointments.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">All Patient Bookings Triaged!</p>
                    <p className="text-[11px] text-slate-500">
                      When a patient completes the online booking engine, instant push alerts appear here with 1-tap confirmation.
                    </p>
                  </div>
                ) : (
                  pendingAppointments.map(apt => {
                    const serv = services.find(s => s.id === apt.serviceId);
                    return (
                      <div 
                        key={apt.id}
                        className="bg-white rounded-2xl p-3.5 border-2 border-teal-500/60 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                              <span className="text-[10px] font-mono text-slate-400 font-bold">{apt.confirmationCode}</span>
                              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-sm">
                                PENDING
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{apt.patientName}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-xs text-teal-800 font-medium truncate">{serv?.name || 'Consultation'}</p>
                              <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.2 rounded-md shrink-0">
                                Dr. {doctors.find(d => d.id === apt.doctorId)?.name.split(',')[0] || 'Clinician'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md block">
                              {apt.timeSlot}
                            </span>
                            <span className="text-[10px] text-slate-500">{apt.date}</span>
                          </div>
                        </div>

                        {/* Complaint & Medical flags */}
                        <div className="bg-slate-50 rounded-xl p-2 text-[11px] text-slate-700 space-y-1">
                          <p><strong>Chief Complaint:</strong> {apt.primaryComplaint}</p>
                          {apt.medicalHistory.hasAllergies && (
                            <p className="text-rose-600 font-semibold">⚠️ Patient has documented drug/latex allergy</p>
                          )}
                          {apt.depositPaid && (
                            <p className="text-emerald-700 font-medium">✓ Deposit of ${apt.depositAmount} secured</p>
                          )}
                        </div>

                        {/* SINGLE-TAP QUICK ACTIONS (PRD 4.2) */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <div className="grid grid-cols-3 gap-1.5 flex-1">
                            <button
                              onClick={() => handle1TapConfirm(apt.id)}
                              className="inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-2 rounded-xl text-[11px] font-bold transition-all shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Confirm</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedAppointmentForAction(apt);
                                setRescheduleModalOpen(true);
                              }}
                              className="inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 px-1 rounded-xl text-[11px] font-semibold transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Suggest Slot</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedAppointmentForAction(apt);
                                setShowDeclineConfirm(true);
                              }}
                              className="inline-flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 px-1 rounded-xl text-[11px] font-semibold transition-colors"
                            >
                              <X className="w-3 h-3" />
                              <span>Decline</span>
                            </button>
                          </div>
                          <button
                            onClick={() => handleDeleteAppointment(apt.id, apt.patientName)}
                            disabled={deletingId === apt.id}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                            title="Delete wrong booking"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Notifications Archive */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Recent Push & SMS Logs
                  </span>
                  <div className="space-y-1.5">
                    {notifications.slice(0, 4).map(n => (
                      <div key={n.id} className="bg-white rounded-xl p-2.5 text-[11px] border border-slate-200 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800">{n.patientName}</span>
                          <p className="text-[10px] text-slate-500">{n.serviceName}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{n.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SCHEDULE TAB: Doctor's daily patient list */}
            {activeTab === 'schedule' && (
              <div className="space-y-2.5">
                <div className="bg-white rounded-xl p-2.5 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-teal-600" />
                    <span className="font-bold text-slate-900">Today & Upcoming Schedule</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {doctorAppointments.some(a => a.status === 'Completed' || a.status === 'Cancelled') && (
                      <button
                        onClick={async () => {
                          const toClear = doctorAppointments.filter(a => a.status === 'Completed' || a.status === 'Cancelled');
                          if (!window.confirm(`Delete all ${toClear.length} completed/cancelled appointment(s)?`)) return;
                          for (const a of toClear) {
                            await deleteAppointment(a.id);
                          }
                        }}
                        className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                        title="Clear all completed and cancelled appointments"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Clear Done</span>
                      </button>
                    )}
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-md">
                      {confirmedAppointments.length} Confirmed
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {doctorAppointments.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No scheduled visits yet.</p>
                  ) : (
                    doctorAppointments.map(apt => (
                      <div 
                        key={apt.id} 
                        className={`bg-white rounded-2xl p-3 border transition-all ${
                          apt.status === 'Confirmed' ? 'border-emerald-200 shadow-xs' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                            {apt.timeSlot} • {apt.date}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              apt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                              apt.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                              apt.status === 'Rescheduled' ? 'bg-blue-100 text-blue-800' :
                              apt.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {apt.status}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAppointment(apt.id, apt.patientName);
                              }}
                              disabled={deletingId === apt.id}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                              title="Delete appointment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mt-2">{apt.patientName}</h4>
                        <div className="flex items-center justify-between text-[10px] text-teal-700 font-medium mt-0.5">
                          <span className="truncate">{services.find(s => s.id === apt.serviceId)?.name || 'General Consultation'}</span>
                          <span className="text-slate-500 font-normal shrink-0">
                            Dr. {doctors.find(d => d.id === apt.doctorId)?.name.split(',')[0] || 'Clinician'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{apt.primaryComplaint}</p>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-mono text-[10px]">{apt.patientPhone}</span>
                          <div className="flex items-center gap-2">
                            {apt.status === 'Confirmed' && (
                              <button
                                onClick={() => completeAppointment(apt.id, 'Standard procedure completed successfully with zero complications.')}
                                className="text-teal-700 hover:text-teal-900 font-bold bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-md transition-colors text-[10px]"
                              >
                                Mark Completed ✓
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAppointment(apt.id, apt.patientName)}
                              disabled={deletingId === apt.id}
                              className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50 text-[10px]"
                              title="Delete appointment"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>{deletingId === apt.id ? 'Deleting...' : 'Delete'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PROFILE & SYNC TAB (PRD 4.2 Two-way Calendar Sync) */}
            {activeTab === 'profile' && (
              <div className="space-y-3 text-xs">
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-teal-600" />
                    Two-Way Calendar Sync
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sync clinic bookings directly into your mobile phone's native calendar app.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="font-semibold text-slate-800 text-[11px]">Google Calendar</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Connected ✓
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="font-semibold text-slate-800 text-[11px]">Apple iCal Sync</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Connected ✓
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900">Working Hours</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Start Shift</span>
                      <strong className="text-slate-800">{currentDoctor.workingHours.start} AM</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">End Shift</span>
                      <strong className="text-slate-800">{currentDoctor.workingHours.end} PM</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Reschedule Alternative Slot Sheet */}
          {rescheduleModalOpen && selectedAppointmentForAction && (
            <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-xs flex items-end p-2">
              <div className="bg-white rounded-3xl p-4 w-full space-y-3 animate-in slide-in-from-bottom-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Suggest Alternative Slot</h4>
                  <button onClick={() => setRescheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Select a new time for {selectedAppointmentForAction.patientName}. Patient will receive an instant SMS proposal.
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">New Date</label>
                  <input
                    type="date"
                    value={newRescheduleDate}
                    onChange={(e) => setNewRescheduleDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">New Time Slot</label>
                  <select
                    value={newRescheduleSlot}
                    onChange={(e) => setNewRescheduleSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-hidden"
                  >
                    <option value="09:30">09:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:30">03:30 PM</option>
                  </select>
                </div>

                <button
                  onClick={() => handleReschedule(selectedAppointmentForAction.id)}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Send Alternative Slot to Patient
                </button>
              </div>
            </div>
          )}

          {/* Decline Confirmation Sheet */}
          {showDeclineConfirm && selectedAppointmentForAction && (
            <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-xs flex items-end p-2">
              <div className="bg-white rounded-3xl p-4 w-full space-y-3 animate-in slide-in-from-bottom-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-rose-600">Decline Appointment</h4>
                  <button onClick={() => setShowDeclineConfirm(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Provide reason for patient notification:
                </p>

                <textarea
                  rows={2}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-hidden"
                />

                <button
                  onClick={() => handleDecline(selectedAppointmentForAction.id)}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Confirm Decline & Notify Patient
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Home Indicator Bar */}
        <div className="w-32 h-1 bg-slate-600 rounded-full mx-auto mt-3"></div>
      </div>
    </div>
  );
};
