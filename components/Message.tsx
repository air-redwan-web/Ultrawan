
import React from 'react';
import { ChatMessage, Role } from '../types';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isModel = message.role === Role.MODEL;

  const formatContent = (content: string) => {
    const lines = content.split('\n');
    let inCodeBlock = false;

    return lines.map((line, i) => {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return null;
      }

      if (inCodeBlock) {
        return (
          <div key={i} className="mono text-[13px] bg-black/60 p-2 my-1 rounded-lg border border-zinc-800 font-mono text-emerald-400 overflow-x-auto print:bg-gray-100 print:text-black">
            {line}
          </div>
        );
      }

      if (line.trim().startsWith('➤')) {
        return (
          <div key={i} className="flex gap-2 mb-2 group">
            <span className="text-zinc-400 font-bold shrink-0 transition-colors group-hover:text-zinc-100 print:text-black">➤</span>
            <span className="text-zinc-300 print:text-black">{line.replace('➤', '').trim()}</span>
          </div>
        );
      }

      return (
        <p key={i} className={`mb-3 last:mb-0 leading-relaxed text-zinc-300 print:text-black`}>
          {line}
        </p>
      );
    });
  };

  return (
    <div className={`flex w-full ${isModel ? 'justify-start' : 'justify-end animate-in fade-in slide-in-from-bottom-2'}`}>
      <div className={`max-w-[85%] sm:max-w-[80%] flex flex-col ${isModel ? 'items-start' : 'items-end'}`}>
        
        <div className={`flex items-center gap-2 mb-1.5 ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
           <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold print:text-gray-600 ai-label">
             {isModel ? 'Ultrawan_Core' : 'User_Identity'}
           </span>
           <span className="text-[10px] text-zinc-700 font-mono print:text-gray-400">
             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </span>
        </div>

        <div className={`
          relative px-4 py-3.5 rounded-2xl shadow-xl transition-all border
          ${isModel 
            ? 'bg-zinc-900/40 border-zinc-800/80 rounded-tl-none' 
            : 'bg-zinc-900/80 border-zinc-700/50 rounded-tr-none print:bg-white print:border-gray-300'}
        `}>
          {message.image && (
            <div className="mb-3 overflow-hidden rounded-xl border border-zinc-800 print:border-gray-200">
              <img 
                src={`data:${message.image.mimeType};base64,${message.image.data}`} 
                className="max-w-full max-h-[300px] object-contain"
                alt="Input content"
              />
            </div>
          )}

          {message.thinking && (
            <div className="flex items-center gap-2 mb-4 text-zinc-500 font-mono text-[11px] bg-black/40 p-2.5 rounded-xl border border-zinc-800/50 italic no-print">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              {message.thinking}
            </div>
          )}
          
          <div className="break-words">
            {message.content ? formatContent(message.content) : null}
            {!message.content && isModel && (
                <div className="flex gap-1.5 py-2 no-print">
                   <div className="w-2 h-2 rounded-full bg-zinc-700 animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-2 h-2 rounded-full bg-zinc-700 animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-2 h-2 rounded-full bg-zinc-700 animate-bounce"></div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
