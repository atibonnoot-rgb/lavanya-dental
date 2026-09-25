import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, Building2, Stethoscope, Image, LogOut, CheckCircle2,
  XCircle, Clock, Phone, Mail, MapPin, Upload, Trash2, Plus, Save,
  Edit3, ChevronDown, ChevronUp, Loader2, AlertCircle, RefreshCw,
  Users, DollarSign, Star, ToggleLeft, ToggleRight, X, Check, Bell
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useClinic } from '../context/ClinicContext';
import { DentalService, Doctor, ClinicSettings } from '../types';
import { saveCloudClinicState, broadcastLiveSync } from '../lib/cloudSync';

// ─── Helper Hooks ─────────────────────────────────────────────────────────────
type TabId = 'appointments' | 'clinic' | 'services' | 'doctors' | 'gallery';

interface RawAppointment {
  id: string;
  confirmation_code: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  doctor_id: string;
  service_id: string;
  date: string;
  time_slot: string;
  status: string;
  primary_complaint: string;
  deposit_amount: number;
  deposit_paid: boolean;
  payment_method: string;
  created_at: string;
  doctor_notes: string;
  otp_verified: boolean;
}

interface GalleryImg {
  id: string;
  title: string;
  category: string;
  image_url: string;
  type: string;
  description: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDone: () => void }> = ({ message, type, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white animate-in slide-in-from-bottom-4 ${
      type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
    }`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    Pending:     'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Confirmed:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Completed:   'bg-slate-500/20 text-slate-300 border-slate-500/30',
    Cancelled:   'bg-rose-500/20 text-rose-300 border-rose-500/30',
    Rescheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[status] || colors.Pending}`}>
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB: APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────
const AppointmentsTab: React.FC = () => {
  const { doctors, services } = useClinic();
  const [appointments, setAppointments] = useState<RawAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data } = await supabase.from('appointments').select('*').order('created_at', { ascending: false });
    if (data) setAppointments(data as RawAppointment[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();

    // Realtime subscription
    const channel = supabase
      .channel('admin-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string, notes?: string) => {
    const update: Record<string, unknown> = { status };
    if (notes) update.doctor_notes = notes;
    const { error } = await supabase.from('appointments').update(update).eq('id', id);
    if (!error) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status, doctor_notes: notes || a.doctor_notes } : a));
      setToast({ message: `Appointment ${status}`, type: 'success' });
    } else {
      setToast({ message: 'Failed to update', type: 'error' });
    }
  };

  const statuses = ['ALL', 'Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled'];
  const filtered = appointments.filter(a => filter === 'ALL' || a.status === filter);
  const pendingCount = appointments.filter(a => a.status === 'Pending').length;

  return (
    <div className="p-4 space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Appointments</h2>
          {pendingCount > 0 && (
            <p className="text-amber-400 text-xs font-medium">{pendingCount} awaiting approval</p>
          )}
        </div>
        <button onClick={fetchAppointments} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
              filter === s ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(apt => {
            const doctor = doctors.find(d => d.id === apt.doctor_id);
            const service = services.find(s => s.id === apt.service_id);
            const isOpen = expanded === apt.id;

            return (
              <div key={apt.id} className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
                {/* Card header */}
                <button
                  className="w-full p-4 flex items-start justify-between gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : apt.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-teal-400 font-bold">{apt.confirmation_code}</span>
                      <StatusBadge status={apt.status} />
                    </div>
                    <p className="text-white font-semibold text-sm truncate">{apt.patient_name}</p>
                    <p className="text-slate-400 text-xs truncate">{service?.name || apt.service_id}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {apt.date} at {apt.time_slot} · {doctor?.name?.split(',')[0] || 'Doctor'}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1" />}
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900/60 rounded-xl p-2.5">
                        <span className="text-slate-500 block">Phone</span>
                        <span className="text-slate-200 font-medium">{apt.patient_phone}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded-xl p-2.5">
                        <span className="text-slate-500 block">Deposit</span>
                        <span className="text-emerald-400 font-bold">${apt.deposit_amount} {apt.deposit_paid ? '✓' : '(Pending)'}</span>
                      </div>
                    </div>

                    {apt.primary_complaint && (
                      <div className="bg-slate-900/60 rounded-xl p-2.5 text-xs">
                        <span className="text-slate-500 block mb-1">Chief Complaint</span>
                        <span className="text-slate-300">{apt.primary_complaint}</span>
                      </div>
                    )}

                    {apt.doctor_notes && (
                      <div className="bg-amber-950/30 rounded-xl p-2.5 text-xs border border-amber-800/30">
                        <span className="text-amber-400 block mb-1">Doctor Notes</span>
                        <span className="text-slate-300">{apt.doctor_notes}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    {apt.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(apt.id, 'Confirmed')}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id, 'Cancelled', 'Declined by doctor')}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-rose-800/50 hover:bg-rose-700/50 text-rose-300 py-2.5 rounded-xl text-xs font-bold border border-rose-700/50 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Decline
                        </button>
                      </div>
                    )}

                    {apt.status === 'Confirmed' && (
                      <button
                        onClick={() => updateStatus(apt.id, 'Completed')}
                        className="w-full flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark as Completed
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB: CLINIC INFO
// ─────────────────────────────────────────────────────────────────────────────
const ClinicInfoTab: React.FC = () => {
  const { clinicSettings, updateClinicSettings } = useClinic();
  const [form, setForm] = useState<ClinicSettings>(clinicSettings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setForm(clinicSettings); }, [clinicSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClinicSettings(form);
      setToast({ message: 'Clinic info saved!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to save', type: 'error' });
    }
    setSaving(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setForm(f => ({ ...f, logoUrl: url }));
      setToast({ message: 'Logo uploaded successfully!', type: 'success' });
      setUploading(false);
    };
    reader.onerror = () => {
      setToast({ message: 'Failed to read image file', type: 'error' });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  return (
    <div className="p-4 space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      <h2 className="text-white font-bold text-lg">Clinic Information</h2>

      {/* Logo */}
      <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 space-y-3">
        <h3 className="text-slate-300 text-sm font-semibold">Clinic Logo</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/50 border border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-7 h-7 text-slate-500" />
            )}
          </div>
          <div className="flex-1">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-400 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </button>
            {form.logoUrl && (
              <button
                onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
                className="w-full mt-1.5 text-xs text-slate-500 hover:text-rose-400 transition-colors"
              >
                Remove logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 space-y-3">
        <h3 className="text-slate-300 text-sm font-semibold">Basic Details</h3>
        {[
          { label: 'Clinic Name', key: 'clinicName', icon: Building2 },
          { label: 'Tagline', key: 'tagline', icon: Star },
          { label: 'Phone Number', key: 'phone', icon: Phone },
          { label: 'Email', key: 'email', icon: Mail },
          { label: 'Address', key: 'address', icon: MapPin },
        ].map(({ label, key, icon: Icon }) => (
          <div key={key}>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              <Icon className="w-3.5 h-3.5" /> {label}
            </label>
            <input
              type="text"
              value={(form as unknown as Record<string, unknown>)[key] as string || ''}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full bg-slate-900/60 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
            />
          </div>
        ))}
      </div>

      {/* Clinic Hours */}
      <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 space-y-3">
        <h3 className="text-slate-300 text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" /> Opening Hours
        </h3>
        {days.map(day => {
          const dayHours = form.hours[day];
          return (
            <div key={day} className="flex items-center gap-3">
              <button
                onClick={() => setForm(f => ({ ...f, hours: { ...f.hours, [day]: { ...dayHours, open: !dayHours.open } } }))}
                className="shrink-0"
              >
                {dayHours.open
                  ? <ToggleRight className="w-8 h-8 text-teal-400" />
                  : <ToggleLeft className="w-8 h-8 text-slate-600" />
                }
              </button>
              <span className="text-slate-300 text-sm w-24 capitalize font-medium">{day}</span>
              {dayHours.open ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="time"
                    value={dayHours.start}
                    onChange={e => setForm(f => ({ ...f, hours: { ...f.hours, [day]: { ...dayHours, start: e.target.value } } }))}
                    className="flex-1 bg-slate-900/60 border border-slate-600/50 text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  />
                  <span className="text-slate-500 text-xs">–</span>
                  <input
                    type="time"
                    value={dayHours.end}
                    onChange={e => setForm(f => ({ ...f, hours: { ...f.hours, [day]: { ...dayHours, end: e.target.value } } }))}
                    className="flex-1 bg-slate-900/60 border border-slate-600/50 text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  />
                </div>
              ) : (
                <span className="text-rose-400/60 text-xs font-medium">Closed</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98]"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Clinic Info'}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// TAB: SERVICES
// ─────────────────────────────────────────────────────────────────────────────
const SERVICE_CATEGORIES = ['Preventive', 'Cosmetic', 'Restorative', 'Orthodontics', 'Surgical & Implants', 'Emergency & Endodontics'];
const INSURANCE_OPTIONS = ['Full', 'Partial', 'Varies', 'Cosmetic/Elective'];

interface ServiceEditFormProps {
  service: DentalService;
  isNew?: boolean;
  saving: boolean;
  onSave: (s: DentalService) => void;
  onCancel: () => void;
}

const ServiceEditForm: React.FC<ServiceEditFormProps> = ({ service, isNew = false, saving, onSave, onCancel }) => {
  const [form, setForm] = useState<DentalService>(service);

  useEffect(() => {
    setForm(service);
  }, [service]);

  return (
    <div className="bg-slate-800/80 rounded-2xl p-4 border border-teal-500/30 space-y-3">
      <h3 className="text-teal-400 font-bold text-sm">{isNew ? 'Add New Service' : 'Edit Service'}</h3>
      <input
        placeholder="Service name"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="w-full bg-slate-900/60 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        rows={3}
        className="w-full bg-slate-900/60 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Category</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value as DentalService['category'] }))}
            className="w-full bg-slate-900/60 border border-slate-600/50 text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Insurance</label>
          <select
            value={form.insuranceCovered}
            onChange={e => setForm(f => ({ ...f, insuranceCovered: e.target.value as DentalService['insuranceCovered'] }))}
            className="w-full bg-slate-900/60 border border-slate-600/50 text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            {INSURANCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Duration (min)</label>
          <input
            type="number"
            value={form.durationMinutes}
            onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))}
            className="w-full bg-slate-900/60 border border-slate-600/50 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.popular}
              onChange={e => setForm(f => ({ ...f, popular: e.target.checked }))}
              className="w-4 h-4 rounded accent-teal-500"
            />
            <span className="text-xs text-slate-300">Mark as Popular</span>
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
          className="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Service
        </button>
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
};

const ServicesTab: React.FC = () => {
  const { services, setServices, doctors } = useClinic();
  const [editing, setEditing] = useState<DentalService | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const emptyService: DentalService = {
    id: `serv-${Date.now()}`,
    name: '',
    category: 'Preventive',
    description: '',
    durationMinutes: 45,
    priceEstimate: 0,
    depositRequired: 0,
    recommendedFor: [],
    popular: false,
    insuranceCovered: 'Partial',
  };

  const saveService = async (service: DentalService) => {
    setSaving(true);
    const isNew = !services.some(s => s.id === service.id);
    const row = {
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      duration_minutes: service.durationMinutes,
      price_estimate: service.priceEstimate,
      deposit_required: service.depositRequired,
      recommended_for: service.recommendedFor,
      popular: service.popular,
      insurance_covered: service.insuranceCovered,
      updated_at: new Date().toISOString(),
    };

    const nextServices = services.some(s => s.id === service.id)
      ? services.map(s => s.id === service.id ? service : s)
      : [...services, service];

    // Optimistically update context & local storage
    setServices(nextServices);
    try {
      localStorage.setItem('auradental_services_v1', JSON.stringify(nextServices));
      localStorage.setItem('auradental_timestamp_v1', String(Date.now()));
    } catch {}

    // Persist to Cloud Storage & Realtime broadcast immediately
    saveCloudClinicState(doctors, nextServices);
    broadcastLiveSync(doctors, nextServices);

    setToast({ message: isNew ? 'Service added!' : 'Service saved!', type: 'success' });
    setEditing(null);
    setAdding(false);

    // Also attempt Supabase upsert
    try {
      const { error } = await supabase.from('services').upsert(row, { onConflict: 'id' });
      if (error) console.warn('Supabase service upsert warning:', error.message);
    } catch (e) {
      console.warn('Supabase network error saving service:', e);
    }

    setSaving(false);
  };

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    const nextServices = services.filter(s => s.id !== id);
    setServices(nextServices);
    try {
      localStorage.setItem('auradental_services_v1', JSON.stringify(nextServices));
      localStorage.setItem('auradental_timestamp_v1', String(Date.now()));
    } catch {}

    saveCloudClinicState(doctors, nextServices);
    broadcastLiveSync(doctors, nextServices);
    setToast({ message: 'Service deleted', type: 'success' });

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) console.warn('Supabase service delete warning:', error.message);
    } catch (e) {
      console.warn('Supabase network error deleting service:', e);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Services</h2>
        <button
          onClick={() => { setAdding(true); setEditing(emptyService); }}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add New
        </button>
      </div>

      {adding && editing && (
        <ServiceEditForm service={editing} isNew={true} saving={saving} onSave={saveService} onCancel={() => { setAdding(false); setEditing(null); }} />
      )}

      <div className="space-y-3">
        {services.map(service => (
          <div key={service.id}>
            {!adding && editing?.id === service.id ? (
              <ServiceEditForm service={editing} isNew={false} saving={saving} onSave={saveService} onCancel={() => setEditing(null)} />
            ) : (
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm leading-tight">{service.name}</span>
                      {service.popular && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">★ Popular</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{service.durationMinutes} min</span>
                      <span>•</span>
                      <span className="truncate">{service.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => { setAdding(false); setEditing(service); }} className="p-2 rounded-xl bg-slate-700 hover:bg-teal-700/50 text-slate-400 hover:text-teal-300 transition-all">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteService(service.id)} className="p-2 rounded-xl bg-slate-700 hover:bg-rose-700/50 text-slate-400 hover:text-rose-300 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB: DOCTORS
// ─────────────────────────────────────────────────────────────────────────────
interface DoctorEditFormProps {
  doctor: Doctor;
  isNew?: boolean;
  saving: boolean;
  uploading: boolean;
  onSave: (d: Doctor) => void;
  onCancel: () => void;
  onDelete?: (id: string, name: string) => void;
  onPhotoUpload: (doctorId: string, file: File) => void;
}

const compressImageFile = (file: File, maxWidth = 360, quality = 0.72): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(readerEvent.target?.result as string);
        }
      };
      img.onerror = () => resolve(readerEvent.target?.result as string);
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

const DoctorEditForm: React.FC<DoctorEditFormProps> = ({
  doctor,
  isNew = false,
  saving,
  uploading,
  onSave,
  onCancel,
  onDelete,
  onPhotoUpload,
}) => {
  const [form, setForm] = useState<Doctor>(doctor);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(doctor);
  }, [doctor]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedUrl = await compressImageFile(file);
      if (compressedUrl) {
        setForm(f => ({ ...f, photoUrl: compressedUrl }));
      }
      onPhotoUpload(form.id, file);
    }
  };

  return (
    <div className="bg-slate-800/80 rounded-2xl p-4 border border-teal-500/30 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-teal-400 font-bold text-sm">
          {isNew ? 'Add New Specialist' : `Editing: ${form.name.split(',')[0]}`}
        </h3>
        {!isNew && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(form.id, form.name)}
            className="flex items-center gap-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-2.5 py-1 rounded-lg text-xs font-semibold border border-rose-500/30 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        )}
      </div>

      {/* Photo upload and URL input */}
      <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-700 shrink-0 border border-slate-600">
            <img
              src={form.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600'}
              alt="doctor"
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600'; }}
            />
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-teal-600/30 hover:bg-teal-600 text-teal-300 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold border border-teal-500/30 transition-all"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Processing Image...' : 'Upload Photo (Auto-Sync)'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 mb-1 block">Or paste Image Web Link / URL</label>
          <input
            type="url"
            value={form.photoUrl}
            onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))}
            placeholder="https://images.unsplash.com/..."
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {[
        { label: 'Full Name (e.g. Dr. Jane Doe, MDS)', key: 'name' },
        { label: 'Title / Qualification', key: 'title' },
        { label: 'Specialty', key: 'specialty' },
        { label: 'Degrees', key: 'degrees' },
        { label: 'Phone', key: 'phone' },
        { label: 'Email', key: 'email' },
      ].map(({ label, key }) => (
        <div key={key}>
          <label className="text-xs text-slate-400 mb-1 block">{label}</label>
          <input
            type="text"
            value={(form as any)[key] || ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="w-full bg-slate-900/60 border border-slate-600/50 text-white rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:border-teal-500"
          />
        </div>
      ))}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Years of Experience</label>
          <input
            type="number"
            value={form.experienceYears}
            onChange={e => setForm(f => ({ ...f, experienceYears: +e.target.value }))}
            className="w-full bg-slate-900/60 border border-slate-600/50 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Slot Duration (min)</label>
          <input
            type="number"
            value={form.slotDurationMinutes}
            onChange={e => setForm(f => ({ ...f, slotDurationMinutes: +e.target.value }))}
            className="w-full bg-slate-900/60 border border-slate-600/50 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Bio / Summary</label>
        <textarea
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          rows={3}
          className="w-full bg-slate-900/60 border border-slate-600/50 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Shift Start Time</label>
          <input
            type="time"
            value={form.workingHours.start}
            onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, start: e.target.value } }))}
            className="w-full bg-slate-900/60 border border-slate-600/50 text-white rounded-xl px-2.5 py-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Shift End Time</label>
          <input
            type="time"
            value={form.workingHours.end}
            onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, end: e.target.value } }))}
            className="w-full bg-slate-900/60 border border-slate-600/50 text-white rounded-xl px-2.5 py-2 text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
          className="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Profile
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
};

const DoctorsTab: React.FC = () => {
  const { doctors, setDoctors, services } = useClinic();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const createEmptyDoctor = (): Doctor => ({
    id: `doc-${Date.now()}`,
    name: 'Dr. ',
    title: 'B.D.S Dental Specialist',
    specialty: 'General & Cosmetic Dentistry',
    degrees: 'B.D.S',
    experienceYears: 5,
    rating: 4.9,
    reviewsCount: 12,
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
    bio: 'Dedicated dental specialist providing personalized patient care.',
    phone: '+91 98765 00000',
    email: 'doctor@lavanyadental.com',
    workingDays: [1, 2, 3, 4, 5],
    workingHours: { start: '09:00', end: '17:00' },
    slotDurationMinutes: 45,
    isAvailableToday: true,
    onCallForEmergency: false,
  });

  const saveDoctor = async (doctor: Doctor) => {
    setSaving(true);
    const isNew = !doctors.some(d => d.id === doctor.id);

    const nextDoctors = doctors.some(d => d.id === doctor.id)
      ? doctors.map(d => d.id === doctor.id ? doctor : d)
      : [...doctors, doctor];

    // Optimistically update local state & localStorage immediately
    setDoctors(nextDoctors);
    try {
      localStorage.setItem('auradental_doctors_v1', JSON.stringify(nextDoctors));
      localStorage.setItem('auradental_timestamp_v1', String(Date.now()));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    // Persist to Cloud Storage & Realtime broadcast immediately
    saveCloudClinicState(nextDoctors, services);
    broadcastLiveSync(nextDoctors, services);

    setToast({ message: isNew ? 'New doctor added successfully!' : 'Doctor profile saved successfully!', type: 'success' });
    setEditing(null);
    setAdding(false);

    // Also attempt Supabase upsert in background
    try {
      const row = {
        id: doctor.id,
        name: doctor.name,
        title: doctor.title,
        specialty: doctor.specialty,
        degrees: doctor.degrees,
        experience_years: doctor.experienceYears,
        rating: doctor.rating,
        reviews_count: doctor.reviewsCount,
        photo_url: doctor.photoUrl,
        bio: doctor.bio,
        phone: doctor.phone,
        email: doctor.email,
        working_days: doctor.workingDays,
        working_hours: doctor.workingHours,
        slot_duration_minutes: doctor.slotDurationMinutes,
        is_available_today: doctor.isAvailableToday,
        on_call_for_emergency: doctor.onCallForEmergency,
        display_order: 99,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('doctors').upsert(row, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase doctor save warning:', error.message);
      }
    } catch (e) {
      console.warn('Supabase network error:', e);
    }

    setSaving(false);
  };

  const handlePhotoUpload = async (doctorId: string, file: File) => {
    setUploading(true);
    try {
      const photoUrl = await compressImageFile(file);
      if (!photoUrl) {
        setUploading(false);
        return;
      }

      // Update current edit form if open
      if (editing && editing.id === doctorId) {
        setEditing(d => d ? { ...d, photoUrl } : null);
      }

      const updated = doctors.map(d => d.id === doctorId ? { ...d, photoUrl } : d);
      setDoctors(updated);
      try {
        localStorage.setItem('auradental_doctors_v1', JSON.stringify(updated));
        localStorage.setItem('auradental_timestamp_v1', String(Date.now()));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }
      saveCloudClinicState(updated, services);
      broadcastLiveSync(updated, services);

      setToast({ message: 'Photo uploaded and synced across all devices!', type: 'success' });
    } catch (err) {
      console.warn('Photo processing error:', err);
      setToast({ message: 'Failed to process image file', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const toggleAvailability = async (doctorId: string, field: 'isAvailableToday' | 'onCallForEmergency') => {
    const doc = doctors.find(d => d.id === doctorId);
    if (!doc) return;
    const newVal = !doc[field];
    const dbField = field === 'isAvailableToday' ? 'is_available_today' : 'on_call_for_emergency';
    
    // Optimistic update
    const updated = doctors.map(d => d.id === doctorId ? { ...d, [field]: newVal } : d);
    setDoctors(updated);
    try {
      localStorage.setItem('auradental_doctors_v1', JSON.stringify(updated));
      localStorage.setItem('auradental_timestamp_v1', String(Date.now()));
    } catch {}
    saveCloudClinicState(updated, services);
    broadcastLiveSync(updated, services);

    try {
      await supabase.from('doctors').update({ [dbField]: newVal }).eq('id', doctorId);
    } catch (e) {
      console.warn('Supabase doctor toggle warning:', e);
    }
  };

  const deleteDoctor = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    const updated = doctors.filter(d => d.id !== id);
    setDoctors(updated);
    try {
      localStorage.setItem('auradental_doctors_v1', JSON.stringify(updated));
      localStorage.setItem('auradental_timestamp_v1', String(Date.now()));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }
    saveCloudClinicState(updated, services);
    broadcastLiveSync(updated, services);

    if (editing?.id === id) {
      setEditing(null);
      setAdding(false);
    }
    setToast({ message: 'Doctor removed successfully!', type: 'success' });

    try {
      await supabase.from('doctors').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete doctor warning:', e);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Doctors & Staff</h2>
        <button
          onClick={() => {
            const newDoc = createEmptyDoctor();
            setAdding(true);
            setEditing(newDoc);
          }}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {adding && editing && (
        <DoctorEditForm
          doctor={editing}
          isNew={true}
          saving={saving}
          uploading={uploading}
          onSave={saveDoctor}
          onCancel={() => { setAdding(false); setEditing(null); }}
          onPhotoUpload={handlePhotoUpload}
        />
      )}

      <div className="space-y-4">
        {doctors.map(doc => (
          <div key={doc.id}>
            {!adding && editing?.id === doc.id ? (
              <DoctorEditForm
                doctor={editing}
                isNew={false}
                saving={saving}
                uploading={uploading}
                onSave={saveDoctor}
                onCancel={() => setEditing(null)}
                onDelete={deleteDoctor}
                onPhotoUpload={handlePhotoUpload}
              />
            ) : (
              // Doctor card
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                <div className="flex gap-3 mb-3">
                  <img
                    src={doc.photoUrl}
                    alt={doc.name}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-700 shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm leading-tight truncate">{doc.name.split(',')[0]}</p>
                    <p className="text-teal-400 text-xs">{doc.specialty}</p>
                    <p className="text-slate-400 text-xs">{doc.workingHours.start} – {doc.workingHours.end} • {doc.experienceYears} yrs exp</p>
                  </div>
                  <div className="flex items-center gap-1 self-start">
                    <button
                      onClick={() => { setAdding(false); setEditing(doc); }}
                      className="p-2 rounded-xl bg-slate-700 hover:bg-teal-700/50 text-slate-400 hover:text-teal-300 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteDoctor(doc.id, doc.name)}
                      className="p-2 rounded-xl bg-slate-700 hover:bg-rose-700/50 text-slate-400 hover:text-rose-300 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAvailability(doc.id, 'isAvailableToday')}
                    className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all ${doc.isAvailableToday ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}
                  >
                    {doc.isAvailableToday ? '✓ Available' : '✗ Unavailable'}
                  </button>
                  <button
                    onClick={() => toggleAvailability(doc.id, 'onCallForEmergency')}
                    className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all ${doc.onCallForEmergency ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' : 'bg-slate-700 text-slate-400'}`}
                  >
                    {doc.onCallForEmergency ? '📞 On-Call' : 'Off-Call'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const DEFAULT_GALLERY_IMAGES: GalleryImg[] = [
  {
    id: 'img-1',
    title: 'Modern Clinic Suite',
    category: 'Facility',
    image_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80',
    type: 'general',
    description: 'High-tech intraoral scanning suite'
  },
  {
    id: 'img-2',
    title: 'Sterilization & Hygiene Station',
    category: 'Facility',
    image_url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    type: 'general',
    description: 'Hospital grade autoclave sterilization'
  },
  {
    id: 'img-3',
    title: 'Consultation & Treatment Bay',
    category: 'Facility',
    image_url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80',
    type: 'general',
    description: 'Ergonomic patient comfort chair'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// TAB: GALLERY (SIMPLIFIED & BULLETPROOF)
// ─────────────────────────────────────────────────────────────────────────────
const GalleryTab: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 1. Homepage Cover Picture
  const [heroImage, setHeroImage] = useState<string>(() => {
    try {
      return localStorage.getItem('auradental_hero_image') || '/clinic-hero.png';
    } catch {
      return '/clinic-hero.png';
    }
  });

  // 2. Before & After Cases
  const [beforeAfterList, setBeforeAfterList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('auradental_before_after_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load before & after:', e);
    }
    return [
      {
        id: 'case-1',
        title: 'Full Arch Clear Aligner Alignment',
        category: 'Orthodontics',
        beforeImage: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
        afterImage: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'case-2',
        title: 'Porcelain Veneers (8 Units)',
        category: 'Cosmetic Dentistry',
        beforeImage: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
        afterImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
      }
    ];
  });

  // 3. Clinic General Gallery
  const [galleryImages, setGalleryImages] = useState<GalleryImg[]>(() => {
    try {
      const saved = localStorage.getItem('auradental_gallery_images_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load gallery images:', e);
    }
    return DEFAULT_GALLERY_IMAGES;
  });

  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Helper to safely convert uploaded file to URL or DataURL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Upload Hero Image
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (!dataUrl) return;

    setHeroImage(dataUrl);
    try {
      localStorage.setItem('auradental_hero_image', dataUrl);
      setToast({ message: 'Homepage cover picture updated!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Image loaded! (Storage limit full)', type: 'error' });
    }
  };

  const resetHeroImage = () => {
    setHeroImage('/clinic-hero.png');
    try {
      localStorage.removeItem('auradental_hero_image');
    } catch {}
    setToast({ message: 'Cover picture reset to default.', type: 'error' });
  };

  // Upload Before Image for a Case
  const handleBeforeUpload = async (caseId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (!dataUrl) return;

    const updated = beforeAfterList.map(item => item.id === caseId ? { ...item, beforeImage: dataUrl } : item);
    setBeforeAfterList(updated);
    try {
      localStorage.setItem('auradental_before_after_v1', JSON.stringify(updated));
    } catch {}
    setToast({ message: 'Before picture updated!', type: 'success' });
  };

  // Upload After Image for a Case
  const handleAfterUpload = async (caseId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (!dataUrl) return;

    const updated = beforeAfterList.map(item => item.id === caseId ? { ...item, afterImage: dataUrl } : item);
    setBeforeAfterList(updated);
    try {
      localStorage.setItem('auradental_before_after_v1', JSON.stringify(updated));
    } catch {}
    setToast({ message: 'After picture updated!', type: 'success' });
  };

  // Add General Gallery Image
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: GalleryImg[] = [];
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file);
      if (dataUrl) {
        newItems.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: file.name.split('.')[0] || 'Clinic Photo',
          category: 'Facility',
          image_url: dataUrl,
          type: 'general',
          description: file.name
        });
      }
    }

    if (newItems.length > 0) {
      const updated = [...newItems, ...galleryImages];
      setGalleryImages(updated);
      try {
        localStorage.setItem('auradental_gallery_images_v1', JSON.stringify(updated));
      } catch {}
      setToast({ message: 'Gallery photos added!', type: 'success' });
    }
  };

  const removeGalleryImage = (id: string) => {
    const updated = galleryImages.filter(img => img.id !== id);
    setGalleryImages(updated);
    try {
      localStorage.setItem('auradental_gallery_images_v1', JSON.stringify(updated));
    } catch {}
    setToast({ message: 'Photo removed', type: 'error' });
  };

  return (
    <div className="p-4 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* ── 1. HOMEPAGE COVER PICTURE ── */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-400" />
            Homepage Cover Picture
          </h2>
          <span className="text-[10px] text-teal-400 font-semibold bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
            Front Screen
          </span>
        </div>

        <p className="text-slate-400 text-xs">
          Main banner image visible on the front screen of your website.
        </p>

        <div className="flex items-center gap-4 pt-1">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
            <img src={heroImage} alt="Front Cover" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-2 flex-1">
            <input
              ref={heroInputRef}
              type="file"
              accept="image/*"
              onChange={handleHeroUpload}
              className="hidden"
            />
            <button
              onClick={() => heroInputRef.current?.click()}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>Change Cover Picture</span>
            </button>

            <button
              onClick={resetHeroImage}
              className="w-full sm:w-auto bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. BEFORE & AFTER TRANSFORMATIONS ── */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            Before & After Clinical Images
          </h2>
          <span className="text-[10px] text-teal-400 font-semibold bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
            Patient Cases
          </span>
        </div>

        <p className="text-slate-400 text-xs">
          Edit patient transformation photos shown in the comparison slider on the website gallery.
        </p>

        <div className="space-y-4">
          {beforeAfterList.map((item) => (
            <div key={item.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white">{item.title}</h4>
                <span className="text-[10px] text-teal-400">{item.category}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Before Image */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">BEFORE</span>
                  <div className="aspect-4/3 rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                    <img src={item.beforeImage} alt="Before" className="w-full h-full object-cover" />
                  </div>
                  <label className="block text-center bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold py-2 rounded-lg cursor-pointer transition-colors">
                    Upload Before
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBeforeUpload(item.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* After Image */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">AFTER</span>
                  <div className="aspect-4/3 rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                    <img src={item.afterImage} alt="After" className="w-full h-full object-cover" />
                  </div>
                  <label className="block text-center bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold py-2 rounded-lg cursor-pointer transition-colors">
                    Upload After
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAfterUpload(item.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. CLINIC GALLERY PHOTOS ── */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-400" />
            Clinic Gallery Photos
          </h2>
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Photos</span>
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
            className="hidden"
          />
        </div>

        {galleryImages.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-xs">No clinic photos added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryImages.map((img) => (
              <div key={img.id} className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-2 space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-900">
                  <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => removeGalleryImage(img.id)}
                  className="w-full bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-[11px] font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────────────────────
interface SupabaseAdminPanelProps {
  onLogout: () => void;
}

export const SupabaseAdminPanel: React.FC<SupabaseAdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabId>('appointments');
  const { appointments } = useClinic();
  const pendingCount = appointments.filter(a => a.status === 'Pending').length;

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'appointments', label: 'Schedule', icon: Calendar },
    { id: 'clinic',       label: 'Clinic',   icon: Building2 },
    { id: 'services',     label: 'Services', icon: Stethoscope },
    { id: 'doctors',      label: 'Doctors',  icon: Users },
    { id: 'gallery',      label: 'Gallery',  icon: Image },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Doctor Admin</p>
            <p className="text-teal-400 text-[10px] font-medium">Clinic Management Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-1 rounded-full text-[10px] font-bold">
              <Bell className="w-3 h-3" />
              {pendingCount} pending
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:border-rose-700/50 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'appointments' && <AppointmentsTab />}
        {activeTab === 'clinic'       && <ClinicInfoTab />}
        {activeTab === 'services'     && <ServicesTab />}
        {activeTab === 'doctors'      && <DoctorsTab />}
        {activeTab === 'gallery'      && <GalleryTab />}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`admin-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all relative ${
                isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.id === 'appointments' && pendingCount > 0 && (
                <span className="absolute top-1.5 right-[25%] w-2 h-2 rounded-full bg-amber-500" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[9px] font-semibold leading-none">{tab.label}</span>
              {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-400 rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
