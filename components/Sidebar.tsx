
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onToggle: () => void;
  isOpen: boolean;
  onExportPDF: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewSession, 
  onDeleteSession,
  onToggle,
  isOpen,
  onExportPDF
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-[280px] h-full bg-[#0c0c0e] border-r border-zinc-800 flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-100 rounded flex items-center justify-center">
             <span className="text-black font-black text-lg">W</span>
          </div>
          <span className="font-bold tracking-tight text-zinc-200">ULTRAWAN</span>
        </div>
      </div>

      <div className="px-4 mb-4 space-y-2">
        <button 
          onClick={onNewSession}
          className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-black rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          New discussion
        </button>
        <button 
          onClick={onExportPDF}
          className="w-full py-2 px-4 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          Make PDF / Print
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-2 space-y-1">
        <div className="px-2 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recent Contexts</div>
        {sessions.map((session) => (
          <div 
            key={session.id}
            className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all ${
              activeSessionId === session.id 
                ? 'bg-zinc-800/50 text-zinc-100 border border-zinc-700/50 shadow-inner' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <div className="truncate text-sm font-medium flex-1">{session.title}</div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-800 space-y-3">
        <div className="flex items-center gap-3 text-xs text-zinc-500 px-2 py-1.5 rounded hover:bg-zinc-900 cursor-pointer">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
           <span>Settings</span>
        </div>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
            <span className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">Vault Status: Locked</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
