import React, { useState } from 'react';
import Logo from './Logo';

interface OnboardingProps {
  onComplete: (name: string) => void;
  email?: string;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, email }) => {
  const [name, setName] = useState('');

  const handleInit = () => {
    if (!name.trim()) return;
    onComplete(name);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#09090b]/90 backdrop-blur-xl animate-in fade-in duration-500 px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-md w-full px-8 py-12 glass rounded-[40px] border border-zinc-800 shadow-2xl z-10 text-center animate-in zoom-in-95 duration-500">
        <div className="flex items-center justify-center mb-10 mx-auto">
           <Logo size={64} />
        </div>
        
        <h1 className="text-2xl font-black tracking-tighter text-white mb-2 italic uppercase">Finalize Your Profile</h1>
        <p className="text-zinc-500 text-[11px] mb-10 leading-relaxed px-6">
          Hello! We detected a login for <span className="text-blue-400 font-mono font-bold uppercase">{email?.split('@')[0]}</span>. 
          Please set your preferred name to continue.
        </p>

        <div className="space-y-6">
          <div className="relative">
            <input 
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInit()}
              placeholder="Your Preferred Name"
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all text-center font-bold tracking-tight text-lg shadow-inner"
            />
          </div>

          <button 
            onClick={handleInit}
            disabled={!name.trim()}
            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-xl active:scale-95 ${
              name.trim() 
                ? 'bg-white text-black hover:bg-zinc-200' 
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            Start Investigation
          </button>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-2">
           <span className="text-[9px] text-zinc-600 font-mono tracking-[0.2em] uppercase">Simulated Persistence: Gmail Mapped</span>
           <span className="text-[8px] text-zinc-800 font-black uppercase tracking-widest">Powered by AIRSOFTS</span>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;