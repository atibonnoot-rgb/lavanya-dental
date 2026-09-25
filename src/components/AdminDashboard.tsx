import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Activity, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Search,
  Filter,
  Trash2
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { CLINIC_KPIS } from '../data/mockData';

export const AdminDashboard: React.FC = () => {
  const { 
    appointments, 
    doctors, 
    services, 
    auditLogs, 
    toggleDoctorAvailability,
    confirmAppointmentByDoctor,
    deleteAppointment,
    setShowBookingModal
  } = useClinic();

  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'appointments' | 'staff' | 'audit'>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');

  const filteredAppointments = appointments.filter(a => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  const filteredAuditLogs = auditLogs.filter(l => 
    l.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const totalDepositsCollected = appointments
    .filter(a => a.depositPaid)
    .reduce((sum, a) => sum + a.depositAmount, 0);

  const exportAuditLogCsv = () => {
    const headers = 'ID,Timestamp,Actor,Role,Action,Details,Encryption,IPHash\n';
    const rows = auditLogs.map(l => 
      `"${l.id}","${l.timestamp}","${l.actor}","${l.role}","${l.action}","${l.details.replace(/"/g, '""')}","${l.encryptionStatus}","${l.ipHash}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AuraDental_HIPAA_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-semibold border border-indigo-200 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Clinic Administrator & Executive Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
            Clinic Master Operations
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Real-time schedule synchronization, clinician capacity, billing reconciliation, and HIPAA compliance logs.
          </p>
        </div>

        {/* Quick Nav Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200 self-start md:self-auto">
          {[
            { id: 'overview', label: 'Analytics & KPIs' },
            { id: 'appointments', label: 'Master Schedule' },
            { id: 'staff', label: 'Dentist Roster' },
            { id: 'audit', label: 'HIPAA Audit Trail' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAdminTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB: KPI METRICS (PRD Section 7) */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Booking Conversion</span>
                <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-display text-slate-900">{CLINIC_KPIS.bookingConversionRate}%</span>
                <span className="text-xs font-semibold text-emerald-600">Goal: ≥15% (Passed)</span>
              </div>
              <p className="text-[11px] text-slate-500">Visitors completing direct appointment booking</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Push Latency</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-display text-slate-900">{CLINIC_KPIS.notificationLatencySeconds}s</span>
                <span className="text-xs font-semibold text-emerald-600">Goal: &lt;5.0s (Passed)</span>
              </div>
              <p className="text-[11px] text-slate-500">Delivered to doctor's phone via FCM/Twilio</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">No-Show Reduction</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-display text-slate-900">{CLINIC_KPIS.noShowRateReduction}%</span>
                <span className="text-xs font-semibold text-emerald-600">Target: 25%</span>
              </div>
              <p className="text-[11px] text-slate-500">Reduced via automated 2FA & SMS reminders</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Availability</span>
                <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-display text-slate-900">{CLINIC_KPIS.systemUptime}%</span>
                <span className="text-xs font-semibold text-emerald-600">SLA 99.9% Met</span>
              </div>
              <p className="text-[11px] text-slate-500">Multi-region HIPAA compliant container cluster</p>
            </div>

          </div>

          {/* Revenue & Real-time Booking Feed summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Recent Appointments & Triage Status</h3>
                <span className="text-xs font-mono text-slate-500">{appointments.length} Total Bookings</span>
              </div>

              <div className="space-y-3">
                {appointments.slice(0, 5).map(apt => {
                  const doc = doctors.find(d => d.id === apt.doctorId);
                  const serv = services.find(s => s.id === apt.serviceId);
                  return (
                    <div key={apt.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-teal-800">{apt.confirmationCode}</span>
                          <span className="text-xs font-bold text-slate-900 truncate">{apt.patientName}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{serv?.name} • With {doc?.name.split(',')[0]}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right text-xs">
                          <span className="font-semibold text-slate-900 block">{apt.timeSlot}</span>
                          <span className="text-[10px] text-slate-500">{apt.date}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          apt.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Billing & Deposit Summary */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Billing & Deposit Protection</h3>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3">
                <span className="text-xs font-semibold text-slate-400">Total Pre-Authorized Deposits</span>
                <div className="text-3xl font-bold font-display text-emerald-400">
                  ${totalDepositsCollected + CLINIC_KPIS.revenueCollected}.00
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-700">
                  <span>Secured via Stripe PCI-DSS</span>
                  <span className="text-emerald-400">0 Chargebacks</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span>Average Deposit per Booking:</span>
                  <strong className="text-slate-900">$55.00</strong>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span>Payment Success Rate:</span>
                  <strong className="text-emerald-600">99.4%</strong>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span>Auto-Refund on Cancellation:</span>
                  <strong className="text-slate-900">Enabled (24h prior)</strong>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MASTER SCHEDULE TAB */}
      {activeAdminTab === 'appointments' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Master Clinical Schedule</h3>
              <p className="text-xs text-slate-500">Live feed of all clinic bookings across all doctors</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'Pending', 'Confirmed', 'Completed', 'Rescheduled'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Deposit</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map(apt => {
                  const doc = doctors.find(d => d.id === apt.doctorId);
                  const serv = services.find(s => s.id === apt.serviceId);
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-teal-800">{apt.confirmationCode}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{apt.patientName}</div>
                        <div className="text-[11px] text-slate-500">{apt.patientPhone}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{doc?.name.split(',')[0]}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{serv?.name}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900">{apt.date}</span>{' '}
                        <span className="text-teal-700 font-mono">@{apt.timeSlot}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        ${apt.depositAmount} {apt.depositPaid ? '✓' : '(Due)'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          apt.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                          apt.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status === 'Pending' && (
                            <button
                              onClick={() => confirmAppointmentByDoctor(apt.id)}
                              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete appointment ${apt.confirmationCode} for ${apt.patientName}?`)) {
                                deleteAppointment(apt.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors"
                            title="Delete appointment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAFF ROSTER TAB */}
      {activeAdminTab === 'staff' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Clinician & Specialist Management</h3>
            <p className="text-xs text-slate-500 mb-6">Manage working shifts, emergency on-call status, and schedule allocations</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map(doc => (
                <div key={doc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
                  <img
                    src={doc.photoUrl}
                    alt={doc.name}
                    className="w-16 h-16 rounded-2xl object-cover shadow-xs shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{doc.name}</h4>
                      <span className="text-[10px] font-mono text-amber-600 font-bold">★ {doc.rating}</span>
                    </div>
                    <p className="text-xs text-teal-800 font-medium truncate">{doc.specialty}</p>
                    <p className="text-[11px] text-slate-500">Working hours: {doc.workingHours.start} – {doc.workingHours.end}</p>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => toggleDoctorAvailability(doc.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                          doc.isAvailableToday
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {doc.isAvailableToday ? 'Status: Active & Booking' : 'Status: Paused'}
                      </button>

                      <span className="text-[10px] text-slate-400 font-medium">
                        {doc.onCallForEmergency ? 'On-Call Emergency ✓' : 'Routine Shifts'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HIPAA / GDPR AUDIT TRAIL TAB (PRD 4.3) */}
      {activeAdminTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">HIPAA / GDPR Immutable Audit Log</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every access to patient health information (PHI), OTP verification, and clinician mobile alert is cryptographically logged.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportAuditLogCsv}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit CSV</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by actor, action code, or details..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 outline-hidden"
            />
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp (UTC)</th>
                  <th className="p-3">Actor & Role</th>
                  <th className="p-3">Action Event</th>
                  <th className="p-3">Event Details</th>
                  <th className="p-3">Encryption & Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{log.actor}</div>
                      <span className="text-[10px] text-slate-500">{log.role}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-sm border border-teal-200 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 max-w-md">{log.details}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                        <Lock className="w-3 h-3" />
                        <span>{log.encryptionStatus}</span>
                      </div>
                      <span className="font-mono text-[9px] text-slate-400 block">{log.ipHash}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
