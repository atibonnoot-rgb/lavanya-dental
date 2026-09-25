import React, { useState, useEffect } from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { DoctorsSection } from './components/DoctorsSection';
import { BeforeAfterGallery } from './components/BeforeAfterGallery';
import { ReviewsSection } from './components/ReviewsSection';
import { PatientPortal } from './components/PatientPortal';
import { AdminLogin } from './components/AdminLogin';
import { SupabaseAdminPanel } from './components/SupabaseAdminPanel';
import { BookingModal } from './components/BookingModal';
import { EmergencyModal } from './components/EmergencyModal';
import { DoctorMobileCompanion } from './components/DoctorMobileCompanion';
import { Footer } from './components/Footer';
import { supabase } from './lib/supabase';
import { 
  Stethoscope
} from 'lucide-react';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M12.04 2C6.516 2 2.024 6.491 2.024 12.016c0 1.764.461 3.487 1.336 5.006L2 22l5.12-1.343c1.464.798 3.119 1.218 4.805 1.218 5.524 0 10.016-4.49 10.016-10.016 0-2.677-1.042-5.195-2.936-7.09A10.02 10.02 0 0012.04 2zm0 18.293c-1.503 0-2.975-.405-4.262-1.17l-.306-.182-3.167.83.845-3.087-.199-.317a8.272 8.272 0 01-1.267-4.351c0-4.57 3.719-8.29 8.29-8.29 2.215 0 4.298.863 5.864 2.43 1.566 1.566 2.428 3.65 2.427 5.866 0 4.571-3.719 8.291-8.29 8.291zm4.61-6.19c-.253-.127-1.498-.739-1.73-.823-.232-.085-.4-.127-.57.127-.17.253-.655.823-.803.992-.148.17-.296.19-.55.064-.253-.127-1.07-.394-2.038-1.258-.753-.672-1.261-1.503-1.41-1.756-.148-.253-.016-.39.111-.516.115-.113.254-.296.38-.444.127-.148.17-.253.254-.423.085-.17.042-.317-.021-.444-.064-.127-.57-1.373-.782-1.881-.206-.494-.415-.426-.57-.434l-.487-.008c-.17 0-.444.064-.676.317-.233.254-.888.867-.888 2.114 0 1.248.91 2.453 1.036 2.622.127.17 1.79 2.733 4.337 3.832.606.262 1.08.419 1.45.536.61.194 1.165.166 1.603.101.488-.073 1.498-.613 1.71-1.205.212-.592.212-1.1.148-1.205-.063-.106-.233-.17-.486-.296z" />
  </svg>
);

const AppContent: React.FC = () => {
  const { 
    currentRole, 
    setCurrentRole, 
    showDoctorMobileSimulator, 
    setShowDoctorMobileSimulator,
    getDoctorById,
    selectedDoctorId
  } = useClinic();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isDoctorAuthenticated, setIsDoctorAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Check Supabase auth session on mount and listen for changes
  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        if (import.meta.env.VITE_SUPABASE_URL) {
          const { data } = await supabase.auth.getSession();
          setIsAdminAuthenticated(!!data?.session);
          setIsDoctorAuthenticated(!!data?.session);
        }
      } catch (err) {
        console.warn('Auth check skipped:', err);
      } finally {
        setAuthChecked(true);
      }
    };

    initAuth();

    try {
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setIsAdminAuthenticated(!!session);
          setIsDoctorAuthenticated(!!session);
        });
        sub = data.subscription;
      }
    } catch (err) {
      console.warn('Auth listener skipped:', err);
    }

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
    if (currentRole !== 'patient') {
      setCurrentRole('patient');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Public website rendered immediately without white-screen block
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

      {/* DOCTOR / CLINICIAN ROLE — Password Protected */}
      {currentRole === 'doctor' && (
        <>
          {!isDoctorAuthenticated ? (
            <AdminLogin onAuthenticated={() => setIsDoctorAuthenticated(true)} />
          ) : (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col">
              {/* Doctor header bar with Lock / Logout */}
              <div className="bg-slate-950 border-b border-slate-800 py-3 px-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm text-white font-display">
                    Clinician Mobile Console (Protected) — {getDoctorById(selectedDoctorId)?.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsDoctorAuthenticated(false);
                    setCurrentRole('patient');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-1.5 rounded-xl border border-slate-700 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Lock Console</span>
                  <span>🔒</span>
                </button>
              </div>

              <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
                <DoctorMobileCompanion isModal={false} />
              </div>
            </div>
          )}
        </>
      )}

      {/* PATIENT ROLE — Public website */}
      {currentRole === 'patient' && (
        <>
          {/* Clinic Header */}
          <Header onNavigateTab={handleNavigateTab} activeTab={activeTab} />

          {/* Main View Router */}
          <main className="flex-1">
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
          </main>

          {/* Footer */}
          <Footer onNavigateTab={handleNavigateTab} />

          {/* Global Modals & Overlays */}
          <BookingModal />
          <EmergencyModal />

          {/* Clean WhatsApp Direct Button (No Popups / Interferences) */}
          <a
            href="https://wa.me/918555052843?text=Hello%20Lavanya%20Dental%20Clinic%2C%20I%20would%20like%20to%20book%20an%20appointment"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:shadow-emerald-600/50 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 group border-2 border-white/30"
            title="Chat on WhatsApp"
          >
            <WhatsAppIcon className="w-5 h-5 text-white" />
            <span className="hidden sm:inline font-bold text-xs tracking-wide">WhatsApp</span>
          </a>

          {/* Floating Smartphone Companion */}
          {showDoctorMobileSimulator && (
            <DoctorMobileCompanion 
              isModal={true} 
              onClose={() => setShowDoctorMobileSimulator(false)} 
            />
          )}
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
