import React from 'react';
import { 
  AlertTriangle, 
  X, 
  Phone, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  Calendar, 
  CheckCircle2,
  HelpCircle 
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const EmergencyModal: React.FC = () => {
  const { showEmergencyModal, setShowEmergencyModal, setShowBookingModal, setBookingPreselectedServiceId } = useClinic();

  if (!showEmergencyModal) return null;

  const handleBookEmergencySlot = () => {
    setShowEmergencyModal(false);
    setBookingPreselectedServiceId('serv-7'); // Urgent Dental Trauma slot
    setShowBookingModal(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border-2 border-rose-500 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Alert Strip */}
        <div className="bg-rose-600 text-white p-5 relative">
          <button
            onClick={() => setShowEmergencyModal(false)}
            className="absolute top-4 right-4 text-rose-200 hover:text-white p-1 rounded-full hover:bg-rose-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-rose-200" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
              Immediate Clinical Triage Protocol
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
            Dental Emergency Assessment
          </h2>
          <p className="text-xs text-rose-100 mt-1">
            Follow these life-safety guidelines to determine immediate course of action.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Life threatening criteria */}
          <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 text-xs text-rose-950 space-y-2">
            <span className="font-bold flex items-center gap-1.5 text-rose-900 text-sm">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Call 911 Immediately If You Experience:
            </span>
            <ul className="space-y-1 list-disc pl-4 text-rose-800">
              <li>Severe facial swelling that threatens your airway or causes difficulty breathing.</li>
              <li>Uncontrollable bleeding from the mouth that does not stop after 20 minutes of firm direct pressure.</li>
              <li>Sudden facial numbness, high fever, or trauma involving head loss of consciousness.</li>
            </ul>
          </div>

          {/* Critical First-Aid Protocols */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Emergency Action Steps (Before You Arrive):
            </h4>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900">Knocked-Out (Avulsed) Adult Tooth:</strong>
                <p className="text-slate-600 mt-0.5">
                  Pick up the tooth by the <em>crown</em> (never touch the root). Gently rinse with water or milk—do not scrub. Place the tooth back into the socket if possible, or preserve it in a cup of cold whole milk or saliva. Re-implantation must occur within <strong>60 minutes</strong>!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900">Severe Throbbing Toothache / Abscess:</strong>
                <p className="text-slate-600 mt-0.5">
                  Rinse with warm salt water. Do not place an aspirin directly against your gums (this burns the tissue). Apply a cold compress to the outside cheek.
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Hotline Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            <a
              href="tel:18005553368"
              className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-3 px-4 rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call On-Call Hotline: (800) 555-DENT</span>
            </a>

            <button
              onClick={handleBookEmergencySlot}
              className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>Book Priority Emergency Slot</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
