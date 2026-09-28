import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  CalendarCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

interface Locality {
  id: string;
  name: string;
  shortName: string;
  travelTime: string;
  distance: string;
  transitNote: string;
  headline: string;
  seoKeywords: string;
  description: string;
  popularTreatments: string[];
  mapsOrigin: string;
}

const LOCALITIES: Locality[] = [
  {
    id: 'sindhi-colony',
    name: 'Sindhi Colony & Minister Road',
    shortName: 'Sindhi Colony',
    travelTime: '3 mins away',
    distance: '0.8 km',
    transitNote: 'Direct via Minister Road',
    headline: 'Living in Sindhi Colony? Book into Lavanya Dental Clinic (PG Road)',
    seoKeywords: 'Best Dental Clinic near Sindhi Colony • Painless Laser RCT • Invisible Aligners',
    description: 'Located right next door on PG Road. Families across Sindhi Colony and Minister Road choose Dr. Vijay Rajshekar for painless laser root canals, pediatric care, and smile makeovers.',
    popularTreatments: ['Laser Root Canal', 'Teeth Whitening', 'Invisible Aligners'],
    mapsOrigin: 'Sindhi Colony, Secunderabad'
  },
  {
    id: 'begumpet',
    name: 'Begumpet & Prakash Nagar',
    shortName: 'Begumpet',
    travelTime: '5 mins away',
    distance: '1.8 km',
    transitNote: 'Via SP Road / Begumpet Flyover',
    headline: 'Living in Begumpet? Book into Lavanya Dental Clinic (PG Road)',
    seoKeywords: 'Top Dentist near Begumpet • Dental Implants Begumpet • Ceramic Crowns',
    description: 'A quick 5-minute drive via SP Road or Prakash Nagar Metro. Corporate professionals and residents looking for the best dentist near Begumpet rely on Lavanya Dental for painless laser dentistry and permanent dental implants.',
    popularTreatments: ['Dental Implants', 'Single-Sitting RCT', 'Ceramic Crowns'],
    mapsOrigin: 'Begumpet, Hyderabad'
  },
  {
    id: 'pg-road-paradise',
    name: 'PG Road & Paradise Circle',
    shortName: 'PG Road / Paradise',
    travelTime: 'Immediate Walk-in',
    distance: '0 km (On-Site)',
    transitNote: 'Beside Vysya Kalyana Mandapam, 500m to Paradise Metro',
    headline: 'Living on PG Road or Paradise? Book into Lavanya Dental Clinic',
    seoKeywords: 'Best Dentist on PG Road Secunderabad • Emergency Dental Care Paradise',
    description: 'Our flagship clinic is located beside Vysya Kalyana Mandapam on PG Road. Immediate appointments and walk-in emergency consultations available daily.',
    popularTreatments: ['Emergency Pain Relief', 'Laser Dentistry', 'Smile Design'],
    mapsOrigin: 'Paradise Circle, Secunderabad'
  },
  {
    id: 'banjara-hills',
    name: 'Banjara Hills (Roads 1 to 12)',
    shortName: 'Banjara Hills',
    travelTime: '12 mins away',
    distance: '5.2 km',
    transitNote: 'Via Panjagutta Flyover or SP Road',
    headline: 'Living in Banjara Hills? Book into Lavanya Dental Clinic (PG Road)',
    seoKeywords: 'Best Dentist near Banjara Hills Hyderabad • Digital Smile Design • Full Mouth Implants',
    description: 'Easily accessible via Panjagutta flyover or SP Road. Patients from Banjara Hills travel to Lavanya Dental Clinic for Dr. Vijay Rajshekar’s 25+ years of clinical mastery in aesthetic smile makeovers and implantology.',
    popularTreatments: ['Digital Smile Design', 'Porcelain Veneers', 'All-on-4 Implants'],
    mapsOrigin: 'Banjara Hills, Hyderabad'
  },
  {
    id: 'marredpally',
    name: 'West & East Marredpally',
    shortName: 'Marredpally',
    travelTime: '8 mins away',
    distance: '2.5 km',
    transitNote: 'Via Shenoy Nursing Home Road',
    headline: 'Living in Marredpally? Book into Lavanya Dental Clinic (PG Road)',
    seoKeywords: 'Top Dental Clinic near Marredpally Secunderabad • Root Canal & Dentures',
    description: 'Only 8 minutes via Shenoy Nursing Home road. Highly trusted by generations of Marredpally families and senior citizens for gentle geriatric care, painless root canals, and precision dentures.',
    popularTreatments: ['Complete Dentures', 'Painless Root Canal', 'Dental Bridges'],
    mapsOrigin: 'Marredpally, Secunderabad'
  },
  {
    id: 'bowenpally-trimulgherry',
    name: 'Bowenpally, Trimulgherry & Karkhana',
    shortName: 'Bowenpally',
    travelTime: '10 mins away',
    distance: '3.5 km',
    transitNote: 'Via Diamond Point & Tadbund',
    headline: 'Living in Bowenpally or Trimulgherry? Book into Lavanya Dental Clinic (PG Road)',
    seoKeywords: 'Dental Clinic near Bowenpally & Trimulgherry • Braces, Aligners & Implants',
    description: 'Direct drive down Diamond Point and Tadbund. Serving defence personnel, cantonment residents, and families seeking top-tier dental treatments with transparent pricing.',
    popularTreatments: ['V-Clear Aligners', 'Laser Gum Therapy', 'Wisdom Tooth Removal'],
    mapsOrigin: 'Bowenpally, Secunderabad'
  },
  {
    id: 'somajiguda-panjagutta',
    name: 'Somajiguda, Raj Bhavan & Panjagutta',
    shortName: 'Somajiguda',
    travelTime: '10 mins away',
    distance: '3.8 km',
    transitNote: 'Via Begumpet Flyover',
    headline: 'Living in Somajiguda or Panjagutta? Book into Lavanya Dental Clinic (PG Road)',
    seoKeywords: 'Cosmetic Dentist near Somajiguda & Panjagutta • Single-Visit RCT • Veneers',
    description: 'Straight commute across Begumpet Flyover. Corporate executives and residents from Raj Bhavan Road visit our clinic for fast, single-visit root canals and aesthetic smile restorations.',
    popularTreatments: ['Single-Visit RCT', 'Composite Bonding', 'Teeth Whitening'],
    mapsOrigin: 'Somajiguda, Hyderabad'
  },
  {
    id: 'jubilee-hills',
    name: 'Jubilee Hills & Film Nagar',
    shortName: 'Jubilee Hills',
    travelTime: '15 mins away',
    distance: '7.0 km',
    transitNote: 'Via Panjagutta / Road No. 36',
    headline: 'Living in Jubilee Hills? Book into Lavanya Dental Clinic (PG Road)',
    seoKeywords: 'Smile Makeover Dentist near Jubilee Hills • Porcelain Veneers • Luxury Dental Care',
    description: 'Smooth 15-minute drive via Panjagutta. Patients looking for top smile makeover dentists near Jubilee Hills choose our clinic for discreet, premium aesthetic dental solutions.',
    popularTreatments: ['Porcelain Laminates', 'Zirconia Crowns', 'Laser Teeth Whitening'],
    mapsOrigin: 'Jubilee Hills, Hyderabad'
  },
  {
    id: 'madhapur-hitec',
    name: 'Madhapur, Hitec City & Kondapur',
    shortName: 'Madhapur / Hitec City',
    travelTime: '20 mins away',
    distance: '11.5 km',
    transitNote: 'Direct Blue Line Metro to Paradise Station',
    headline: 'Living in Madhapur or Hitec City? Book into Lavanya Dental Clinic (PG Road)',
    seoKeywords: 'Dental Clinic near Hitec City & Madhapur • Clear Aligners • Weekend Appointments',
    description: 'Direct metro connection straight to Paradise Metro Station (500m from clinic). Convenient evening and Saturday appointments tailored for IT professionals from Cyber Towers and Hitec City.',
    popularTreatments: ['Invisalign Aligners', 'Night Guards for Bruxism', 'Dental Implants'],
    mapsOrigin: 'Madhapur, Hitec City, Hyderabad'
  },
  {
    id: 'gachibowli-financial',
    name: 'Gachibowli & Financial District',
    shortName: 'Gachibowli',
    travelTime: '25 mins away',
    distance: '14.0 km',
    transitNote: 'Via ORR or Blue Line Metro',
    headline: 'Living in Gachibowli? Book into Lavanya Dental Clinic (PG Road)',
    seoKeywords: 'Dental Implants near Gachibowli Financial District • Full Mouth Rehabilitation',
    description: 'Fast connectivity via Outer Ring Road or Blue Line Metro to Paradise station. Flexible priority scheduling and comprehensive single-visit treatments for working professionals.',
    popularTreatments: ['Immediate Implants', 'Full Mouth Rehab', 'Crowns & Bridges'],
    mapsOrigin: 'Gachibowli, Hyderabad'
  },
  {
    id: 'kphb-kukatpally',
    name: 'KPHB Colony & Kukatpally',
    shortName: 'KPHB / Kukatpally',
    travelTime: '18 mins away',
    distance: '10 km',
    transitNote: 'Via Metro or Sanath Nagar Road',
    headline: 'Living in KPHB or Kukatpally? Book into Lavanya Dental Clinic (PG Road)',
    seoKeywords: 'Best Dental Clinic near KPHB Kukatpally • Root Canal Specialist • Ceramic Crowns',
    description: 'Direct Red/Blue metro interchange or fast transit via Sanath Nagar. Kukatpally residents choose Lavanya Dental for painless laser endodontics and guaranteed ceramic restorations.',
    popularTreatments: ['Single-Day RCT', 'Ceramic Crowns', 'Clear Aligners'],
    mapsOrigin: 'KPHB Colony, Kukatpally, Hyderabad'
  },
  {
    id: 'alwal-yapral',
    name: 'Alwal, Lothkunta & Yapral',
    shortName: 'Alwal / Yapral',
    travelTime: '15 mins away',
    distance: '6.5 km',
    transitNote: 'Via Lothkunta & JBS',
    headline: 'Living in Alwal or Yapral? Book into Lavanya Dental Clinic (PG Road)',
    seoKeywords: 'Dental Clinic near Alwal Secunderabad • Complete Family Dental Care',
    description: 'Direct drive down Lothkunta and JBS to PG Road. Providing trusted root canals, crowns, and preventive dental care for families across North Secunderabad.',
    popularTreatments: ['Family Dentistry', 'Gum Therapy', 'Root Canal Treatment'],
    mapsOrigin: 'Alwal, Secunderabad'
  }
];

export const AreasServedSection: React.FC = () => {
  const { setShowBookingModal, setBookingPreselectedDoctorId } = useClinic();
  const [selectedId, setSelectedId] = useState<string>('sindhi-colony');

  const currentLocality = LOCALITIES.find(l => l.id === selectedId) || LOCALITIES[0];

  const handleBookNow = () => {
    // Preselect Dr. Vijay Rajshekar and open modal
    setBookingPreselectedDoctorId('doc-1');
    setShowBookingModal(true);
  };

  return (
    <section id="areas-served" className="py-16 sm:py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>Central Clinic on PG Road, Secunderabad (Paradise Metro)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
            Book Your Dental Appointment by Area
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Visiting from anywhere in Hyderabad or Secunderabad? Select your locality below to see travel time and instantly book your appointment with <strong>Dr. Vijay Rajshekar</strong> at our PG Road clinic.
          </p>
        </div>

        {/* The Sleek Dropdown Booking Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-100 space-y-6">
          
          {/* Locality Dropdown Selector */}
          <div>
            <label htmlFor="area-dropdown" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Locality / Neighborhood:
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 pointer-events-none" />
              <select
                id="area-dropdown"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border-2 border-slate-200 focus:border-teal-500 rounded-2xl pl-12 pr-10 py-3.5 text-sm sm:text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-teal-500/10 outline-hidden transition-all cursor-pointer appearance-none"
              >
                {LOCALITIES.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} — {loc.travelTime} ({loc.distance})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Quick Selection Pills for Most Popular Neighborhoods */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Popular:
            </span>
            {['sindhi-colony', 'begumpet', 'banjara-hills', 'marredpally', 'bowenpally', 'madhapur', 'kphb-kukatpally'].map(id => {
              const loc = LOCALITIES.find(l => l.id === id);
              if (!loc) return null;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedId(id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedId === id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {loc.shortName}
                </button>
              );
            })}
          </div>

          {/* Dynamic Locality Confirmation & Booking Card */}
          <div className="bg-gradient-to-br from-teal-50/80 via-slate-50 to-emerald-50/60 rounded-2xl p-5 sm:p-6 border border-teal-200/80 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-200/60">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
                    Route to Lavanya Dental (PG Road)
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {currentLocality.transitNote}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {currentLocality.headline}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300/60">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  {currentLocality.travelTime}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {currentLocality.description}
            </p>

            {/* Target SEO Keywords (Indexable & Contextual) */}
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-950 bg-white/90 p-2.5 rounded-xl border border-teal-200/70">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{currentLocality.seoKeywords}</span>
            </div>

            {/* Popular Treatments for this area */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Specialties:
              </span>
              {currentLocality.popularTreatments.map((t, idx) => (
                <span 
                  key={idx}
                  className="text-xs bg-white text-slate-700 px-2.5 py-0.5 rounded-md font-medium border border-slate-200"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Action Buttons: Direct Booking + Google Maps Route */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=17.4403811,78.4856958&origin=${encodeURIComponent(currentLocality.mapsOrigin)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 transition-colors"
                title={`Driving route from ${currentLocality.shortName} to Lavanya Dental Clinic on Google Maps`}
              >
                <Navigation className="w-4 h-4 text-teal-600" />
                <span>Get Directions from {currentLocality.shortName}</span>
              </a>

              <button
                onClick={handleBookNow}
                className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-teal-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Book Appointment from {currentLocality.shortName}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Bottom Assurance Note */}
        <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed max-w-2xl mx-auto">
          Centrally located on PG Road, Secunderabad (beside Vysya Kalyana Mandapam, 500m from Paradise Metro). Walk-in emergencies and same-day appointments welcome daily. Call <a href="tel:+918555052843" className="font-bold text-teal-700 hover:underline">+91 8555052843</a>.
        </p>

      </div>
    </section>
  );
};
