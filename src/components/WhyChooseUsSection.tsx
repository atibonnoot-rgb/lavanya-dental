import React from 'react';
import { 
  Award, 
  Sparkles, 
  Zap, 
  HeartHandshake,
  Star
} from 'lucide-react';

export const WhyChooseUsSection: React.FC = () => {
  const metrics = [
    {
      value: '25+ Years',
      label: 'Clinical Mastery',
      sub: 'Led by Dr. Vijay Rajshekar (BDS, MDS)',
      icon: Award,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      value: '4.9 ★',
      label: 'Google Rating',
      sub: '1,240+ verified patient reviews',
      icon: Star,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      value: '100% Painless',
      label: 'Laser Protocols',
      sub: 'Biolase Diode laser & micro-drill',
      icon: Zap,
      color: 'text-teal-600 bg-teal-50 border-teal-200'
    },
    {
      value: '15,000+',
      label: 'Smiles Restored',
      sub: 'Patients across Hyderabad & globally',
      icon: HeartHandshake,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    }
  ];

  return (
    <section id="why-choose-us" className="py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>The Gold Standard in Dental Excellence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-display">
            Why Patients Rank Lavanya Dental <br />
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              #1 in Hyderabad &amp; Secunderabad
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            From pain-free laser technology and 3D digital imaging to over two decades of surgical expertise, see why thousands of families trust Lavanya Dental Clinic over standard clinics.
          </p>
        </div>

        {/* 4 Trust Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div 
                key={idx}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md shadow-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${m.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900 font-display">
                  {m.value}
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {m.label}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {m.sub}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
