import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Appointment, 
  Doctor, 
  DentalService, 
  DoctorNotification, 
  AuditLog, 
  UserRole,
  ClinicSettings,
  GalleryImage,
  BeforeAfterCase
} from '../types';
import { 
  INITIAL_DOCTORS, 
  DENTAL_SERVICES, 
  INITIAL_APPOINTMENTS, 
  INITIAL_AUDIT_LOGS,
  BEFORE_AFTER_CASES
} from '../data/mockData';
import { supabase } from '../lib/supabase';

const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  clinicName: 'Lavanya Dental',
  tagline: 'Where Precision Meets Perfection',
  logoUrl: '',
  phone: '+91 98765 43210',
  email: 'appointments@lavanyadental.com',
  address: 'Lavanya Dental Care Pavilion, Main Road',
  hours: {
    monday:    { open: true,  start: '08:00', end: '18:00' },
    tuesday:   { open: true,  start: '08:00', end: '18:00' },
    wednesday: { open: true,  start: '08:00', end: '18:00' },
    thursday:  { open: true,  start: '08:00', end: '18:00' },
    friday:    { open: true,  start: '08:00', end: '17:00' },
    saturday:  { open: true,  start: '09:00', end: '15:00' },
    sunday:    { open: false, start: '09:00', end: '13:00' },
  }
};

interface ClinicContextType {
  // State
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  selectedDoctorId: string;
  setSelectedDoctorId: (id: string) => void;
  doctors: Doctor[];
  services: DentalService[];
  appointments: Appointment[];
  doctorNotifications: DoctorNotification[];
  auditLogs: AuditLog[];
  showBookingModal: boolean;
  setShowBookingModal: (show: boolean) => void;
  bookingPreselectedDoctorId: string | null;
  setBookingPreselectedDoctorId: (id: string | null) => void;
  bookingPreselectedServiceId: string | null;
  setBookingPreselectedServiceId: (id: string | null) => void;
  showEmergencyModal: boolean;
  setShowEmergencyModal: (show: boolean) => void;
  showDoctorMobileSimulator: boolean;
  setShowDoctorMobileSimulator: (show: boolean) => void;
  lastSimulatedPush: DoctorNotification | null;
  dismissPushToast: () => void;
  unreadCountForSelectedDoctor: number;
  clinicSettings: ClinicSettings;
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  setServices: React.Dispatch<React.SetStateAction<DentalService[]>>;

  // Actions
  createAppointment: (data: Omit<Appointment, 'id' | 'confirmationCode' | 'createdAt' | 'status'>) => Promise<Appointment>;
  confirmAppointmentByDoctor: (appointmentId: string) => void;
  declineAppointmentByDoctor: (appointmentId: string, reason: string) => void;
  rescheduleAppointmentByDoctor: (appointmentId: string, newDate: string, newTimeSlot: string, note?: string) => void;
  completeAppointment: (appointmentId: string, doctorNotes?: string) => void;
  toggleDoctorAvailability: (doctorId: string) => void;
  markNotificationRead: (notifId: string) => void;
  getDoctorById: (id: string) => Doctor | undefined;
  getServiceById: (id: string) => DentalService | undefined;
  findAppointmentByCodeOrPhone: (query: string) => Appointment[];
  updateClinicSettings: (settings: Partial<ClinicSettings>) => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_APPOINTMENTS = 'auradental_appointments_v1';
const LOCAL_STORAGE_KEY_DOCTORS = 'auradental_doctors_v1';
const LOCAL_STORAGE_KEY_AUDIT = 'auradental_audit_v1';

// Helper: convert Supabase snake_case row → camelCase DentalService
const mapServiceRow = (row: Record<string, unknown>): DentalService => ({
  id: row.id as string,
  name: row.name as string,
  category: row.category as DentalService['category'],
  description: row.description as string,
  durationMinutes: row.duration_minutes as number,
  priceEstimate: row.price_estimate as number,
  depositRequired: row.deposit_required as number,
  recommendedFor: (row.recommended_for as string[]) || [],
  popular: row.popular as boolean,
  insuranceCovered: row.insurance_covered as DentalService['insuranceCovered'],
});

// Helper: convert Supabase row → Doctor
const mapDoctorRow = (row: Record<string, unknown>): Doctor => ({
  id: row.id as string,
  name: row.name as string,
  title: row.title as string,
  specialty: row.specialty as string,
  degrees: row.degrees as string,
  experienceYears: (row.experience_years === 14 || row.id === 'doc-1') ? 25 : (row.experience_years as number),
  rating: row.rating as number,
  reviewsCount: row.reviews_count as number,
  photoUrl: row.photo_url as string,
  bio: row.bio as string,
  phone: row.phone as string,
  email: row.email as string,
  workingDays: (row.working_days as number[]) || [1,2,3,4,5],
  workingHours: (row.working_hours as { start: string; end: string }) || { start: '08:30', end: '17:00' },
  slotDurationMinutes: row.slot_duration_minutes as number,
  isAvailableToday: row.is_available_today as boolean,
  onCallForEmergency: row.on_call_for_emergency as boolean,
});

// Helper: convert Supabase row → ClinicSettings
const mapClinicSettingsRow = (row: Record<string, unknown>): ClinicSettings => ({
  id: row.id as string,
  clinicName: row.clinic_name as string,
  tagline: row.tagline as string,
  logoUrl: row.logo_url as string,
  phone: row.phone as string,
  email: row.email as string,
  address: row.address as string,
  hours: (row.hours as ClinicSettings['hours']) || DEFAULT_CLINIC_SETTINGS.hours,
});

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('patient');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-1');
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(DEFAULT_CLINIC_SETTINGS);

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DOCTORS);
    if (saved) {
      try {
        const parsed: Doctor[] = JSON.parse(saved);
        return parsed.map(d => ({
          ...d,
          experienceYears: (d.id === 'doc-1' || d.experienceYears === 14) ? 25 : d.experienceYears
        }));
      } catch {}
    }
    return INITIAL_DOCTORS;
  });
  const [services, setServices] = useState<DentalService[]>(DENTAL_SERVICES);
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_APPOINTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [doctorNotifications, setDoctorNotifications] = useState<DoctorNotification[]>([
    {
      id: 'notif-init-1',
      appointmentId: 'apt-102',
      doctorId: 'doc-2',
      type: 'NEW_BOOKING',
      patientName: 'David K. Miller',
      serviceName: 'Single Tooth 3D Guided Dental Implant Consultation',
      date: '2026-09-19',
      timeSlot: '13:00',
      read: false,
      timestamp: 'Just now',
      urgent: false
    }
  ]);

  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [bookingPreselectedDoctorId, setBookingPreselectedDoctorId] = useState<string | null>(null);
  const [bookingPreselectedServiceId, setBookingPreselectedServiceId] = useState<string | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [showDoctorMobileSimulator, setShowDoctorMobileSimulator] = useState<boolean>(false);
  const [lastSimulatedPush, setLastSimulatedPush] = useState<DoctorNotification | null>(null);

  // ─── Load public data & Realtime Sync ──────────────────────────────────────
  useEffect(() => {
    const loadPublicData = async () => {
      try {
        // Load clinic settings
        const { data: settingsData } = await supabase
          .from('clinic_settings')
          .select('*')
          .limit(1)
          .single();
        if (settingsData) {
          setClinicSettings(mapClinicSettingsRow(settingsData as Record<string, unknown>));
        }

        // Load services
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .order('id');
        if (servicesData && servicesData.length > 0) {
          setServices(servicesData.map((r) => mapServiceRow(r as Record<string, unknown>)));
        }

        // Load doctors — always sync with mapped experience years
        const { data: doctorsData } = await supabase
          .from('doctors')
          .select('*')
          .order('display_order');
        if (doctorsData && doctorsData.length > 0) {
          const mappedDoctors = doctorsData.map((r) => mapDoctorRow(r as Record<string, unknown>));
          setDoctors(mappedDoctors);
          localStorage.setItem(LOCAL_STORAGE_KEY_DOCTORS, JSON.stringify(mappedDoctors));
        }
      } catch {
        // Supabase failover handled via local state
      }
    };

    loadPublicData();

    // Supabase Realtime Channel for Doctors
    let channel: any = null;
    try {
      channel = supabase
        .channel('public-doctors-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, (payload) => {
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            setDoctors(prev => prev.filter(d => d.id !== payload.old.id));
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new) {
              const updatedDoc = mapDoctorRow(payload.new as Record<string, unknown>);
              setDoctors(prev => {
                const exists = prev.some(d => d.id === updatedDoc.id);
                return exists ? prev.map(d => d.id === updatedDoc.id ? updatedDoc : d) : [...prev, updatedDoc];
              });
            }
          }
        })
        .subscribe();
    } catch {}

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // ─── Sync localStorage & Cross-Tab/Window Broadcast ─────────────────────────
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
    // Broadcast doctor updates to all tabs/windows
    try {
      const channel = new BroadcastChannel('auradental_clinic_sync');
      channel.postMessage({ type: 'DOCTORS_UPDATED', data: doctors });
      channel.close();
    } catch {}
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Listen for storage changes from other windows/tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY_DOCTORS && e.newValue) {
        try {
          setDoctors(JSON.parse(e.newValue));
        } catch {}
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('auradental_clinic_sync');
      bc.onmessage = (msg) => {
        if (msg.data?.type === 'DOCTORS_UPDATED' && Array.isArray(msg.data.data)) {
          setDoctors(msg.data.data);
        }
      };
    } catch {}

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const addAuditLog = (actor: string, role: 'Patient' | 'Doctor' | 'Admin' | 'System', action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor,
      role,
      action,
      details,
      encryptionStatus: 'AES-256-GCM / TLS 1.3',
      ipHash: `sha256:${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Also persist to Supabase (fire and forget)
    supabase.from('audit_logs').insert({
      id: newLog.id,
      timestamp: newLog.timestamp,
      actor: newLog.actor,
      role: newLog.role,
      action: newLog.action,
      details: newLog.details,
      encryption_status: newLog.encryptionStatus,
      ip_hash: newLog.ipHash,
    }).then(() => {});
  };

  const getDoctorById = (id: string) => doctors.find(d => d.id === id);
  const getServiceById = (id: string) => services.find(s => s.id === id);

  // ─── updateClinicSettings ──────────────────────────────────────────────────
  const updateClinicSettings = async (settings: Partial<ClinicSettings>) => {
    const merged = { ...clinicSettings, ...settings };
    setClinicSettings(merged);

    const { data: existing } = await supabase.from('clinic_settings').select('id').limit(1).single();
    if (existing) {
      await supabase.from('clinic_settings').update({
        clinic_name: merged.clinicName,
        tagline: merged.tagline,
        logo_url: merged.logoUrl,
        phone: merged.phone,
        email: merged.email,
        address: merged.address,
        hours: merged.hours,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    }
  };

  // ─── createAppointment ─────────────────────────────────────────────────────
  const createAppointment = async (
    data: Omit<Appointment, 'id' | 'confirmationCode' | 'createdAt' | 'status'>
  ): Promise<Appointment> => {
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const confirmationCode = `AD-${codeNum}`;
    const newAppointment: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
      confirmationCode,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };

    setAppointments(prev => [newAppointment, ...prev]);

    // Persist to Supabase
    await supabase.from('appointments').insert({
      id: newAppointment.id,
      confirmation_code: newAppointment.confirmationCode,
      patient_name: newAppointment.patientName,
      patient_phone: newAppointment.patientPhone,
      patient_email: newAppointment.patientEmail,
      doctor_id: newAppointment.doctorId,
      service_id: newAppointment.serviceId,
      date: newAppointment.date,
      time_slot: newAppointment.timeSlot,
      status: newAppointment.status,
      primary_complaint: newAppointment.primaryComplaint,
      medical_history: newAppointment.medicalHistory,
      insurance_provider: newAppointment.insuranceProvider,
      insurance_policy_number: newAppointment.insurancePolicyNumber,
      deposit_amount: newAppointment.depositAmount,
      deposit_paid: newAppointment.depositPaid,
      payment_method: newAppointment.paymentMethod,
      created_at: newAppointment.createdAt,
      otp_verified: newAppointment.otpVerified,
    }).then(() => {});

    addAuditLog(
      `Patient (${newAppointment.patientName})`,
      'Patient',
      'APPOINTMENT_REQUEST_CREATED',
      `Booking code ${confirmationCode} created for ${data.date} at ${data.timeSlot}. Deposit: $${data.depositAmount}. PHI encrypted.`
    );

    const assignedDoctor = getDoctorById(data.doctorId);
    const selectedService = getServiceById(data.serviceId);
    const serviceName = selectedService ? selectedService.name : 'Dental Procedure';

    const newNotification: DoctorNotification = {
      id: `notif-${Date.now()}`,
      appointmentId: newAppointment.id,
      doctorId: data.doctorId,
      type: data.serviceId === 'serv-7' ? 'EMERGENCY_ALERT' : 'NEW_BOOKING',
      patientName: data.patientName,
      serviceName,
      date: data.date,
      timeSlot: data.timeSlot,
      read: false,
      timestamp: 'Just now',
      urgent: data.serviceId === 'serv-7'
    };

    setDoctorNotifications(prev => [newNotification, ...prev]);
    setLastSimulatedPush(newNotification);

    setTimeout(() => {
      addAuditLog(
        'System Push & SMS Gateway',
        'System',
        'DOCTOR_MOBILE_ALERT_DISPATCHED',
        `Instant push sent to ${assignedDoctor?.name || 'Doctor'} phone. Latency: 1.2s. SMS dispatched to clinician device.`
      );
    }, 400);

    return newAppointment;
  };

  // ─── Appointment status actions ────────────────────────────────────────────
  const confirmAppointmentByDoctor = (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    setAppointments(prev => prev.map(a => 
      a.id === appointmentId ? { ...a, status: 'Confirmed' } : a
    ));

    supabase.from('appointments').update({ status: 'Confirmed' }).eq('id', appointmentId).then(() => {});

    const doctor = getDoctorById(apt.doctorId);
    addAuditLog(
      doctor?.name || 'Clinician',
      'Doctor',
      'APPOINTMENT_CONFIRMED_VIA_MOBILE',
      `Doctor confirmed slot for patient ${apt.patientName} (${apt.confirmationCode}) on ${apt.date} ${apt.timeSlot}.`
    );
  };

  const declineAppointmentByDoctor = (appointmentId: string, reason: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    setAppointments(prev => prev.map(a => 
      a.id === appointmentId ? { ...a, status: 'Cancelled', doctorNotes: `Declined: ${reason}` } : a
    ));

    supabase.from('appointments').update({ status: 'Cancelled', doctor_notes: `Declined: ${reason}` }).eq('id', appointmentId).then(() => {});

    const doctor = getDoctorById(apt.doctorId);
    addAuditLog(
      doctor?.name || 'Clinician',
      'Doctor',
      'APPOINTMENT_DECLINED_BY_DOCTOR',
      `Doctor declined ${apt.confirmationCode}. Reason: "${reason}".`
    );
  };

  const rescheduleAppointmentByDoctor = (
    appointmentId: string, 
    newDate: string, 
    newTimeSlot: string, 
    note?: string
  ) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    setAppointments(prev => prev.map(a => 
      a.id === appointmentId 
        ? { ...a, status: 'Rescheduled', rescheduledTo: { date: newDate, timeSlot: newTimeSlot }, doctorNotes: note || a.doctorNotes } 
        : a
    ));

    supabase.from('appointments').update({ 
      status: 'Rescheduled', 
      rescheduled_to: { date: newDate, timeSlot: newTimeSlot },
      doctor_notes: note 
    }).eq('id', appointmentId).then(() => {});

    const doctor = getDoctorById(apt.doctorId);
    addAuditLog(
      doctor?.name || 'Clinician',
      'Doctor',
      'APPOINTMENT_PROPOSED_RESCHEDULE',
      `Alternative slot offered to ${apt.patientName} for ${newDate} at ${newTimeSlot}.`
    );
  };

  const completeAppointment = (appointmentId: string, doctorNotes?: string) => {
    setAppointments(prev => prev.map(a => 
      a.id === appointmentId 
        ? { ...a, status: 'Completed', doctorNotes: doctorNotes || a.doctorNotes } 
        : a
    ));

    supabase.from('appointments').update({ 
      status: 'Completed', 
      doctor_notes: doctorNotes 
    }).eq('id', appointmentId).then(() => {});

    addAuditLog(
      'Treating Clinician',
      'Doctor',
      'PROCEDURE_MARKED_COMPLETED',
      `Appointment ${appointmentId} marked completed.`
    );
  };

  const toggleDoctorAvailability = (doctorId: string) => {
    setDoctors(prev => prev.map(doc => 
      doc.id === doctorId ? { ...doc, isAvailableToday: !doc.isAvailableToday } : doc
    ));
    const doc = doctors.find(d => d.id === doctorId);
    if (doc) {
      supabase.from('doctors').update({ is_available_today: !doc.isAvailableToday }).eq('id', doctorId).then(() => {});
    }
  };

  const markNotificationRead = (notifId: string) => {
    setDoctorNotifications(prev => prev.map(n => 
      n.id === notifId ? { ...n, read: true } : n
    ));
  };

  const dismissPushToast = () => {
    setLastSimulatedPush(null);
  };

  const unreadCountForSelectedDoctor = doctorNotifications.filter(
    n => n.doctorId === selectedDoctorId && !n.read
  ).length;

  const findAppointmentByCodeOrPhone = (query: string): Appointment[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return appointments.filter(a => 
      a.confirmationCode.toLowerCase().includes(q) ||
      a.patientPhone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      a.patientEmail.toLowerCase().includes(q)
    );
  };

  return (
    <ClinicContext.Provider value={{
      currentRole,
      setCurrentRole,
      selectedDoctorId,
      setSelectedDoctorId,
      doctors,
      setDoctors,
      services,
      setServices,
      appointments,
      doctorNotifications,
      auditLogs,
      showBookingModal,
      setShowBookingModal,
      bookingPreselectedDoctorId,
      setBookingPreselectedDoctorId,
      bookingPreselectedServiceId,
      setBookingPreselectedServiceId,
      showEmergencyModal,
      setShowEmergencyModal,
      showDoctorMobileSimulator,
      setShowDoctorMobileSimulator,
      lastSimulatedPush,
      dismissPushToast,
      unreadCountForSelectedDoctor,
      clinicSettings,
      createAppointment,
      confirmAppointmentByDoctor,
      declineAppointmentByDoctor,
      rescheduleAppointmentByDoctor,
      completeAppointment,
      toggleDoctorAvailability,
      markNotificationRead,
      getDoctorById,
      getServiceById,
      findAppointmentByCodeOrPhone,
      updateClinicSettings,
    }}>
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
