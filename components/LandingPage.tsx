
import React from 'react';
import { Language, translations } from '../translations';

interface LandingPageProps {
  onStart: () => void;
  lang: Language;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, lang }) => {
  const t = translations[lang];

  return (
    <div className="relative w-full h-full overflow-y-auto overflow-x-hidden bg-[#020617] text-white">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-8 pt-40 pb-32">
        {/* Hero Section */}
        <div className="text-center mb-32">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <i className="fas fa-sparkles"></i>
            Introducing AI Lineage
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black font-outfit tracking-tighter mb-8 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {t.landingHeroTitle}
          </h1>
          
          <p className="max-w-2xl mx-auto text-white/50 text-lg md:text-xl leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            {t.landingHeroSub}
          </p>

          <button 
            onClick={onStart}
            className="group relative px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-lg tracking-tight transition-all shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] active:scale-95 animate-in fade-in zoom-in-95 duration-1000 delay-700"
          >
            <span className="relative z-10 flex items-center gap-3">
              {t.getStarted}
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </span>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: 'fa-wand-magic-sparkles', title: t.featureAi, desc: t.featureAiDesc, color: 'text-purple-400' },
            { icon: 'fa-cube', title: t.featureVis, desc: t.featureVisDesc, color: 'text-blue-400' },
            { icon: 'fa-cloud-arrow-up', title: t.featureShare, desc: t.featureShareDesc, color: 'text-indigo-400' }
          ].map((feature, i) => (
            <div 
              key={i} 
              className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 animate-in fade-in slide-in-from-bottom-12 fill-mode-both"
              style={{ animationDelay: `${900 + (i * 150)}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-6 border border-white/5 group-hover:scale-110 transition-transform ${feature.color}`}>
                <i className={`fas ${feature.icon}`}></i>
              </div>
              <h3 className="text-xl font-bold mb-4 font-outfit">{feature.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Visual Teaser */}
        <div className="mt-40 relative rounded-3xl overflow-hidden aspect-video border border-white/10 group shadow-2xl animate-in fade-in duration-1000 delay-[1200ms]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10"></div>
          <div className="absolute inset-0 bg-blue-600/10 animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-12 backdrop-blur-md border border-white/10 rounded-full bg-white/5">
               <i className="fas fa-play text-4xl text-white/80"></i>
            </div>
          </div>
          {/* Mock Node cards floating in 3D space */}
          <div className="absolute inset-0 pointer-events-none opacity-20 transform-style-3d rotate-x-12">
            <div className="absolute top-[20%] left-[30%] w-48 h-20 bg-blue-500/20 border border-blue-400/30 rounded-xl blur-[1px]"></div>
            <div className="absolute top-[40%] right-[25%] w-48 h-20 bg-indigo-500/20 border border-indigo-400/30 rounded-xl blur-[1px]"></div>
            <div className="absolute bottom-[30%] left-[40%] w-48 h-20 bg-blue-500/20 border border-blue-400/30 rounded-xl blur-[1px]"></div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-tree text-[10px]"></i>
          </div>
          <span className="font-outfit font-black tracking-tighter text-lg">{t.appName}</span>
        </div>
        <div className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
          &copy; 2024 Phopo Ancestry. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
