import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Check, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { BEFORE_AFTER_CASES } from '../data/mockData';
import { BeforeAfterCase } from '../types';

export const BeforeAfterGallery: React.FC = () => {
  const [cases] = useState<BeforeAfterCase[]>(() => {
    const saved = localStorage.getItem('auradental_before_after_v1');
    return saved ? JSON.parse(saved) : BEFORE_AFTER_CASES;
  });
  const [activeCaseIndex, setActiveCaseIndex] = useState<number>(0);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100

  const activeIndex = activeCaseIndex >= cases.length ? 0 : activeCaseIndex;
  const currentCase = cases[activeIndex] || BEFORE_AFTER_CASES[0];

  return (
    <section id="gallery" className="py-16 sm:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Documented Clinical Transformations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
            Before & After Smile Restoration Gallery
          </h2>
          <p className="text-slate-600 text-base">
            Real patient outcomes achieved by our clinical faculty. All cases presented with explicit HIPAA compliance consent waivers.
          </p>
        </div>

        {/* Interactive Comparison Component */}
        <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-lg max-w-5xl mx-auto">
          
          {/* Case selector pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            {cases.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCaseIndex(idx);
                  setSliderPosition(50);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeIndex === idx
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {c.category}: {c.title.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Split Image Comparison Slider */}
            <div className="lg:col-span-7">
              <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-md select-none border-2 border-white bg-slate-900">
                {/* After Image (Full background) */}
                <img
                  src={currentCase.afterImage}
                  alt={`After Treatment: ${currentCase.title}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md z-10">
                  AFTER TREATMENT
                </span>

                {/* Before Image (Clipped overlay) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={currentCase.beforeImage}
                    alt={`Before Treatment: ${currentCase.title}`}
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{ width: '100%', minWidth: '100%', height: '100%' }}
                  />
                  <span className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md z-10">
                    BEFORE
                  </span>
                </div>

                {/* Draggable Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-2xl"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-teal-800 shadow-xl flex items-center justify-center border-2 border-teal-600">
                    <span className="text-xs font-black">⇄</span>
                  </div>
                </div>

                {/* Native Range input overlaid for smooth touch/drag */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
                  aria-label="Before and after comparison slider"
                />
              </div>

              <p className="text-center text-xs text-slate-400 mt-3">
                Drag slider left or right to compare smile transformation
              </p>
            </div>

            {/* Case Clinical Details */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentCase.consentBadge}</span>
              </div>

              <h3 className="text-2xl font-bold font-display text-slate-900 leading-snug">
                {currentCase.title}
              </h3>

              <div className="space-y-1 text-xs text-slate-600">
                <p><strong>Treating Specialist:</strong> {currentCase.doctorName}</p>
                <p><strong>Clinical Timeline:</strong> {currentCase.duration}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200/80">
                {currentCase.description}
              </p>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Clinical Outcomes Achieved:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {currentCase.results.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
