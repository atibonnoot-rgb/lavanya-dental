import { DentalService, Doctor, Appointment, BeforeAfterCase, PostCareGuide, AuditLog } from '../types';

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Lin, DDS, MS',
    title: 'Chief Orthodontist & Clear Aligner Specialist',
    specialty: 'Orthodontics & Facial Aesthetics',
    degrees: 'Columbia University College of Dental Medicine • Board Certified Orthodontist',
    experienceYears: 25,
    rating: 4.96,
    reviewsCount: 382,
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
    bio: 'Specializing in digital aligner therapy, complex adult malocclusions, and teen airway-friendly orthodontic care. Recognized for gentle touch and aesthetic symmetry.',
    phone: '+1 (555) 382-9901',
    email: 'dr.lin@auradental.com',
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    workingHours: {
      start: '08:30',
      end: '17:00'
    },
    slotDurationMinutes: 45,
    isAvailableToday: true,
    onCallForEmergency: false,
  },
  {
    id: 'doc-2',
    name: 'Dr. Marcus Vance, DMD, FICOI',
    title: 'Lead Implantologist & Oral Reconstructive Surgeon',
    specialty: 'Implantology & Bone Regeneration',
    degrees: 'Harvard School of Dental Medicine • Fellow International Congress of Oral Implantologists',
    experienceYears: 18,
    rating: 4.98,
    reviewsCount: 512,
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
    bio: 'Pioneer in 3D CBCT guided computer-navigated dental implants and immediate-load full arch rehabilitation. High patient comfort track record.',
    phone: '+1 (555) 382-9902',
    email: 'dr.vance@auradental.com',
    workingDays: [1, 2, 4, 5, 6], // Mon, Tue, Thu, Fri, Sat
    workingHours: {
      start: '09:00',
      end: '17:30'
    },
    slotDurationMinutes: 60,
    isAvailableToday: true,
    onCallForEmergency: true,
  },
  {
    id: 'doc-3',
    name: 'Dr. Elena Rostova, DDS, AACD',
    title: 'Director of Cosmetic & Restorative Dentistry',
    specialty: 'Smile Design & Porcelain Veneers',
    degrees: 'UCLA School of Dentistry • Accredited American Academy of Cosmetic Dentistry',
    experienceYears: 12,
    rating: 4.94,
    reviewsCount: 294,
    photoUrl: 'https://images.unsplash.com/photo-1594824813576-0c9f1367015d?auto=format&fit=crop&w=600&q=80',
    bio: 'Renowned for minimally invasive porcelain veneers, biomimetic composite bonding, and in-office LED laser teeth whitening that enhances natural enamel tone.',
    phone: '+1 (555) 382-9903',
    email: 'dr.rostova@auradental.com',
    workingDays: [2, 3, 4, 5, 6], // Tue-Sat
    workingHours: {
      start: '09:00',
      end: '18:00'
    },
    slotDurationMinutes: 45,
    isAvailableToday: true,
    onCallForEmergency: false,
  },
  {
    id: 'doc-4',
    name: 'Dr. James Chen, DMD, MS',
    title: 'Endodontist & Pediatric Care Lead',
    specialty: 'Microscopic Endodontics & Painless Care',
    degrees: 'University of Pennsylvania Dental Medicine • Specialization in Pain Management',
    experienceYears: 10,
    rating: 4.97,
    reviewsCount: 320,
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80',
    bio: 'Dedicated to painless single-visit root canal therapy under high-powered surgical microscopy and welcoming pediatric preventative treatments.',
    phone: '+1 (555) 382-9904',
    email: 'dr.chen@auradental.com',
    workingDays: [1, 3, 4, 5], // Mon, Wed, Thu, Fri
    workingHours: {
      start: '08:00',
      end: '16:30'
    },
    slotDurationMinutes: 45,
    isAvailableToday: true,
    onCallForEmergency: true,
  }
];

export const DENTAL_SERVICES: DentalService[] = [
  {
    id: 'serv-1',
    name: 'Comprehensive Oral Exam & Ultrasonic Hygiene',
    category: 'Preventive',
    description: 'Includes full digital low-radiation X-rays, 3D intraoral scan, periodontal probing, ultrasonic scaling, and remineralizing fluoride varnish.',
    durationMinutes: 45,
    priceEstimate: 180,
    depositRequired: 50,
    recommendedFor: ['Routine checkup every 6 months', 'Plaque & tartar buildup', 'Early cavity detection'],
    popular: true,
    insuranceCovered: 'Full'
  },
  {
    id: 'serv-2',
    name: 'Advanced Clear Aligner Consultation & 3D Simulation',
    category: 'Orthodontics',
    description: 'Complete digital photogrammetry scan, bite analysis, and an instant 3D video simulation previewing your projected teeth alignment journey.',
    durationMinutes: 45,
    priceEstimate: 120,
    depositRequired: 40,
    recommendedFor: ['Crowded or gapped teeth', 'Crossbite & overbite correction', 'Discreet adult orthodontics'],
    popular: true,
    insuranceCovered: 'Partial'
  },
  {
    id: 'serv-3',
    name: 'Single Tooth 3D Guided Dental Implant Consultation',
    category: 'Surgical & Implants',
    description: 'High-resolution CBCT volumetric scan, bone density evaluation, computer-guided surgical planning, and customized surgical stent preview.',
    durationMinutes: 60,
    priceEstimate: 290,
    depositRequired: 75,
    recommendedFor: ['Missing teeth', 'Failed root canals requiring replacement', 'Permanent lifelong restoration'],
    popular: true,
    insuranceCovered: 'Partial'
  },
  {
    id: 'serv-4',
    name: 'Custom Porcelain Veneer & Smile Design Preview',
    category: 'Cosmetic',
    description: 'Aesthetic facial harmony assessment, mock-up test smile, shade matching, and custom ultra-thin feldspathic porcelain consultation.',
    durationMinutes: 60,
    priceEstimate: 250,
    depositRequired: 60,
    recommendedFor: ['Chipped, discolored or worn enamel', 'Uneven teeth proportions', 'Hollywood smile makeover'],
    popular: false,
    insuranceCovered: 'Cosmetic/Elective'
  },
  {
    id: 'serv-5',
    name: 'Microscopic Painless Root Canal Therapy',
    category: 'Emergency & Endodontics',
    description: 'Same-day pulpal relief using high-magnification surgical microscope, rotary nickel-titanium cleaning, and bioceramic thermal seal.',
    durationMinutes: 60,
    priceEstimate: 850,
    depositRequired: 100,
    recommendedFor: ['Severe throbbing toothache', 'Sensitivity to hot & cold that lingers', 'Abscess or facial tenderness'],
    popular: false,
    insuranceCovered: 'Full'
  },
  {
    id: 'serv-6',
    name: 'In-Office Medical Laser Teeth Whitening (Zoom 4)',
    category: 'Cosmetic',
    description: 'Gentle protective gum barrier application followed by 3x 15-minute cycles of medical-grade hydrogen peroxide light activation. Up to 8 shades whiter.',
    durationMinutes: 60,
    priceEstimate: 395,
    depositRequired: 75,
    recommendedFor: ['Coffee, tea, wine stains', 'Pre-wedding or event preparation', 'Enamel brightening'],
    popular: true,
    insuranceCovered: 'Cosmetic/Elective'
  },
  {
    id: 'serv-7',
    name: 'Urgent Dental Trauma & Acute Emergency Triage',
    category: 'Emergency & Endodontics',
    description: 'Priority immediate slot for acute trauma, knocked-out (avulsed) tooth, sudden fracture, or severe bleeding. On-call doctor notified instantly.',
    durationMinutes: 45,
    priceEstimate: 220,
    depositRequired: 50,
    recommendedFor: ['Avulsed or fractured tooth', 'Uncontrollable dental bleeding', 'Acute swelling'],
    popular: false,
    insuranceCovered: 'Full'
  },
  {
    id: 'serv-8',
    name: 'Biomimetic Tooth-Colored Composite Filling',
    category: 'Restorative',
    description: 'Mercury-free nano-hybrid composite restoration layered to match natural dental translucency and anatomy with zero sensitivity.',
    durationMinutes: 45,
    priceEstimate: 210,
    depositRequired: 50,
    recommendedFor: ['New dental cavities', 'Replacing dark amalgam fillings', 'Enamel bonding'],
    popular: false,
    insuranceCovered: 'Full'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    confirmationCode: 'AD-8921',
    patientName: 'Claire Abernathy',
    patientPhone: '+1 (555) 749-3321',
    patientEmail: 'claire.abernathy@email.com',
    doctorId: 'doc-1',
    serviceId: 'serv-2',
    date: '2026-09-19',
    timeSlot: '10:15',
    status: 'Confirmed',
    primaryComplaint: 'Upper front teeth crowding; interested in 12-month clear aligner treatment.',
    medicalHistory: {
      hasAllergies: false,
      hasHeartCondition: false,
      hasDiabetes: false,
      hasBleedingDisorder: false,
      isPregnant: false,
      previousDentalAnxiety: false,
    },
    insuranceProvider: 'Delta Dental Premier',
    insurancePolicyNumber: 'DD-99201948',
    depositAmount: 40,
    depositPaid: true,
    paymentMethod: 'Card',
    createdAt: '2026-09-18T01:30:00Z',
    doctorNotes: 'Digital scans requested. Ready for 3D simulation review.',
    otpVerified: true,
  },
  {
    id: 'apt-102',
    confirmationCode: 'AD-8922',
    patientName: 'David K. Miller',
    patientPhone: '+1 (555) 883-4912',
    patientEmail: 'd.miller92@gmail.com',
    doctorId: 'doc-2',
    serviceId: 'serv-3',
    date: '2026-09-19',
    timeSlot: '13:00',
    status: 'Pending',
    primaryComplaint: 'Lower right molar extracted 4 months ago; ready for bone check and implant placement.',
    medicalHistory: {
      hasAllergies: true,
      allergyDetails: 'Penicillin allergy (hives)',
      hasHeartCondition: false,
      hasDiabetes: false,
      hasBleedingDisorder: false,
      isPregnant: false,
      previousDentalAnxiety: true,
    },
    insuranceProvider: 'Aetna Dental PPO',
    insurancePolicyNumber: 'AET-491823',
    depositAmount: 75,
    depositPaid: true,
    paymentMethod: 'Card',
    createdAt: '2026-09-18T02:05:00Z',
    otpVerified: true,
  },
  {
    id: 'apt-103',
    confirmationCode: 'AD-8923',
    patientName: 'Sophia Montgomery',
    patientPhone: '+1 (555) 612-9011',
    patientEmail: 'sophia.m@outlook.com',
    doctorId: 'doc-3',
    serviceId: 'serv-6',
    date: '2026-09-20',
    timeSlot: '11:00',
    status: 'Confirmed',
    primaryComplaint: 'Preparing for wedding ceremony next month, wants laser whitening treatment.',
    medicalHistory: {
      hasAllergies: false,
      hasHeartCondition: false,
      hasDiabetes: false,
      hasBleedingDisorder: false,
      isPregnant: false,
      previousDentalAnxiety: false,
    },
    depositAmount: 75,
    depositPaid: true,
    paymentMethod: 'Card',
    createdAt: '2026-09-17T18:40:00Z',
    otpVerified: true,
  },
  {
    id: 'apt-104',
    confirmationCode: 'AD-8924',
    patientName: 'Robert Langdon',
    patientPhone: '+1 (555) 390-1120',
    patientEmail: 'rlangdon@harvard.edu',
    doctorId: 'doc-4',
    serviceId: 'serv-5',
    date: '2026-09-18',
    timeSlot: '14:30',
    status: 'Confirmed',
    primaryComplaint: 'Throbbing pain in upper left premolar over the weekend.',
    medicalHistory: {
      hasAllergies: false,
      hasHeartCondition: true,
      currentMedications: 'Lisinopril 10mg daily for mild hypertension',
      hasDiabetes: false,
      hasBleedingDisorder: false,
      isPregnant: false,
      previousDentalAnxiety: false,
    },
    insuranceProvider: 'MetLife Dental Preferred',
    insurancePolicyNumber: 'MET-8839102',
    depositAmount: 100,
    depositPaid: true,
    paymentMethod: 'Card',
    createdAt: '2026-09-17T09:12:00Z',
    otpVerified: true,
  }
];

export const BEFORE_AFTER_CASES: BeforeAfterCase[] = [
  {
    id: 'case-1',
    title: 'Minimally Invasive Porcelain Veneers (8 Units)',
    category: 'Cosmetic Dentistry',
    doctorName: 'Dr. Elena Rostova, DDS, AACD',
    duration: '2 Weeks (2 Clinical Visits)',
    description: 'Restored natural enamel luminescence, repaired alignment gaps and discolored tooth structure with ultra-thin feldspathic porcelain veneers.',
    beforeImage: '/veneers-before.jpg',
    afterImage: '/veneers-after.jpg',
    consentBadge: 'HIPAA Signed Consent #2026-V04',
    results: ['Eliminated anterior gaps & asymmetry', 'Natural surface micro-texture', 'Shade elevated to BL2 porcelain white']
  },
  {
    id: 'case-2',
    title: 'Full Arch Digital Clear Aligner Alignment',
    category: 'Orthodontics',
    doctorName: 'Dr. Sarah Lin, DDS, MS',
    duration: '11 Months (22 Trays)',
    description: 'Corrected moderate anterior crowding and deep overbite using custom 3D aligners with zero tooth extraction.',
    beforeImage: '/veneers-before.jpg',
    afterImage: '/veneers-after.jpg',
    consentBadge: 'HIPAA Signed Consent #2025-C11',
    results: ['Eliminated anterior crowding', 'Optimized smile arc and buccal corridors', 'Airway profile maintained']
  },
  {
    id: 'case-3',
    title: 'Computer-Guided Anterior Dental Implant & Zirconia Crown',
    category: 'Implantology',
    doctorName: 'Dr. Marcus Vance, DMD, FICOI',
    duration: '3 Months Healing + Immediate Temp',
    description: 'Replaced traumatic tooth loss with a titanium-zirconia biocompatible dental implant with customized pink gingival papilla preservation.',
    beforeImage: '/veneers-before.jpg',
    afterImage: '/veneers-after.jpg',
    consentBadge: 'HIPAA Signed Consent #2026-I89',
    results: ['100% biological bone graft integration', 'Natural soft tissue scallop architecture', 'Lifetime fixture warranty']
  }
];

export const POST_CARE_GUIDES: PostCareGuide[] = [
  {
    id: 'guide-extraction',
    procedure: 'Tooth Extraction & Wisdom Teeth Removal',
    recoveryTimeline: '3 to 7 days initial recovery; 2 weeks for full gum closure',
    immediateCare: [
      'Bite gently on the sterile gauze pack for 45 minutes to encourage blood clot formation.',
      'Apply an ice pack to your cheek for 15 minutes on / 15 minutes off for the first 24 hours to minimize swelling.',
      'Take prescribed or recommended analgesics (e.g., ibuprofen) before the local anesthetic fully wears off.',
      'Keep your head elevated with 2 pillows while resting.'
    ],
    doNotDo: [
      'DO NOT use a straw or create suction in your mouth for 72 hours (risk of painful Dry Socket).',
      'DO NOT spit forcefully or rinse vigorously during the first 24 hours.',
      'DO NOT smoke, vape, or consume alcoholic beverages for at least 5 days.',
      'Avoid strenuous exercise or heavy lifting for 48 hours.'
    ],
    emergencySigns: [
      'Heavy, continuous bleeding that does not slow after 2 hours of direct gauze pressure.',
      'Severe throbbing pain that worsens on days 3-4 (Dry Socket sign).',
      'Difficulty swallowing, breathing, or sudden fever over 101°F (38.3°C).'
    ],
    dietRecommendations: [
      'Smoothies (with a spoon, no straw), cold yogurt, lukewarm broth, applesauce, scrambled eggs.',
      'Avoid chips, nuts, seeds, spicy foods, and hot liquids.'
    ]
  },
  {
    id: 'guide-whitening',
    procedure: 'Professional In-Office Laser Teeth Whitening',
    recoveryTimeline: '24 to 48 hours for enamel pores to re-hydrate and seal',
    immediateCare: [
      'Adhere strictly to the "White Diet" for the first 48 hours.',
      'Use the provided desensitizing potassium nitrate gel if mild sensitivity or "zings" occur.',
      'Brush gently with a soft-bristle toothbrush and lukewarm water.'
    ],
    doNotDo: [
      'DO NOT consume staining foods or beverages: coffee, red wine, tea, soy sauce, blueberries, ketchup.',
      'DO NOT use colored or dark mouthwashes (chlorhexidine or blue rinses).',
      'DO NOT smoke or use tobacco products.'
    ],
    emergencySigns: [
      'Severe sharp nerve pain persisting over 48 hours.',
      'Chemical burn or whitening of the gum tissue (blanching usually resolves within 1 hour; call if blistering).'
    ],
    dietRecommendations: [
      'White rice, grilled chicken breast, white fish, steamed cauliflower, plain milk, clear water, bananas.'
    ]
  },
  {
    id: 'guide-implants',
    procedure: 'Dental Implant Placement & Bone Grafting',
    recoveryTimeline: '7-10 days for soft tissue healing; 3-4 months for osseointegration',
    immediateCare: [
      'Rinse gently with warm salt water (1/2 tsp salt in 8 oz water) starting 24 hours after surgery.',
      'Take full course of prescribed prophylactic antibiotics if ordered.',
      'Rest and avoid touching the surgical site with your tongue or fingers.'
    ],
    doNotDo: [
      'DO NOT chew hard or crunchy foods on the implant side.',
      'DO NOT disturb sutures or pull down your lip to inspect the surgical site.',
      'Avoid electric toothbrushes directly vibrating on the healing abutment for 2 weeks.'
    ],
    emergencySigns: [
      'Implant fixture feels loose or twists.',
      'Excessive purulent discharge (pus) or foul taste in mouth.',
      'Numbness of the lower lip or chin lasting more than 8 hours post-op.'
    ],
    dietRecommendations: [
      'Nutrient-dense soft foods: mashed potatoes, avocado, protein shakes, soft pasta, oatmeal.'
    ]
  },
  {
    id: 'guide-root-canal',
    procedure: 'Endodontic Root Canal Therapy',
    recoveryTimeline: '2 to 5 days for ligament inflammation to subside',
    immediateCare: [
      'Take anti-inflammatory medication (e.g. Ibuprofen 600mg) as recommended by Dr. Chen.',
      'Chew on the opposite side until your permanent crown is seated.',
      'Keep the temporary filling clean with gentle flossing pulling sideways.'
    ],
    doNotDo: [
      'DO NOT chew hard candy, ice, or sticky gum on the treated tooth (risk of coronal fracture).',
      'Avoid extreme temperature foods while temporary cement is setting.'
    ],
    emergencySigns: [
      'Visible swelling in the gums or cheek surrounding the tooth.',
      'Temporary filling dislodges completely before your crown appointment.',
      'Uneven bite where the treated tooth hits first upon closing.'
    ],
    dietRecommendations: [
      'Soft foods, pasta, soups, cooked vegetables.'
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-09-18T02:05:00Z',
    actor: 'Patient (David K. Miller)',
    role: 'Patient',
    action: 'OTP_AUTH_VERIFIED',
    details: 'Verified SMS OTP for appointment booking AD-8922. PHI encrypted.',
    encryptionStatus: 'AES-256-GCM / TLS 1.3',
    ipHash: 'sha256:7f8a9...b401'
  },
  {
    id: 'log-002',
    timestamp: '2026-09-18T02:05:03Z',
    actor: 'System Notification Dispatcher',
    role: 'System',
    action: 'DOCTOR_ALERT_PUSH_SENT',
    details: 'Delivered real-time mobile push & SMS to Dr. Marcus Vance for pending implant booking.',
    encryptionStatus: 'AES-256-GCM / TLS 1.3',
    ipHash: 'internal:fcm_gateway'
  },
  {
    id: 'log-003',
    timestamp: '2026-09-18T01:30:00Z',
    actor: 'Dr. Sarah Lin, DDS',
    role: 'Doctor',
    action: 'PHI_ACCESS_CONFIRMED',
    details: 'Viewed medical history & 3D aligner notes for patient Claire Abernathy (AD-8921).',
    encryptionStatus: 'AES-256-GCM / TLS 1.3',
    ipHash: 'sha256:1a2c8...ef92'
  },
  {
    id: 'log-004',
    timestamp: '2026-09-17T18:42:00Z',
    actor: 'Clinic Admin',
    role: 'Admin',
    action: 'DEPOSIT_PAYMENT_RECONCILED',
    details: 'Verified Stripe deposit receipt #ch_3N82b... for Sophia Montgomery ($75.00).',
    encryptionStatus: 'AES-256-GCM / TLS 1.3',
    ipHash: 'sha256:8890a...5541'
  }
];

export const CLINIC_KPIS = {
  bookingConversionRate: 18.7, // Target >= 15%
  systemUptime: 99.99, // Target 99.9%
  notificationLatencySeconds: 1.4, // Target < 5s
  noShowRateReduction: 27.2, // Target 25%
  totalAppointmentsThisMonth: 142,
  revenueCollected: 38450
};
