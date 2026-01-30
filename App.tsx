
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatSession, Role, User } from './types';
import { gemini } from './services/geminiService';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';

const STORAGE_KEY = 'ultrawan_sessions';
const USER_KEY = 'ultrawan_user';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Discussion',
      messages: [],
      lastUpdated: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, []);

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const handleExportPDF = () => {
    window.print();
  };

  const handleSendMessage = async (text: string, imageData?: { data: string; mimeType: string }) => {
    if (!activeSessionId) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: Role.USER,
      content: text,
      timestamp: Date.now(),
      image: imageData
    };

    const updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        const newTitle = s.messages.length === 0 ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : s.title;
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMsg],
          lastUpdated: Date.now()
        };
      }
      return s;
    });

    setSessions(updatedSessions);

    try {
      const currentSessionMessages = updatedSessions.find(s => s.id === activeSessionId)?.messages || [];
      const placeholderId = uuidv4();
      const modelPlaceholder: ChatMessage = {
        id: placeholderId,
        role: Role.MODEL,
        content: '',
        timestamp: Date.now(),
        thinking: 'Ultrawan is analyzing inputs...'
      };

      setSessions(prev => prev.map(s => 
        s.id === activeSessionId ? { ...s, messages: [...s.messages, modelPlaceholder] } : s
      ));

      let fullContent = '';
      const stream = gemini.streamResponse(currentSessionMessages);
      
      for await (const chunk of stream) {
        if (chunk) {
          fullContent += chunk;
          setSessions(prev => prev.map(s => 
            s.id === activeSessionId ? {
              ...s,
              messages: s.messages.map(m => m.id === placeholderId ? { ...m, content: fullContent, thinking: undefined } : m)
            } : s
          ));
        }
      }
    } catch (error) {
      console.error("Error in AI response stream", error);
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId ? {
          ...s,
          messages: s.messages.map(m => 
            m.role === Role.MODEL && m.content === '' 
            ? { ...m, content: "Neural link interrupted. Please retry the communication.", thinking: undefined } 
            : m
          )
        } : s
      ));
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden print:bg-white print:text-black">
      <style>{`
        @media print {
          header, aside, .input-area, .sidebar-toggle, .no-print { display: none !important; }
          main { width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .message-container { page-break-inside: avoid; border: 1px solid #ccc !important; background: white !important; color: black !important; }
          .user-label, .ai-label { color: #555 !important; }
          .messages-list { overflow: visible !important; height: auto !important; }
        }
      `}</style>
      
      <div className="no-print">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        <div className={`fixed md:relative z-30 h-full transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0'}`}>
          <Sidebar 
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={(id) => {
              setActiveSessionId(id);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            onNewSession={createNewSession}
            onDeleteSession={deleteSession}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isOpen={isSidebarOpen}
            onExportPDF={handleExportPDF}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col relative min-w-0">
        <div className="no-print">
          <Header 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen}
            activeTitle={activeSession?.title || 'Ultrawan'}
            user={user}
            onLogout={handleLogout}
          />
        </div>
        
        <div className="flex-1 overflow-hidden relative messages-list">
          {activeSession ? (
            <ChatInterface 
              messages={activeSession.messages} 
              onSendMessage={handleSendMessage}
              user={user}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">
              Select or create a discussion to begin.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
