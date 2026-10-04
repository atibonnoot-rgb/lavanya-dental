import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, Clock, Phone, Plus, Trash2, CheckCircle2,
  AlertCircle, Users, Search, Check, Send, X, Database,
  ArrowRight, ArrowLeft, Stethoscope, RefreshCw, MessageSquare, UserCheck,
  Building2, LogOut, ExternalLink, ShieldCheck, Globe, Copy
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { Appointment } from '../types';
import { supabase } from '../lib/supabase';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M12.04 2C6.516 2 2.024 6.491 2.024 12.016c0 1.764.461 3.487 1.336 5.006L2 22l5.12-1.343c1.464.798 3.119 1.218 4.805 1.218 5.524 0 10.016-4.49 10.016-10.016 0-2.677-1.042-5.195-2.936-7.09A10.02 10.02 0 0012.04 2zm0 18.293c-1.503 0-2.975-.405-4.262-1.17l-.306-.182-3.167.83.845-3.087-.199-.317a8.272 8.272 0 01-1.267-4.351c0-4.57 3.719-8.29 8.29-8.29 2.215 0 4.298.863 5.864 2.43 1.566 1.566 2.428 3.65 2.427 5.866 0 4.571-3.719 8.291-8.29 8.291zm4.61-6.19c-.253-.127-1.498-.739-1.73-.823-.232-.085-.4-.127-.57.127-.17.253-.655.823-.803.992-.148.17-.296.19-.55.064-.253-.127-1.07-.394-2.038-1.258-.753-.672-1.261-1.503-1.41-1.756-.148-.253-.016-.39.111-.516.115-.113.254-.296.38-.444.127-.148.17-.253.254-.423.085-.17.042-.317-.021-.444-.064-.127-.57-1.373-.782-1.881-.206-.494-.415-.426-.57-.434l-.487-.008c-.17 0-.444.064-.676.317-.233.254-.888.867-.888 2.114 0 1.248.91 2.453 1.036 2.622.127.17 1.79 2.733 4.337 3.832.606.262 1.08.419 1.45.536.61.194 1.165.166 1.603.101.488-.073 1.498-.613 1.71-1.205.212-.592.212-1.1.148-1.205-.063-.106-.233-.17-.486-.296z" />
  </svg>
);

const cleanWhatsAppPhone = (rawPhone: string) => {
  let cleaned = (rawPhone || '').replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
};

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type AdminTab = 'booked' | 'in_clinic' | 'database';

export interface TreatedPatientRecord {
  id: string;
  patientName: string;
  patientPhone: string;
  source: 'Website' | 'WhatsApp' | 'Walk-in';
  serviceName: string;
  treatedDate: string;
  treatedTime: string;
  doctorName: string;
  doctorNotes?: string;
  confirmationCode?: string;
}

// All data is now stored in Supabase — no localStorage fallback, no fake records

interface SupabaseAdminPanelProps {
  onLogout: () => void;
  onBackToWebsite?: () => void;
}

export const SupabaseAdminPanel: React.FC<SupabaseAdminPanelProps> = ({ onLogout, onBackToWebsite }) => {
  const { 
    appointments, 
    services, 
    doctors, 
    confirmAppointmentByDoctor, 
    completeAppointment,
    deleteAppointment,
    createAppointment,
    refreshData 
  } = useClinic();

  // Active Tab: Booked | In-Clinic | Patient Database
  const [activeTab, setActiveTabState] = useState<AdminTab>(() => {
    try {
      const savedTab = localStorage.getItem('lavanya_admin_active_tab');
      if (savedTab === 'booked' || savedTab === 'in_clinic' || savedTab === 'database') {
        return savedTab as AdminTab;
      }
    } catch {}
    return 'booked';
  });

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('lavanya_admin_active_tab', tab);
    } catch {}
  };

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshData(), loadFromSupabase()]);
    } catch (err) {
      console.warn('Manual refresh warning:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Search filter for phone number and name across tabs
  const [bookedSearchQuery, setBookedSearchQuery] = useState<string>('');
  const [inClinicSearchQuery, setInClinicSearchQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ── Permanent patient records — stored in Supabase, not localStorage ─────
  const [patientDatabase, setPatientDatabase] = useState<TreatedPatientRecord[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(true);

  // ── In-clinic queue — stored in Supabase ──────────────────────────────────
  const [inClinicIds, setInClinicIds] = useState<string[]>([]);

  // Load both from Supabase on mount
  const loadFromSupabase = useCallback(async () => {
    try {
      // Load patient records
      const { data: records, error: recErr } = await supabase
        .from('patient_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (!recErr && records) {
        setPatientDatabase(records.map((r: any) => ({
          id: r.id,
          patientName: r.patient_name,
          patientPhone: r.patient_phone,
          source: r.source,
          serviceName: r.service_name,
          treatedDate: r.treated_date,
          treatedTime: r.treated_time,
          doctorName: r.doctor_name,
          doctorNotes: r.doctor_notes || '',
          confirmationCode: r.confirmation_code || ''
        })));
      }

      // Load in-clinic queue
      const { data: queue, error: qErr } = await supabase
        .from('in_clinic_queue')
        .select('appointment_id');

      if (!qErr && queue) {
        setInClinicIds(queue.map((q: any) => q.appointment_id));
      }
    } catch (err) {
      console.warn('Supabase load error:', err);
    } finally {
      setDbLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  // Modal: Add New Booking / Walk-in
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientPhone, setNewPatientPhone] = useState<string>('');
  const [newBookingSource, setNewBookingSource] = useState<'Website' | 'WhatsApp'>('Website');
  const [newServiceId, setNewServiceId] = useState<string>(services[0]?.id || 'serv-teeth-whitening');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTimeSlot, setNewTimeSlot] = useState<string>('11:00 AM');
  const [newComplaint, setNewComplaint] = useState<string>('Routine consultation');

  // Keep newServiceId synchronized when services load from Supabase
  useEffect(() => {
    if (services.length > 0 && (!newServiceId || !services.some(s => s.id === newServiceId))) {
      setNewServiceId(services[0].id);
    }
  }, [services, newServiceId]);

  // Modal: Cancel WhatsApp Bot Notification
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>(
    'Emergency surgery schedule / Doctor unavailable at selected slot'
  );

  // Modal: WhatsApp Appointment Reminder
  const [reminderTarget, setReminderTarget] = useState<Appointment | null>(null);
  const [customReminderMessage, setCustomReminderMessage] = useState<string>('');
  const [copiedReminder, setCopiedReminder] = useState<boolean>(false);
  const [skipReminderPreview, setSkipReminderPreview] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lavanya_skip_reminder_preview') === 'true';
    } catch {
      return false;
    }
  });
  const [remindedMap, setRemindedMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('lavanya_reminded_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Filter Booked (Pending) - EXCLUDES anything in clinic or cancelled or completed
  const rawBookedAppointments = useMemo(() => {
    return appointments.filter(a => 
      !inClinicIds.includes(a.id) &&
      a.status !== 'Confirmed' &&
      a.status !== 'Completed' &&
      a.status !== 'Cancelled'
    );
  }, [appointments, inClinicIds]);

  // Search filter for Booked appointments (by Phone Number digits, Name, or Confirmation Code)
  const bookedAppointments = useMemo(() => {
    const q = bookedSearchQuery.toLowerCase().trim();
    if (!q) return rawBookedAppointments;
    const cleanQ = q.replace(/\D/g, '');
    return rawBookedAppointments.filter(a => {
      const cleanPhone = (a.patientPhone || '').replace(/\D/g, '');
      const matchPhone = cleanQ ? cleanPhone.includes(cleanQ) : false;
      const matchName = (a.patientName || '').toLowerCase().includes(q);
      const matchCode = a.confirmationCode && a.confirmationCode.toLowerCase().includes(q);
      return matchPhone || matchName || matchCode;
    });
  }, [rawBookedAppointments, bookedSearchQuery]);

  // In-Clinic STRICTLY shows patients who arrived and are confirmed!
  const rawInClinicAppointments = useMemo(() => {
    return appointments.filter(a => 
      (inClinicIds.includes(a.id) || a.status === 'Confirmed' || a.status === 'Rescheduled') &&
      a.status !== 'Completed' &&
      a.status !== 'Cancelled'
    );
  }, [appointments, inClinicIds]);

  // Search filter for In-Clinic appointments
  const inClinicAppointments = useMemo(() => {
    const q = inClinicSearchQuery.toLowerCase().trim();
    if (!q) return rawInClinicAppointments;
    const cleanQ = q.replace(/\D/g, '');
    return rawInClinicAppointments.filter(a => {
      const cleanPhone = (a.patientPhone || '').replace(/\D/g, '');
      const matchPhone = cleanQ ? cleanPhone.includes(cleanQ) : false;
      const matchName = (a.patientName || '').toLowerCase().includes(q);
      return matchPhone || matchName;
    });
  }, [rawInClinicAppointments, inClinicSearchQuery]);

  // Filter Database records by search (with phone digits match)
  const filteredDatabase = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return patientDatabase;
    const cleanQ = q.replace(/\D/g, '');
    return patientDatabase.filter(r => {
      const cleanPhone = (r.patientPhone || '').replace(/\D/g, '');
      const matchPhone = (cleanQ && cleanPhone.includes(cleanQ)) || (r.patientPhone || '').includes(q);
      const matchName = (r.patientName || '').toLowerCase().includes(q);
      const matchService = (r.serviceName || '').toLowerCase().includes(q);
      const matchDoctor = (r.doctorName || '').toLowerCase().includes(q);
      const matchCode = r.confirmationCode && r.confirmationCode.toLowerCase().includes(q);
      return matchPhone || matchName || matchService || matchDoctor || matchCode;
    });
  }, [patientDatabase, searchQuery]);

  // Cross-tab search counts when searching in Booked tab
  const matchingInClinicFromBookedSearch = useMemo(() => {
    const q = bookedSearchQuery.toLowerCase().trim();
    if (!q) return 0;
    const cleanQ = q.replace(/\D/g, '');
    return rawInClinicAppointments.filter(a => {
      const cleanPhone = (a.patientPhone || '').replace(/\D/g, '');
      return (cleanQ && cleanPhone.includes(cleanQ)) || (a.patientName || '').toLowerCase().includes(q);
    }).length;
  }, [rawInClinicAppointments, bookedSearchQuery]);

  const matchingDbFromBookedSearch = useMemo(() => {
    const q = bookedSearchQuery.toLowerCase().trim();
    if (!q) return 0;
    const cleanQ = q.replace(/\D/g, '');
    return patientDatabase.filter(r => {
      const cleanPhone = (r.patientPhone || '').replace(/\D/g, '');
      return (cleanQ && cleanPhone.includes(cleanQ)) || (r.patientName || '').toLowerCase().includes(q);
    }).length;
  }, [patientDatabase, bookedSearchQuery]);

  // ─── ACTION 1: CONFIRM APPOINTMENT WHEN PATIENT ARRIVES ───────────────────
  const handleConfirmArrival = async (appointmentId: string) => {
    // 1. Instantly update local state
    setInClinicIds(prev => prev.includes(appointmentId) ? prev : [...prev, appointmentId]);

    // 2. Persist to Supabase in_clinic_queue
    try {
      await supabase.from('in_clinic_queue').upsert({ appointment_id: appointmentId });
    } catch (err) {
      console.warn('in_clinic_queue upsert error:', err);
    }

    // 3. Call context confirm function
    try {
      confirmAppointmentByDoctor(appointmentId);
    } catch (e) {
      console.warn('confirmAppointmentByDoctor call:', e);
    }

    // 4. Navigate to In-Clinic tab
    setActiveTab('in_clinic');
  };

  // ─── ACTION 2: MARK TREATED (DELETES FROM QUEUE -> ADDS TO SUPABASE DATABASE) ─────
  const handleMarkTreated = async (appointment: Appointment, customNotes?: string) => {
    const serviceName = services.find(s => s.id === appointment.serviceId)?.name || appointment.primaryComplaint || 'General Dental Treatment';
    const doctorName = doctors.find(d => d.id === appointment.doctorId)?.name || 'Dr. Vijai';
    const recordId = `rec-${Date.now()}`;

    const newRecord: TreatedPatientRecord = {
      id: recordId,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      source: appointment.paymentMethod === 'Insurance' ? 'WhatsApp' : 'Website',
      serviceName,
      treatedDate: new Date().toISOString().split('T')[0],
      treatedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      doctorName,
      doctorNotes: customNotes || 'Procedure successfully completed at clinic. Post-op instructions given.',
      confirmationCode: appointment.confirmationCode
    };

    // 1. Save to Supabase patient_records (permanent storage)
    try {
      await supabase.from('patient_records').insert({
        id: newRecord.id,
        patient_name: newRecord.patientName,
        patient_phone: newRecord.patientPhone,
        source: newRecord.source,
        service_name: newRecord.serviceName,
        treated_date: newRecord.treatedDate,
        treated_time: newRecord.treatedTime,
        doctor_name: newRecord.doctorName,
        doctor_notes: newRecord.doctorNotes,
        confirmation_code: newRecord.confirmationCode || ''
      });
    } catch (err) {
      console.warn('patient_records insert error:', err);
    }

    // 2. Update local state immediately for instant UI feedback
    setPatientDatabase(prev => [newRecord, ...prev]);

    // 3. Remove from in_clinic_queue in Supabase
    try {
      await supabase.from('in_clinic_queue').delete().eq('appointment_id', appointment.id);
    } catch {}
    setInClinicIds(prev => prev.filter(id => id !== appointment.id));

    // 4. Complete and delete from appointments queue
    try { completeAppointment(appointment.id, customNotes); } catch {}
    try { await deleteAppointment(appointment.id); } catch {}

    // 5. Switch to database view
    setActiveTab('database');
  };

  // ─── ACTION 3: CANCEL & TRIGGER WHATSAPP BOT NOTIFICATION ────────────────
  const handleExecuteCancelWithWhatsApp = async () => {
    if (!cancelTarget) return;

    const patientName = cancelTarget.patientName;
    const phone = cancelTarget.patientPhone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;

    // WhatsApp Bot message giving the doctor's phone number as requested
    const message = `Hello ${patientName},\n\nThis is an automated update from Lavanya Dental Clinic.\n\nYour appointment scheduled for ${cancelTarget.date} at ${cancelTarget.timeSlot} has been cancelled by the doctor.\nReason: ${cancellationReason}\n\nPlease contact Dr. Vijai directly at +91 9885611128 to reschedule your visit or for any clinical questions.\n\nLavanya Dental Clinic\nContact: 9885611128\nAddress: PG Road, Hyderabad`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    // Delete or update appointment status
    await deleteAppointment(cancelTarget.id);

    // Close modal
    setCancelTarget(null);

    // Open WhatsApp to notify client directly
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // ─── ACTION 3.5: SEND WHATSAPP APPOINTMENT REMINDER ───────────────────────
  const generateReminderMessage = (apt: Appointment) => {
    const svc = services.find(s => s.id === apt.serviceId);
    const doc = doctors.find(d => d.id === apt.doctorId);
    const treatmentName = svc?.name || apt.primaryComplaint || 'General Dental Consultation';
    const doctorName = doc?.name || 'Dr. Vijai';

    return `Hello ${apt.patientName},

This is a friendly reminder from *Lavanya Dental Clinic* regarding your dental appointment today:

📅 *Date:* ${apt.date}
⏰ *Time Slot:* ${apt.timeSlot}
🩺 *Treatment:* ${treatmentName}
👨‍⚕️ *Doctor:* ${doctorName}
📍 *Location:* Lavanya Dental Care Pavilion, PG Road, Secunderabad
🗺️ *Google Maps:* https://maps.google.com/maps?cid=14113866403058578443

⚠️ *Helpful Note:* Please arrive 5–10 minutes before your scheduled slot. If you need any assistance, directions, or wish to reschedule, please reply here or call *+91 8555052843* / *9885611128*.

We look forward to seeing you today! 😊
— Team Lavanya Dental`;
  };

  const handleSendReminder = (apt: Appointment, customText?: string) => {
    const message = customText || generateReminderMessage(apt);
    const phone = cleanWhatsAppPhone(apt.patientPhone);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Track that reminder was sent today with timestamp
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRemindedMap(prev => {
      const updated = { ...prev, [apt.id]: timeStr };
      try {
        localStorage.setItem('lavanya_reminded_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Close preview modal if open
    setReminderTarget(null);

    // Open WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReminderClick = (apt: Appointment) => {
    if (skipReminderPreview) {
      handleSendReminder(apt);
    } else {
      setReminderTarget(apt);
      setCustomReminderMessage(generateReminderMessage(apt));
      setCopiedReminder(false);
    }
  };

  const handleCopyReminder = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReminder(true);
      setTimeout(() => setCopiedReminder(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  // ─── ACTION 4: DELETE ANYTIME (FROM BOOKED OR DATABASE) ───────────────────
  const handleDeleteBooked = async (appointmentId: string, patientName: string) => {
    if (window.confirm(`Are you sure you want to delete the booking for ${patientName}?`)) {
      await deleteAppointment(appointmentId);
    }
  };

  const handleDeleteFromDatabase = async (recordId: string, patientName: string) => {
    if (window.confirm(`Delete record for ${patientName} from patient database?`)) {
      // Delete from Supabase
      try {
        await supabase.from('patient_records').delete().eq('id', recordId);
      } catch (err) {
        console.warn('patient_records delete error:', err);
      }
      // Update local state immediately
      setPatientDatabase(prev => prev.filter(r => r.id !== recordId));
    }
  };

  // ─── ACTION 5: MANUAL ADD BOOKING ─────────────────────────────────────────
  const handleAddNewBooking = async () => {
    const phone = newPatientPhone.trim();
    if (!phone) {
      alert('Please enter patient phone number.');
      return;
    }

    setIsSubmittingBooking(true);
    const name = newPatientName.trim() || `Patient (${phone.slice(-4)})`;
    const activeServiceId = newServiceId || services[0]?.id || 'serv-teeth-whitening';
    const svc = services.find(s => s.id === activeServiceId);
    const activeDoctorId = doctors[0]?.id || 'doc-1';

    try {
      await createAppointment({
        patientName: name,
        patientPhone: phone,
        patientEmail: 'patient@lavanyadental.in',
        doctorId: activeDoctorId,
        serviceId: activeServiceId,
        date: newDate || new Date().toISOString().split('T')[0],
        timeSlot: newTimeSlot || '11:00 AM',
        primaryComplaint: newComplaint || svc?.name || 'Dental Consultation',
        medicalHistory: {
          hasAllergies: false,
          hasHeartCondition: false,
          hasDiabetes: false,
          hasBleedingDisorder: false,
          isPregnant: false,
          previousDentalAnxiety: false,
        },
        depositAmount: 0,
        depositPaid: false,
        paymentMethod: newBookingSource === 'WhatsApp' ? 'Insurance' : 'Clinic',
        otpVerified: true
      });

      setShowAddModal(false);
      setNewPatientName('');
      setNewPatientPhone('');
      setNewComplaint('Routine consultation');
      setBookedSearchQuery(''); // Clear search so the newly added appointment is visible immediately
      setActiveTab('booked');
    } catch (err) {
      console.error('Error creating appointment:', err);
      setShowAddModal(false);
      setBookedSearchQuery('');
      setActiveTab('booked');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-slate-800 font-sans selection:bg-emerald-200">
      
      {/* ══════════════════════════════════════════════════════════════════════════
          TOP HEALVO-STYLE HEADER
      ══════════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            
            {/* Clinic Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#064E3B] flex items-center justify-center shadow-md shadow-emerald-900/10 text-white shrink-0">
                <Stethoscope className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight font-display">
                    Lavanya Dental
                  </h1>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Admin Panel
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Dr. Vijai • Direct Doctor Helpline: 9885611128
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Back to Website Button */}
              <button
                onClick={onBackToWebsite || onLogout}
                className="flex items-center gap-1 bg-white hover:bg-stone-100 text-slate-700 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border border-stone-200 shadow-2xs hover:border-slate-300"
                title="View the public clinic website"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Website</span>
              </button>

              {/* Manual Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 sm:px-3 sm:py-2 flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-stone-200 active:scale-95 disabled:opacity-60"
                title="Refresh appointments and sync with database"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Refresh</span>
              </button>

              {/* + New Booking Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 sm:gap-1.5 bg-[#064E3B] hover:bg-emerald-800 text-white px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ New Booking</span>
                <span className="sm:hidden">Booking</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                title="Log Out of Admin Panel"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* ════════════════════════════════════════════════════════════════════
              3 CLEAN SIMPLE TABS
          ════════════════════════════════════════════════════════════════════ */}
          {/* 3 CLEAN TABS — responsive grid */}
          <div className="py-2.5 border-t border-stone-100">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">

              {/* Tab 1: Booked */}
              <button
                onClick={() => setActiveTab('booked')}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'booked'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">1. Booked</span>
                <span className="sm:hidden">Booked</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'booked' ? 'bg-emerald-950 text-emerald-200' : 'bg-stone-200 text-slate-700'
                }`}>
                  {bookedAppointments.length}
                </span>
              </button>

              {/* Tab 2: In-Clinic */}
              <button
                onClick={() => setActiveTab('in_clinic')}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'in_clinic'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">2. In-Clinic</span>
                <span className="sm:hidden">In-Clinic</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'in_clinic' ? 'bg-emerald-950 text-emerald-200' : 'bg-stone-200 text-slate-700'
                }`}>
                  {inClinicAppointments.length}
                </span>
              </button>

              {/* Tab 3: Patient Records Database */}
              <button
                onClick={() => setActiveTab('database')}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'database'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
                }`}
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">3. Database</span>
                <span className="sm:hidden">Database</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'database' ? 'bg-emerald-950 text-emerald-200' : 'bg-stone-200 text-slate-700'
                }`}>
                  {patientDatabase.length}
                </span>
              </button>

            </div>
          </div>

        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ──────────────────────────────────────────────────────────────────────
            TAB 1: BOOKED APPOINTMENTS (Website & WhatsApp Bookings)
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'booked' && (
          <div className="space-y-4">
            
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                    Booked Appointments
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Incoming bookings from Website &amp; WhatsApp. When patient arrives at the clinic, click <strong>"Confirm &amp; Arrived"</strong> to start treatment.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 self-start sm:self-auto">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    {bookedSearchQuery 
                      ? `${bookedAppointments.length} matching result${bookedAppointments.length === 1 ? '' : 's'}` 
                      : `${bookedAppointments.length} Bookings Awaiting Arrival`}
                  </span>
                </div>
              </div>

              {/* Search Bar for Booked Appointments */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by client phone number (e.g. 7396561933), patient name, or booking code..."
                  value={bookedSearchQuery}
                  onChange={(e) => setBookedSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
                />
                {bookedSearchQuery && (
                  <button
                    onClick={() => setBookedSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Cross-tab search hints if searched phone number or name is in In-Clinic or Database */}
              {bookedSearchQuery && bookedAppointments.length === 0 && (matchingInClinicFromBookedSearch > 0 || matchingDbFromBookedSearch > 0) && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-amber-900 font-medium">
                    No matching bookings in Booked list. But records were found in other sections:
                  </span>
                  <div className="flex items-center gap-2">
                    {matchingInClinicFromBookedSearch > 0 && (
                      <button
                        onClick={() => {
                          setInClinicSearchQuery(bookedSearchQuery);
                          setActiveTab('in_clinic');
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>In-Clinic ({matchingInClinicFromBookedSearch}) →</span>
                      </button>
                    )}
                    {matchingDbFromBookedSearch > 0 && (
                      <button
                        onClick={() => {
                          setSearchQuery(bookedSearchQuery);
                          setActiveTab('database');
                        }}
                        className="bg-stone-800 hover:bg-stone-900 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>Patient Database ({matchingDbFromBookedSearch}) →</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* List of Booked Appointments */}
            {bookedAppointments.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-slate-400">
                  {bookedSearchQuery ? <Search className="w-6 h-6 text-slate-500" /> : <Calendar className="w-6 h-6" />}
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  {bookedSearchQuery ? `No booked appointments matching "${bookedSearchQuery}"` : 'No pending bookings right now'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {bookedSearchQuery
                    ? 'Check the phone digits or try searching in the In-Clinic or Patient Database tabs.'
                    : 'New appointments booked by patients on the website or via WhatsApp will automatically appear here.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  {bookedSearchQuery && (
                    <button
                      onClick={() => setBookedSearchQuery('')}
                      className="bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer border border-stone-200 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#064E3B] hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors"
                  >
                    + Add Test Booking
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookedAppointments.map(apt => {
                  const svc = services.find(s => s.id === apt.serviceId);
                  const isWhatsAppSource = apt.paymentMethod === 'Insurance'; // Tagged as WhatsApp booking
                  return (
                    <div 
                      key={apt.id} 
                      className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all space-y-4"
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-400">
                              #{apt.confirmationCode || 'LD-BOOK'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isWhatsAppSource 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-teal-50 text-teal-800 border border-teal-200'
                            }`}>
                              {isWhatsAppSource ? <MessageSquare className="w-3 h-3 text-emerald-600" /> : <ExternalLink className="w-3 h-3 text-teal-600" />}
                              <span>{isWhatsAppSource ? 'WhatsApp Booking' : 'Website Booking'}</span>
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900 mt-1 font-display">
                            {apt.patientName}
                          </h3>
                        </div>

                        {/* Direct Call & WhatsApp Contact */}
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${apt.patientPhone}`}
                            className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-xl transition-colors"
                            title="Call Patient"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{apt.patientPhone}</span>
                          </a>

                          <button
                            onClick={() => {
                              setReminderTarget(apt);
                              setCustomReminderMessage(generateReminderMessage(apt));
                              setCopiedReminder(false);
                            }}
                            className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                            title="Preview & Customize WhatsApp Reminder"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="bg-stone-50 rounded-2xl p-3 text-xs space-y-2 border border-stone-200/80">
                        <div className="flex items-center justify-between text-slate-700 font-semibold">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Date &amp; Slot:
                          </span>
                          <span className="font-bold text-slate-900">{apt.date} • {apt.timeSlot}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-700 font-semibold">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-700" /> Treatment:
                          </span>
                          <span className="font-bold text-slate-900 truncate max-w-[200px]">
                            {svc?.name || apt.primaryComplaint || 'General Dental Checkup'}
                          </span>
                        </div>

                        {apt.primaryComplaint && (
                          <div className="text-[11px] text-slate-600 pt-1 border-t border-stone-200">
                            <span className="text-slate-400 font-medium">Complaint: </span>
                            {apt.primaryComplaint}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Confirm Arrived | WhatsApp Reminder | Cancel | Delete */}
                      <div className="space-y-2 pt-1">
                        {/* 1. Primary: Confirm Arrived */}
                        <button
                          onClick={() => handleConfirmArrival(apt.id)}
                          className="w-full bg-[#064E3B] hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <UserCheck className="w-4 h-4 text-emerald-300" />
                          <span>Confirm &amp; Patient Arrived</span>
                        </button>

                        {/* 2. Secondary Row: WhatsApp Reminder | Cancel | Delete */}
                        <div className="flex items-center gap-2">
                          {/* WhatsApp Reminder Button */}
                          <button
                            onClick={() => handleReminderClick(apt)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border active:scale-98 shadow-2xs ${
                              remindedMap[apt.id]
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300/80 hover:border-emerald-500'
                            }`}
                            title={
                              remindedMap[apt.id]
                                ? `Reminder already sent today at ${remindedMap[apt.id]}. Click to open WhatsApp again.`
                                : 'Send WhatsApp appointment reminder to client'
                            }
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">
                              {remindedMap[apt.id] ? `✓ Reminded (${remindedMap[apt.id]})` : 'WhatsApp Reminder'}
                            </span>
                          </button>

                          {/* 2. Cancel (WhatsApp Bot notification with doctor number) */}
                          <button
                            onClick={() => setCancelTarget(apt)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            title="Cancel appointment and notify client via WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5 text-amber-700" />
                            <span>Cancel</span>
                          </button>

                          {/* 3. Delete anytime */}
                          <button
                            onClick={() => handleDeleteBooked(apt.id, apt.patientName)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="Delete booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────
            TAB 2: IN-CLINIC (PATIENT ARRIVED & TREATMENT IN PROGRESS)
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'in_clinic' && (
          <div className="space-y-4">
            
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                    In-Clinic (Arrived &amp; Treatment in Progress)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patients currently at the clinic. When treatment is finished, click <strong>"Treated"</strong> to complete it and save it into the permanent <strong>Patient Database</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {inClinicSearchQuery 
                      ? `${inClinicAppointments.length} matching result${inClinicAppointments.length === 1 ? '' : 's'}` 
                      : `${inClinicAppointments.length} Active in Operatory`}
                  </span>
                </div>
              </div>

              {/* Search Bar for In-Clinic Patients */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search active patients by phone number (e.g. 7396561933) or name..."
                  value={inClinicSearchQuery}
                  onChange={(e) => setInClinicSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
                />
                {inClinicSearchQuery && (
                  <button
                    onClick={() => setInClinicSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {inClinicAppointments.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-slate-400">
                  {inClinicSearchQuery ? <Search className="w-6 h-6 text-slate-500" /> : <UserCheck className="w-6 h-6" />}
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  {inClinicSearchQuery ? `No active patients matching "${inClinicSearchQuery}"` : 'No active patients in clinic right now'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {inClinicSearchQuery
                    ? 'Check the phone digits or try searching in the Booked or Database tabs.'
                    : 'When a patient arrives, go to the "Booked" tab and click "Confirm & Patient Arrived".'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  {inClinicSearchQuery && (
                    <button
                      onClick={() => setInClinicSearchQuery('')}
                      className="bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer border border-stone-200 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('booked')}
                    className="bg-[#064E3B] hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors"
                  >
                    Go to Booked Appointments
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inClinicAppointments.map(apt => {
                  const svc = services.find(s => s.id === apt.serviceId);
                  return (
                    <div 
                      key={apt.id}
                      className="bg-white rounded-3xl p-6 border-2 border-emerald-600 shadow-md space-y-4 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                            ● ARRIVED &amp; CONFIRMED
                          </span>
                          <h3 className="text-lg font-extrabold text-slate-900 mt-1.5 font-display">
                            {apt.patientName}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">{apt.patientPhone}</p>
                        </div>

                        <span className="font-mono text-xs font-bold text-slate-400 bg-stone-100 px-2 py-1 rounded-lg">
                          Slot: {apt.timeSlot}
                        </span>
                      </div>

                      <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-emerald-950">
                          <span>Treatment in progress:</span>
                          <span className="text-emerald-700">Dr. Vijai</span>
                        </div>
                        <p className="text-slate-700 font-semibold">
                          {svc?.name || apt.primaryComplaint || 'Oral & Maxillofacial Consultation'}
                        </p>
                      </div>

                      {/* Action buttons: Treated (Moves to DB) + Delete */}
                      <div className="flex items-center gap-2 pt-2">
                        {/* THE "TREATED" BUTTON */}
                        <button
                          onClick={() => {
                            const notes = prompt(`Enter clinical notes for ${apt.patientName} (Optional):`, 'Treatment successfully performed at clinic. Next review in 6 months.');
                            handleMarkTreated(apt, notes || undefined);
                          }}
                          className="flex-1 bg-[#064E3B] hover:bg-emerald-800 text-white py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>Treated (Finish &amp; Save)</span>
                        </button>

                        {/* Delete button anytime */}
                        <button
                          onClick={() => handleDeleteBooked(apt.id, apt.patientName)}
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors cursor-pointer border border-stone-200"
                          title="Delete from active queue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────
            TAB 3: PATIENT DATABASE (PERMANENT TREATED RECORDS ARCHIVE)
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                  Patient Records Database
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanent clinical records of all patients who received treatment at Lavanya Dental Clinic. Records can be deleted anytime.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, phone (e.g. 7396561933), or procedure..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-9 py-2 text-xs font-medium text-slate-800 outline-hidden focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Records List / Table */}
            {filteredDatabase.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-slate-400">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-700 text-sm">
                  {searchQuery ? `No patient records found matching "${searchQuery}"` : 'No patient records found'}
                </h3>
                <p className="text-xs text-slate-400">
                  {searchQuery ? 'Check the phone digits or try clearing your search query.' : 'Treated patients will automatically be archived here.'}
                </p>
                {searchQuery && (
                  <div className="pt-2">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer border border-stone-200"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDatabase.map(record => (
                  <div 
                    key={record.id}
                    className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-2xs hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Patient & Treatment Info */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-base font-display">
                          {record.patientName}
                        </h4>
                        <span className="text-xs font-mono font-bold text-slate-500 bg-stone-100 px-2 py-0.5 rounded-md">
                          {record.patientPhone}
                        </span>
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                          {record.source}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 font-semibold flex items-center gap-2 flex-wrap">
                        <span className="text-emerald-900 font-bold">{record.serviceName}</span>
                        <span>•</span>
                        <span className="text-slate-500">Treated on {record.treatedDate} ({record.treatedTime})</span>
                        <span>•</span>
                        <span className="text-slate-500">{record.doctorName}</span>
                      </div>

                      {record.doctorNotes && (
                        <p className="text-xs text-slate-500 font-medium pt-1 italic">
                          "{record.doctorNotes}"
                        </p>
                      )}
                    </div>

                    {/* Actions: WhatsApp Followup & Delete Option */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* WhatsApp Follow-up */}
                      <a
                        href={`https://wa.me/91${record.patientPhone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(record.patientName)}%2C%20this%20is%20Dr.%20Vijai%20from%20Lavanya%20Dental%20Clinic%20following%20up%20on%20your%20treatment.%20How%20are%20you%20feeling%20today%3F`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        title="Follow up on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Follow Up</span>
                      </a>

                      {/* Delete from Database anytime */}
                      <button
                        onClick={() => handleDeleteFromDatabase(record.id, record.patientName)}
                        className="flex items-center gap-1 bg-stone-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border border-stone-200 hover:border-rose-200"
                        title="Delete from database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: ADD NEW BOOKING / WALK-IN
      ══════════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 font-display">Add Appointment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Patient Full Name <span className="text-slate-400 font-normal lowercase">(optional - auto-named if blank)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anand Sharma (or leave blank)"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 7396561933"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Booking Source</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewBookingSource('Website')}
                    className={`py-2 text-xs font-bold rounded-xl border text-center cursor-pointer transition-all ${
                      newBookingSource === 'Website' ? 'bg-[#064E3B] text-white border-[#064E3B]' : 'bg-stone-50 text-slate-700 border-stone-200'
                    }`}
                  >
                    Website Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewBookingSource('WhatsApp')}
                    className={`py-2 text-xs font-bold rounded-xl border text-center cursor-pointer transition-all ${
                      newBookingSource === 'WhatsApp' ? 'bg-[#064E3B] text-white border-[#064E3B]' : 'bg-stone-50 text-slate-700 border-stone-200'
                    }`}
                  >
                    WhatsApp Booking
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service / Procedure</label>
                <select
                  value={newServiceId}
                  onChange={(e) => setNewServiceId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-medium outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Slot</label>
                  <input
                    type="text"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    placeholder="11:00 AM"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-medium outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddNewBooking}
                disabled={isSubmittingBooking}
                className="w-full bg-[#064E3B] hover:bg-emerald-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold transition-all mt-2 cursor-pointer shadow-sm active:scale-98"
              >
                {isSubmittingBooking ? 'Adding to Booked List...' : 'Add to Booked List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: CANCEL APPOINTMENT & NOTIFY PATIENT VIA WHATSAPP BOT
      ══════════════════════════════════════════════════════════════════════════ */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative space-y-4">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold font-display text-slate-900">
                  Cancel &amp; Send WhatsApp Notification
                </h3>
              </div>
              <button onClick={() => setCancelTarget(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Cancelling appointment for <strong>{cancelTarget.patientName}</strong> ({cancelTarget.patientPhone}).
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <span>WhatsApp Bot Notification Message:</span>
                </div>
                <p className="italic text-slate-700">
                  "Your appointment has been cancelled by the doctor. Please contact Dr. Vijai directly at <strong>+91 9885611128</strong> to reschedule."
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">Reason for Cancellation</label>
              <textarea
                rows={2}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-800 resize-none font-medium"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold"
              >
                Go Back
              </button>

              <button
                onClick={handleExecuteCancelWithWhatsApp}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Cancel &amp; Open WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: WHATSAPP APPOINTMENT REMINDER
      ══════════════════════════════════════════════════════════════════════════ */}
      {reminderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 relative space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <WhatsAppIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">
                    Send WhatsApp Appointment Reminder
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Notify client with pre-written appointment details for today
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setReminderTarget(null)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Patient Badge & Slot */}
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">{reminderTarget.patientName}</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                  {reminderTarget.date} • {reminderTarget.timeSlot}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 text-[11px]">
                <span className="truncate max-w-[240px]">
                  Treatment: <strong>{services.find(s => s.id === reminderTarget.serviceId)?.name || reminderTarget.primaryComplaint || 'General Dental Checkup'}</strong>
                </span>
                <a href={`tel:${reminderTarget.patientPhone}`} className="text-slate-700 font-mono font-bold hover:underline flex items-center gap-1 shrink-0">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {reminderTarget.patientPhone}
                </a>
              </div>
            </div>

            {/* Pre-written Message Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Pre-written Reminder Message (WhatsApp)
                </label>
                <button
                  type="button"
                  onClick={() => handleCopyReminder(customReminderMessage)}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedReminder ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={8}
                value={customReminderMessage}
                onChange={(e) => setCustomReminderMessage(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-slate-800 resize-none font-sans leading-relaxed focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400">
                You can review or edit the message above before sending. Clicking "Send via WhatsApp" opens WhatsApp with this text pre-filled.
              </p>
            </div>

            {/* Direct Send Preference Checkbox */}
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                checked={skipReminderPreview}
                onChange={(e) => {
                  setSkipReminderPreview(e.target.checked);
                  try {
                    localStorage.setItem('lavanya_skip_reminder_preview', e.target.checked ? 'true' : 'false');
                  } catch {}
                }}
                className="w-3.5 h-3.5 rounded-sm text-emerald-600 accent-emerald-600 cursor-pointer"
              />
              <span>Direct send: skip this preview next time and open WhatsApp immediately</span>
            </label>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setReminderTarget(null)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleSendReminder(reminderTarget, customReminderMessage)}
                className="flex-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>Send via WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
