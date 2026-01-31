
import React from 'react';
import Logo from './Logo';

interface LandingPageProps {
  onLaunch: () => void;
  onLogin: () => void;
  isLoggedIn: boolean;
}

const FeatureCard = ({ icon, title, description }: any) => (
  <div className="p-8 rounded-[32px] bg-[#0d0d0f] border border-zinc-900 hover:border-zinc-700 transition-all group">
    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-6 group-hover:bg-white group-hover:text-black transition-all">
      {icon}
    </div>
    <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-3">{title}</h3>
    <p className="text-zinc-500 text-sm leading-relaxed font-medium">{description}</p>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch, onLogin, isLoggedIn }) => {
  return (
    <div className="flex-1 w-full flex flex-col items-center bg-[#09090b]">
      {/* Hero Section */}
      <section className="min-h-[85vh] w-full flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="text-center animate-reveal max-w-4xl z-10">
          <div className="flex justify-center mb-10">
            <div className="p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
              <Logo size={64} />
            </div>
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-8 italic uppercase leading-none">
            Your Neural <br /> Guardian.
          </h1>
          <p className="text-zinc-500 text-lg md:text-xl font-medium tracking-tight mb-12 max-w-2xl mx-auto leading-relaxed">
            Ultrawan is a world-class AI companion designed for deep investigation, high-density knowledge extraction, and absolute privacy.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={onLaunch}
              className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-[20px] font-black text-xs uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all active:scale-95 shadow-2xl"
            >
              {isLoggedIn ? 'Access Workspace' : 'Initialize Neural Link'}
            </button>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-10 py-5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-[20px] font-black text-xs uppercase tracking-[0.3em] hover:text-white hover:border-zinc-600 transition-all"
            >
              System Overview
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="w-full max-w-7xl px-6 py-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 mb-16">
          <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-4">Core Systems</h2>
          <p className="text-3xl font-black text-white tracking-tighter uppercase italic">Institutional Investigation Engine</p>
        </div>
        
        <FeatureCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
          title="Deep Search"
          description="Direct access to verified institutional data, academic records, and global news via neural grounding."
        />
        <FeatureCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>}
          title="Neural Voice"
          description="Real-time, human-like voice interaction for hands-free analysis and emotional support."
        />
        <FeatureCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4c.4.4 1 .4 1.4 0l4-4c.4-.4.4-1 0-1.4l-2-2c-.4-.4-1-.4-1.4 0L15 7.6V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2.6l-5 5V18Z"/><circle cx="17" cy="7" r="1"/></svg>}
          title="Secure Vault"
          description="Offline-first storage. Your sessions, logic, and investigation history never leave your device."
        />
      </section>

      {/* Security/Privacy Section */}
      <section id="security" className="w-full bg-[#0d0d0f] py-32 px-6 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">End-to-End Privacy</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-8 uppercase italic">Absolute Neural Sovereignty.</h2>
          <p className="text-zinc-500 text-lg font-medium leading-relaxed mb-12">
            Ultrawan is built on the philosophy of user-owned data. By leveraging IndexedDB and the File System Access API, we ensure that your investigations are locally encrypted and accessible even without a network connection.
          </p>
        </div>
      </section>

      {/* Developer Section */}
      <section id="developer" className="w-full py-32 px-6 flex flex-col items-center border-t border-zinc-900">
        <div className="max-w-2xl text-center">
          <h2 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.6em] mb-10">Neural Architect</h2>
          <div className="flex flex-col items-center gap-6">
             <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
               <span className="text-3xl font-black text-white italic">AI</span>
             </div>
             <div>
               <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-1">Asraful Islam Redwan</h3>
               <p className="text-blue-500 text-[11px] font-black uppercase tracking-[0.3em]">Lead Developer • AIRSOFTS</p>
             </div>
             <p className="text-zinc-500 text-sm font-medium leading-relaxed mt-4">
               Engineering the future of personal AI companions. Dedicated to privacy, performance, and institutional data transparency.
             </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-20 px-6 border-t border-zinc-900 bg-[#0d0d0f]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <span className="text-[11px] font-black text-white tracking-[0.5em] uppercase">Ultrawan</span>
          </div>
          
          <div className="flex gap-8">
            {['Twitter', 'GitHub', 'LinkedIn'].map(social => (
              <a key={social} href="#" className="text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-widest">{social}</a>
            ))}
          </div>
          
          <p className="text-[10px] font-mono text-zinc-800 tracking-widest uppercase">© 2025 AIRSOFTS. ALL SYSTEMS OPERATIONAL.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
