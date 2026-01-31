
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Role, AppMode } from '../types.ts';
import Message from './Message.tsx';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, mediaData?: { data: string; mimeType: string }) => void;
  onImageAction?: (prompt: string, sourceImage?: { data: string; mimeType: string }) => void;
  userName: string;
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onVoiceClick?: () => void;
}

const SUPPORTED_MIME_TYPES = [
  'image/png', 
  'image/jpeg', 
  'image/webp', 
  'image/heic', 
  'image/heif'
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  onImageAction,
  userName,
  currentMode,
  onModeChange,
  onVoiceClick
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  const isLanding = messages.length === 0;
  
  // Detect if the latest model message is still being updated (streaming)
  const lastMessage = messages[messages.length - 1];
  const isStreaming = lastMessage?.role === Role.MODEL && lastMessage.content.length > 0 && !lastMessage.id.includes('placeholder');

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 110)}px`;
    }
  }, [inputValue]);

  // Handle auto-scroll logic with a "pinned" behavior
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: isStreaming ? 'auto' : 'smooth'
      });
    }
  }, [messages, autoScroll, isStreaming]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Check if user has scrolled away from the bottom (with a threshold)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    // If user manually scrolls up, disable auto-scroll
    if (autoScroll && !isAtBottom) {
      setAutoScroll(false);
    }
    // If user manually scrolls back to bottom, re-enable auto-scroll
    if (!autoScroll && isAtBottom) {
      setAutoScroll(true);
    }
  };

  const scrollToBottom = () => {
    setAutoScroll(true);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text && !selectedMedia) return;
    
    onSendMessage(text, selectedMedia || undefined);
    setInputValue('');
    setSelectedMedia(null);
    setIsPlusMenuOpen(false);
    setAutoScroll(true);
  };

  const handleCopyInput = () => {
    if (!inputValue.trim()) return;
    navigator.clipboard.writeText(inputValue);
    setCopiedInput(true);
    setTimeout(() => setCopiedInput(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
        alert("Unsupported image type.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setSelectedMedia({ data: base64Data, mimeType: file.type, name: file.name });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
    setIsPlusMenuOpen(false);
  };

  const handleImageButtonClick = async () => {
    if (!inputValue.trim()) {
      alert(selectedMedia ? "Please describe the edits you want to make." : "Please describe the image you want to create.");
      return;
    }

    if (onImageAction) {
      await onImageAction(inputValue.trim(), selectedMedia || undefined);
      setInputValue('');
      setSelectedMedia(null);
      setAutoScroll(true);
    }
  };

  const getPlaceholder = () => {
    switch (currentMode) {
      case 'Search': return 'Search the web';
      case 'Research': return 'What are you researching?';
      case 'Thinking': return 'Thinking...';
      case 'Shopping': return 'Shopping search...';
      default: return 'Ask anything';
    }
  };

  const getModeLabel = () => {
    switch (currentMode) {
      case 'Search': return 'Search';
      case 'Research': return 'Research';
      case 'Thinking': return 'Think';
      case 'Shopping': return 'Shopping';
      case 'Engineering': return 'Study';
      default: return '';
    }
  };

  const getModeIcon = () => {
    switch (currentMode) {
      case 'Search': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
      case 'Research': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
      case 'Thinking': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
      case 'Engineering': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6.5 18H20"/></svg>;
      default: return null;
    }
  };

  const PlusMenuOption = ({ icon, label, onClick, sub = false, more = false }: any) => (
    <button 
      type="button" 
      onClick={onClick} 
      className={`w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors group ${sub ? 'pl-8' : ''}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-zinc-400 group-hover:text-zinc-100">{icon}</span>
        <span className="text-zinc-200">{label}</span>
      </div>
      {more && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>}
    </button>
  );

  const renderInputArea = (centered: boolean) => (
    <div className={`w-full max-w-2xl px-4 transition-all duration-700 mx-auto`}>
      {centered && (
        <h2 className="text-xl md:text-2xl font-medium text-white mb-8 text-center tracking-tight animate-reveal">
          What are you working on?
        </h2>
      )}

      <form onSubmit={handleSubmit} className="w-full relative">
        {selectedMedia && (
          <div className="absolute bottom-full mb-3 left-0 animate-reveal">
            <div className="relative p-1 bg-[#1e1e1e] border border-zinc-800 rounded-xl shadow-2xl">
              <img src={`data:${selectedMedia.mimeType};base64,${selectedMedia.data}`} className="h-14 w-14 object-cover rounded-lg" alt="Preview" />
              <button type="button" onClick={() => setSelectedMedia(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-0.5 rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        )}

        <div className={`bg-[#212121] rounded-2xl p-1.5 flex items-end gap-1 transition-all border border-zinc-700/50 focus-within:border-zinc-500 shadow-2xl overflow-visible`}>
          <div className="flex items-center gap-1 relative" ref={plusMenuRef}>
            <input type="file" ref={fileInputRef} className="hidden" accept={SUPPORTED_MIME_TYPES.join(',')} onChange={handleFileChange} />
            <button 
              type="button"
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            </button>

            {isPlusMenuOpen && (
              <div className="absolute bottom-full mb-3 left-0 bg-[#1f1f1f] border border-zinc-800 rounded-xl py-1 w-56 shadow-2xl animate-reveal z-[100] text-sm">
                <PlusMenuOption 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>}
                  label="Photos & files"
                  onClick={() => fileInputRef.current?.click()}
                />
                <PlusMenuOption 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>}
                  label="AI Vision"
                  onClick={() => { handleImageButtonClick(); setIsPlusMenuOpen(false); }}
                />
                <PlusMenuOption 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
                  label="Thinking"
                  onClick={() => { onModeChange('Thinking'); setIsPlusMenuOpen(false); }}
                />
                <PlusMenuOption 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                  label="Research"
                  onClick={() => { onModeChange('Research'); setIsPlusMenuOpen(false); }}
                />
                <div className="relative">
                  <button 
                    type="button"
                    onMouseEnter={() => setShowMoreMenu(true)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 group-hover:text-zinc-100"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></span>
                      <span className="text-zinc-200">More</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                  {showMoreMenu && (
                    <div 
                      onMouseLeave={() => setShowMoreMenu(false)}
                      className="absolute left-full bottom-0 ml-1 bg-[#1f1f1f] border border-zinc-800 rounded-xl py-1 w-40 shadow-2xl animate-reveal"
                    >
                      <PlusMenuOption label="Study" onClick={() => { onModeChange('Engineering'); setIsPlusMenuOpen(false); }} />
                      <PlusMenuOption label="Web" onClick={() => { onModeChange('Search'); setIsPlusMenuOpen(false); }} />
                      <PlusMenuOption label="Shopping" onClick={() => { onModeChange('Shopping'); setIsPlusMenuOpen(false); }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
             {currentMode !== 'Standard' && (
               <div className="flex items-center gap-1.5 px-3 py-0.5 mb-1 animate-reveal self-start bg-zinc-800/80 rounded-full border border-zinc-700/50">
                 <span className="text-zinc-500 scale-75">{getModeIcon()}</span>
                 <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{getModeLabel()}</span>
                 <button onClick={() => onModeChange('Standard')} className="ml-1 text-zinc-600 hover:text-white transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6 6 18M6 6l12 12"/></svg>
                 </button>
               </div>
             )}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={getPlaceholder()}
              className="w-full bg-transparent text-zinc-100 py-2 px-2 focus:outline-none resize-none min-h-[38px] max-h-[110px] text-[15px] leading-relaxed placeholder-zinc-500"
              rows={1}
            />
          </div>
          
          <div className="flex items-center gap-1 pr-1 pb-1">
            {inputValue.trim() && (
               <button 
                type="button" 
                onClick={handleCopyInput}
                className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                title="Copy input"
              >
                {copiedInput ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                )}
              </button>
            )}
            <button 
              type="button"
              onClick={onVoiceClick}
              className="p-1.5 text-zinc-600 hover:text-zinc-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
            <button 
              type="submit" 
              disabled={!inputValue.trim() && !selectedMedia}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${ (inputValue.trim() || selectedMedia) ? 'bg-white text-black active:scale-90' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed' }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#09090b] relative">
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-48 custom-scroll flex flex-col items-center"
      >
        {isLanding ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full mt-[-10vh]">
             {renderInputArea(true)}
          </div>
        ) : (
          <div className="w-full max-w-4xl space-y-12">
            {messages.map((msg) => <Message key={msg.id} message={msg} />)}
          </div>
        )}
      </div>

      {!autoScroll && !isLanding && (
        <button 
          onClick={scrollToBottom}
          className={`fixed bottom-36 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border shadow-2xl flex items-center justify-center transition-all animate-reveal z-30 group active:scale-90 ${
            isStreaming 
              ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)]' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
          title={isStreaming ? "Follow live answer" : "Scroll to bottom"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${isStreaming ? 'animate-bounce' : 'group-hover:translate-y-0.5'}`}><path d="m19 12-7 7-7-7M12 19V5"/></svg>
          {isStreaming && (
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded shadow-xl animate-pulse whitespace-nowrap">Live Answer Flow</span>
          )}
        </button>
      )}
      
      {!isLanding && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent pt-24 pb-6 px-4 z-20">
          <div className="w-full max-w-2xl mx-auto">
            {renderInputArea(false)}
            <p className="text-[10px] text-zinc-800 mt-4 text-center font-bold tracking-[0.25em] opacity-40 uppercase">Ultrawan Intelligence • Global Core by AIRSOFTS</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
