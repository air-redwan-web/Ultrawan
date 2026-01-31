
import React from 'react';
import { storage } from '../services/storageService';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  activeTitle: string;
  userName: string | null;
  onLoginClick: () => void;
  onVoiceClick: () => void;
  hasMemoryAccess: boolean;
  onMemoryConnected: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  activeTitle, 
  userName, 
  onLoginClick,
  onVoiceClick,
  hasMemoryAccess,
  onMemoryConnected
}) => {
  const handleConnectMemory = async () => {
    try {
      // @ts-ignore
      if (!window.showDirectoryPicker) {
        throw new Error("Local folder access is not supported by your browser.");
      }
      
      // @ts-ignore
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await storage.setDirectory(handle);
      onMemoryConnected();
    } catch (e: any) {
      if (e.name === 'AbortError') return;

      if (e.name === 'SecurityError' || e.message?.includes('Cross origin')) {
        alert("Security Restriction: Local folder access is blocked in this preview environment. Ultrawan will automatically use 'Secure Browser Storage' (IndexedDB) for your data instead. To use local folders, open this app in its own window.");
        onMemoryConnected(); // Proceed using the fallback mode
      } else {
        console.error("Memory vault connection failed:", e);
        alert(`Memory initialization issue: ${e.message}`);
      }
    }
  };

  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  return (
    <header className="h-14 md:h-16 border-b border-[#121214] flex items-center justify-between px-3 md:px-6 bg-[#09090b] shrink-0 no-print z-[30] sticky top-0">
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden flex-1">
        <button onClick={onToggleSidebar} className="p-2 md:p-2.5 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <h1 className="text-[12px] md:text-sm font-semibold text-zinc-300 tracking-tight truncate max-w-[120px] xs:max-w-[150px] sm:max-w-[300px] lg:max-w-[500px]">
          {activeTitle || 'New Investigation'}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
        <div className="flex items-center gap-1 group relative">
          <button 
            onClick={handleSelectKey}
            className="p-2 md:px-3 md:py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/20 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
            title="Configure Project Key"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4c.4.4 1 .4 1.4 0l4-4c.4-.4.4-1 0-1.4l-2-2c-.4-.4-1-.4-1.4 0L15 7.6V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2.6l-5 5V18Z"/><circle cx="17" cy="7" r="1"/></svg>
            <span className="hidden xl:inline text-[9px] font-black uppercase tracking-widest">Update Key</span>
          </button>
        </div>

        <button 
          onClick={onVoiceClick}
          className="p-2 md:px-3 md:py-1.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all group flex items-center gap-2"
          title="Voice Discovery Mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          <span className="hidden sm:inline lg:inline text-[9px] font-black uppercase tracking-widest">Live Voice</span>
        </button>

        <button 
          onClick={handleConnectMemory}
          className={`flex items-center gap-2 p-2 md:px-3 md:py-1.5 rounded-xl border border-zinc-900/50 bg-[#0d0d0f] transition-all group hover:border-zinc-700`}
          title={hasMemoryAccess ? 'Secure Memory Active' : 'Initialize Memory Vault'}
        >
           <div className={`w-1.5 h-1.5 rounded-full ${hasMemoryAccess ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
           <span className="text-[9px] font-black font-mono uppercase tracking-widest text-zinc-500 hidden xl:block">
             {hasMemoryAccess ? 'Vault' : 'Memory'}
           </span>
        </button>

        {userName ? (
          <div className="px-3 md:px-4 py-1.5 rounded-xl border border-zinc-900/50 bg-[#0d0d0f] flex items-center gap-2 max-w-[120px] md:max-w-[200px]">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
             <span className="text-[9px] md:text-[10px] font-black text-white font-mono tracking-[0.2em] uppercase truncate">{userName.toUpperCase()}</span>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="px-4 md:px-5 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
          >
             <span className="text-[9px] md:text-[10px] font-black font-mono tracking-[0.2em] uppercase">Login</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
