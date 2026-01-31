
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatSession, Role, AppMode, User } from './types.ts';
import { gemini } from './services/geminiService.ts';
import { storage } from './services/storageService.ts';
import Sidebar from './components/Sidebar.tsx';
import ChatInterface from './components/ChatInterface.tsx';
import Header from './components/Header.tsx';
import Onboarding from './components/Onboarding.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import VoiceChat from './components/VoiceChat.tsx';

interface ExtendedChatMessage extends ChatMessage {
  status?: 'thinking' | 'searching' | 'none';
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [hasMemoryAccess, setHasMemoryAccess] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<AppMode>('Standard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  const sessionsRef = useRef<ChatSession[]>([]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  const initApp = useCallback(async () => {
    setIsInitializing(true);
    
    const lastEmail = localStorage.getItem('ultrawan_last_login');
    if (lastEmail) {
      const registry = JSON.parse(localStorage.getItem('ultrawan_user_registry') || '{}');
      if (registry[lastEmail]) setCurrentUser(registry[lastEmail]);
    }
    
    const permitted = await storage.verifyPermission();
    if (permitted) {
      setHasMemoryAccess(true);
      const loadedSessions = await storage.loadAllSessions();
      setSessions(loadedSessions);
      if (loadedSessions.length > 0 && !activeSessionId) {
        const first = loadedSessions.find(s => !s.isArchived);
        if (first) setActiveSessionId(first.id);
      }
    }
    setIsInitializing(false);
  }, [activeSessionId]);

  useEffect(() => { initApp(); }, [initApp]);

  const createNewSession = useCallback(() => {
    const newId = uuidv4();
    const s: ChatSession = { id: newId, title: 'New Investigation', messages: [], lastUpdated: Date.now() };
    setSessions(prev => [s, ...prev]);
    setActiveSessionId(newId);
    if (hasMemoryAccess) storage.syncSession(s);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
    return newId;
  }, [hasMemoryAccess]);

  const handleSendMessage = async (text: string, mediaData?: { data: string; mimeType: string }) => {
    if (!text.trim() && !mediaData) return;
    let targetId = activeSessionId;
    let isNew = false;
    if (!targetId) {
      targetId = uuidv4();
      const newS: ChatSession = { id: targetId, title: text.slice(0, 30) || 'Investigation', messages: [], lastUpdated: Date.now() };
      setSessions(prev => [newS, ...prev]);
      setActiveSessionId(targetId);
      isNew = true;
    }

    const userMsg: ChatMessage = { id: uuidv4(), role: Role.USER, content: text, timestamp: Date.now(), media: mediaData };
    setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, userMsg], lastUpdated: Date.now(), title: s.messages.length === 0 ? (text.slice(0, 30) || 'Investigation') : s.title } : s));

    const placeholderId = uuidv4();
    try {
      const modelPlaceholder: ExtendedChatMessage = { id: placeholderId, role: Role.MODEL, content: '', timestamp: Date.now(), status: currentMode === 'Search' ? 'searching' : 'none', isStreaming: true };
      setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, modelPlaceholder] } : s));
      const activeSession = sessionsRef.current.find(s => s.id === targetId);
      const history = isNew ? [userMsg] : [...(activeSession?.messages || []), userMsg];
      let fullContent = '';
      let allSources: { uri: string; title: string }[] = [];
      const stream = gemini.streamResponse(history, currentMode);
      for await (const chunk of stream) {
        if (chunk.text) fullContent += chunk.text;
        if (chunk.sources) chunk.sources.forEach(src => { if (!allSources.find(s => s.uri === src.uri)) allSources.push(src); });
        setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: s.messages.map(m => m.id === placeholderId ? { ...m, content: fullContent, sources: allSources.length > 0 ? [...allSources] : m.sources, status: chunk.status || (fullContent ? 'none' : (m as any).status) } : m) } : s));
      }
      setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: s.messages.map(m => m.id === placeholderId ? { ...m, status: 'none', isStreaming: false } : m) } : s));
      const finalSession = sessionsRef.current.find(s => s.id === targetId);
      if (finalSession && hasMemoryAccess) storage.syncSession(finalSession);
    } catch (error: any) {
      setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: s.messages.map(m => m.id === placeholderId ? { ...m, content: "Anomaly encountered.", status: 'none', isStreaming: false } : m) } : s));
    }
  };

  const handleGoHome = () => {
    document.body.classList.remove('app-active');
  };

  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center bg-[#09090b]">
      <div className="w-10 h-10 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
    </div>;
  }

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden relative">
      {showLogin && <LoginScreen onLogin={(user) => { setCurrentUser(user); setShowLogin(false); setShowNameEntry(true); }} onCancel={() => setShowLogin(false)} />}
      {showNameEntry && <Onboarding onComplete={(name) => { if (currentUser) { const u = { ...currentUser, name }; setCurrentUser(u); const r = JSON.parse(localStorage.getItem('ultrawan_user_registry') || '{}'); r[u.email] = u; localStorage.setItem('ultrawan_user_registry', JSON.stringify(r)); localStorage.setItem('ultrawan_last_login', u.email); setShowNameEntry(false); } }} email={currentUser?.email} />}
      {showVoiceChat && <VoiceChat onClose={() => setShowVoiceChat(false)} userName={currentUser?.name || 'Guest'} />}

      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => { setActiveSessionId(id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
        onNewSession={createNewSession}
        onDeleteSession={async (id) => { setSessions(prev => prev.filter(s => s.id !== id)); if (activeSessionId === id) setActiveSessionId(null); if (hasMemoryAccess) await storage.deleteSession(id); }}
        onRenameSession={(id, title) => setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))}
        onArchiveSession={(id) => setSessions(prev => prev.map(s => s.id === id ? { ...s, isArchived: !s.isArchived } : s))}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onExportPDF={() => window.print()}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        <Header 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
          activeTitle={activeSession?.title || 'New Investigation'}
          userName={currentUser?.name || null}
          onLoginClick={() => setShowLogin(true)}
          onVoiceClick={() => setShowVoiceChat(true)}
          hasMemoryAccess={hasMemoryAccess}
          onMemoryConnected={() => { setHasMemoryAccess(true); initApp(); }}
          onGoHome={handleGoHome}
        />
        <div className="flex-1 overflow-hidden relative">
          <ChatInterface 
            messages={activeSession?.messages || []} 
            onSendMessage={handleSendMessage}
            userName={currentUser?.name || 'Guest'}
            currentMode={currentMode}
            onModeChange={setCurrentMode}
            onVoiceClick={() => setShowVoiceChat(true)}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
