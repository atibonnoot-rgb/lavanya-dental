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
  Stethoscope, 
  MessageSquare
} from 'lucide-react';

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
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:shadow-emerald-600/50 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 group border-2 border-white/30"
            title="Chat on WhatsApp"
          >
            <MessageSquare className="w-5 h-5 fill-current" />
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
