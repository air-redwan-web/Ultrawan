
import React, { useState } from 'react';
import { ChatSession } from '../types.ts';
import Logo from './Logo.tsx';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onArchiveSession: (id: string) => void;
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
  onRenameSession,
  onArchiveSession,
  isOpen,
  onExportPDF
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const handleFinishEdit = (id: string) => {
    if (editValue.trim()) {
      onRenameSession(id, editValue.trim());
    }
    setEditingId(null);
  };

  const activeSessions = sessions.filter(s => !s.isArchived);
  const archivedSessions = sessions.filter(s => s.isArchived);

  return (
    <aside 
      className={`bg-[#09090b] border-r border-zinc-900 flex flex-col shrink-0 fluid-transition h-full overflow-hidden 
        fixed lg:static inset-y-0 left-0 z-[50] lg:z-auto
        ${isOpen ? 'w-[280px]' : 'w-0 -translate-x-full lg:translate-x-0 lg:opacity-0 pointer-events-none lg:pointer-events-auto'}
      `}
    >
      <div className="p-5 flex items-center gap-3 shrink-0">
        <Logo size={28} />
        <span className="font-black text-xs tracking-[0.2em] text-white">ULTRAWAN</span>
      </div>

      <div className="px-4 mb-6 space-y-2 shrink-0">
        <button 
          onClick={onNewSession}
          className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          New discussion
        </button>
        <button 
          onClick={onExportPDF}
          className="w-full py-2 px-4 border border-zinc-900 bg-zinc-900/30 hover:bg-zinc-900/50 text-zinc-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-wider active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          Make PDF / Print
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll px-3 space-y-1 pb-4">
        <div className="px-2 py-3 text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">Recent Contexts</div>
        {activeSessions.map((session) => (
          <div 
            key={session.id}
            className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 border ${
              activeSessionId === session.id 
                ? 'bg-[#121214] text-zinc-100 border-zinc-800 shadow-lg' 
                : 'text-zinc-500 hover:bg-[#121214]/50 hover:text-zinc-300 border-transparent'
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-opacity ${activeSessionId === session.id ? 'opacity-80' : 'opacity-40'}`}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            
            <div className="flex-1 min-w-0">
              {editingId === session.id ? (
                <input 
                  autoFocus
                  className="w-full bg-zinc-800 text-xs border-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-white"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleFinishEdit(session.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit(session.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="truncate text-xs font-medium tracking-tight">{session.title || 'Untitled Investigation'}</div>
              )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); handleStartEdit(session); }}
                className="p-1 hover:text-blue-400 transition-colors"
                title="Rename"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onArchiveSession(session.id); }}
                className="p-1 hover:text-amber-400 transition-colors"
                title="Archive"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                className="p-1 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        ))}

        {archivedSessions.length > 0 && (
          <div className="mt-6 border-t border-zinc-900/50 pt-4">
             <button 
              onClick={() => setShowArchived(!showArchived)}
              className="w-full flex items-center justify-between px-2 py-2 text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] hover:text-zinc-500 transition-colors"
             >
               <span>Archived Investigations</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${showArchived ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
             </button>
             
             {showArchived && (
               <div className="mt-2 space-y-1">
                 {archivedSessions.map((session) => (
                    <div 
                      key={session.id}
                      className="group flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-900/30 hover:text-zinc-400 transition-all border border-transparent cursor-pointer"
                      onClick={() => onSelectSession(session.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
                      <div className="truncate text-[11px] font-medium flex-1">{session.title}</div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onArchiveSession(session.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-400 transition-colors"
                        title="Unarchive"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 21V11"/><path d="m16 15-4-4-4 4"/><path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4"/><rect width="20" height="8" x="2" y="10" rx="2"/></svg>
                      </button>
                    </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-900 bg-[#09090b] shrink-0">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 px-2 py-2.5 rounded-xl hover:bg-zinc-900 hover:text-zinc-400 cursor-pointer transition-all mb-2 active:scale-95">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
           <span>Settings</span>
        </div>
        <div className="flex items-center gap-2 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.8)] animate-pulse"></div>
          <span className="text-[8px] text-zinc-700 font-mono tracking-widest uppercase font-black">Vault Status: Locked</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
