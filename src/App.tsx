import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { WhyChooseUsSection } from './components/WhyChooseUsSection';
import { Footer } from './components/Footer';

import { Receipt, ArrowLeft } from 'lucide-react';

// Lazy-load below-the-fold public sections for optimal LCP & minimal initial JS bundle
const ServicesSection = lazy(() => import('./components/ServicesSection').then(m => ({ default: m.ServicesSection })));
const DoctorsSection = lazy(() => import('./components/DoctorsSection').then(m => ({ default: m.DoctorsSection })));
const BeforeAfterGallery = lazy(() => import('./components/BeforeAfterGallery').then(m => ({ default: m.BeforeAfterGallery })));
const AreasServedSection = lazy(() => import('./components/AreasServedSection').then(m => ({ default: m.AreasServedSection })));
const FaqSection = lazy(() => import('./components/FaqSection').then(m => ({ default: m.FaqSection })));

// Lazy-load heavy administrative, portal, and modal components for ultra-fast initial page load
const PatientPortal = lazy(() => import('./components/PatientPortal').then(m => ({ default: m.PatientPortal })));
const AdminLogin = lazy(() => import('./components/AdminLogin').then(m => ({ default: m.AdminLogin })));
const SupabaseAdminPanel = lazy(() => import('./components/SupabaseAdminPanel').then(m => ({ default: m.SupabaseAdminPanel })));
const ClinicBillingLedger = lazy(() => import('./components/ClinicBillingLedger').then(m => ({ default: m.ClinicBillingLedger })));
const BookingModal = lazy(() => import('./components/BookingModal').then(m => ({ default: m.BookingModal })));
const EmergencyModal = lazy(() => import('./components/EmergencyModal').then(m => ({ default: m.EmergencyModal })));
const DoctorMobileCompanion = lazy(() => import('./components/DoctorMobileCompanion').then(m => ({ default: m.DoctorMobileCompanion })));

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-12">
    <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

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
    showBookingModal,
    showEmergencyModal,
  } = useClinic();

  const [activeTab, setActiveTab] = useState<string>('home');
  // Admin auth is NEVER auto-granted from URL — must go through AdminLogin
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Standalone Localhost Billing Tool state (accessible via #billing or ?billing)
  const [isLocalBilling, setIsLocalBilling] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hash.includes('billing') ||
           window.location.pathname.includes('billing') ||
           window.location.search.includes('billing');
  });

  // Check Supabase auth session only when admin portal is accessed
  useEffect(() => {
    const isAdminIntent = 
      currentRole === 'admin' || 
      (typeof window !== 'undefined' && (
        window.location.hash.includes('admin') || 
        window.location.pathname.includes('admin')
      ));

    if (!isAdminIntent) return;

    let sub: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        if (import.meta.env.VITE_SUPABASE_URL) {
          const { supabase } = await import('./lib/supabase');
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            setIsAdminAuthenticated(true);
          }
          const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
              setIsAdminAuthenticated(true);
            } else {
              setIsAdminAuthenticated(false);
            }
          });
          sub = listener.subscription;
        }
      } catch (err) {
        console.warn('Auth check skipped:', err);
      }
    };

    initAuth();

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [currentRole]);

  // Listen for /admin or /billing in URL
  useEffect(() => {
    const handleUrlChange = () => {
      const isBillingRoute = 
        window.location.hash.includes('billing') ||
        window.location.pathname.includes('billing') ||
        window.location.search.includes('billing');
      
      setIsLocalBilling(isBillingRoute);

      if (
        window.location.hash.includes('admin') ||
        window.location.pathname.includes('admin') ||
        window.location.search.includes('admin')
      ) {
        // Just set the role to admin so login screen shows; auth gate remains
        setCurrentRole('admin');
        // Clean the URL hash so it doesn't confuse state
        if (window.location.hash.includes('admin')) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    };

    handleUrlChange();
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [setCurrentRole]);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
    if (currentRole !== 'patient') {
      setCurrentRole('patient');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* STANDALONE LOCALHOST BILLING TOOL — Preserved on localhost / standalone route #billing */}
      {isLocalBilling ? (
        <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
          <header className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-40 px-4 py-3.5 shadow-md">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-xl border border-white/20">
                  <Receipt className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Lavanya Dental Clinic
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-700">
                      Localhost Bill Generator
                    </span>
                  </h1>
                  <p className="text-[11px] text-emerald-300">
                    Standalone In-Clinic Invoicing, Printable Tax Bills &amp; Expense Ledger (Saved on Localhost)
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsLocalBilling(false);
                  if (window.location.hash.includes('billing')) {
                    history.replaceState(null, '', window.location.pathname + window.location.search.replace(/[?&]billing(=[^&]*)?/, ''));
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Clinic Website</span>
              </button>
            </div>
          </header>

          <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6">
            <Suspense fallback={<LoadingSpinner />}>
              <ClinicBillingLedger />
            </Suspense>
          </main>
        </div>
      ) : (
        <>
          {/* ADMIN ROLE — Login gate then Admin Panel */}
      {currentRole === 'admin' && (
        !isAdminAuthenticated ? (
          <Suspense fallback={<LoadingSpinner />}>
            <AdminLogin onAuthenticated={() => {
              setIsAdminAuthenticated(true);
            }} />
          </Suspense>
        ) : (
          <Suspense fallback={<LoadingSpinner />}>
            <SupabaseAdminPanel 
              onBackToWebsite={() => {
                setCurrentRole('patient');
                try { localStorage.removeItem('lavanya_current_role'); } catch {}
                if (window.location.hash.includes('admin')) {
                  history.replaceState(null, '', window.location.pathname + window.location.search);
                }
              }}
              onLogout={() => {
                setIsAdminAuthenticated(false);
                setCurrentRole('patient');
                try { localStorage.removeItem('lavanya_current_role'); } catch {}
                try { import('./lib/supabase').then(m => m.supabase.auth.signOut()).catch(() => {}); } catch {}
                if (window.location.hash.includes('admin')) {
                  history.replaceState(null, '', window.location.pathname + window.location.search);
                }
              }} 
            />
          </Suspense>
        )
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
                <WhyChooseUsSection />
                <Suspense fallback={null}>
                  <ServicesSection />
                  <DoctorsSection />
                  <BeforeAfterGallery />
                  <AreasServedSection />
                  <FaqSection />
                </Suspense>
              </>
            )}

            {activeTab === 'services' && (
              <div className="pt-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <ServicesSection />
                </Suspense>
              </div>
            )}

            {activeTab === 'why-us' && (
              <div className="pt-6">
                <WhyChooseUsSection />
              </div>
            )}

            {activeTab === 'doctors' && (
              <div className="pt-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <DoctorsSection />
                </Suspense>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="pt-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <BeforeAfterGallery />
                </Suspense>
              </div>
            )}

            {activeTab === 'areas-served' && (
              <div className="pt-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <AreasServedSection />
                </Suspense>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="pt-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <FaqSection />
                </Suspense>
              </div>
            )}

            {(activeTab === 'patient-portal' || activeTab === 'care-guides') && (
              <Suspense fallback={<LoadingSpinner />}>
                <PatientPortal />
              </Suspense>
            )}
          </main>

          {/* Footer */}
          <Footer onNavigateTab={handleNavigateTab} />

          {/* Global Modals & Overlays (Loaded conditionally only when triggered) */}
          {showBookingModal && (
            <Suspense fallback={null}>
              <BookingModal />
            </Suspense>
          )}

          {showEmergencyModal && (
            <Suspense fallback={null}>
              <EmergencyModal />
            </Suspense>
          )}

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
            <Suspense fallback={null}>
              <DoctorMobileCompanion 
                isModal={true} 
                onClose={() => setShowDoctorMobileSimulator(false)} 
              />
            </Suspense>
          )}
        </>
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
