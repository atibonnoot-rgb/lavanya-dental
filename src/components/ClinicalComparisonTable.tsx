import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  CalendarCheck 
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const ClinicalComparisonTable: React.FC = () => {
  const { setShowBookingModal } = useClinic();

  const comparisonFeatures = [
    {
      feature: 'Treating Practitioner Experience',
      lavanya: 'Senior Specialist with 25+ years hands-on mastery (Dr. Vijay Rajshekar personally oversees complex cases)',
      others: 'Often handled by fresh dental graduates or rotating general dentists with limited experience',
    },
    {
      feature: 'Root Canal & Surgery Technology',
      lavanya: 'Painless Biolase Diode Laser disinfection & computerized rotary apex locators in single-visit',
      others: 'Traditional manual files with multi-visit sessions, post-op pain, and scalpel incisions',
    },
    {
      feature: 'Impression & Smile Planning',
      lavanya: '3D Digital Intraoral Scanning with instant 3D computer simulation (Zero gagging paste)',
      others: 'Messy alginate impression putty prone to gagging, dimensional distortion, and repeats',
    },
    {
      feature: 'Sterilization & Infection Control',
      lavanya: '6-Step Hospital-Grade Class-B Autoclave & individual vacuum-sealed surgical pouches (CDC standards)',
      others: 'Standard boiling or basic chemical wiping without strict autoclave spore monitoring',
    },
    {
      feature: 'Pricing & Financing Options',
      lavanya: '100% Transparent itemized fees upfront with 0% Interest EMI & all major insurance accepted',
      others: 'Hidden consultation fees, ambiguous treatment estimates, and surprise add-on charges',
    },
    {
      feature: 'Waiting Time & Scheduling',
      lavanya: 'Zero waiting list with live mobile sync and dedicated reserved doctor consultation slots',
      others: 'Overbooked schedules with 45–60 minute waiting room delays',
    },
    {
      feature: 'Emergency & Sunday Availability',
      lavanya: '24/7 Dental Emergency Triage Hotline + Sunday appointments on-call',
      others: 'Closed on Sundays and holidays with no weekend emergency contact',
    }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden mt-14 sm:mt-16">
      {/* Top Header Bar matching the design */}
      <div className="bg-[#0B1528] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#00E599]">
            UNCOMPROMISING QUALITY
          </span>
          <h3 className="text-xl sm:text-2xl font-bold font-display mt-0.5 text-white">
            Clinical Comparison: Lavanya Dental vs Generic Dental Clinics
          </h3>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="inline-flex items-center gap-2 bg-[#00D084] hover:bg-[#00b875] text-[#0B1528] font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 shrink-0"
        >
          <CalendarCheck className="w-4 h-4 text-[#0B1528]" />
          <span>Experience The Difference</span>
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700">
              <th className="py-4 px-5 sm:px-6 font-bold w-1/3">Clinical Feature</th>
              <th className="py-4 px-5 sm:px-6 font-bold w-1/3 bg-teal-50/60 text-teal-900 border-x border-teal-100">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Lavanya Dental Clinic</span>
                </div>
              </th>
              <th className="py-4 px-5 sm:px-6 font-bold w-1/3 text-slate-500">
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Standard Dental Clinics</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comparisonFeatures.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-5 sm:px-6 font-semibold text-slate-900 align-top">
                  {row.feature}
                </td>
                <td className="py-4 px-5 sm:px-6 bg-teal-50/30 border-x border-teal-100/60 text-slate-800 align-top">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{row.lavanya}</span>
                  </div>
                </td>
                <td className="py-4 px-5 sm:px-6 text-slate-500 align-top">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{row.others}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
