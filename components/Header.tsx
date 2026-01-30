
import React, { useState } from 'react';
import { User } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  activeTitle: string;
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen, activeTitle, user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button 
          onClick={onToggleSidebar}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
          title="Toggle Sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
        </button>
        <div className="flex flex-col min-w-0">
          <h1 className="text-sm font-semibold truncate text-zinc-100">{activeTitle}</h1>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Secured Neural Link</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono">ENCRYPTED</span>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-700 hover:border-zinc-500 transition-all active:scale-95"
          >
            <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-56 glass border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
               <div className="px-3 py-3 border-b border-zinc-800/50 mb-1">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
               </div>
               <button 
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors text-left"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                 Sign Out
               </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
