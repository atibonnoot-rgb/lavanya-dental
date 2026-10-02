import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  QrCode, 
  Share2, 
  X, 
  Eye, 
  Building2, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Sparkles,
  Edit2
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── DATA MODELS ─────────────────────────────────────────────────────────────

export interface InvoiceItem {
  id: string;
  description: string;
  toothNumber?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string; // e.g. LDC-2026-1001
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  patientName: string;
  patientPhone: string;
  patientAge?: string;
  patientGender?: 'Male' | 'Female' | 'Other';
  doctorName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number; // in ₹
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentMode: 'UPI' | 'Cash' | 'Card' | 'Insurance' | 'NetBanking';
  paymentReference?: string;
  notes?: string;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Dental Lab Charges (Crowns/Aligners)'
  | 'Dental Consumables & Implants'
  | 'Clinic Rent & Utilities'
  | 'Staff & Assistant Salaries'
  | 'Sterilization & Bio-Waste'
  | 'Doctor Professional Payout'
  | 'Clinic Maintenance & Repairs'
  | 'Other Clinic Expenses';

export interface ClinicExpense {
  id: string;
  date: string;
  category: ExpenseCategory;
  vendorName: string;
  amount: number;
  paymentMode: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
  notes?: string;
  createdAt: string;
}

// Pre-configured clinic treatments with standard pricing
export const STANDARD_TREATMENTS: { name: string; defaultFee: number; category: string }[] = [
  { name: 'Laser Root Canal Treatment (RCT)', defaultFee: 4500, category: 'Endodontics' },
  { name: 'Zirconia Aesthetic Crown (Cad-Cam)', defaultFee: 7500, category: 'Prosthodontics' },
  { name: 'PFM Crown (Ceramic)', defaultFee: 4500, category: 'Prosthodontics' },
  { name: 'Dental Implant (Titanium Fixture + Abutment)', defaultFee: 25000, category: 'Implantology' },
  { name: 'Ultrasonic Teeth Scaling & Polishing', defaultFee: 1200, category: 'Periodontics' },
  { name: 'Deep Periodontal Curettage / Flap Surgery', defaultFee: 4000, category: 'Periodontics' },
  { name: 'Aesthetic Composite Filling (Per Tooth)', defaultFee: 1500, category: 'Restorative' },
  { name: 'Surgical Wisdom Tooth Extraction (Impaction)', defaultFee: 3500, category: 'Oral Surgery' },
  { name: 'Simple Permanent Tooth Extraction', defaultFee: 1000, category: 'Oral Surgery' },
  { name: 'Clear Aligners Initial 3D Scan & Planning', defaultFee: 5000, category: 'Orthodontics' },
  { name: 'Complete Clear Aligners Treatment Package', defaultFee: 65000, category: 'Orthodontics' },
  { name: 'In-Office Laser Teeth Whitening', defaultFee: 8000, category: 'Cosmetic' },
  { name: 'Pediatric Pulpectomy & Zirconia Crown', defaultFee: 3500, category: 'Pedodontics' },
  { name: 'Digital Intraoral Radiograph (IOPA/RVG)', defaultFee: 300, category: 'Diagnostics' },
  { name: 'Comprehensive Consultation & Treatment Plan', defaultFee: 500, category: 'Diagnostics' }
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Dental Lab Charges (Crowns/Aligners)',
  'Dental Consumables & Implants',
  'Clinic Rent & Utilities',
  'Staff & Assistant Salaries',
  'Sterilization & Bio-Waste',
  'Doctor Professional Payout',
  'Clinic Maintenance & Repairs',
  'Other Clinic Expenses'
];

interface ClinicBillingLedgerProps {
  initialPatient?: {
    name: string;
    phone: string;
    treatment?: string;
  } | null;
  onClearInitialPatient?: () => void;
}

export const ClinicBillingLedger: React.FC<ClinicBillingLedgerProps> = ({
  initialPatient,
  onClearInitialPatient
}) => {
  // ─── STATE MANAGEMENT ────────────────────────────────────────────────────────
  const [activeLedgerSubTab, setActiveLedgerSubTab] = useState<'invoices' | 'expenses' | 'summary'>('invoices');
  
  // Invoices & Expenses from LocalStorage
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('lavanya_clinic_invoices');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load invoices:', e);
    }
    return [];
  });

  const [expenses, setExpenses] = useState<ClinicExpense[]>(() => {
    try {
      const saved = localStorage.getItem('lavanya_clinic_expenses');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load expenses:', e);
    }
    return [];
  });

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lavanya_clinic_invoices', JSON.stringify(invoices));
    } catch (e) {
      console.warn('Failed to save invoices:', e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem('lavanya_clinic_expenses', JSON.stringify(expenses));
    } catch (e) {
      console.warn('Failed to save expenses:', e);
    }
  }, [expenses]);

  // Modals
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState<boolean>(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<Invoice | null>(null);

  // Search & Filters
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>('');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  // Triggered when an initial patient is passed from another tab
  useEffect(() => {
    if (initialPatient) {
      setShowCreateInvoiceModal(true);
      setNewInvPatientName(initialPatient.name || '');
      setNewInvPatientPhone(initialPatient.phone || '');
      if (initialPatient.treatment) {
        const found = STANDARD_TREATMENTS.find(t => 
          t.name.toLowerCase().includes(initialPatient.treatment!.toLowerCase())
        );
        if (found) {
          setNewInvItems([{
            id: 'item-1',
            description: found.name,
            quantity: 1,
            unitPrice: found.defaultFee,
            total: found.defaultFee
          }]);
        } else {
          setNewInvItems([{
            id: 'item-1',
            description: initialPatient.treatment,
            quantity: 1,
            unitPrice: 1500,
            total: 1500
          }]);
        }
      }
      if (onClearInitialPatient) onClearInitialPatient();
    }
  }, [initialPatient]);

  // ─── FORM STATES: NEW INVOICE ────────────────────────────────────────────────
  const [newInvPatientName, setNewInvPatientName] = useState<string>('');
  const [newInvPatientPhone, setNewInvPatientPhone] = useState<string>('');
  const [newInvPatientAge, setNewInvPatientAge] = useState<string>('');
  const [newInvPatientGender, setNewInvPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newInvDoctorName, setNewInvDoctorName] = useState<string>('Dr. V. Vijai Rajasekhar (BDS, MDS)');
  const [newInvPaymentMode, setNewInvPaymentMode] = useState<'UPI' | 'Cash' | 'Card' | 'Insurance' | 'NetBanking'>('UPI');
  const [newInvPaymentReference, setNewInvPaymentReference] = useState<string>('');
  const [newInvDiscount, setNewInvDiscount] = useState<number>(0);
  const [newInvPaidAmount, setNewInvPaidAmount] = useState<number>(0);
  const [newInvNotes, setNewInvNotes] = useState<string>('');
  const [newInvItems, setNewInvItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      description: 'Laser Root Canal Treatment (RCT)',
      toothNumber: '',
      quantity: 1,
      unitPrice: 4500,
      total: 4500
    }
  ]);

  // Calculations for current draft invoice
  const draftSubtotal = useMemo(() => {
    return newInvItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  }, [newInvItems]);

  const draftGrandTotal = useMemo(() => {
    const total = draftSubtotal - (Number(newInvDiscount) || 0);
    return total > 0 ? total : 0;
  }, [draftSubtotal, newInvDiscount]);

  // Auto-set paid amount when grand total changes unless user customized it
  useEffect(() => {
    setNewInvPaidAmount(draftGrandTotal);
  }, [draftGrandTotal]);

  const draftBalanceDue = useMemo(() => {
    const bal = draftGrandTotal - (Number(newInvPaidAmount) || 0);
    return bal > 0 ? bal : 0;
  }, [draftGrandTotal, newInvPaidAmount]);

  const handleAddItemToInvoice = () => {
    setNewInvItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: 'Zirconia Aesthetic Crown (Cad-Cam)',
        toothNumber: '',
        quantity: 1,
        unitPrice: 7500,
        total: 7500
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (newInvItems.length <= 1) return;
    setNewInvItems(prev => prev.filter(i => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setNewInvItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
        updated.total = (qty || 1) * (price || 0);
      }
      return updated;
    }));
  };

  const handleQuickSelectTreatment = (itemId: string, treatmentName: string) => {
    const found = STANDARD_TREATMENTS.find(t => t.name === treatmentName);
    if (!found) return;
    setNewInvItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        description: found.name,
        unitPrice: found.defaultFee,
        total: (item.quantity || 1) * found.defaultFee
      };
    }));
  };

  const handleSaveInvoice = (andPrint: boolean = false) => {
    if (!newInvPatientName.trim() || !newInvPatientPhone.trim()) {
      alert('Please enter patient name and contact phone number.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nextNum = invoices.length + 1001;
    const invId = `LDC-${now.getFullYear()}-${nextNum}`;

    const status: Invoice['status'] = draftBalanceDue === 0 ? 'PAID' : (newInvPaidAmount > 0 ? 'PARTIAL' : 'UNPAID');

    const createdInvoice: Invoice = {
      id: invId,
      date: dateStr,
      time: timeStr,
      patientName: newInvPatientName.trim(),
      patientPhone: newInvPatientPhone.trim(),
      patientAge: newInvPatientAge.trim() || undefined,
      patientGender: newInvPatientGender,
      doctorName: newInvDoctorName,
      items: newInvItems,
      subtotal: draftSubtotal,
      discount: Number(newInvDiscount) || 0,
      grandTotal: draftGrandTotal,
      paidAmount: Number(newInvPaidAmount) || 0,
      balanceDue: draftBalanceDue,
      paymentMode: newInvPaymentMode,
      paymentReference: newInvPaymentReference.trim() || undefined,
      notes: newInvNotes.trim() || undefined,
      status,
      createdAt: now.toISOString()
    };

    setInvoices(prev => [createdInvoice, ...prev]);
    setShowCreateInvoiceModal(false);

    // Reset form
    setNewInvPatientName('');
    setNewInvPatientPhone('');
    setNewInvPatientAge('');
    setNewInvDiscount(0);
    setNewInvPaidAmount(0);
    setNewInvPaymentReference('');
    setNewInvNotes('');
    setNewInvItems([
      {
        id: 'item-1',
        description: 'Laser Root Canal Treatment (RCT)',
        toothNumber: '',
        quantity: 1,
        unitPrice: 4500,
        total: 4500
      }
    ]);

    if (andPrint) {
      setActiveInvoiceForPrint(createdInvoice);
    }
  };

  // ─── FORM STATES: NEW EXPENSE ────────────────────────────────────────────────
  const [newExpCategory, setNewExpCategory] = useState<ExpenseCategory>('Dental Lab Charges (Crowns/Aligners)');
  const [newExpVendor, setNewExpVendor] = useState<string>('');
  const [newExpAmount, setNewExpAmount] = useState<string>('');
  const [newExpPaymentMode, setNewExpPaymentMode] = useState<ClinicExpense['paymentMode']>('UPI');
  const [newExpRef, setNewExpRef] = useState<string>('');
  const [newExpNotes, setNewExpNotes] = useState<string>('');
  const [newExpDate, setNewExpDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const handleSaveExpense = () => {
    if (!newExpVendor.trim() || !newExpAmount || Number(newExpAmount) <= 0) {
      alert('Please enter valid vendor/lab name and expense amount.');
      return;
    }

    const createdExpense: ClinicExpense = {
      id: `EXP-${Date.now().toString().slice(-6)}`,
      date: newExpDate,
      category: newExpCategory,
      vendorName: newExpVendor.trim(),
      amount: Number(newExpAmount),
      paymentMode: newExpPaymentMode,
      referenceNo: newExpRef.trim() || undefined,
      notes: newExpNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setExpenses(prev => [createdExpense, ...prev]);
    setShowAddExpenseModal(false);

    // Reset
    setNewExpVendor('');
    setNewExpAmount('');
    setNewExpRef('');
    setNewExpNotes('');
  };

  // Delete handlers
  const handleDeleteInvoice = (id: string) => {
    if (window.confirm(`Delete invoice ${id}? This cannot be undone.`)) {
      setInvoices(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm(`Delete expense record?`)) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  // ─── EXCEL (.XLSX) GENERATION ────────────────────────────────────────────────
  const handleExportToExcel = () => {
    try {
      const invoiceRows = invoices.map((inv, idx) => ({
        'S.No': idx + 1,
        'Invoice No': inv.id,
        'Date': inv.date,
        'Time': inv.time,
        'Patient Name': inv.patientName,
        'Contact Phone': inv.patientPhone,
        'Age/Gender': `${inv.patientAge || '-'} / ${inv.patientGender || '-'}`,
        'Doctor': inv.doctorName,
        'Procedures / Treatments': inv.items.map(i => `${i.description}${i.toothNumber ? ` [Tooth #${i.toothNumber}]` : ''} (x${i.quantity})`).join('; '),
        'Subtotal (₹)': inv.subtotal,
        'Discount (₹)': inv.discount,
        'Grand Total (₹)': inv.grandTotal,
        'Paid Amount (₹)': inv.paidAmount,
        'Balance Due (₹)': inv.balanceDue,
        'Payment Mode': inv.paymentMode,
        'Transaction UTR / Ref': inv.paymentReference || 'N/A',
        'Payment Status': inv.status,
        'Notes': inv.notes || ''
      }));

      const expenseRows = expenses.map((exp, idx) => ({
        'S.No': idx + 1,
        'Expense ID': exp.id,
        'Date': exp.date,
        'Category': exp.category,
        'Vendor / Recipient': exp.vendorName,
        'Amount (₹)': exp.amount,
        'Payment Mode': exp.paymentMode,
        'Reference No': exp.referenceNo || 'N/A',
        'Notes': exp.notes || ''
      }));

      // Summary Metrics
      const totalCollected = invoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
      const totalBilled = invoices.reduce((s, i) => s + (Number(i.grandTotal) || 0), 0);
      const totalBalance = invoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);
      const totalExp = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const netProfit = totalCollected - totalExp;

      const upiTotal = invoices.filter(i => i.paymentMode === 'UPI').reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
      const cashTotal = invoices.filter(i => i.paymentMode === 'Cash').reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
      const cardTotal = invoices.filter(i => i.paymentMode === 'Card').reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);

      const summaryRows = [
        { 'Financial Metric': 'Total Billed Amount', 'Value (INR)': totalBilled },
        { 'Financial Metric': 'Total In-Clinic Collections (Paid)', 'Value (INR)': totalCollected },
        { 'Financial Metric': 'Total Patient Outstanding Balance', 'Value (INR)': totalBalance },
        { 'Financial Metric': 'Total Clinic Expenses & Lab Bills', 'Value (INR)': totalExp },
        { 'Financial Metric': 'Net Operating Profit (Cash Flow)', 'Value (INR)': netProfit },
        { 'Financial Metric': '--- Payment Methods Breakdown ---', 'Value (INR)': '---' },
        { 'Financial Metric': 'UPI / GPay / PhonePe Collections', 'Value (INR)': upiTotal },
        { 'Financial Metric': 'Cash Collections', 'Value (INR)': cashTotal },
        { 'Financial Metric': 'Card Swipe (POS) Collections', 'Value (INR)': cardTotal }
      ];

      const wb = XLSX.utils.book_new();
      const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows);
      const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

      XLSX.utils.book_append_sheet(wb, wsInvoices, 'Patient Invoices');
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Clinic Expenses');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'P&L Financial Summary');

      const fileName = `Lavanya_Dental_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Excel Export Error:', err);
      alert('Error generating Excel file. Check console.');
    }
  };

  // ─── FILTERED DATA ───────────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = inv.patientName.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
                          inv.patientPhone.includes(invoiceSearchQuery) ||
                          inv.id.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return inv.date === todayStr;
      }
      if (dateFilter === 'month') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return inv.date.startsWith(currentMonth);
      }
      return true;
    });
  }, [invoices, invoiceSearchQuery, dateFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchSearch = exp.vendorName.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
                          exp.category.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
                          exp.id.toLowerCase().includes(expenseSearchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return exp.date === todayStr;
      }
      if (dateFilter === 'month') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return exp.date.startsWith(currentMonth);
      }
      return true;
    });
  }, [expenses, expenseSearchQuery, dateFilter]);

  // Overall Totals
  const totalCollections = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);
  }, [invoices]);

  const totalClinicExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [expenses]);

  const netCashFlow = totalCollections - totalClinicExpenses;

  // ─── PRINT HANDLER ───────────────────────────────────────────────────────────
  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* ═══ PRINT STYLESHEET (HIDDEN ON SCREEN, USED ON PRINT) ═══ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-container, #printable-invoice-container * {
            visibility: visible !important;
          }
          #printable-invoice-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 24px !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* ═══ TOP LEDGER HEADER & ACTIONS ═══ */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Receipt className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                In-Clinic Billing, Invoices &amp; Expense Ledger
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Generate printable tax bills, capture in-clinic UPI/cash payments, and track dental lab &amp; clinic expenses.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              onClick={() => setShowCreateInvoiceModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#064E3B] hover:bg-emerald-900 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/10 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create In-Clinic Bill</span>
            </button>

            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
            >
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              <span>+ Add Expense</span>
            </button>

            <button
              onClick={handleExportToExcel}
              className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
              title="Download Excel Sheet (.xlsx) with Invoices, Expenses, and P&L Summary"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">Export Excel (.xlsx)</span>
              <span className="sm:hidden">Excel</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Card 1: Total Collections */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>Total Collections</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-emerald-950 font-mono">
              ₹{totalCollections.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium">
              {invoices.length} Invoices Generated
            </p>
          </div>

          {/* Card 2: Clinic Expenses */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-rose-800">
              <span>Total Expenses</span>
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-rose-950 font-mono">
              ₹{totalClinicExpenses.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-rose-700 font-medium">
              Lab bills &amp; clinic consumables
            </p>
          </div>

          {/* Card 3: Net Cash Flow */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-teal-800">
              <span>Net Clinic Cash Profit</span>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <p className={`text-lg sm:text-2xl font-black font-mono ${netCashFlow >= 0 ? 'text-teal-950' : 'text-rose-700'}`}>
              ₹{netCashFlow.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-teal-700 font-medium">
              Collections − Expenses
            </p>
          </div>

          {/* Card 4: Outstanding Balance */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-amber-800">
              <span>Pending Patient Dues</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-amber-950 font-mono">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-amber-700 font-medium">
              {invoices.filter(i => i.balanceDue > 0).length} Unsettled balances
            </p>
          </div>
        </div>

        {/* Ledger Sub-Tabs Navigation */}
        <div className="flex items-center justify-between border-t border-stone-200 pt-3 flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveLedgerSubTab('invoices')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLedgerSubTab === 'invoices'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🧾 Patient Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveLedgerSubTab('expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLedgerSubTab === 'expenses'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💸 Clinic Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveLedgerSubTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLedgerSubTab === 'summary'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 P&amp;L Financial Overview
            </button>
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Filter:</span>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                dateFilter === 'all' ? 'bg-[#064E3B] text-white' : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                dateFilter === 'today' ? 'bg-[#064E3B] text-white' : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                dateFilter === 'month' ? 'bg-[#064E3B] text-white' : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* ═══ SUB-TAB 1: INVOICES LIST ═══ */}
      {activeLedgerSubTab === 'invoices' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice #, patient name, or phone number..."
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200/80 p-6 space-y-3">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No invoices found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "+ Create In-Clinic Bill" to generate a printable invoice for an in-clinic patient.
              </p>
              <button
                onClick={() => setShowCreateInvoiceModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#064E3B] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-900 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Bill</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Invoice # / Date</th>
                    <th className="py-3 px-3">Patient Details</th>
                    <th className="py-3 px-3">Treatments Rendered</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Mode &amp; Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {inv.id}
                        </span>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{inv.date} ({inv.time})</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-900">{inv.patientName}</p>
                        <a 
                          href={`tel:${inv.patientPhone}`} 
                          className="text-[11px] text-teal-700 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{inv.patientPhone}</span>
                        </a>
                      </td>
                      <td className="py-3.5 px-3 max-w-[220px]">
                        <div className="space-y-0.5">
                          {inv.items.map((it, idx) => (
                            <div key={idx} className="text-xs text-slate-700 truncate">
                              • {it.description} {it.toothNumber ? `(#${it.toothNumber})` : ''}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono">
                        <div className="font-black text-slate-900 text-sm">
                          ₹{inv.grandTotal.toLocaleString('en-IN')}
                        </div>
                        {inv.balanceDue > 0 && (
                          <div className="text-[10px] text-amber-700 font-bold">
                            Due: ₹{inv.balanceDue.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-slate-700 border border-stone-200">
                            {inv.paymentMode}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : (inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveInvoiceForPrint(inv)}
                            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="View & Print PDF Bill"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Print PDF</span>
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ SUB-TAB 2: EXPENSES LIST ═══ */}
      {activeLedgerSubTab === 'expenses' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor name, lab bill, or category..."
                value={expenseSearchQuery}
                onChange={(e) => setExpenseSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total Expenses Recorded: ₹{totalClinicExpenses.toLocaleString('en-IN')}
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200/80 p-6 space-y-3">
              <ArrowDownRight className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No clinic expenses recorded</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Record dental lab payments, dental consumables, or clinic utilities to calculate your accurate net cash flow.
              </p>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="inline-flex items-center gap-1.5 bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-stone-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record First Expense</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Vendor / Recipient</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Payment Mode</th>
                    <th className="py-3 px-3">Notes</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-600">
                        {exp.date}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        {exp.vendorName}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-black text-rose-700 text-sm">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-slate-700 border border-stone-200">
                          {exp.paymentMode}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-500 max-w-[200px] truncate">
                        {exp.notes || exp.referenceNo || '-'}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ SUB-TAB 3: P&L SUMMARY & CHARTS ═══ */}
      {activeLedgerSubTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <span>In-Clinic Collections by Mode</span>
            </h3>
            
            <div className="space-y-3 pt-2">
              {['UPI', 'Cash', 'Card', 'Insurance'].map(mode => {
                const total = invoices
                  .filter(i => i.paymentMode === mode)
                  .reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
                const pct = totalCollections > 0 ? Math.round((total / totalCollections) * 100) : 0;

                return (
                  <div key={mode} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">{mode} Payments</span>
                      <span className="text-slate-900 font-mono">₹{total.toLocaleString('en-IN')} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          mode === 'UPI' ? 'bg-emerald-600' : (mode === 'Cash' ? 'bg-teal-600' : 'bg-cyan-600')
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Total Settled Collections:</span>
              <span className="font-mono text-emerald-700 text-sm">₹{totalCollections.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-rose-600" />
              <span>Clinic Expense Breakdown</span>
            </h3>

            <div className="space-y-3 pt-2">
              {EXPENSE_CATEGORIES.map(cat => {
                const total = expenses
                  .filter(e => e.category === cat)
                  .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                if (total === 0 && expenses.length > 0) return null;
                const pct = totalClinicExpenses > 0 ? Math.round((total / totalClinicExpenses) * 100) : 0;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 truncate pr-2">{cat}</span>
                      <span className="text-slate-900 font-mono shrink-0">₹{total.toLocaleString('en-IN')} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Total Outflows:</span>
              <span className="font-mono text-rose-700 text-sm">₹{totalClinicExpenses.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 1: CREATE NEW INVOICE / IN-CLINIC BILL
      ══════════════════════════════════════════════════════════════════════════ */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-stone-200 space-y-5 my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Create In-Clinic Patient Bill
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lavanya Dental Care Pavilion • PG Road, Secunderabad
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateInvoiceModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newInvPatientName}
                  onChange={(e) => setNewInvPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newInvPatientPhone}
                  onChange={(e) => setNewInvPatientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Age &amp; Gender (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Age (e.g. 34)"
                    value={newInvPatientAge}
                    onChange={(e) => setNewInvPatientAge(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <select
                    value={newInvPatientGender}
                    onChange={(e) => setNewInvPatientGender(e.target.value as any)}
                    className="w-full px-2 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attending Doctor
                </label>
                <input
                  type="text"
                  value={newInvDoctorName}
                  onChange={(e) => setNewInvDoctorName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Treatment Items List */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Procedures &amp; Treatments Performed
                </label>
                <button
                  type="button"
                  onClick={handleAddItemToInvoice}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {newInvItems.map((item, idx) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-500">#{idx + 1}</span>
                      <select
                        onChange={(e) => handleQuickSelectTreatment(item.id, e.target.value)}
                        className="text-xs bg-white border border-stone-200 rounded-lg px-2 py-1 text-slate-700 font-medium"
                      >
                        <option value="">-- Quick Select Standard Fee --</option>
                        {STANDARD_TREATMENTS.map(t => (
                          <option key={t.name} value={t.name}>
                            {t.name} (₹{t.defaultFee})
                          </option>
                        ))}
                      </select>
                      {newInvItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6 sm:col-span-5">
                        <input
                          type="text"
                          placeholder="Treatment Description"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Tooth #"
                          value={item.toothNumber || ''}
                          onChange={(e) => handleItemChange(item.id, 'toothNumber', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-center"
                          title="Tooth number e.g. 16, 21, All"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-center"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <input
                          type="number"
                          placeholder="Fee (₹)"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono font-bold text-right"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Calculation Strip */}
            <div className="p-4 rounded-2xl bg-stone-100/80 border border-stone-200/90 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-800">₹{draftSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <span>Special Clinic Discount (₹):</span>
                </span>
                <input
                  type="number"
                  min="0"
                  value={newInvDiscount}
                  onChange={(e) => setNewInvDiscount(Number(e.target.value) || 0)}
                  className="w-24 px-2 py-1 bg-white border border-stone-200 rounded-md text-xs font-mono text-right"
                />
              </div>
              <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-1 border-t border-stone-200">
                <span>Grand Total:</span>
                <span className="font-mono text-base text-emerald-950">₹{draftGrandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={newInvPaymentMode}
                  onChange={(e) => setNewInvPaymentMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                >
                  <option value="UPI">UPI (GPay / PhonePe / QR Code)</option>
                  <option value="Cash">Cash at Reception</option>
                  <option value="Card">Card Swipe (POS Terminal)</option>
                  <option value="Insurance">Insurance / TPA Claim</option>
                  <option value="NetBanking">Net Banking / Direct Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount Received Now (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newInvPaidAmount}
                  onChange={(e) => setNewInvPaidAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold"
                />
                {draftBalanceDue > 0 && (
                  <p className="text-[11px] text-amber-700 font-bold mt-1">
                    Pending Balance: ₹{draftBalanceDue.toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Reference / UTR Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref # 4289103982"
                  value={newInvPaymentReference}
                  onChange={(e) => setNewInvPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Dynamic UPI Quick QR Preview when UPI is selected */}
            {newInvPaymentMode === 'UPI' && draftGrandTotal > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <span>In-Clinic Dynamic UPI QR</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Ask patient to scan with Google Pay, PhonePe, or Paytm for ₹{draftGrandTotal.toLocaleString('en-IN')}.
                  </p>
                  <p className="text-[10px] font-mono text-emerald-700">VPA: dr.vijay@lavanyadental (Lavanya Dental)</p>
                </div>
                <div className="p-1.5 bg-white rounded-xl border border-emerald-200 shadow-2xs shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`upi://pay?pa=vijayrajshekar@okaxis&pn=LavanyaDentalClinic&am=${draftGrandTotal}&cu=INR`)}`}
                    alt="UPI Payment QR"
                    className="w-16 h-16"
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowCreateInvoiceModal(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-slate-600 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveInvoice(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Save Bill
              </button>
              <button
                type="button"
                onClick={() => handleSaveInvoice(true)}
                className="px-5 py-2.5 rounded-xl bg-[#064E3B] hover:bg-emerald-900 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Save &amp; Print PDF Bill</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 2: ADD CLINIC EXPENSE
      ══════════════════════════════════════════════════════════════════════════ */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-stone-200 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Record Clinic Expense
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track dental lab charges, consumables &amp; clinic overheads
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expense Category *
                </label>
                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:bg-white"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vendor / Lab Name / Recipient *
                </label>
                <input
                  type="text"
                  placeholder="e.g. DentCare Dental Lab, Prime Implants, Clinic Assistant"
                  value={newExpVendor}
                  onChange={(e) => setNewExpVendor(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 3500"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={newExpPaymentMode}
                    onChange={(e) => setNewExpPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bill / Voucher #
                  </label>
                  <input
                    type="text"
                    placeholder="Lab Bill # 829"
                    value={newExpRef}
                    onChange={(e) => setNewExpRef(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 Zirconia crowns for patient Ramesh"
                  value={newExpNotes}
                  onChange={(e) => setNewExpNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-slate-600 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveExpense}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold cursor-pointer shadow-xs active:scale-95"
              >
                Record Expense
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 3: INVOICE PRINT VIEW & WHATSAPP SHARING
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeInvoiceForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8 space-y-6">
            
            {/* Action Bar (Hidden during actual print) */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 no-print">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Ready to Print
                </span>
                <span className="text-xs text-slate-500 font-mono">Invoice #{activeInvoiceForPrint.id}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerPrint}
                  className="flex items-center gap-1.5 bg-[#064E3B] hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>

                <a
                  href={`https://wa.me/91${activeInvoiceForPrint.patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hello ${activeInvoiceForPrint.patientName},\n\nHere is your treatment receipt from *Lavanya Dental Clinic*:\n\n📄 *Invoice #:* ${activeInvoiceForPrint.id}\n📅 *Date:* ${activeInvoiceForPrint.date}\n🩺 *Treatments:* ${activeInvoiceForPrint.items.map(i => i.description).join(', ')}\n💰 *Total Amount:* ₹${activeInvoiceForPrint.grandTotal.toLocaleString('en-IN')}\n✅ *Amount Paid:* ₹${activeInvoiceForPrint.paidAmount.toLocaleString('en-IN')}${activeInvoiceForPrint.balanceDue > 0 ? `\n⚠️ *Balance Due:* ₹${activeInvoiceForPrint.balanceDue.toLocaleString('en-IN')}` : ''}\n\n📍 *Address:* PG Road, Secunderabad (Paradise Circle)\n📞 *Contact:* +91 8555052843 / 9885611128\n\nThank you for choosing Lavanya Dental! ✨`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  title="Send invoice summary to patient's WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={() => setActiveInvoiceForPrint(null)}
                  className="p-2 rounded-full hover:bg-stone-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ═══ PRINTABLE A4 INVOICE CONTAINER ═══ */}
            <div id="printable-invoice-container" className="bg-white p-2 sm:p-4 space-y-6 text-slate-800">
              
              {/* Invoice Header */}
              <div className="flex items-start justify-between border-b-2 border-emerald-800 pb-5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-emerald-950 font-display tracking-tight uppercase">
                    Lavanya Dental Care Pavilion
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    Advanced Laser Dentistry, Dental Implants &amp; Micro-Endodontics
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm leading-relaxed">
                    PG Road (Penderghast Road), Near Vysya Kalyana Mandapam, Secunderabad, Hyderabad - 500003, Telangana.
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Phone: +91 8555052843 • Helpline: 9885611128 • Web: lavanyadental.in
                  </p>
                </div>

                <div className="text-right space-y-1 shrink-0">
                  <span className="inline-block bg-emerald-900 text-white text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
                    Tax Invoice / Receipt
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 pt-1">
                    Invoice: {activeInvoiceForPrint.id}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Date: {activeInvoiceForPrint.date} ({activeInvoiceForPrint.time})
                  </p>
                </div>
              </div>

              {/* Patient & Doctor Meta Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Billed To (Patient):</p>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">{activeInvoiceForPrint.patientName}</p>
                  <p className="text-slate-600">Contact: +91 {activeInvoiceForPrint.patientPhone}</p>
                  {activeInvoiceForPrint.patientAge && (
                    <p className="text-slate-500">Age/Gender: {activeInvoiceForPrint.patientAge} Yrs / {activeInvoiceForPrint.patientGender || 'Male'}</p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clinician in Charge:</p>
                  <p className="font-bold text-slate-900 mt-0.5">{activeInvoiceForPrint.doctorName}</p>
                  <p className="text-slate-500 text-[11px]">BDS, MDS, FRSH (London)</p>
                  <p className="text-[11px] text-emerald-800 font-semibold">Payment: {activeInvoiceForPrint.paymentMode} ({activeInvoiceForPrint.status})</p>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                    <th className="py-2.5">#</th>
                    <th className="py-2.5">Procedure / Dental Treatment</th>
                    <th className="py-2.5 text-center">Tooth #</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Fee (₹)</th>
                    <th className="py-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeInvoiceForPrint.items.map((it, idx) => (
                    <tr key={idx} className="py-2">
                      <td className="py-2.5 text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 font-bold text-slate-900">{it.description}</td>
                      <td className="py-2.5 text-center font-mono">{it.toothNumber || '-'}</td>
                      <td className="py-2.5 text-center">{it.quantity}</td>
                      <td className="py-2.5 text-right font-mono">₹{it.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹{it.total.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Calculation Totals */}
              <div className="border-t border-slate-300 pt-3 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{activeInvoiceForPrint.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {activeInvoiceForPrint.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount:</span>
                      <span className="font-mono">-₹{activeInvoiceForPrint.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-950">₹{activeInvoiceForPrint.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-800">
                    <span>Amount Paid ({activeInvoiceForPrint.paymentMode}):</span>
                    <span className="font-mono">₹{activeInvoiceForPrint.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {activeInvoiceForPrint.balanceDue > 0 && (
                    <div className="flex justify-between text-xs font-bold text-rose-700 pt-0.5">
                      <span>Balance Due:</span>
                      <span className="font-mono">₹{activeInvoiceForPrint.balanceDue.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Care Instructions Reminder */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-950 leading-relaxed">
                <p className="font-bold text-amber-900 mb-0.5">📌 Post-Treatment Care Notice:</p>
                <p>
                  Do not chew hard or crackling foods on newly treated teeth. Complete full course of prescribed medications. Root canal treated teeth must be protected with a permanent crown/cap within 10–15 days to prevent fracture or re-infection.
                </p>
              </div>

              {/* Signature & Seal Area */}
              <div className="pt-8 flex items-end justify-between text-xs text-slate-500">
                <div>
                  <p className="text-[10px] text-slate-400">Computer Generated Clinical Receipt</p>
                  <p className="text-[10px]">Lavanya Dental Care Pavilion</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="w-36 border-b border-slate-400 mx-auto mb-1"></div>
                  <p className="font-bold text-slate-900">Dr. V. Vijai Rajasekhar</p>
                  <p className="text-[10px]">Authorized Signature / Seal</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
