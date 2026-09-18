export type UserRole = 'patient' | 'doctor' | 'admin';

export type ServiceCategory = 
  | 'Preventive' 
  | 'Cosmetic' 
  | 'Restorative' 
  | 'Orthodontics' 
  | 'Surgical & Implants' 
  | 'Emergency & Endodontics';

export interface DentalService {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  durationMinutes: number;
  priceEstimate: number;
  depositRequired: number;
  recommendedFor: string[];
  popular?: boolean;
  insuranceCovered: 'Full' | 'Partial' | 'Varies' | 'Cosmetic/Elective';
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  degrees: string;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  photoUrl: string;
  bio: string;
  phone: string;
  email: string;
  workingDays: number[]; // 0 = Sun, 1 = Mon, ...
  workingHours: {
    start: string; // "08:30"
    end: string;   // "17:30"
  };
  slotDurationMinutes: number;
  isAvailableToday: boolean;
  onCallForEmergency: boolean;
}

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Rescheduled' | 'Completed' | 'Cancelled';

export interface MedicalHistory {
  hasAllergies: boolean;
  allergyDetails?: string;
  currentMedications?: string;
  hasHeartCondition: boolean;
  hasDiabetes: boolean;
  hasBleedingDisorder: boolean;
  isPregnant: boolean;
  previousDentalAnxiety: boolean;
}

export interface Appointment {
  id: string;
  confirmationCode: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm format e.g. "09:00"
  status: AppointmentStatus;
  primaryComplaint: string;
  medicalHistory: MedicalHistory;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  depositAmount: number;
  depositPaid: boolean;
  paymentMethod: 'Card' | 'Clinic' | 'Insurance';
  createdAt: string;
  doctorNotes?: string;
  rescheduledTo?: {
    date: string;
    timeSlot: string;
  };
  otpVerified: boolean;
}

export interface DoctorNotification {
  id: string;
  appointmentId: string;
  doctorId: string;
  type: 'NEW_BOOKING' | 'RESCHEDULE' | 'CANCELLATION' | 'EMERGENCY_ALERT';
  patientName: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  read: boolean;
  timestamp: string;
  urgent?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: 'Patient' | 'Doctor' | 'Admin' | 'System';
  action: string;
  details: string;
  encryptionStatus: 'AES-256-GCM / TLS 1.3';
  ipHash: string;
}

export interface BeforeAfterCase {
  id: string;
  title: string;
  category: string;
  doctorName: string;
  duration: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  consentBadge: string;
  results: string[];
}

export interface PostCareGuide {
  id: string;
  procedure: string;
  recoveryTimeline: string;
  immediateCare: string[];
  doNotDo: string[];
  emergencySigns: string[];
  dietRecommendations: string[];
}

export interface ClinicKPIs {
  bookingConversionRate: number; // e.g. 18.4%
  systemUptime: number; // 99.98%
  notificationLatencySeconds: number; // 1.8s
  noShowRateReduction: number; // 28.5%
  totalAppointmentsThisMonth: number;
  revenueCollected: number;
}

export interface ClinicHourDay {
  open: boolean;
  start: string;
  end: string;
}

export interface ClinicSettings {
  id?: string;
  clinicName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  hours: {
    monday: ClinicHourDay;
    tuesday: ClinicHourDay;
    wednesday: ClinicHourDay;
    thursday: ClinicHourDay;
    friday: ClinicHourDay;
    saturday: ClinicHourDay;
    sunday: ClinicHourDay;
  };
}

export interface GalleryImage {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  type: 'before' | 'after' | 'general';
  description: string;
  createdAt: string;
}
