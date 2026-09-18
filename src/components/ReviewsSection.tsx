import React, { useState } from 'react';
import { Star, CheckCircle2, ThumbsUp, MessageSquare } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
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

          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
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
