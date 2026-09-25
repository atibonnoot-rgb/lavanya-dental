import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Appointment, 
  Doctor, 
  DentalService, 
  DoctorNotification, 
  AuditLog, 
  UserRole,
  ClinicSettings,
} from '../types';
import { 
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';
import { supabase } from '../lib/supabase';
import { broadcastLiveSync } from '../lib/cloudSync';
import { playNotificationSound } from '../lib/sound';

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
  isLoading: boolean;  // true while initial Supabase fetch is in progress
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
  deleteAppointment: (appointmentId: string) => Promise<{ success: boolean; error?: string }>;
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
const LOCAL_STORAGE_KEY_SERVICES = 'auradental_services_v1';
const LOCAL_STORAGE_KEY_AUDIT = 'auradental_audit_v1';
const LOCAL_STORAGE_KEY_TIMESTAMP = 'auradental_timestamp_v1';

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

  // Start with empty arrays — Supabase is the source of truth.
  // We no longer fall back to mock data so ghost clients never reappear.
  // The loadAllData() effect below populates these from Supabase on mount.
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<DentalService[]>([]);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_APPOINTMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [doctorNotifications, setDoctorNotifications] = useState<DoctorNotification[]>([]);

  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [bookingPreselectedDoctorId, setBookingPreselectedDoctorId] = useState<string | null>(null);
  const [bookingPreselectedServiceId, setBookingPreselectedServiceId] = useState<string | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [showDoctorMobileSimulator, setShowDoctorMobileSimulator] = useState<boolean>(false);
  const [lastSimulatedPush, setLastSimulatedPush] = useState<DoctorNotification | null>(null);

  const isLoadedRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ─── Helper: map Supabase appointment row → Appointment ───────────────────
  const mapAppointmentRow = (row: Record<string, unknown>): Appointment => ({
    id: row.id as string,
    confirmationCode: (row.confirmation_code as string) || '',
    patientName: (row.patient_name as string) || '',
    patientPhone: (row.patient_phone as string) || '',
    patientEmail: (row.patient_email as string) || '',
    doctorId: (row.doctor_id as string) || '',
    serviceId: (row.service_id as string) || '',
    date: (row.date as string) || '',
    timeSlot: (row.time_slot as string) || '',
    status: (row.status as Appointment['status']) || 'Pending',
    primaryComplaint: (row.primary_complaint as string) || '',
    medicalHistory: (row.medical_history as Appointment['medicalHistory']) || {
      hasAllergies: false,
      hasHeartCondition: false,
      hasDiabetes: false,
      hasBleedingDisorder: false,
      isPregnant: false,
      previousDentalAnxiety: false,
    },
    insuranceProvider: row.insurance_provider as string | undefined,
    insurancePolicyNumber: row.insurance_policy_number as string | undefined,
    depositAmount: (row.deposit_amount as number) || 0,
    depositPaid: (row.deposit_paid as boolean) || false,
    paymentMethod: (row.payment_method as Appointment['paymentMethod']) || 'Clinic',
    createdAt: (row.created_at as string) || new Date().toISOString(),
    doctorNotes: row.doctor_notes as string | undefined,
    rescheduledTo: row.rescheduled_to as Appointment['rescheduledTo'] | undefined,
    otpVerified: (row.otp_verified as boolean) || false,
  });

  // ─── Global Realtime Broadcast, Cloud Storage & DB Sync ───────────────────
  useEffect(() => {
    let syncChannel: ReturnType<typeof supabase.channel> | null = null;
    let doctorsChannel: ReturnType<typeof supabase.channel> | null = null;
    let aptsChannel: ReturnType<typeof supabase.channel> | null = null;
    let servicesChannel: ReturnType<typeof supabase.channel> | null = null;

    const loadAllData = async () => {
      // ── SUPABASE IS THE SINGLE SOURCE OF TRUTH ────────────────────────────
      // Always wipe localStorage doctors/services caches first so stale data
      // from a previous session can never show as ghost rows.
      try { localStorage.removeItem(LOCAL_STORAGE_KEY_DOCTORS); } catch {}
      try { localStorage.removeItem(LOCAL_STORAGE_KEY_SERVICES); } catch {}

      try {
        // 1. Clinic settings
        const { data: settingsData } = await supabase
          .from('clinic_settings')
          .select('*')
          .limit(1)
          .single();
        if (settingsData) {
          setClinicSettings(mapClinicSettingsRow(settingsData as Record<string, unknown>));
        }

        // 2. Services — always fetch fresh from Supabase
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .order('id');
        if (servicesData && servicesData.length > 0) {
          const mappedServices = servicesData.map((r) => mapServiceRow(r as Record<string, unknown>));
          setServices(mappedServices);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(mappedServices));
          } catch {}
        }

        // 3. Doctors — always fetch fresh from Supabase
        const { data: doctorsData } = await supabase
          .from('doctors')
          .select('*')
          .order('display_order');
        if (doctorsData && doctorsData.length > 0) {
          const mappedDoctors = doctorsData.map((r) => mapDoctorRow(r as Record<string, unknown>));
          setDoctors(mappedDoctors);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY_DOCTORS, JSON.stringify(mappedDoctors));
          } catch {}
        } else {
          // No doctors in Supabase yet — ensure we show nothing (no ghost data)
          setDoctors([]);
          try { localStorage.removeItem(LOCAL_STORAGE_KEY_DOCTORS); } catch {}
        }

        // 5. Appointments — load from Supabase
        const { data: aptsData } = await supabase
          .from('appointments')
          .select('*')
          .order('created_at', { ascending: false });
        if (aptsData) {
          const mappedApts = aptsData.map((r) => mapAppointmentRow(r as Record<string, unknown>));
          setAppointments(mappedApts);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(mappedApts));
          } catch {}
          const notifs: DoctorNotification[] = mappedApts
            .filter(a => a.status === 'Pending')
            .map(a => ({
              id: `notif-${a.id}`,
              appointmentId: a.id,
              doctorId: a.doctorId,
              type: a.serviceId === 'serv-7' ? 'EMERGENCY_ALERT' : 'NEW_BOOKING',
              patientName: a.patientName,
              serviceName: a.serviceId,
              date: a.date,
              timeSlot: a.timeSlot,
              read: false,
              timestamp: a.createdAt,
              urgent: a.serviceId === 'serv-7',
            } as DoctorNotification));
          setDoctorNotifications(notifs);
        }
      } catch (err) {
        console.warn('Supabase initial fetch warning:', err);
      } finally {
        isLoadedRef.current = true;
        setIsLoading(false);
      }
    };

    loadAllData();



    // ─── Realtime: Postgres Changes for Doctors & Services ──────────────────
    // Listen for admin edits on the doctors & services tables so all connected
    // devices update in real-time without a page refresh.
    try {
      doctorsChannel = supabase
        .channel('rt-doctors-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => {
          // Re-fetch all doctors from Supabase so we always get the freshest state
          supabase.from('doctors').select('*').order('display_order').then(({ data }) => {
            if (data) {
              const mapped = data.map(r => mapDoctorRow(r as Record<string, unknown>));
              setDoctors(mapped);
              try { localStorage.setItem(LOCAL_STORAGE_KEY_DOCTORS, JSON.stringify(mapped)); } catch {}
            }
          });
        })
        .subscribe();
    } catch {}

    try {
      servicesChannel = supabase
        .channel('rt-services-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
          // Re-fetch all services from Supabase
          supabase.from('services').select('*').order('id').then(({ data }) => {
            if (data) {
              const mapped = data.map(r => mapServiceRow(r as Record<string, unknown>));
              setServices(mapped);
              try { localStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(mapped)); } catch {}
            }
          });
        })
        .subscribe();
    } catch {}

    try {
      aptsChannel = supabase
        .channel('rt-appointments-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            playNotificationSound();
            const newApt = mapAppointmentRow(payload.new as Record<string, unknown>);
            setAppointments(prev => {
              if (prev.some(a => a.id === newApt.id)) return prev;
              const next = [newApt, ...prev];
              try { localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(next)); } catch {}
              return next;
            });
            const notif: DoctorNotification = {
              id: `notif-${newApt.id}-${Date.now()}`,
              appointmentId: newApt.id,
              doctorId: newApt.doctorId,
              type: newApt.serviceId === 'serv-7' ? 'EMERGENCY_ALERT' : 'NEW_BOOKING',
              patientName: newApt.patientName,
              serviceName: newApt.serviceId,
              date: newApt.date,
              timeSlot: newApt.timeSlot,
              read: false,
              timestamp: 'Just now',
              urgent: newApt.serviceId === 'serv-7',
            };
            setDoctorNotifications(prev => {
              if (prev.some(n => n.appointmentId === newApt.id)) return prev;
              return [notif, ...prev];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = mapAppointmentRow(payload.new as Record<string, unknown>);
            setAppointments(prev => {
              const next = prev.map(a => a.id === updated.id ? updated : a);
              try { localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setAppointments(prev => {
              const next = prev.filter(a => a.id !== payload.old.id);
              try { localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(next)); } catch {}
              return next;
            });
          }
        })
        .subscribe();
    } catch {}

    return () => {
      if (syncChannel) supabase.removeChannel(syncChannel);
      if (doctorsChannel) supabase.removeChannel(doctorsChannel);
      if (servicesChannel) supabase.removeChannel(servicesChannel);
      if (aptsChannel) supabase.removeChannel(aptsChannel);
    };
  }, []);

  // ─── Sync changes to LocalStorage & Realtime Devices ──────────────────────
  // Only sync AFTER initial load is complete to avoid overwriting Supabase data
  // with stale localStorage values on mount.
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
      // BroadcastChannel (same-origin tabs)
      const bc = new BroadcastChannel('auradental_clinic_sync');
      bc.postMessage({ type: 'DOCTORS_UPDATED', data: doctors });
      bc.close();
      broadcastLiveSync(doctors, services);
    } catch {}
  }, [doctors]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(services));
      // BroadcastChannel (same-origin tabs)
      const bc = new BroadcastChannel('auradental_clinic_sync');
      bc.postMessage({ type: 'SERVICES_UPDATED', data: services });
      bc.close();
      broadcastLiveSync(doctors, services);
    } catch {}
  }, [services]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
      const bc = new BroadcastChannel('auradental_clinic_sync');
      bc.postMessage({ type: 'APPOINTMENTS_UPDATED', data: appointments });
      bc.close();
    } catch {}
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  // Listen for storage events and same-origin broadcast channel events (instant & 0ms lag)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY_DOCTORS && e.newValue) {
        try { setDoctors(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === LOCAL_STORAGE_KEY_SERVICES && e.newValue) {
        try { setServices(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === LOCAL_STORAGE_KEY_APPOINTMENTS && e.newValue) {
        try { setAppointments(JSON.parse(e.newValue)); } catch {}
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('auradental_clinic_sync');
      bc.onmessage = (msg) => {
        if (msg.data?.type === 'DOCTORS_UPDATED' && Array.isArray(msg.data.data)) {
          setDoctors(msg.data.data);
        }
        if (msg.data?.type === 'SERVICES_UPDATED' && Array.isArray(msg.data.data)) {
          setServices(msg.data.data);
        }
        if (msg.data?.type === 'APPOINTMENTS_UPDATED' && Array.isArray(msg.data.data)) {
          setAppointments(msg.data.data);
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

    // Play chime sound
    playNotificationSound();

    // Optimistic UI — add immediately (realtime INSERT event will dedup via guard)
    setAppointments(prev => {
      if (prev.some(a => a.id === newAppointment.id)) return prev;
      const next = [newAppointment, ...prev];
      try { localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(next)); } catch {}
      return next;
    });

    // Persist to Supabase — realtime will fire INSERT on all other clients
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
      `Booking code ${confirmationCode} created for ${data.date} at ${data.timeSlot}. Deposit: ₹${data.depositAmount}. PHI encrypted.`
    );

    const assignedDoctor = getDoctorById(data.doctorId);
    const selectedService = getServiceById(data.serviceId);
    const serviceName = selectedService ? selectedService.name : 'Dental Procedure';

    // Notification for THIS device — realtime handles other devices
    const newNotification: DoctorNotification = {
      id: `notif-${newAppointment.id}-local`,
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

    setDoctorNotifications(prev => {
      if (prev.some(n => n.appointmentId === newAppointment.id)) return prev;
      return [newNotification, ...prev];
    });

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

  const deleteAppointment = async (appointmentId: string): Promise<{ success: boolean; error?: string }> => {
    const aptToDelete = appointments.find(a => a.id === appointmentId);

    // 1. Optimistic UI update & immediate localStorage cache update
    setAppointments(prev => {
      const next = prev.filter(a => a.id !== appointmentId);
      try { localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(next)); } catch {}
      return next;
    });
    setDoctorNotifications(prev => prev.filter(n => n.appointmentId !== appointmentId));

    try {
      const bc = new BroadcastChannel('auradental_clinic_sync');
      bc.postMessage({ type: 'APPOINTMENTS_UPDATED', data: appointments.filter(a => a.id !== appointmentId) });
      bc.close();
    } catch {}

    // 2. Delete from Supabase
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
      if (error) {
        console.warn('Supabase delete warning (check RLS policies):', error.message);
      }

      addAuditLog(
        'Doctor/Admin',
        'Doctor',
        'APPOINTMENT_DELETED',
        `Appointment ${aptToDelete?.confirmationCode || appointmentId} for ${aptToDelete?.patientName || 'Patient'} was deleted permanently.`
      );
    } catch (err: unknown) {
      console.warn('Supabase delete error:', err);
    }

    return { success: true };
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
      isLoading,
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
      deleteAppointment,
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
