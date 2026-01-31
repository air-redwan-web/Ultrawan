
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
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Handle responsiveness on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initApp = useCallback(async () => {
    setIsInitializing(true);
    
    // 1. Check Login Status
    const lastEmail = localStorage.getItem('ultrawan_last_login');
    if (lastEmail) {
      const registry = JSON.parse(localStorage.getItem('ultrawan_user_registry') || '{}');
      if (registry[lastEmail]) {
        setCurrentUser(registry[lastEmail]);
      }
    }
    
    // 2. Check Memory Access
    const permitted = await storage.verifyPermission();
    if (permitted) {
      setHasMemoryAccess(true);
      const loadedSessions = await storage.loadAllSessions();
      setSessions(loadedSessions);
      if (loadedSessions.length > 0 && !activeSessionId) {
        const firstNonArchived = loadedSessions.find(s => !s.isArchived);
        if (firstNonArchived) setActiveSessionId(firstNonArchived.id);
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

  const handleRenameSession = async (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    const target = sessionsRef.current.find(s => s.id === id);
    if (target && hasMemoryAccess) {
      storage.syncSession({ ...target, title: newTitle });
    }
  };

  const handleArchiveSession = async (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isArchived: !s.isArchived } : s));
    const target = sessionsRef.current.find(s => s.id === id);
    if (target && hasMemoryAccess) {
      storage.syncSession({ ...target, isArchived: !target.isArchived });
    }
    if (activeSessionId === id) setActiveSessionId(null);
  };

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

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: Role.USER,
      content: text,
      timestamp: Date.now(),
      media: mediaData
    };

    setSessions(prev => prev.map(s => 
      s.id === targetId ? { 
        ...s, 
        messages: [...s.messages, userMsg], 
        lastUpdated: Date.now(),
        title: s.messages.length === 0 ? (text.slice(0, 30) || 'Investigation') : s.title
      } : s
    ));

    const placeholderId = uuidv4();
    try {
      const modelPlaceholder: ExtendedChatMessage = { 
        id: placeholderId, 
        role: Role.MODEL, 
        content: '', 
        timestamp: Date.now(),
        status: currentMode === 'Search' ? 'searching' : 'none',
        isStreaming: true
      };
      
      setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, modelPlaceholder] } : s));

      const activeSession = sessionsRef.current.find(s => s.id === targetId);
      const history = isNew ? [userMsg] : [...(activeSession?.messages || []), userMsg];
      
      let fullContent = '';
      let allSources: { uri: string; title: string }[] = [];
      const stream = gemini.streamResponse(history, currentMode);
      
      for await (const chunk of stream) {
        if (chunk.text) fullContent += chunk.text;
        if (chunk.sources) {
          chunk.sources.forEach(src => {
            if (!allSources.find(s => s.uri === src.uri)) allSources.push(src);
          });
        }

        setSessions(prev => prev.map(s => s.id === targetId ? {
          ...s,
          messages: s.messages.map(m => {
            if (m.id === placeholderId) {
              const extendedM = m as ExtendedChatMessage;
              return { 
                ...extendedM, 
                content: fullContent, 
                sources: allSources.length > 0 ? [...allSources] : m.sources,
                status: chunk.status || (fullContent ? 'none' : extendedM.status)
              };
            }
            return m;
          })
        } : s));
      }

      setSessions(prev => prev.map(s => s.id === targetId ? {
        ...s,
        messages: s.messages.map(m => m.id === placeholderId ? { ...m, status: 'none', isStreaming: false } : m)
      } : s));

      const finalSession = sessionsRef.current.find(s => s.id === targetId);
      if (finalSession && hasMemoryAccess) storage.syncSession(finalSession);

    } catch (error: any) {
      console.error("Ultrawan AI Error:", error);
      let errorMsg = "The investigator encountered an anomaly. Please retry.";
      const errStr = JSON.stringify(error);
      if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
        errorMsg = "Ultrawan Quota Exhausted. Global capacity has been reached. Please select your own API key in the header to continue.";
      }
      
      setSessions(prev => prev.map(s => s.id === targetId ? {
        ...s,
        messages: s.messages.map(m => m.id === placeholderId ? { 
          ...m, 
          content: errorMsg,
          status: 'none',
          isStreaming: false
        } : m)
      } : s));
    }
  };

  const handleImageAction = async (prompt: string, sourceImage?: { data: string; mimeType: string }) => {
    if (!prompt.trim()) return;
    let targetId = activeSessionId || createNewSession();
    const userMsg: ChatMessage = { id: uuidv4(), role: Role.USER, content: prompt, timestamp: Date.now(), media: sourceImage };
    setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, userMsg], lastUpdated: Date.now() } : s));
    const placeholderId = uuidv4();
    const modelPlaceholder: ExtendedChatMessage = { id: placeholderId, role: Role.MODEL, content: '', timestamp: Date.now(), status: 'thinking', isStreaming: true };
    setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, modelPlaceholder] } : s));
    try {
      const result = await gemini.generateImage(prompt, sourceImage);
      setSessions(prev => prev.map(s => s.id === targetId ? {
        ...s,
        messages: s.messages.map(m => m.id === placeholderId ? {
          ...m,
          content: result.text || "Visual request processed.",
          media: { data: result.data, mimeType: result.mimeType },
          status: 'none',
          isStreaming: false
        } : m)
      } : s));
      const finalSession = sessionsRef.current.find(s => s.id === targetId);
      if (finalSession && hasMemoryAccess) storage.syncSession(finalSession);
    } catch (error: any) {
      setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: s.messages.map(m => m.id === placeholderId ? { ...m, content: "Failed to generate image.", status: 'none', isStreaming: false } : m) } : s));
    }
  };

  const handleGoogleLogin = (user: User) => {
    const registry = JSON.parse(localStorage.getItem('ultrawan_user_registry') || '{}');
    const existingUser = registry[user.email];
    localStorage.setItem('ultrawan_last_login', user.email);
    if (existingUser && existingUser.name) {
      setCurrentUser(existingUser);
      setShowLogin(false);
    } else {
      setCurrentUser(user);
      setShowLogin(false);
      setShowNameEntry(true);
    }
  };

  const handleSetName = (name: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, name };
      setCurrentUser(updatedUser);
      const registry = JSON.parse(localStorage.getItem('ultrawan_user_registry') || '{}');
      registry[updatedUser.email] = updatedUser;
      localStorage.setItem('ultrawan_user_registry', JSON.stringify(registry));
      setShowNameEntry(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
    if (hasMemoryAccess) await storage.deleteSession(id);
  };

  if (isInitializing) {
    return (
      <div className="flex h-screen bg-[#09090b] items-center justify-center p-6">
         <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-2 border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black tracking-[0.4em] text-zinc-500 uppercase animate-pulse">Initializing Ultrawan Core...</p>
         </div>
      </div>
    );
  }

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden relative">
      {showLogin && <LoginScreen onLogin={handleGoogleLogin} onCancel={() => setShowLogin(false)} />}
      {showNameEntry && <Onboarding onComplete={handleSetName} email={currentUser?.email} />}
      {showVoiceChat && <VoiceChat onClose={() => setShowVoiceChat(false)} userName={currentUser?.name || 'Guest'} />}

      {isSidebarOpen && window.innerWidth < 1024 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40]" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => { setActiveSessionId(id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
        onNewSession={createNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onArchiveSession={handleArchiveSession}
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
        />
        <div className="flex-1 overflow-hidden relative">
          <ChatInterface 
            messages={activeSession?.messages || []} 
            onSendMessage={handleSendMessage}
            onImageAction={handleImageAction}
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
