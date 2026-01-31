
import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

interface VoiceChatProps {
  onClose: () => void;
  userName: string;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ onClose, userName }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [userInputText, setUserInputText] = useState('');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Base64 Helpers as per SDK Rules
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };
  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        inputContextRef.current = inputCtx;
        audioContextRef.current = outputCtx;

        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setIsConnecting(false);
              setIsActive(true);
              const source = inputCtx.createMediaStreamSource(stream!);
              scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              // Handle Transcriptions
              if (message.serverContent?.outputTranscription) {
                setTranscription(prev => prev + (message.serverContent?.outputTranscription?.text || ''));
              }
              if (message.serverContent?.inputTranscription) {
                setUserInputText(prev => prev + (message.serverContent?.inputTranscription?.text || ''));
              }
              if (message.serverContent?.turnComplete) {
                setTranscription('');
                setUserInputText('');
              }

              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                setIsSpeaking(true);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(outputCtx.destination);
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsSpeaking(false);
                };
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }
              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsSpeaking(false);
              }
            },
            onclose: () => setIsActive(false),
            onerror: (e) => console.error("Live Error", e)
          },
          config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: `You are Ultrawan in Live Voice Mode. 
            The user is ${userName}.
            Developer: Asraful Islam Redwan.
            Rules: Be concise, warm, and helpful. You speak any language the user speaks perfectly. Adapt your tone to be professional yet empathetic.`
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (e) {
        console.error("Session Init Error", e);
        setIsConnecting(false);
      }
    };

    startSession();

    return () => {
      sessionRef.current?.close();
      audioContextRef.current?.close();
      inputContextRef.current?.close();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (scriptProcessor) {
        scriptProcessor.disconnect();
      }
    };
  }, [userName]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#09090b] flex flex-col items-center justify-center animate-in fade-in duration-500 overflow-hidden">
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
      
      {/* Neural Pulse Visualizer */}
      <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
         <div className={`absolute inset-0 rounded-full bg-blue-500/10 blur-[60px] transition-all duration-1000 ${isSpeaking ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`}></div>
         <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border border-blue-500/30 flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-110 shadow-[0_0_50px_rgba(59,130,246,0.3)]' : ''}`}>
            <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/10`}>
               <div className={`flex gap-1 items-center h-8`}>
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-blue-400 rounded-full transition-all duration-300"
                      style={{ 
                        height: isActive ? (isSpeaking ? `${Math.random() * 80 + 20}%` : '20%') : '10%', 
                        opacity: 0.5 + (i * 0.1),
                        animation: isActive && isSpeaking ? `pulse 0.5s infinite ${i * 0.1}s` : 'none'
                      }}
                    ></div>
                  ))}
               </div>
            </div>
         </div>
         <div className={`absolute inset-0 border-[0.5px] border-zinc-800 rounded-full animate-[spin_20s_linear_infinite]`}></div>
         <div className={`absolute inset-10 border-[0.5px] border-zinc-800 rounded-full animate-[spin_15s_linear_infinite_reverse]`}></div>
      </div>

      <div className="mt-8 md:mt-12 text-center z-10 px-6 max-w-2xl">
        <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-zinc-600 mb-6">Voice Discovery Engine v4</h2>
        
        <div className="min-h-[140px] flex flex-col gap-4">
          {userInputText && (
             <p className="text-zinc-500 text-sm font-medium animate-reveal bg-zinc-900/40 px-4 py-2 rounded-2xl border border-zinc-800/50">
               {userInputText}
             </p>
          )}
          
          <p className="text-xl md:text-2xl font-black text-white italic tracking-tighter leading-relaxed">
            {isConnecting ? 'Initializing Link...' : (transcription || (isSpeaking ? 'Ultrawan Speaking' : 'Listening...'))}
          </p>
        </div>
        
        <div className="mt-10 flex items-center justify-center gap-3">
           <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
           <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Global Language Engine Active</p>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="absolute bottom-12 px-10 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full border border-red-500/30 font-black text-[10px] tracking-[0.3em] uppercase transition-all active:scale-95 shadow-2xl"
      >
        Close Connection
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
    </div>
  );
};

export default VoiceChat;
