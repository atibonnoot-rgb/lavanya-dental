import React, { useEffect, useState } from 'react';
import { Bell, Smartphone, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const PushNotificationToast: React.FC = () => {
  const { 
    lastSimulatedPush, 
    dismissPushToast, 
    confirmAppointmentByDoctor, 
    setShowDoctorMobileSimulator,
    setSelectedDoctorId,
    getDoctorById
  } = useClinic();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastSimulatedPush) {
      setVisible(true);
      // Auto-dismiss toast after 9 seconds if not interacted with
      const timer = setTimeout(() => {
        setVisible(false);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [lastSimulatedPush]);

  if (!lastSimulatedPush || !visible) return null;

  const doctor = getDoctorById(lastSimulatedPush.doctorId);

  const handleQuickConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    confirmAppointmentByDoctor(lastSimulatedPush.appointmentId);
    setVisible(false);
    dismissPushToast();
  };

  const handleOpenPhone = () => {
    setSelectedDoctorId(lastSimulatedPush.doctorId);
    setShowDoctorMobileSimulator(true);
    setVisible(false);
    dismissPushToast();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div 
        onClick={handleOpenPhone}
        className="bg-slate-950/95 text-white rounded-2xl p-4 shadow-2xl border border-teal-500/40 backdrop-blur-md cursor-pointer hover:border-teal-400 transition-all group"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-teal-400 font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
            </span>
            <span>CLINICIAN MOBILE PUSH (FCM/SMS)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">1.2s Latency</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
                dismissPushToast();
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="py-2.5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
            {lastSimulatedPush.urgent ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <Smartphone className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-white truncate">
                New Booking: {lastSimulatedPush.patientName}
              </h4>
              <span className="text-[10px] font-mono text-teal-300 bg-teal-900/60 px-1.5 py-0.5 rounded-sm">
                {lastSimulatedPush.timeSlot}
              </span>
            </div>
            <p className="text-xs text-slate-300 truncate">
              {lastSimulatedPush.serviceName}
            </p>
            <p className="text-[11px] text-slate-400">
              Assigned to: <strong className="text-slate-200">{doctor?.name.split(',')[0]}</strong> • {lastSimulatedPush.date}
            </p>
          </div>
        </div>

        {/* 1-Tap Quick Actions directly inside notification */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <button
            onClick={handleQuickConfirm}
            className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>1-Tap Confirm</span>
          </button>

          <button
            onClick={handleOpenPhone}
            className="flex-1 inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-400" />
            <span>Open Phone</span>
          </button>
        </div>
      </div>
    </div>
  );
};
