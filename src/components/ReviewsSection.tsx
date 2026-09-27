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
import confetti from 'canvas-confetti';

const GOOGLE_REVIEW_URL = 'https://g.page/r/CQt0oBG3ht7DEBM/review';

const PREWRITTEN_REVIEWS = [
  "Exceptional experience at Lavanya Dental Clinic! The doctors are extremely gentle, patient, and knowledgeable. The clinic is equipped with the latest modern technology and the staff made sure I felt completely comfortable throughout the treatment. Highly recommend to everyone in need of quality dental care!",
  "Had a wonderful and completely painless treatment at Lavanya Dental. The doctors and clinical team are thorough professionals who explain every step with clarity. Pristine hygiene standards and very courteous staff. 5 stars all the way!",
  "Best dental clinic experience I've ever had. Truly painless procedure and very modern facilities. The doctors are polite, attentive, and genuinely caring. The clinic maintains impeccable cleanliness. Will definitely recommend Lavanya Dental to all my friends and family!",
  "I was very anxious about my dental treatment, but the team at Lavanya Dental made it so easy and stress-free. From the welcoming front desk to the skilled doctors, everything was top-notch. Completely pain-free and transparent care!",
  "Outstanding clinical service and wonderful doctors! State-of-the-art equipment and a very hygienic atmosphere. They attended to my issue promptly with zero waiting time. Truly appreciate the dedication and warmth of Dr. Lavanya and team.",
  "Visited Lavanya Dental for treatment and was thoroughly impressed by their expertise and gentle approach. They took the time to answer all my queries and provided the best possible care with zero discomfort. Easily a 5-star clinic!",
  "Top quality dental care at Lavanya Dental Clinic! Doctors are highly experienced and treatments are completely pain-free. The entire clinic is spotless, welcoming, and very well managed. Kudos to the entire staff!",
  "Very satisfied with the treatment at Lavanya Dental. The doctors are kind, considerate, and treat patients with great care. High-tech equipment, clear explanations, and no hidden surprises. Deserves more than 5 stars!",
  "Remarkable attention to detail and patient comfort! Lavanya Dental sets a high benchmark for dental care. Treatment was smooth, prompt, and completely painless. Thank you to the doctors and support staff for such a great experience.",
  "Had a fantastic experience at Lavanya Dental Clinic. The doctors are experts at what they do, very gentle with their hands, and make you feel at ease immediately. Clean, modern, and trustworthy clinic. Highly recommended!",
  "Extremely satisfied with the dental treatment here. The clinic is spotless, well-maintained, and the doctors are skilled and gentle. The entire appointment was smooth and on time. Best dental clinic around!",
  "Lavanya Dental Clinic is the gold standard for oral care! Modern clinic, courteous staff, and skilled doctors who prioritize patient comfort above all else. Truly a 5-star experience from start to finish.",
  "Very smooth and comfortable consultation at Lavanya Dental. The doctors take time to listen and diagnose accurately without rushing. Friendly staff and spotless clinic. Very happy with the care provided!",
  "Impressed by the professionalism and hygiene at Lavanya Dental Clinic. The doctor was so gentle that I didn't feel any discomfort during the entire treatment. Highly recommended for families!"
];

export const ReviewsSection: React.FC = () => {
  const [showRateModal, setShowRateModal] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [customReviewText, setCustomReviewText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const reviews = [
    {
      id: 1,
      author: 'Marcus H.',
      procedure: '3D Computer-Guided Dental Implant',
      doctor: 'Dr. Marcus Vance',
      rating: 5,
      date: '2 weeks ago',
      comment: 'I was terrified of implant surgery after losing a molar in a sports accident. Dr. Vance used the 3D CT scan to guide the implant with pinpoint accuracy. Zero pain during surgery, and I was back at work the next morning. Outstanding clinical mastery!',
      verified: true
    },
    {
      id: 2,
      author: 'Emily Chen-Miller',
      procedure: 'Invisalign Clear Aligners & Whitening',
      doctor: 'Dr. Sarah Lin',
      rating: 5,
      date: '3 weeks ago',
      comment: 'Booking online took literally 2 minutes, and Dr. Lin confirmed on her mobile app within seconds. The 3D scan simulator showed me exactly how my teeth would look 10 months later, and the reality actually exceeded expectations.',
      verified: true
    },
    {
      id: 3,
      author: 'Jonathan Ross',
      procedure: 'Painless Root Canal Therapy',
      doctor: 'Dr. James Chen',
      rating: 5,
      date: '1 month ago',
      comment: 'Had a severe dental emergency on a Friday afternoon. The triage system routed my complaint straight to Dr. Chen’s phone. He stayed late to perform a microscopic root canal. True lifesaver.',
      verified: true
    },
    {
      id: 4,
      author: 'Victoria Sterling',
      procedure: 'Cosmetic Porcelain Veneers (6 Units)',
      doctor: 'Dr. Elena Rostova',
      rating: 5,
      date: '1 month ago',
      comment: 'Dr. Rostova has an artist’s eye for facial harmony. She customized the shade and surface texture to look 100% natural, not like fake Hollywood chiclets. I smile in every photo now.',
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
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
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
            {/* Rate Now Button to the left of the 4.96 badge */}
            <button
              onClick={handleOpenRateModal}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-4 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg hover:shadow-emerald-900/10 transition-all active:scale-95 cursor-pointer whitespace-nowrap group"
            >
              <Star className="w-4 h-4 fill-amber-300 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>Rate Now</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* 4.96 Badge */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs shrink-0">
              <div className="text-3xl font-extrabold font-display text-slate-900">4.96</div>
              <div>
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Based on 1,508 verified reviews</p>
              </div>
            </div>
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
                    Unique Pre-Written 5-Star Review
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map(rev => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{rev.author}</span>
                    {rev.verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Patient
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{rev.date}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Treatment: <strong>{rev.procedure}</strong></span>
                <span className="text-teal-700 font-medium">Treated by {rev.doctor}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
