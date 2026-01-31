
import React from 'react';
import { storage } from '../services/storageService';
import Logo from './Logo';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  activeTitle: string;
  userName: string | null;
  onLoginClick: () => void;
  onVoiceClick: () => void;
  hasMemoryAccess: boolean;
  onMemoryConnected: () => void;
  isLanding?: boolean;
  onLaunchApp?: () => void;
  onGoHome?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  activeTitle, 
  userName, 
  onLoginClick,
  onVoiceClick,
  hasMemoryAccess,
  onMemoryConnected,
  isLanding = false,
  onLaunchApp,
  onGoHome
}) => {
  const handleConnectMemory = async () => {
    try {
      // @ts-ignore
      if (!window.showDirectoryPicker) throw new Error("Folder access not supported.");
      // @ts-ignore
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await storage.setDirectory(handle);
      onMemoryConnected();
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      onMemoryConnected(); // Fallback to IndexedDB
    }
  };

  if (isLanding) {
    return (
      <header className="h-16 md:h-20 border-b border-zinc-900 flex items-center justify-between px-4 md:px-10 bg-[#09090b]/90 backdrop-blur-xl z-[100] sticky top-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Logo size={28} />
          <span className="font-black text-[11px] tracking-[0.4em] text-white uppercase hidden sm:block">ULTRAWAN</span>
        </div>

        <nav className="hidden lg:flex items-center gap-10">
          {['Features', 'Security', 'About', 'Developer'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {!userName && (
            <button onClick={onLoginClick} className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors px-4">
              Login
            </button>
          )}
          <button 
            onClick={onLaunchApp}
            className="px-6 py-2.5 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            {userName ? 'Launch Workspace' : 'Get Started'}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="h-14 md:h-16 border-b border-[#121214] flex items-center justify-between px-3 md:px-6 bg-[#09090b]/95 backdrop-blur-md shrink-0 no-print z-[40] sticky top-0">
      <div className="flex items-center gap-1 md:gap-4 overflow-hidden flex-1 mr-2">
        <button 
          onClick={onToggleSidebar} 
          className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 transition-colors shrink-0 active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        
        <button onClick={onGoHome} className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 transition-colors hidden sm:block" title="Exit to Website">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>

        <h1 className="text-[13px] md:text-sm font-bold text-zinc-200 tracking-tight truncate max-w-[140px] sm:max-w-xs lg:max-w-md">
          {activeTitle || 'New Investigation'}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        <button onClick={onVoiceClick} className="p-2 md:px-3 md:py-1.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all active:scale-90 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          <span className="hidden sm:inline text-[9px] font-black uppercase tracking-[0.2em]">Live</span>
        </button>

        <button onClick={handleConnectMemory} className="p-2 md:px-3 md:py-1.5 rounded-xl border border-zinc-900/50 bg-[#0d0d0f] transition-all active:scale-90 flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${hasMemoryAccess ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500'}`}></div>
           <span className="hidden xl:inline text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Vault</span>
        </button>

        {userName && (
          <div className="px-3 py-1.5 rounded-xl border border-zinc-900/50 bg-[#0d0d0f] flex items-center gap-2 max-w-[100px] sm:max-w-[150px]">
             <span className="text-[10px] font-black text-white truncate uppercase tracking-widest">{userName}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
