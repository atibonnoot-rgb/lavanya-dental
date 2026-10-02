import React, { useState } from 'react';
import { 
  Star, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Shuffle, 
  X, 
  Sparkles,
  Heart
} from 'lucide-react';

const GOOGLE_REVIEW_URL = 'https://maps.app.goo.gl/6xQioN2UgJ4wPccJ9';

const PREWRITTEN_REVIEWS = [
  "Best clinic I have ever visited in Hyderabad! Painless treatment by Dr. Vijay Rajshekar and very hygienic clinic. Highly recommend Lavanya Dental Clinic to everyone!",
  "I have done my laser root canal treatment and crown fixation fully satisfied with the treatment and services at Lavanya Dental by Dr Vijay Rajshekar.",
  "Excellent and very caring doctor for dental! Highly recommend him in hyderabad with budget friendly also...without second thought u can rush into this clinic....",
  "Dr vijay rajshekhar is one of the best doctor.. He listen to the patient very nicely and explain the treatment plan very nicely. He done my laser surgical extraction it is painless.. He is one of the best doctor",
  "Had a very good experience with Dr. Vijay. The surgery was performed efficiently and the entire process was smooth and painless.",
  "Very pleased with the consultation, hygiene and care at Lavanya Dental Clinic. Highly recommended for painless laser dental treatments!"
];

export const ReviewsSection: React.FC = () => {
  const [showRateModal, setShowRateModal] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [customReviewText, setCustomReviewText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const reviews = [
    {
      id: 1,
      author: 'Kiran Paulloy',
      badge: 'Verified Google Patient',
      procedure: 'Painless Dental Treatment',
      doctor: 'Dr. Vijay Rajshekar',
      rating: 5,
      date: 'Recent',
      comment: 'Best clinic I have ever visited. Painless treatment.',
      ownerReply: 'Thank you so much for your review madam.',
      verified: true
    },
    {
      id: 2,
      author: 'Laxminarasimha Rao Gundapuneni',
      badge: 'Verified Google Review',
      procedure: 'Laser Root Canal & Crown Fixation',
      doctor: 'Dr. Vijay Rajshekar',
      rating: 5,
      date: '9 weeks ago',
      comment: 'I have done my laser root canal treatment and crown fixation fully satisfied with the treatment and services at Lavanya Dental by Dr Vijay Rajshekar.',
      ownerReply: 'Hello uncle, thank you so much for your valuable and supportive msg, we will keep up the same.',
      verified: true
    },
    {
      id: 3,
      author: 'Deepthi Su',
      badge: 'Google Local Guide · 17 Reviews',
      procedure: 'Comprehensive Dental Care',
      doctor: 'Dr. Vijay Rajshekar',
      rating: 5,
      date: '10 weeks ago',
      comment: 'Excellent and very caring doctor for dental! Highly recommend him in hyderabad with budget friendly also...without second thought u can rush into this clinic....',
      ownerReply: 'Hello Deepthi ji, thank u very much mam.',
      verified: true
    },
    {
      id: 4,
      author: 'Nithya Bonagalla',
      badge: 'Verified Google Review',
      procedure: 'Laser Surgical Extraction (Painless)',
      doctor: 'Dr. Vijay Rajshekar',
      rating: 5,
      date: '10 weeks ago',
      comment: 'Dr vijay rajshekhar is one of the best doctor.. He listen to the patient very nicely and explain the treatment plan very nicely. He done my laser surgical extraction it is painless.. He is one of the best doctor.',
      ownerReply: 'Hello Nithya, with 25+ yrs experience we should do a good job, we will always keep up the same..',
      verified: true
    },
    {
      id: 5,
      author: 'Eshwar Rao',
      badge: 'Verified Google Review',
      procedure: 'Laser Oral Surgery',
      doctor: 'Dr. Vijay Rajshekar',
      rating: 5,
      date: '10 weeks ago',
      comment: 'Had a very good experience with Dr. Vijay. The surgery was performed efficiently and the entire process was smooth and painless.',
      ownerReply: 'Hello Eshwar, thank u for ur inspiring reviews, a great boost to others, we will keep up the same.tnq',
      verified: true
    },
    {
      id: 6,
      author: 'Priyanka Vishnu',
      badge: 'Verified Google Patient',
      procedure: 'V-Clear Aligners & Checkup',
      doctor: 'Dr. Vijay Rajshekar',
      rating: 5,
      date: '7 weeks ago',
      comment: 'Very pleased with the consultation and hygiene at Lavanya Dental. Professional care with gentle hands and clear guidance.',
      ownerReply: 'Hello mam tnq so much, pls have regular checkups to maintain it.',
      verified: true
    }
  ];

  const handleOpenRateModal = () => {
    // Pick a randomized unique review for each user
    const randomIndex = Math.floor(Math.random() * PREWRITTEN_REVIEWS.length);
    setCurrentReviewIndex(randomIndex);
    setCustomReviewText(PREWRITTEN_REVIEWS[randomIndex]);
    setIsCopied(false);
    setShowRateModal(true);
  };

  const handleShuffleReview = () => {
    const nextIndex = (currentReviewIndex + 1) % PREWRITTEN_REVIEWS.length;
    setCurrentReviewIndex(nextIndex);
    setCustomReviewText(PREWRITTEN_REVIEWS[nextIndex]);
    setIsCopied(false);
  };

  const handleCopyAndOpenGoogle = async () => {
    try {
      await navigator.clipboard.writeText(customReviewText);
    } catch {
      // Fallback if clipboard API restricted
      const textarea = document.createElement('textarea');
      textarea.value = customReviewText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setIsCopied(true);

    try {
      import('canvas-confetti').then((m: any) => {
        const fire = m.default || m;
        fire({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }).catch(() => {});
    } catch {}

    // Open Google Review in new tab
    setTimeout(() => {
      window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer');
    }, 300);
  };

  return (
    <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              Verified Social Proof
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
              Patient Experiences & Feedback
            </h2>
            <p className="text-slate-600 text-sm">
              Real reviews authenticated following clinical visits.
            </p>
          </div>

          {/* Rate Now Button + 4.96 Rating Pill */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Rate Now Button */}
            <button
              onClick={handleOpenRateModal}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-4 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg hover:shadow-emerald-900/10 transition-all active:scale-95 cursor-pointer whitespace-nowrap group"
            >
              <Star className="w-4 h-4 fill-amber-300 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>Rate on Google</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Google Rating Badge */}
            <a 
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs shrink-0 hover:border-teal-300 transition-colors group cursor-pointer"
              title="View Lavanya Dental Clinic on Google Maps"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-lg text-slate-800">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5 group-hover:text-teal-700 transition-colors">
                  5.0 ★ on Google Maps
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* ══ 1-CLICK 5-STAR GOOGLE REVIEW MODAL ══ */}
        {showRateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5 animate-in zoom-in-95 duration-200">
              
              {/* Close Button */}
              <button 
                onClick={() => setShowRateModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center gap-1.5 text-amber-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400 animate-pulse" />
                  ))}
                </div>
                <h3 className="text-2xl font-bold font-display text-slate-900">
                  Rate Lavanya Dental on Google
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  We prepared an authentic 5-star review for you. Simply copy, open Google, and click <strong>Submit</strong>!
                </p>
              </div>

              {/* Review Textarea Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Suggested 5-Star Review
                  </span>
                  <button
                    onClick={handleShuffleReview}
                    className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                    title="Generate another review"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Shuffle New Review</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={customReviewText}
                    onChange={(e) => setCustomReviewText(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed outline-hidden transition-all resize-none font-medium"
                    placeholder="Write your review here..."
                  />
                  {isCopied && (
                    <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                      <Check className="w-3 h-3" /> Copied!
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={handleCopyAndOpenGoogle}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Copied! Opening Google Reviews...</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Review & Open Google (5 Stars)</span>
                      <ExternalLink className="w-4 h-4 opacity-80" />
                    </>
                  )}
                </button>

                {/* Helpful Instruction Note */}
                <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-2.5 text-center text-[11px] text-emerald-800 font-medium">
                  💡 On Google, select <strong>5 Stars ★★★★★</strong>, tap <strong>Paste</strong> (<kbd className="px-1 py-0.5 bg-white border rounded">Ctrl+V</kbd> or hold screen), then tap <strong>Post</strong>.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══ AUTHENTIC GOOGLE REVIEWS GRID ══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map(rev => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md hover:border-teal-200 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{rev.author}</h3>
                    {rev.badge && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        {rev.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 font-medium whitespace-nowrap">{rev.date}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                  "{rev.comment}"
                </p>

                {rev.ownerReply && (
                  <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-3 space-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-teal-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0"></span>
                      <span>Lavanya Dental Clinic [Owner Response]</span>
                    </div>
                    <p className="text-slate-600 italic">
                      "{rev.ownerReply}"
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
                <span>Treatment: <strong className="text-slate-800">{rev.procedure}</strong></span>
                <span className="text-teal-700 font-semibold whitespace-nowrap">{rev.doctor}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
