
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Role, User } from '../types';
import Message from './Message';

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, imageData?: { data: string; mimeType: string }) => void;
  user: User;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, user }) => {
  const [inputValue, setInputValue] = useState('');
  const [pendingImage, setPendingImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() && !pendingImage) return;
    
    onSendMessage(inputValue, pendingImage || undefined);
    setInputValue('');
    setPendingImage(null);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (file) {
      if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
        setError(`Format ${file.type} is not supported. Use JPG, PNG, or WebP.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        setPendingImage({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth scrollbar-hide print:overflow-visible print:px-0"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 no-print">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-xl shadow-black">
               <span className="text-zinc-100 font-bold text-3xl">W</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-zinc-100">Greetings, {user.name.split(' ')[0]}.</h2>
              <p className="text-zinc-500 text-sm leading-relaxed">
                I am Ultrawan. Ready to analyze code, explain concepts, or process visual intelligence. I'm listening.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
               <button 
                onClick={() => setInputValue("Analyze this image and describe its key elements.")}
                className="p-4 text-left text-xs bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all hover:border-zinc-700"
               >
                 <span className="block font-bold text-zinc-300 mb-1">➤ Visual Analysis</span>
                 <span className="text-[10px] text-zinc-600">Explain this image...</span>
               </button>
               <button 
                onClick={() => setInputValue("Write a detailed technical summary based on our context.")}
                className="p-4 text-left text-xs bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all hover:border-zinc-700"
               >
                 <span className="block font-bold text-zinc-300 mb-1">➤ Synthesis</span>
                 <span className="text-[10px] text-zinc-600">Make a report...</span>
               </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="message-container">
              <Message message={msg} />
            </div>
          ))
        )}
      </div>

      <div className="p-4 sm:p-6 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent no-print input-area">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative group"
        >
          {error && (
            <div className="mb-2 px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs animate-in slide-in-from-bottom-2">
              {error}
            </div>
          )}

          {pendingImage && (
            <div className="mb-4 relative w-20 h-20 group/preview animate-in zoom-in-95">
              <img 
                src={`data:${pendingImage.mimeType};base64,${pendingImage.data}`} 
                className="w-full h-full object-cover rounded-xl border border-zinc-700 shadow-xl" 
                alt="Preview"
              />
              <button 
                type="button"
                onClick={() => setPendingImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover/preview:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          )}

          <div className="relative glass rounded-2xl border-zinc-800 shadow-2xl focus-within:border-zinc-600 transition-all">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".jpg,.jpeg,.png,.webp,.heic,.heif" 
              onChange={handleFileChange}
            />
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Communicate with Ultrawan..."
              className="w-full bg-transparent text-zinc-100 py-4 pl-14 pr-16 focus:outline-none resize-none min-h-[56px] max-h-[200px] scrollbar-hide text-sm"
              rows={1}
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 bottom-3 p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Attach Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>

            <div className="absolute right-3 bottom-3 flex items-center gap-2">
               <button
                type="submit"
                disabled={!inputValue.trim() && !pendingImage}
                className={`p-2 rounded-xl transition-all ${
                  (inputValue.trim() || pendingImage)
                  ? 'bg-zinc-100 text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              </button>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-600 flex justify-between px-2 font-mono">
            <span>SESSION_OWNER: {user.name.toUpperCase()}</span>
            <div className="flex gap-4">
              {pendingImage && <span>IMAGE_BUFFER_READY</span>}
              <span>FLASH_CORE_ACTIVE</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
