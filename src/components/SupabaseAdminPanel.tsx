import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Building2, Stethoscope, Image as ImageIcon, LogOut, CheckCircle2,
  Clock, Phone, Mail, MapPin, Upload, Trash2, Plus, Save,
  Edit3, ChevronDown, ChevronUp, Loader2, AlertCircle, RefreshCw,
  Users, DollarSign, Star, Check, Bell, Search, Sparkles, QrCode,
  CreditCard, Banknote, Printer, Send, Activity, ShieldCheck,
  FileText, Camera, Eye, ArrowRight, X, HeartPulse, Smile, Layers
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useClinic } from '../context/ClinicContext';
import { DentalService, Doctor, ClinicSettings, Appointment } from '../types';
import clinicLogo from '../assets/logo.png';

// ─── TYPES & HEALVO DATA MODELS ─────────────────────────────────────────────
type HealvoTabId = 'queue' | 'chart' | 'consult' | 'xrays' | 'billing' | 'reports' | 'services';

export type ToothStatus = 
  | 'healthy' 
  | 'caries' 
  | 'filled' 
  | 'rct' 
  | 'crown' 
  | 'implant' 
  | 'missing' 
  | 'fracture';

export interface ToothData {
  id: number; // 11-18, 21-28, 31-38, 41-48
  name: string;
  status: ToothStatus;
  notes?: string;
  lastTreated?: string;
}

export interface PrescriptionItem {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string; // e.g. "1-0-1"
  duration: string;  // e.g. "5 Days"
  instructions: string; // e.g. "After food"
}

export interface ClinicalConsultation {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  chiefComplaint: string;
  examinationFindings: string;
  diagnosis: string;
  teethInvolved: number[];
  prescriptions: PrescriptionItem[];
  advice: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  patientName: string;
  patientPhone: string;
  date: string;
  items: { name: string; cost: number }[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMode: 'UPI' | 'Cash' | 'Card' | 'Part Payment';
  upiRef?: string;
  status: 'Paid' | 'Partial' | 'Unpaid';
}

export interface PatientXray {
  id: string;
  patientName: string;
  toothNumber?: number;
  type: 'IOPA' | 'OPG' | 'Intraoral' | 'CBCT';
  date: string;
  imageUrl: string;
  notes: string;
}

// ─── INITIAL FDI 32-TOOTH CHART MODEL ───────────────────────────────────────
const INITIAL_FDI_TEETH: ToothData[] = [
  // Upper Right (18 to 11)
  { id: 18, name: 'Maxillary Right 3rd Molar (Wisdom)', status: 'missing', notes: 'Extracted previously' },
  { id: 17, name: 'Maxillary Right 2nd Molar', status: 'healthy' },
  { id: 16, name: 'Maxillary Right 1st Molar', status: 'caries', notes: 'Deep distal decay, tender on biting' },
  { id: 15, name: 'Maxillary Right 2nd Premolar', status: 'filled', notes: 'Composite restoration done 2024' },
  { id: 14, name: 'Maxillary Right 1st Premolar', status: 'healthy' },
  { id: 13, name: 'Maxillary Right Canine', status: 'healthy' },
  { id: 12, name: 'Maxillary Right Lateral Incisor', status: 'healthy' },
  { id: 11, name: 'Maxillary Right Central Incisor', status: 'healthy' },

  // Upper Left (21 to 28)
  { id: 21, name: 'Maxillary Left Central Incisor', status: 'healthy' },
  { id: 22, name: 'Maxillary Left Lateral Incisor', status: 'healthy' },
  { id: 23, name: 'Maxillary Left Canine', status: 'healthy' },
  { id: 24, name: 'Maxillary Left 1st Premolar', status: 'crown', notes: 'Zirconia crown placed' },
  { id: 25, name: 'Maxillary Left 2nd Premolar', status: 'healthy' },
  { id: 26, name: 'Maxillary Left 1st Molar', status: 'rct', notes: 'Obturation completed, core buildup done' },
  { id: 27, name: 'Maxillary Left 2nd Molar', status: 'healthy' },
  { id: 28, name: 'Maxillary Left 3rd Molar', status: 'missing' },

  // Lower Left (38 to 31)
  { id: 38, name: 'Mandibular Left 3rd Molar (Wisdom)', status: 'fracture', notes: 'Impacted mesioangular' },
  { id: 37, name: 'Mandibular Left 2nd Molar', status: 'healthy' },
  { id: 36, name: 'Mandibular Left 1st Molar', status: 'implant', notes: 'Osseointegrated Nobel Biocare 4.3x10' },
  { id: 35, name: 'Mandibular Left 2nd Premolar', status: 'healthy' },
  { id: 34, name: 'Mandibular Left 1st Premolar', status: 'healthy' },
  { id: 33, name: 'Mandibular Left Canine', status: 'healthy' },
  { id: 32, name: 'Mandibular Left Lateral Incisor', status: 'healthy' },
  { id: 31, name: 'Mandibular Left Central Incisor', status: 'healthy' },

  // Lower Right (41 to 48)
  { id: 41, name: 'Mandibular Right Central Incisor', status: 'healthy' },
  { id: 42, name: 'Mandibular Right Lateral Incisor', status: 'healthy' },
  { id: 43, name: 'Mandibular Right Canine', status: 'healthy' },
  { id: 44, name: 'Mandibular Right 1st Premolar', status: 'healthy' },
  { id: 45, name: 'Mandibular Right 2nd Premolar', status: 'healthy' },
  { id: 46, name: 'Mandibular Right 1st Molar', status: 'caries', notes: 'Occlusal pit and fissure caries' },
  { id: 47, name: 'Mandibular Right 2nd Molar', status: 'filled', notes: 'Amalgam replaced with GIC' },
  { id: 48, name: 'Mandibular Right 3rd Molar', status: 'healthy' },
];

const TOOTH_STATUS_CONFIG: Record<ToothStatus, { label: string; color: string; bg: string; border: string }> = {
  healthy:  { label: 'Healthy / Sound',      color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-300' },
  caries:   { label: 'Caries / Decay',        color: 'text-rose-700',    bg: 'bg-rose-50',     border: 'border-rose-400' },
  filled:   { label: 'Restored / Filled',     color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-300' },
  rct:      { label: 'Root Canal (RCT)',      color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-300' },
  crown:    { label: 'Crown / Prosthesis',    color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-300' },
  implant:  { label: 'Dental Implant',        color: 'text-teal-700',    bg: 'bg-teal-50',     border: 'border-teal-400' },
  missing:  { label: 'Missing / Extracted',   color: 'text-slate-500',   bg: 'bg-slate-100',   border: 'border-slate-300 border-dashed' },
  fracture: { label: 'Fracture / Defect',     color: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-400' },
};

// ─── PROPS ───────────────────────────────────────────────────────────────────
interface SupabaseAdminPanelProps {
  onLogout: () => void;
}

export const SupabaseAdminPanel: React.FC<SupabaseAdminPanelProps> = ({ onLogout }) => {
  const { 
    appointments, 
    doctors, 
    services, 
    clinicSettings, 
    updateAppointmentStatus, 
    deleteAppointment,
    selectedDoctorId,
    setSelectedDoctorId,
    saveDoctor,
    saveService
  } = useClinic();

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState<HealvoTabId>('queue');

  // FDI Dental Chart state
  const [teethChart, setTeethChart] = useState<ToothData[]>(INITIAL_FDI_TEETH);
  const [selectedToothId, setSelectedToothId] = useState<number>(16);

  // Selected patient across consultation & billing
  const [activePatientName, setActivePatientName] = useState<string>(
    appointments[0]?.patientName || 'Rajesh Kumar'
  );

  // Quick Walk-In Modal
  const [showWalkInModal, setShowWalkInModal] = useState<boolean>(false);
  const [walkInName, setWalkInName] = useState<string>('');
  const [walkInPhone, setWalkInPhone] = useState<string>('');
  const [walkInComplaint, setWalkInComplaint] = useState<string>('Tooth pain / Consultation');
  const [walkInDoctorId, setWalkInDoctorId] = useState<string>(doctors[0]?.id || 'doc-lavanya');

  // AI Assistant Modal
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiChatLog, setAiChatLog] = useState<{ query: string; answer: string; time: string }[]>([
    {
      query: 'How much did we collect today?',
      answer: 'Total collections today: ₹14,500 (UPI: ₹11,000 | Cash: ₹3,500). Outstanding balance pending: ₹4,000 from 2 patients.',
      time: '10:45 AM'
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Consultations state
  const [consultations, setConsultations] = useState<ClinicalConsultation[]>([
    {
      id: 'c-1',
      patientId: 'p-1',
      patientName: 'Rajesh Kumar',
      date: '2026-09-27',
      chiefComplaint: 'Sharp pain in lower right jaw when biting, sensitive to cold water for 3 days.',
      examinationFindings: 'Deep distal occlusal decay on tooth #46. Tender to vertical percussion. Negative to cold vitality test.',
      diagnosis: 'Acute Irreversible Pulpitis with Symptomatic Apical Periodontitis tooth #46.',
      teethInvolved: [46],
      prescriptions: [
        { id: 'rx-1', drugName: 'Tab. Augmentin 625 mg', dosage: '1 Tab', frequency: '1-0-1', duration: '5 Days', instructions: 'After meals' },
        { id: 'rx-2', drugName: 'Tab. Zerodol-SP', dosage: '1 Tab', frequency: '1-0-1', duration: '3 Days', instructions: 'After meals (Pain relief)' },
        { id: 'rx-3', drugName: 'Tab. Pantocid 40 mg', dosage: '1 Tab', frequency: '1-0-0', duration: '5 Days', instructions: 'Before breakfast' },
      ],
      advice: 'Avoid chewing on right side. Root canal treatment appointment scheduled tomorrow at 11:00 AM.'
    }
  ]);

  // Active consultation form state
  const [activeConsultComplaint, setActiveConsultComplaint] = useState(
    'Throbbing tooth pain on lower right side, aggravated during meals.'
  );
  const [activeConsultFindings, setActiveConsultFindings] = useState(
    'Deep distal caries on #46 with pulpal exposure. Localized mild swelling on buccal vestibule.'
  );
  const [activeConsultDiagnosis, setActiveConsultDiagnosis] = useState(
    'Acute Irreversible Pulpitis #46.'
  );
  const [activeConsultTeeth, setActiveConsultTeeth] = useState<number[]>([46]);
  const [activePrescriptions, setActivePrescriptions] = useState<PrescriptionItem[]>([
    { id: 'rx-1', drugName: 'Tab. Augmentin 625 mg', dosage: '1 Tab', frequency: '1-0-1', duration: '5 Days', instructions: 'After food' },
    { id: 'rx-2', drugName: 'Tab. Zerodol-SP', dosage: '1 Tab', frequency: '1-0-1', duration: '3 Days', instructions: 'After food (SOS)' },
    { id: 'rx-3', drugName: 'Tab. Pantocid 40 mg', dosage: '1 Tab', frequency: '1-0-0', duration: '5 Days', instructions: 'Before breakfast' },
  ]);
  const [newDrugName, setNewDrugName] = useState<string>('Chlorhexidine Mouthwash 0.2%');

  // Invoices & Billing state
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([
    {
      id: 'inv-101',
      invoiceNo: 'LDC-2026-089',
      patientName: 'Sneha Patel',
      patientPhone: '9848022334',
      date: '2026-09-27',
      items: [
        { name: 'Root Canal Treatment (RCT) - Rotary Endodontics', cost: 4500 },
        { name: 'Zirconia Monolithic Crown', cost: 6500 },
      ],
      totalAmount: 11000,
      paidAmount: 7000,
      dueAmount: 4000,
      paymentMode: 'UPI',
      upiRef: 'UPI/382910481920/LAVANYA',
      status: 'Partial'
    },
    {
      id: 'inv-102',
      invoiceNo: 'LDC-2026-088',
      patientName: 'Vikram Reddy',
      patientPhone: '9885611128',
      date: '2026-09-27',
      items: [
        { name: 'Dental Ultrasonic Scaling & Polishing', cost: 1500 },
        { name: 'Composite Resin Restoration (Tooth #16)', cost: 2000 },
      ],
      totalAmount: 3500,
      paidAmount: 3500,
      dueAmount: 0,
      paymentMode: 'Cash',
      status: 'Paid'
    },
    {
      id: 'inv-103',
      invoiceNo: 'LDC-2026-087',
      patientName: 'Kavita Rao',
      patientPhone: '9700192837',
      date: '2026-09-26',
      items: [
        { name: 'Invisalign Clear Aligners - Advance Assessment', cost: 5000 },
      ],
      totalAmount: 5000,
      paidAmount: 5000,
      dueAmount: 0,
      paymentMode: 'UPI',
      upiRef: 'UPI/771928401920/LAVANYA',
      status: 'Paid'
    }
  ]);

  // Billing new invoice form
  const [billingPatientName, setBillingPatientName] = useState<string>('Rajesh Kumar');
  const [billingPhone, setBillingPhone] = useState<string>('9885611128');
  const [billingItems, setBillingItems] = useState<{ name: string; cost: number }[]>([
    { name: 'Consultation & 3D Digital Diagnostic Scan', cost: 500 },
    { name: 'Single Sitting Root Canal Treatment (RCT)', cost: 4500 },
  ]);
  const [billingPaymentMode, setBillingPaymentMode] = useState<'UPI' | 'Cash' | 'Card' | 'Part Payment'>('UPI');
  const [billingPaidAmount, setBillingPaidAmount] = useState<number>(5000);

  // X-Ray Vault mock scans
  const [xrays, setXrays] = useState<PatientXray[]>([
    {
      id: 'xr-1',
      patientName: 'Rajesh Kumar',
      toothNumber: 46,
      type: 'IOPA',
      date: '2026-09-27',
      imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      notes: 'Periapical radiolucency around distal root apex of #46. Canal curvature visible.'
    },
    {
      id: 'xr-2',
      patientName: 'Sneha Patel',
      toothNumber: 26,
      type: 'OPG',
      date: '2026-09-26',
      imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
      notes: 'Full panoramic radiograph showing bilateral impacted third molars.'
    },
    {
      id: 'xr-3',
      patientName: 'Vikram Reddy',
      toothNumber: 36,
      type: 'CBCT',
      date: '2026-09-25',
      imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
      notes: '3D bone volume assessment prior to immediate implant placement.'
    }
  ]);
  const [selectedXray, setSelectedXray] = useState<PatientXray | null>(null);
  const [isInvertXray, setIsInvertXray] = useState<boolean>(false);

  // Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Selected tooth details
  const selectedTooth = useMemo(() => {
    return teethChart.find(t => t.id === selectedToothId) || teethChart[0];
  }, [teethChart, selectedToothId]);

  // Update tooth status
  const handleUpdateToothStatus = (status: ToothStatus) => {
    setTeethChart(prev => prev.map(t => {
      if (t.id === selectedToothId) {
        return { ...t, status, lastTreated: new Date().toISOString().split('T')[0] };
      }
      return t;
    }));
  };

  // Update tooth notes
  const handleUpdateToothNotes = (notes: string) => {
    setTeethChart(prev => prev.map(t => {
      if (t.id === selectedToothId) {
        return { ...t, notes };
      }
      return t;
    }));
  };

  // Queue categorization
  const waitingPatients = appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed');
  const inChairPatients = appointments.filter(a => a.status === 'Rescheduled'); // repurposed for in-chair live demo
  const completedPatients = appointments.filter(a => a.status === 'Completed');

  // Quick Walk-In Registration
  const handleRegisterWalkIn = () => {
    if (!walkInName.trim()) return;
    const newApt: Appointment = {
      id: `walkin-${Date.now()}`,
      confirmationCode: `WALK-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: walkInName.trim(),
      patientPhone: walkInPhone.trim() || '9885611128',
      patientEmail: 'walkin@lavanyadental.in',
      doctorId: walkInDoctorId,
      serviceId: 'serv-oral-maxillofacial',
      date: new Date().toISOString().split('T')[0],
      timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
      primaryComplaint: walkInComplaint,
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
      paymentMethod: 'Clinic',
      createdAt: new Date().toISOString(),
    };

    // Add to appointments in context
    updateAppointmentStatus(newApt.id, 'Pending');
    setShowWalkInModal(false);
    setWalkInName('');
    setWalkInPhone('');
  };

  // Healvo AI Query Engine
  const handleAskHealvoAi = (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    setIsAiThinking(true);
    setTimeout(() => {
      let answer = '';
      const lower = q.toLowerCase();

      if (lower.includes('collect') || lower.includes('revenue') || lower.includes('money') || lower.includes('paid')) {
        const total = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
        const upiTotal = invoices.filter(i => i.paymentMode === 'UPI').reduce((acc, inv) => acc + inv.paidAmount, 0);
        const cashTotal = invoices.filter(i => i.paymentMode === 'Cash').reduce((acc, inv) => acc + inv.paidAmount, 0);
        const dueTotal = invoices.reduce((acc, inv) => acc + inv.dueAmount, 0);
        answer = `Today's gross collections: ₹${total.toLocaleString('en-IN')}. (UPI: ₹${upiTotal.toLocaleString('en-IN')} | Cash: ₹${cashTotal.toLocaleString('en-IN')}). Outstanding balance dues: ₹${dueTotal.toLocaleString('en-IN')} across ${invoices.filter(i => i.dueAmount > 0).length} patient accounts.`;
      } else if (lower.includes('waiting') || lower.includes('chair') || lower.includes('queue') || lower.includes('who is')) {
        answer = `Currently in waiting room: ${waitingPatients.length} patients waiting at reception. In Operatory Chair: ${inChairPatients.length > 0 ? inChairPatients.map(p => p.patientName).join(', ') : 'Operatory 1 is currently preparing for next slot'}. Average chair time today: 32 mins.`;
      } else if (lower.includes('rct') || lower.includes('root canal') || lower.includes('surgery')) {
        answer = `Root Canal & Surgical cases today: 3 procedures scheduled with Dr. Lavanya (MDS). 1 tooth #46 obturation, 1 jaw fracture follow-up review, and 1 Zirconia crown seating.`;
      } else if (lower.includes('due') || lower.includes('balance') || lower.includes('pending')) {
        const dues = invoices.filter(i => i.dueAmount > 0);
        answer = `Pending Dues: Found ${dues.length} patients with outstanding balances totaling ₹${dues.reduce((acc, i) => acc + i.dueAmount, 0)}. Highest pending: ${dues[0]?.patientName} (₹${dues[0]?.dueAmount}). WhatsApp reminder links are ready.`;
      } else {
        answer = `Clinic Summary for Dr. Lavanya: Clinic operating smoothly. ${appointments.length} total appointments scheduled, ${invoices.length} invoices generated today. Sterilization cycle #3 completed at 02:30 PM. All operatory sensors active.`;
      }

      setAiChatLog(prev => [{ query: q, answer, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...prev]);
      setIsAiThinking(false);
      setAiQuery('');
    }, 600);
  };

  // Add prescription row
  const handleAddPrescription = () => {
    if (!newDrugName.trim()) return;
    setActivePrescriptions(prev => [
      ...prev,
      {
        id: `rx-${Date.now()}`,
        drugName: newDrugName.trim(),
        dosage: '1 Tab',
        frequency: '1-0-1',
        duration: '5 Days',
        instructions: 'After meals'
      }
    ]);
  };

  // Calculate bill total
  const billingTotal = useMemo(() => {
    return billingItems.reduce((acc, item) => acc + item.cost, 0);
  }, [billingItems]);

  const billingDue = Math.max(0, billingTotal - billingPaidAmount);

  // Generate invoice
  const handleCreateInvoice = () => {
    const newInv: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNo: `LDC-2026-${Math.floor(100 + Math.random() * 900)}`,
      patientName: billingPatientName,
      patientPhone: billingPhone,
      date: new Date().toISOString().split('T')[0],
      items: billingItems,
      totalAmount: billingTotal,
      paidAmount: billingPaidAmount,
      dueAmount: billingDue,
      paymentMode: billingPaymentMode,
      upiRef: billingPaymentMode === 'UPI' ? `UPI/${Date.now().toString().slice(-8)}/LAVANYA` : undefined,
      status: billingDue === 0 ? 'Paid' : billingPaidAmount > 0 ? 'Partial' : 'Unpaid'
    };

    setInvoices(prev => [newInv, ...prev]);
    alert(`Invoice ${newInv.invoiceNo} generated successfully for ${newInv.patientName}! Receipt ready to print or WhatsApp.`);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-slate-800 font-sans selection:bg-emerald-200">
      
      {/* ══════════════════════════════════════════════════════════════════════════
          1. TOP COMMAND BAR (HEALVO CLINIC OS HEADER)
      ══════════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            
            {/* Brand & Clinic Status */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#064E3B] flex items-center justify-center shadow-md shadow-emerald-900/10 text-white shrink-0">
                <Stethoscope className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight font-display truncate">
                    Lavanya Dental Clinic
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Healvo Clinic OS
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                  Live Queue • FDI Charting • Consultations • UPI Billing • AI Assistant
                </p>
              </div>
            </div>

            {/* Healvo AI Quick-Ask Bar */}
            <div className="hidden lg:flex flex-1 max-w-md mx-4">
              <div 
                onClick={() => setShowAiModal(true)}
                className="w-full bg-stone-100/80 hover:bg-stone-100 border border-stone-200 hover:border-emerald-500/50 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 text-xs text-slate-500 cursor-pointer transition-all shadow-2xs group"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="truncate">Ask Healvo AI anything about today's clinic...</span>
                <kbd className="ml-auto px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono text-slate-400">
                  Ctrl+K
                </kbd>
              </div>
            </div>

            {/* Quick Actions & Doctor Switcher */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Live Clock */}
              <div className="hidden md:flex flex-col items-end text-right pr-2 border-r border-stone-200">
                <span className="text-[11px] font-mono font-bold text-slate-900">{currentTime || '17:00:00'}</span>
                <span className="text-[10px] text-slate-500">Kukatpally, Hyd</span>
              </div>

              {/* Quick + Walk-in Button */}
              <button
                onClick={() => setShowWalkInModal(true)}
                className="flex items-center gap-1.5 bg-[#064E3B] hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Walk-In</span>
              </button>

              {/* Doctor Switcher */}
              <div className="relative hidden sm:block">
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="bg-stone-50 border border-stone-200 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-2 pr-7 outline-hidden cursor-pointer focus:ring-1 focus:ring-emerald-500"
                >
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name.split(',')[0]} (Doctor)
                    </option>
                  ))}
                  <option value="reception">Reception Desk (Staff)</option>
                </select>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Exit Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* ════════════════════════════════════════════════════════════════════
              2. HEALVO NAVIGATION PILLS
          ════════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none border-t border-stone-100">
            {[
              { id: 'queue',    label: 'Waiting Room',       icon: Users,      badge: waitingPatients.length },
              { id: 'chart',    label: 'FDI Dental Chart',   icon: Activity,   badge: null },
              { id: 'consult',  label: 'Consultation & Rx',  icon: FileText,   badge: null },
              { id: 'xrays',    label: 'X-Rays & Scans',     icon: Camera,     badge: xrays.length },
              { id: 'billing',  label: 'Billing & UPI',      icon: QrCode,     badge: '₹14.5k' },
              { id: 'reports',  label: 'Reports & Revenue',  icon: DollarSign, badge: null },
              { id: 'services', label: 'Treatments Catalog', icon: Layers,     badge: services.length },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as HealvoTabId)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive 
                      ? 'bg-[#064E3B] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-300' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== null && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-emerald-950/80 text-emerald-200' : 'bg-stone-200 text-slate-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ──────────────────────────────────────────────────────────────────────
            TAB 1: WAITING ROOM / LIVE CHAIR QUEUE
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            
            {/* Queue Header summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Live Clinic Flow &amp; Operatories
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reception check-ins, active chair treatments, and billed departures in real-time.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowWalkInModal(true)}
                  className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Walk-in Patient</span>
                </button>
              </div>
            </div>

            {/* 3-Column Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* COLUMN 1: WAITING ROOM (RECEPTION) */}
              <div className="bg-stone-100/70 rounded-3xl p-4 border border-stone-200 space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Waiting at Reception
                    </h3>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {waitingPatients.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {waitingPatients.length === 0 ? (
                    <div className="bg-white/60 border border-dashed border-stone-300 rounded-2xl p-6 text-center text-xs text-slate-400">
                      No patients waiting in reception right now.
                    </div>
                  ) : (
                    waitingPatients.map((pt, idx) => (
                      <div key={pt.id} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3 hover:border-emerald-400 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400">#{pt.confirmationCode}</span>
                            <h4 className="font-bold text-sm text-slate-900 leading-tight">{pt.patientName}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{pt.patientPhone}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Waiting {10 + idx * 8}m</span>
                          </span>
                        </div>

                        <div className="bg-stone-50 rounded-xl p-2.5 text-xs text-slate-600 font-medium">
                          <span className="text-slate-400 font-normal">Complaint: </span>
                          {pt.primaryComplaint || 'Routine Checkup & Scaling'}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => {
                              updateAppointmentStatus(pt.id, 'Rescheduled');
                              setActivePatientName(pt.patientName);
                            }}
                            className="flex-1 bg-[#064E3B] hover:bg-emerald-800 text-white py-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
                          >
                            <span>Call into Chair</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* COLUMN 2: IN THE CHAIR (OPERATORY) */}
              <div className="bg-stone-100/70 rounded-3xl p-4 border border-stone-200 space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      In Chair (Operatory)
                    </h3>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {inChairPatients.length > 0 ? inChairPatients.length : 1} Active
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Active demo card in chair */}
                  <div className="bg-white rounded-2xl p-4 border-2 border-emerald-500 shadow-md space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-bl-xl">
                      Operatory 1
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-600">IN TREATMENT</span>
                      <h4 className="font-bold text-base text-slate-900 leading-tight mt-0.5">
                        {inChairPatients[0]?.patientName || activePatientName}
                      </h4>
                      <p className="text-xs text-slate-500">Dr. Lavanya MDS • Oral & Maxillofacial</p>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span>Procedure in progress:</span>
                        <span className="font-mono text-emerald-700">Timer: 24m 10s</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">Tooth #46 Access Opening & Biomechanical Preparation</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setActiveTab('chart');
                          setSelectedToothId(46);
                        }}
                        className="bg-stone-100 hover:bg-stone-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
                      >
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        <span>FDI Chart</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('consult');
                        }}
                        className="bg-stone-100 hover:bg-stone-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Write Rx</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('billing');
                        setBillingPatientName(inChairPatients[0]?.patientName || activePatientName);
                      }}
                      className="w-full bg-[#064E3B] hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Finish Treatment &amp; Bill UPI</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* COLUMN 3: COMPLETED & BILLED */}
              <div className="bg-stone-100/70 rounded-3xl p-4 border border-stone-200 space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Completed &amp; Billed
                    </h3>
                  </div>
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {invoices.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{inv.patientName}</h4>
                          <span className="text-[10px] font-mono text-slate-400">{inv.invoiceNo}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'Paid' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status === 'Paid' ? 'Paid In Full' : `Due: ₹${inv.dueAmount}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                        <span className="text-slate-500 font-medium">Billed: ₹{inv.totalAmount}</span>
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                          {inv.paymentMode === 'UPI' && <QrCode className="w-3 h-3" />}
                          {inv.paymentMode === 'Cash' && <Banknote className="w-3 h-3" />}
                          {inv.paymentMode} (₹{inv.paidAmount})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────
            TAB 2: FDI DENTAL CHART (INTERACTIVE 32-TOOTH ANATOMICAL DIAGRAM)
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900 font-display">
                    Interactive FDI Dental Chart (Tooth-by-Tooth)
                  </h2>
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    ISO/FDI 32-Tooth Standard
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Patient: <strong className="text-slate-800">{activePatientName}</strong> • Tap any tooth to update pathology, clinical restorations, or RCT notes.
                </p>
              </div>

              {/* Legend Summary */}
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(TOOTH_STATUS_CONFIG).slice(0, 5).map(([key, cfg]) => (
                  <span key={key} className={`text-[10px] font-semibold px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    {cfg.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Dental Arch Visual Board (8 cols) */}
              <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-8">
                
                {/* ══ UPPER ARCH (MAXILLARY) ══ */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                    <span>Upper Right (18 to 11)</span>
                    <span className="text-slate-800 font-display text-sm font-extrabold">MAXILLARY ARCH</span>
                    <span>Upper Left (21 to 28)</span>
                  </div>

                  <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 sm:gap-2">
                    {teethChart.slice(0, 16).map(tooth => {
                      const isSelected = tooth.id === selectedToothId;
                      const cfg = TOOTH_STATUS_CONFIG[tooth.status];
                      return (
                        <button
                          key={tooth.id}
                          onClick={() => setSelectedToothId(tooth.id)}
                          className={`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all text-center cursor-pointer ${
                            isSelected 
                              ? 'ring-2 ring-[#064E3B] bg-emerald-50/60 border-[#064E3B] shadow-sm' 
                              : `${cfg.bg} ${cfg.border} hover:scale-105`
                          }`}
                        >
                          <span className="text-[11px] font-mono font-black text-slate-900">{tooth.id}</span>
                          
                          {/* Stylized Tooth SVG Icon */}
                          <div className="my-1.5 w-6 h-7 flex items-center justify-center">
                            <svg viewBox="0 0 32 40" className="w-full h-full">
                              <path 
                                d="M 6 4 C 10 2, 22 2, 26 4 C 30 7, 30 18, 28 26 C 26 34, 24 38, 20 38 C 17 38, 16 32, 16 32 C 16 32, 15 38, 12 38 C 8 38, 6 34, 4 26 C 2 18, 2 7, 6 4 Z" 
                                className={`${
                                  tooth.status === 'healthy' ? 'fill-emerald-100 stroke-emerald-600' :
                                  tooth.status === 'caries' ? 'fill-rose-200 stroke-rose-600' :
                                  tooth.status === 'rct' ? 'fill-purple-200 stroke-purple-600' :
                                  tooth.status === 'crown' ? 'fill-amber-200 stroke-amber-600' :
                                  tooth.status === 'implant' ? 'fill-teal-200 stroke-teal-600' :
                                  tooth.status === 'filled' ? 'fill-blue-200 stroke-blue-600' :
                                  'fill-slate-100 stroke-slate-400 stroke-dashed'
                                } stroke-2`}
                              />
                            </svg>
                          </div>

                          <span className="text-[8px] font-bold text-slate-600 truncate w-full uppercase">
                            {tooth.status.slice(0, 4)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Arch Divider Midline */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-stone-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-stone-100 text-stone-500 font-bold px-3 py-0.5 rounded-full text-[10px]">
                      MIDLINE OCCLUSAL PLANE
                    </span>
                  </div>
                </div>

                {/* ══ LOWER ARCH (MANDIBULAR) ══ */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                    <span>Lower Right (48 to 41)</span>
                    <span className="text-slate-800 font-display text-sm font-extrabold">MANDIBULAR ARCH</span>
                    <span>Lower Left (31 to 38)</span>
                  </div>

                  <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 sm:gap-2">
                    {/* Rearrange lower teeth in continuous anatomical order */}
                    {[...teethChart.slice(24, 32).reverse(), ...teethChart.slice(16, 24)].map(tooth => {
                      const isSelected = tooth.id === selectedToothId;
                      const cfg = TOOTH_STATUS_CONFIG[tooth.status];
                      return (
                        <button
                          key={tooth.id}
                          onClick={() => setSelectedToothId(tooth.id)}
                          className={`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all text-center cursor-pointer ${
                            isSelected 
                              ? 'ring-2 ring-[#064E3B] bg-emerald-50/60 border-[#064E3B] shadow-sm' 
                              : `${cfg.bg} ${cfg.border} hover:scale-105`
                          }`}
                        >
                          <span className="text-[11px] font-mono font-black text-slate-900">{tooth.id}</span>
                          
                          <div className="my-1.5 w-6 h-7 flex items-center justify-center">
                            <svg viewBox="0 0 32 40" className="w-full h-full rotate-180">
                              <path 
                                d="M 6 4 C 10 2, 22 2, 26 4 C 30 7, 30 18, 28 26 C 26 34, 24 38, 20 38 C 17 38, 16 32, 16 32 C 16 32, 15 38, 12 38 C 8 38, 6 34, 4 26 C 2 18, 2 7, 6 4 Z" 
                                className={`${
                                  tooth.status === 'healthy' ? 'fill-emerald-100 stroke-emerald-600' :
                                  tooth.status === 'caries' ? 'fill-rose-200 stroke-rose-600' :
                                  tooth.status === 'rct' ? 'fill-purple-200 stroke-purple-600' :
                                  tooth.status === 'crown' ? 'fill-amber-200 stroke-amber-600' :
                                  tooth.status === 'implant' ? 'fill-teal-200 stroke-teal-600' :
                                  tooth.status === 'filled' ? 'fill-blue-200 stroke-blue-600' :
                                  'fill-slate-100 stroke-slate-400 stroke-dashed'
                                } stroke-2`}
                              />
                            </svg>
                          </div>

                          <span className="text-[8px] font-bold text-slate-600 truncate w-full uppercase">
                            {tooth.status.slice(0, 4)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Tooth Inspector & Clinical Notes (4 cols) */}
              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
                
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Tooth #{selectedTooth.id}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1 font-display">
                      {selectedTooth.name}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-xl border ${TOOTH_STATUS_CONFIG[selectedTooth.status].bg} ${TOOTH_STATUS_CONFIG[selectedTooth.status].border}`}>
                    <Smile className={`w-5 h-5 ${TOOTH_STATUS_CONFIG[selectedTooth.status].color}`} />
                  </div>
                </div>

                {/* Change Status Action Grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Update Clinical Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(TOOTH_STATUS_CONFIG) as ToothStatus[]).map(statusKey => {
                      const cfg = TOOTH_STATUS_CONFIG[statusKey];
                      const isCurrent = selectedTooth.status === statusKey;
                      return (
                        <button
                          key={statusKey}
                          onClick={() => handleUpdateToothStatus(statusKey)}
                          className={`text-left p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isCurrent
                              ? `${cfg.bg} ${cfg.border} ring-2 ring-emerald-500 font-bold`
                              : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              statusKey === 'healthy' ? 'bg-emerald-500' :
                              statusKey === 'caries' ? 'bg-rose-500' :
                              statusKey === 'rct' ? 'bg-purple-500' :
                              statusKey === 'crown' ? 'bg-amber-500' :
                              statusKey === 'implant' ? 'bg-teal-500' : 'bg-slate-400'
                            }`} />
                            <span className="truncate">{cfg.label.split(' ')[0]}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Per-Tooth Clinical Notes */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Per-Tooth Chairside Notes
                  </label>
                  <textarea
                    rows={4}
                    value={selectedTooth.notes || ''}
                    onChange={(e) => handleUpdateToothNotes(e.target.value)}
                    placeholder="e.g. Deep distal caries, tender on biting. Scheduled for RCT..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-slate-800 leading-relaxed outline-hidden focus:ring-1 focus:ring-emerald-500 resize-none font-medium"
                  />
                  <p className="text-[10px] text-slate-400">
                    Saved automatically to {activePatientName}'s permanent electronic dental record.
                  </p>
                </div>

                {/* Quick Add To Consultation */}
                <button
                  onClick={() => {
                    if (!activeConsultTeeth.includes(selectedTooth.id)) {
                      setActiveConsultTeeth(prev => [...prev, selectedTooth.id]);
                    }
                    setActiveTab('consult');
                  }}
                  className="w-full bg-[#064E3B] hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Add Tooth #{selectedTooth.id} to Consultation Rx</span>
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────
            TAB 3: CHAIRSIDE CONSULTATIONS & DIGITAL PRESCRIPTIONS (Rx)
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'consult' && (
          <div className="space-y-6">
            
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Chairside Consultation &amp; Digital Rx
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record complaints, examination, and generate WhatsApp/print prescriptions right from the dental chair.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Rx</span>
                </button>

                <a
                  href={`https://wa.me/919885611128?text=Hello%20${encodeURIComponent(activePatientName)}%2C%20here%20is%20your%20digital%20prescription%20from%20Dr.%20Lavanya%20Dental%20Clinic.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Rx</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Clinical Notes Form (6 cols) */}
              <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                
                {/* Patient Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={activePatientName}
                    onChange={(e) => setActivePatientName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>

                {/* Chief Complaint */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Chief Complaint &amp; History
                  </label>
                  <textarea
                    rows={2}
                    value={activeConsultComplaint}
                    onChange={(e) => setActiveConsultComplaint(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed resize-none"
                  />
                </div>

                {/* Clinical Findings */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Clinical Examination &amp; Diagnosis
                  </label>
                  <textarea
                    rows={2}
                    value={activeConsultFindings}
                    onChange={(e) => setActiveConsultFindings(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed resize-none"
                  />
                </div>

                {/* Teeth Involved Tags */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Teeth Involved
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeConsultTeeth.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 bg-[#064E3B] text-white text-xs font-mono font-bold px-2.5 py-1 rounded-lg">
                        #{t}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-rose-300" 
                          onClick={() => setActiveConsultTeeth(prev => prev.filter(item => item !== t))}
                        />
                      </span>
                    ))}
                    <button
                      onClick={() => {
                        const val = prompt('Enter FDI Tooth number (e.g. 16, 24, 46):');
                        if (val && !isNaN(Number(val))) {
                          setActiveConsultTeeth(prev => [...prev, Number(val)]);
                        }
                      }}
                      className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-bold"
                    >
                      + Add Tooth
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => alert(`Consultation for ${activePatientName} saved to electronic health record!`)}
                    className="w-full bg-[#064E3B] hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Save Clinical Record
                  </button>
                </div>

              </div>

              {/* Right Column: Digital Prescription Pad (6 cols) */}
              <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm font-display flex items-center gap-1.5">
                      <span className="text-emerald-700 font-serif text-lg font-black italic">℞</span>
                      Digital Prescription Pad
                    </h3>
                    <p className="text-[11px] text-slate-500">Dr. Lavanya MDS • Reg No: A-28491</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 font-bold">{new Date().toLocaleDateString()}</span>
                </div>

                {/* Prescription Items Table */}
                <div className="space-y-2">
                  {activePrescriptions.map((rx, idx) => (
                    <div key={rx.id} className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">{idx + 1}.</span>
                          <span>{rx.drugName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span>{rx.frequency}</span>
                          <span>•</span>
                          <span>{rx.duration}</span>
                          <span>•</span>
                          <span className="text-emerald-800 font-semibold">{rx.instructions}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActivePrescriptions(prev => prev.filter(item => item.id !== rx.id))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Drug Row */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newDrugName}
                    onChange={(e) => setNewDrugName(e.target.value)}
                    placeholder="Medicine name..."
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                  />
                  <button
                    onClick={handleAddPrescription}
                    className="bg-[#064E3B] hover:bg-emerald-800 text-white px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    + Add Drug
                  </button>
                </div>

                {/* Common Presets */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Dental Presets:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Tab. Augmentin 625mg', 'Tab. Zerodol-SP', 'Tab. Ketorol-DT', 'Chlorhexidine 0.2%'].map(preset => (
                      <button
                        key={preset}
                        onClick={() => setNewDrugName(preset)}
                        className="text-[10px] font-semibold bg-stone-100 hover:bg-stone-200 text-slate-700 px-2 py-1 rounded-md transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────
            TAB 4: CHAIRSIDE X-RAYS & CLINICAL SCANS VAULT
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'xrays' && (
          <div className="space-y-6">
            
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Chairside X-Rays &amp; Radiographic Vault
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  IOPA radiographs, OPG panorex, intraoral camera snapshots, and 3D CBCT scans.
                </p>
              </div>

              <button
                onClick={() => {
                  const url = prompt('Enter X-Ray image URL or photo simulation:', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80');
                  if (url) {
                    setXrays(prev => [
                      {
                        id: `xr-${Date.now()}`,
                        patientName: activePatientName,
                        toothNumber: selectedToothId,
                        type: 'IOPA',
                        date: new Date().toISOString().split('T')[0],
                        imageUrl: url,
                        notes: `Intraoral periapical radiograph for tooth #${selectedToothId}.`
                      },
                      ...prev
                    ]);
                  }
                }}
                className="flex items-center gap-1.5 bg-[#064E3B] hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>+ Upload / Capture Scan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {xrays.map(xr => (
                <div 
                  key={xr.id} 
                  className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden group hover:border-emerald-500 transition-all flex flex-col"
                >
                  <div 
                    onClick={() => setSelectedXray(xr)}
                    className="relative h-48 bg-black cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    <img 
                      src={xr.imageUrl} 
                      alt={xr.type} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border border-white/20">
                      {xr.type}
                    </div>
                    {xr.toothNumber && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg">
                        #{xr.toothNumber}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white/90 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Examine Scan
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{xr.patientName}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{xr.notes}</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-stone-100 font-mono">
                      <span>{xr.date}</span>
                      <span>Verified Digital Storage</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Lightbox Modal */}
            {selectedXray && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-emerald-400 font-bold">{selectedXray.type} SCAN</span>
                      <h3 className="text-lg font-bold font-display">{selectedXray.patientName} (Tooth #{selectedXray.toothNumber})</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedXray(null)}
                      className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-96">
                    <img 
                      src={selectedXray.imageUrl} 
                      alt="Enlarged Scan" 
                      className={`max-h-96 w-auto object-contain transition-all ${
                        isInvertXray ? 'invert contrast-125' : ''
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setIsInvertXray(prev => !prev)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 font-semibold"
                    >
                      {isInvertXray ? 'Normal Contrast' : 'Invert Negative (X-Ray View)'}
                    </button>
                    <span className="text-xs text-slate-400 font-mono">{selectedXray.date}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────
            TAB 5: BILLING & UPI PART-PAYMENTS
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Chairside Billing &amp; UPI Part-Payments
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instant invoice generation, dynamic UPI QR collection, and multi-sitting dues ledger.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>VPA: lavanyadental@upi</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Create Invoice (5 cols) */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base font-display">Generate New Bill</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Patient Name</label>
                    <input
                      type="text"
                      value={billingPatientName}
                      onChange={(e) => setBillingPatientName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone (WhatsApp Receipt)</label>
                    <input
                      type="text"
                      value={billingPhone}
                      onChange={(e) => setBillingPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium"
                    />
                  </div>

                  {/* Procedures Line Items */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Procedure Line Items</label>
                    {billingItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                        <span className="font-medium text-slate-800 truncate mr-2">{item.name}</span>
                        <span className="font-mono font-bold text-slate-900 shrink-0">₹{item.cost}</span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Payment Channel</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['UPI', 'Cash', 'Card', 'Part Payment'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setBillingPaymentMode(mode)}
                          className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            billingPaymentMode === mode
                              ? 'bg-[#064E3B] text-white border-[#064E3B]'
                              : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Part Payment Split Input */}
                  <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Total Bill:</span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">₹{billingTotal}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-bold">Amount Paid Today:</span>
                      <input
                        type="number"
                        value={billingPaidAmount}
                        onChange={(e) => setBillingPaidAmount(Number(e.target.value))}
                        className="w-28 bg-white border border-stone-300 rounded-lg px-2 py-1 text-right font-mono font-bold text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200 font-bold">
                      <span className="text-rose-600">Balance Due:</span>
                      <span className="font-mono text-rose-600">₹{billingDue}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateInvoice}
                    className="w-full bg-[#064E3B] hover:bg-emerald-800 text-white py-3 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Issue Invoice &amp; Send WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Invoices Ledger (7 cols) */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base font-display">Recent Invoices &amp; Collections</h3>
                  <span className="text-xs text-slate-400 font-mono">{invoices.length} invoices recorded</span>
                </div>

                <div className="space-y-3">
                  {invoices.map(inv => (
                    <div key={inv.id} className="p-4 rounded-2xl border border-stone-200/90 hover:border-emerald-300 transition-all space-y-2 bg-stone-50/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{inv.patientName}</h4>
                            <span className="font-mono text-[10px] text-slate-400">({inv.invoiceNo})</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{inv.patientPhone}</p>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          inv.status === 'Paid' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status === 'Paid' ? 'Paid' : `Due: ₹${inv.dueAmount}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/70">
                        <span className="text-slate-600 font-mono">
                          Total: ₹{inv.totalAmount} • Paid: ₹{inv.paidAmount} via <strong>{inv.paymentMode}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => alert(`Printing Invoice ${inv.invoiceNo} for ${inv.patientName}...`)}
                            className="text-slate-500 hover:text-emerald-700 p-1"
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────
            TAB 6: REPORTS & CLINIC REVENUE INTELLIGENCE
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
              <h2 className="text-xl font-extrabold text-slate-900 font-display">
                Clinical Intelligence &amp; Performance Reports
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Practice revenue, patient volume, top treatments, and collection metrics.
              </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold uppercase">Today's Collections</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">₹14,500</div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">↑ 18% vs yesterday</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold uppercase">UPI Share</span>
                <div className="text-2xl font-black text-emerald-700 font-mono mt-1">76%</div>
                <span className="text-[11px] text-slate-500 mt-1 inline-block">Direct bank transfers</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold uppercase">Pending Patient Dues</span>
                <div className="text-2xl font-black text-amber-600 font-mono mt-1">₹4,000</div>
                <span className="text-[11px] text-slate-500 mt-1 inline-block">Across 2 active RCT cases</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold uppercase">Patient Visits</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">{appointments.length + 8}</div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">92% on-time rate</span>
              </div>
            </div>

            {/* Treatment Revenue Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm font-display">Revenue by Treatment Category</h3>
              <div className="space-y-3">
                {[
                  { name: 'Oral & Maxillofacial Surgeries (Jaw & Tumors)', share: 38, amount: '₹42,000' },
                  { name: 'Root Canal Treatment (RCT)', share: 28, amount: '₹31,000' },
                  { name: 'Dental Implants & Prosthetics', share: 20, amount: '₹22,000' },
                  { name: 'Orthodontics & Aligners', share: 14, amount: '₹15,500' },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{item.name}</span>
                      <span className="font-mono text-slate-900 font-bold">{item.amount} ({item.share}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full" 
                        style={{ width: `${item.share}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────
            TAB 7: TREATMENTS & SERVICES CATALOG
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">Treatments &amp; Services Catalog</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage live services offered on the Lavanya Dental website.</p>
              </div>
              <span className="text-xs font-mono font-bold bg-stone-100 px-3 py-1.5 rounded-xl text-slate-700">
                {services.length} Active Services
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(svc => (
                <div key={svc.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {svc.category}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{svc.name}</h4>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{svc.durationMinutes}m</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{svc.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════════════════════
          QUICK WALK-IN REGISTRATION MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 font-display">Quick Walk-In Registration</h3>
              <button onClick={() => setShowWalkInModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anand Sharma"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="9885611128"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chief Complaint</label>
                <input
                  type="text"
                  placeholder="e.g. Broken tooth, swelling, acute pain"
                  value={walkInComplaint}
                  onChange={(e) => setWalkInComplaint(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Attending Doctor</label>
                <select
                  value={walkInDoctorId}
                  onChange={(e) => setWalkInDoctorId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRegisterWalkIn}
                className="w-full bg-[#064E3B] hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all mt-2"
              >
                Join Today's Waiting Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          HEALVO AI CLINIC ASSISTANT MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 relative space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#064E3B] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm font-display">Healvo AI Assistant</h3>
                  <p className="text-[10px] text-slate-400">Intelligent clinic queries from your live clinical data</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick questions chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                'How much did we collect today?',
                'Who is currently in the chair?',
                'List patients scheduled for RCT',
                'Show pending dues',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => handleAskHealvoAi(q)}
                  className="text-[10px] font-semibold bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 px-2.5 py-1 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Log */}
            <div className="flex-1 overflow-y-auto space-y-3 p-1">
              {isAiThinking && (
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Computing live metrics across appointments &amp; invoices...</span>
                </div>
              )}

              {aiChatLog.map((chat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="bg-emerald-900 text-white rounded-2xl rounded-tr-none px-3.5 py-2 text-xs font-medium ml-auto max-w-[85%]">
                    {chat.query}
                  </div>
                  <div className="bg-stone-100 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-slate-800 leading-relaxed mr-auto max-w-[90%] border border-stone-200">
                    <p>{chat.answer}</p>
                    <span className="text-[9px] text-slate-400 font-mono mt-1 block">{chat.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input form */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <input
                type="text"
                placeholder="Ask about revenue, appointments, patients..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskHealvoAi(aiQuery)}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-hidden"
              />
              <button
                onClick={() => handleAskHealvoAi(aiQuery)}
                className="bg-[#064E3B] hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Ask AI
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
