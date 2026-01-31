
import React, { useState } from 'react';
import { ChatMessage, Role } from '../types.ts';
import katex from 'katex';

interface MessageProps {
  message: ChatMessage & { status?: 'thinking' | 'searching' | 'none' };
}

const CodeCanvas: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 w-full rounded-2xl overflow-hidden border border-zinc-800 bg-[#0d0d0e] shadow-xl animate-reveal duration-300 no-break text-left">
      <div className="flex items-center justify-between px-4 py-3 bg-[#161618] border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40"></div>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-3">{language || 'CODE'}</span>
        </div>
        <button onClick={copy} className={`no-print flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${copied ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-5 overflow-x-auto"><pre className="text-[14px] font-mono leading-relaxed text-zinc-300"><code>{code}</code></pre></div>
    </div>
  );
};

const Table: React.FC<{ rows: string[] }> = ({ rows }) => {
  const parseRow = (row: string) => {
    return row.split('|')
      .map(cell => cell.trim())
      .filter((cell, i, arr) => {
        if (i === 0 && cell === '') return false;
        if (i === arr.length - 1 && cell === '') return false;
        return true;
      });
  };

  const contentRows = rows.filter(row => !row.match(/^\s*\|?\s*[:\-]+\s*\|/));
  if (contentRows.length === 0) return null;

  const headerCells = parseRow(contentRows[0]);
  const bodyRows = contentRows.slice(1).map(row => parseRow(row));

  return (
    <div className="my-8 w-full overflow-x-auto rounded-2xl border border-zinc-800/50 bg-[#0d0d0f]/30">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 bg-white/[0.01]">
            {headerCells.map((cell, i) => (
              <th key={i} className="py-5 px-6 text-[13px] font-bold text-zinc-400 uppercase tracking-widest">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900/40">
          {bodyRows.map((row, i) => (
            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
              {row.map((cell, j) => (
                <td key={j} className="py-5 px-6 text-[15px] text-zinc-300 font-medium group-hover:text-white transition-colors">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Latex: React.FC<{ content: string; displayMode?: boolean }> = ({ content, displayMode = false }) => {
  try {
    const html = katex.renderToString(content, {
      throwOnError: false,
      displayMode,
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (e) {
    return <span>{content}</span>;
  }
};

const Message: React.FC<MessageProps> = ({ message }) => {
  const isModel = message.role === Role.MODEL;
  const isUser = message.role === Role.USER;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseInline = (text: string): React.ReactNode => {
    let cleanText = text.replace(/(^|\s)\*\*(\s|$)/g, ' '); 
    cleanText = cleanText.replace(/(\*\*\s+)/g, '**').replace(/(\s+\*\*)/g, '**');

    const combinedRegex = /(\$\$.*?\$\$|\$.*?\$|\*\*[^\*]+\*\*)/gs;
    let parts: (string | React.ReactNode)[] = [cleanText];
    let result: (string | React.ReactNode)[] = [];
    
    parts.forEach(p => {
      if (typeof p !== 'string') {
        result.push(p);
        return;
      }
      
      const chunks = p.split(combinedRegex);
      chunks.forEach((chunk, i) => {
        if (!chunk) return;
        
        if (chunk.startsWith('$$') && chunk.endsWith('$$')) {
          result.push(<div key={`math-block-${i}`} className="my-4 text-center overflow-x-auto"><Latex content={chunk.slice(2, -2)} displayMode={true} /></div>);
        } else if (chunk.startsWith('$') && chunk.endsWith('$')) {
          result.push(<Latex key={`math-inline-${i}`} content={chunk.slice(1, -1)} />);
        } else if (chunk.startsWith('**') && chunk.endsWith('**')) {
          result.push(<strong key={`bold-${i}`} className="font-extrabold text-white">{chunk.slice(2, -2)}</strong>);
        } else {
          result.push(chunk.replace(/\*\*/g, ''));
        }
      });
    });
    
    return result;
  };

  const renderContent = (content: string) => {
    const sections = content.split(/(```[\s\S]*?```)/g);
    
    return sections.map((section, idx) => {
      if (section.startsWith('```')) {
        const match = section.match(/```(\w+)?\n?([\s\S]*?)```/);
        return <CodeCanvas key={idx} code={match?.[2] || ''} language={match?.[1]} />;
      }
      
      const lines = section.split('\n');
      const renderedLines: React.ReactNode[] = [];
      let currentTableRows: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed.includes('|') && trimmed.split('|').length > 2) {
          currentTableRows.push(line);
          continue;
        } else if (currentTableRows.length > 0) {
          renderedLines.push(<Table key={`table-${i}`} rows={currentTableRows} />);
          currentTableRows = [];
        }

        if (!trimmed) {
          renderedLines.push(<div key={i} className="h-1"></div>);
          continue;
        }

        const headerMatch = trimmed.match(/^(#{1,6})\s*(.*)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const title = headerMatch[2];
          const styles = [
            'text-3xl font-black text-white mt-12 mb-6 tracking-tighter',
            'text-2xl font-black text-white mt-10 mb-5 tracking-tight',
            'text-xl font-bold text-white mt-8 mb-4 tracking-tight',
            'text-lg font-bold text-white mt-6 mb-3 tracking-tight',
            'text-md font-bold text-zinc-200 mt-4 mb-2 tracking-wide uppercase',
            'text-sm font-bold text-zinc-400 mt-3 mb-1 tracking-widest uppercase'
          ];
          renderedLines.push(
            <div key={i} className={styles[Math.min(level - 1, 5)]}>
              {parseInline(title)}
            </div>
          );
          continue;
        }

        if (trimmed.startsWith('📌') || trimmed.startsWith('🎓') || trimmed.startsWith('🏠') || trimmed.startsWith('📈') || trimmed.startsWith('📞')) {
          renderedLines.push(
            <h3 key={i} className="text-lg font-bold text-white mt-8 mb-4 tracking-tight flex items-center gap-2">
              {parseInline(line)}
            </h3>
          );
          continue;
        }

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          renderedLines.push(
            <div key={i} className="flex gap-3 pl-2 mb-3">
              <span className="text-zinc-600 mt-2 shrink-0 text-[10px]">•</span>
              <div className="text-[16px] leading-relaxed text-zinc-300 font-medium">
                {parseInline(trimmed.substring(2))}
              </div>
            </div>
          );
          continue;
        }

        renderedLines.push(
          <div key={i} className={`text-[16px] leading-[1.8] mb-5 font-medium ${isUser ? 'text-white' : 'text-zinc-300'}`}>
            {parseInline(line)}
          </div>
        );
      }

      if (currentTableRows.length > 0) {
        renderedLines.push(<Table key={`table-end`} rows={currentTableRows} />);
      }

      return <div key={idx} className="w-full space-y-4">{renderedLines}</div>;
    });
  };

  if (isUser) {
    return (
      <div className="flex w-full flex-col items-end gap-3 animate-reveal px-4">
        {message.media && (
           <div className="relative p-1 bg-zinc-800/60 border border-zinc-700/50 rounded-2xl shadow-xl overflow-hidden max-w-[300px]">
              <img src={`data:${message.media.mimeType};base64,${message.media.data}`} className="w-full h-auto rounded-xl" alt="User Media" />
           </div>
        )}
        <div className="flex items-center gap-2 group max-w-[85%]">
           <button 
             onClick={handleCopy}
             className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-zinc-400 transition-all shrink-0 active:scale-90"
             title="Copy message"
           >
             {copied ? (
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="4"><path d="M20 6 9 17l-5-5"/></svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
             )}
           </button>
           <div className="bg-zinc-800/40 px-5 py-2.5 rounded-[22px] border border-zinc-700/50 shadow-lg">
              <div className="text-white text-[15px] font-semibold tracking-tight">{parseInline(message.content)}</div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row w-full gap-8 animate-reveal px-2 md:px-0 items-start">
      <div className="flex-1 flex flex-col items-start min-w-0">
        {message.status !== 'none' && (
          <div className="flex items-center gap-4 mb-8 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/10">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">
              {message.status === 'searching' ? 'Investigating Sources...' : 'Synthesizing...'}
            </span>
          </div>
        )}

        <div className="w-full prose-invert">
           {message.media && (
              <div className="mb-8 p-1 bg-zinc-900/60 border border-zinc-800/80 rounded-[28px] shadow-2xl overflow-hidden max-w-md">
                <img src={`data:${message.media.mimeType};base64,${message.media.data}`} className="w-full h-auto rounded-[24px]" alt="Model Media" />
              </div>
           )}
           {renderContent(message.content)}
           
           {isModel && !message.isStreaming && message.content.length > 0 && (
             <div className="mt-8 flex items-center gap-5 no-print pt-2 opacity-40 hover:opacity-100 transition-opacity">
                <button onClick={handleCopy} className="p-1 hover:text-white transition-colors" title="Copy response">
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  )}
                </button>
                <button className="p-1 hover:text-white transition-colors" title="Helpful">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                </button>
                <button className="p-1 hover:text-white transition-colors" title="Not helpful">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                </button>
                <button className="p-1 hover:text-white transition-colors" title="Share">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                </button>
                <button className="p-1 hover:text-white transition-colors" title="Regenerate">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                </button>
                <button className="p-1 hover:text-white transition-colors" title="More">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </button>
             </div>
           )}
        </div>
      </div>

      {isModel && message.sources && message.sources.length > 0 && (
        <div className="lg:w-72 shrink-0 animate-reveal no-print pt-2">
          <div className="sticky top-24 flex flex-col gap-5">
            <div className="flex items-center gap-3 text-zinc-600">
              <div className="w-3 h-px bg-zinc-800"></div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Evidence</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {message.sources.map((source, sIdx) => (
                <a 
                  key={sIdx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-blue-500/30 hover:bg-zinc-800/60 transition-all group flex flex-col gap-1.5 shadow-md"
                >
                  <span className="text-[11px] font-bold text-zinc-200 line-clamp-1 group-hover:text-blue-400 transition-colors tracking-tight">
                    {source.title || 'Source'}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-tighter">
                      {new URL(source.uri).hostname.replace('www.', '')}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-zinc-700 group-hover:text-blue-500 transition-colors"><path d="M7 17L17 7M7 7h10v10"/></svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;