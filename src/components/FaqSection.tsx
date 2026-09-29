import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  Search, 
  Sparkles, 
  PhoneCall, 
  MessageSquare,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export interface FAQItem {
  id: string;
  category: 'General' | 'Treatments' | 'Costs & Insurance' | 'Appointments';
  question: string;
  answer: string;
}

export const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'General',
    question: 'Why is Lavanya Dental Clinic considered the best dental clinic in Hyderabad & Secunderabad?',
    answer: 'Lavanya Dental Clinic is led by Dr. Vijay Rajshekar (BDS, MDS) with over 25+ years of distinguished clinical experience in laser endodontics, dental implants, oral surgeries, and invisible aligners. With 1,240+ verified 5-star Google reviews (4.9 rating), hospital-grade Class-B autoclave sterilization, 3D digital intraoral scanning, and an empathetic pain-free approach, we deliver world-class clinical outcomes at affordable, transparent prices on PG Road, Secunderabad.'
  },
  {
    id: 'faq-2',
    category: 'Treatments',
    question: 'Are root canal treatments painful at Lavanya Dental Clinic?',
    answer: 'No! At Lavanya Dental Clinic, we specialize in 100% painless laser-assisted root canal therapy. Using advanced computerized apex locators, micro-rotary instruments, and Biolase Diode lasers, the infection is thoroughly sterilized without trauma. Most patients report zero discomfort during the procedure and can comfortably resume their normal routine the next morning.'
  },
  {
    id: 'faq-post-root-canal',
    category: 'Treatments',
    question: 'Post Root Canal Instructions',
    answer: `1. Post the root canal, you may have discomfort/pain, which is normal and should subside in few days.

Follow up your root canal with any medication as prescribed by your doctor, do not skip medication even when no pain as some medication is for healing /reducing inflamation.

2. Practice good oral hygiene, continue regular brushing and flossing.

3. Avoid hard food (any food with crackling noise like almonds, nuts etc) till it is capped.

4. Have soft food to avoid any stress on the tooth.

5. Your root canaled tooth, which will need to be covered by a cap eventually (usually 10-15 days after last sitting).

A cap is a very integral part of the root canal as it protects the hollow tooth and gives the tooth strength to bear chewing forces.

A root canal is INCOMPLETE without a cap which is important for its seal and strength.

If not covered with a cap, any of the following complications can occur:
a. Re-infection of the root canal tooth due to leakage of filling /tooth, ultimately whole root canal to be retreated.
b. Fracture of the tooth structure to even softest of food as micro cracks develop over a period of time.`
  },
  {
    id: 'faq-3',
    category: 'Treatments',
    question: 'How much do dental implants cost in Hyderabad, and how long do they last?',
    answer: 'Dental implants are the permanent, gold-standard solution for missing teeth. In Hyderabad, dental implant costs typically range based on the implant system (US FDA-approved titanium implants such as Nobel Biocare, Straumann, or Osstem) and whether bone grafting or immediate loading is required. At Lavanya Dental Clinic, our implant restorations are computer-guided using 3D CBCT imaging, ensuring lifelong durability, natural chewing power, and seamless aesthetics with warranty-backed Zirconia crowns.'
  },
  {
    id: 'faq-4',
    category: 'Treatments',
    question: 'What is the difference between invisible aligners and traditional braces?',
    answer: 'Traditional braces use metal brackets and archwires to gradually shift teeth, which can cause mouth sores and require dietary restrictions. Invisible aligners (such as V-Clear and Invisalign) are custom 3D-printed transparent trays that are virtually undetectable, completely removable for meals and brushing, and align teeth 30% faster with fewer clinic visits. Dr. Vijay Rajshekar is a certified specialist in custom digital aligner planning.'
  },
  {
    id: 'faq-5',
    category: 'Appointments',
    question: 'Where is Lavanya Dental Clinic located, and how do I reach from Begumpet or Banjara Hills?',
    answer: 'Lavanya Dental Clinic is centrally located on PG Road (Penderghast Road), Secunderabad, Hyderabad 500003, near Vysya Kalyana Mandapam and Sindhi Colony. We are only 5 minutes from Paradise Metro Station and SP Road, 7 minutes from Begumpet via the flyover, and 12-15 minutes from Banjara Hills and Somajiguda. Free dedicated patient parking is available directly at the clinic.'
  },
  {
    id: 'faq-6',
    category: 'Appointments',
    question: 'Is Lavanya Dental Clinic open on Sundays and public holidays for dental emergencies?',
    answer: 'Yes. Regular clinic operating hours are Monday through Saturday from 10:30 AM to 8:30 PM, and Sundays from 11:00 AM to 1:00 PM. We also provide dedicated emergency appointments and a 24/7 Dental Emergency Triage Hotline (+91 8555052843) for acute toothaches, chipped/knocked-out teeth, facial swelling, or broken dental bridges.'
  },
  {
    id: 'faq-7',
    category: 'Costs & Insurance',
    question: 'Do you offer transparent pricing, dental insurance assistance, and 0% interest EMI options?',
    answer: 'Absolutely. We believe in 100% transparent healthcare with zero hidden costs. Before beginning any procedure, you receive an itemized treatment estimate. We accept all major credit/debit cards, UPI, and bank transfers, and offer flexible 0% interest monthly EMI plans for high-value treatments like dental implants, full smile makeovers, and clear aligners. We also assist with documentation for dental insurance claims.'
  },
  {
    id: 'faq-8',
    category: 'General',
    question: 'What sterilization and infection control protocols are followed at Lavanya Dental?',
    answer: 'Patient safety is our top priority. We follow strict 6-stage hospital-grade sterilization protocols compliant with CDC (USA) and ADA standards. All surgical and dental handpieces undergo ultrasonic cleaning, vacuum sealing in medical-grade pouches, and high-pressure Class-B autoclave sterilization with spore testing. Treatment rooms, dental chairs, and surfaces are thoroughly disinfected between every single patient.'
  },
  {
    id: 'faq-9',
    category: 'General',
    question: 'How can international and NRI patients plan dental treatment in Hyderabad (Dental Tourism)?',
    answer: 'We provide an exclusive Dental Concierge service for NRI and international patients from the USA, UK, UAE, Australia, and Africa. You can send your dental X-rays (OPG/CBCT) via WhatsApp (+91 8555052843) for a pre-travel diagnosis and estimated quote. Once you arrive at RGIA Airport (35 mins away via PVNR Expressway), we schedule priority appointments to complete your full smile makeover, crowns, or implants within 3 to 5 days.'
  },
  {
    id: 'faq-10',
    category: 'Appointments',
    question: 'How do I book an instant consultation with Dr. Vijay Rajshekar?',
    answer: 'You can book your appointment online in just 30 seconds using our real-time booking engine on this website. You can also call directly at +91 8555052843 or message us on WhatsApp. You will receive an instant appointment confirmation with date, time, and doctor calendar sync.'
  }
];

export const FaqSection: React.FC = () => {
  const { setShowBookingModal } = useClinic();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqIds, setOpenFaqIds] = useState<Set<string>>(new Set(['faq-1', 'faq-2']));

  const categories = ['ALL', 'General', 'Treatments', 'Costs & Insurance', 'Appointments'];

  const toggleFaq = (id: string) => {
    setOpenFaqIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredFaqs = FAQ_DATA.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="faq" className="py-16 sm:py-24 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/40 border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>Patient Knowledge &amp; Search Guide</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-display">
            Frequently Asked Questions <br />
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Hyderabad Dental Care Guide
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Get clear, verified answers to common questions about laser root canals, dental implants, costs, insurance, and clinic timings.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-4 mb-10">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search any dental question (e.g. root canal pain, implant cost, Sunday timings)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Questions' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 text-slate-500">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">No matching questions found.</p>
              <p className="text-xs text-slate-500 mt-1">Have a specific question? Call us directly at +91 8555052843.</p>
            </div>
          ) : (
            filteredFaqs.map(faq => {
              const isOpen = openFaqIds.has(faq.id);
              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? 'border-teal-400 shadow-md ring-1 ring-teal-400/20' 
                      : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full text-left px-5 sm:px-6 py-4.5 flex items-center justify-between gap-4 select-none group"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0">
                        ?
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 group-hover:text-teal-600 ${
                        isOpen ? 'rotate-180 text-teal-600' : ''
                      }`} 
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40 whitespace-pre-line">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still have questions? CTA strip */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 font-display">
              Have a clinical question not answered here?
            </h4>
            <p className="text-xs text-slate-500">
              Speak directly with our clinical desk or send an inquiry via WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:9885611128"
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>Call Clinic</span>
            </a>
            <button
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
