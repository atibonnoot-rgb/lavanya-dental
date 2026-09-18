import React, { useState, useEffect } from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { DoctorsSection } from './components/DoctorsSection';
import { BeforeAfterGallery } from './components/BeforeAfterGallery';
import { ReviewsSection } from './components/ReviewsSection';
import { PatientPortal } from './components/PatientPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { SupabaseAdminPanel } from './components/SupabaseAdminPanel';
import { BookingModal } from './components/BookingModal';
import { EmergencyModal } from './components/EmergencyModal';
import { DoctorMobileCompanion } from './components/DoctorMobileCompanion';
import { PushNotificationToast } from './components/PushNotificationToast';
import { Footer } from './components/Footer';
import { supabase } from './lib/supabase';
import { 
  Stethoscope, 
  Calendar
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    currentRole, 
    setCurrentRole, 
    showDoctorMobileSimulator, 
    setShowDoctorMobileSimulator,
    setShowBookingModal,
    selectedDoctorId,
    getDoctorById
  } = useClinic();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  const selectedDoctor = getDoctorById(selectedDoctorId);

  // Check Supabase auth session on mount and listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdminAuthenticated(!!session);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
    if (currentRole !== 'patient') {
      setCurrentRole('patient');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // While checking auth, show nothing (avoids flash)
  if (!authChecked) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* ADMIN ROLE — Password Protected */}
      {currentRole === 'admin' && (
        <>
          {!isAdminAuthenticated ? (
            <AdminLogin onAuthenticated={() => setIsAdminAuthenticated(true)} />
          ) : (
            <SupabaseAdminPanel onLogout={() => {
              setIsAdminAuthenticated(false);
              setCurrentRole('patient');
            }} />
          )}
        </>
      )}

      {/* PATIENT / DOCTOR ROLE — Public site */}
      {currentRole !== 'admin' && (
        <>
          {/* Clinic Header */}
          <Header onNavigateTab={handleNavigateTab} activeTab={activeTab} />

          {/* Main View Router */}
          <main className="flex-1">
            
            {/* PATIENT ROLE VIEW */}
            {currentRole === 'patient' && (
              <>
                {activeTab === 'home' && (
                  <>
                    <Hero onExploreServices={() => handleNavigateTab('services')} />
                    <ServicesSection />
                    <DoctorsSection />
                    <BeforeAfterGallery />
                    <ReviewsSection />
                  </>
                )}

                {activeTab === 'services' && (
                  <div className="pt-6">
                    <ServicesSection />
                  </div>
                )}

                {activeTab === 'doctors' && (
                  <div className="pt-6">
                    <DoctorsSection />
                  </div>
                )}

                {activeTab === 'gallery' && (
                  <div className="pt-6">
                    <BeforeAfterGallery />
                  </div>
                )}

                {(activeTab === 'patient-portal' || activeTab === 'care-guides') && (
                  <PatientPortal />
                )}
              </>
            )}

            {/* DOCTOR / CLINICIAN PORTAL VIEW */}
            {currentRole === 'doctor' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white mb-8 border border-slate-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-semibold border border-emerald-700/60 mb-2">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Doctor Mobile Direct Management Portal</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
                      Clinician Mobile Console: {selectedDoctor?.name}
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
                      Inspect your real-time smartphone alerts, 1-tap appointment confirmation workflow, schedule availability toggle, and two-way Google Calendar synchronization.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Simulate Patient Booking</span>
                    </button>
                  </div>
                </div>

                {/* Centered Realistic Smartphone Device Container */}
                <DoctorMobileCompanion isModal={false} />
              </div>
            )}

          </main>

          {/* Footer */}
          <Footer onNavigateTab={handleNavigateTab} />

          {/* Global Modals & Overlays */}
          <BookingModal />
          <EmergencyModal />

          {/* Floating Smartphone Companion */}
          {showDoctorMobileSimulator && (
            <DoctorMobileCompanion 
              isModal={true} 
              onClose={() => setShowDoctorMobileSimulator(false)} 
            />
          )}

          {/* Real-Time Push Notification Alert Toast */}
          <PushNotificationToast />
        </>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ClinicProvider>
      <AppContent />
    </ClinicProvider>
  );
}
