import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import Logo from './Logo';
import { jwtDecode } from 'jwt-decode';

// Declare the google property on the global window object to satisfy TypeScript
declare global {
  interface Window {
    google: any;
  }
}

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onCancel?: () => void;
}

interface GoogleCredentialResponse {
  credential: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCredentialResponse = (response: GoogleCredentialResponse) => {
      setIsLoading(true);
      try {
        const decoded: any = jwtDecode(response.credential);
        const user: User = {
          name: '', // We force name entry in the next step to ensure it's their preferred name
          email: decoded.email,
          picture: decoded.picture
        };
        
        // Brief delay for aesthetic "handshake" animation
        setTimeout(() => {
          onLogin(user);
        }, 1000);
      } catch (err) {
        console.error("JWT Decode failed", err);
        setIsLoading(false);
      }
    };

    // Initialize Google Identity Services
    const initializeGoogle = () => {
      // Fix: window.google is now recognized by the compiler after global declaration
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: "408801716763-oq6jne1418jf2jbv3lq03ui9iak0rpmb.apps.googleusercontent.com",
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          width: 320,
          text: "continue_with",
          logo_alignment: "left"
        });
      }
    };

    // Polling check for the script being ready
    const checkInterval = setInterval(() => {
      // Fix: Safely access google property on window using optional chaining
      if (window.google?.accounts?.id) {
        initializeGoogle();
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [onLogin]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {!isLoading ? (
        <div className="max-w-md w-full px-8 py-10 glass rounded-[40px] border border-zinc-800 shadow-2xl z-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-center mb-8 mx-auto">
             <Logo size={56} />
          </div>
          
          <h1 className="text-2xl font-black tracking-tighter text-white mb-2 italic">ULTRAWAN CORE</h1>
          <p className="text-zinc-500 text-xs mb-10 leading-relaxed px-4">
            ব্যক্তিগত AI সহচর। কন্টিনিউ করতে আপনার Google অ্যাকাউন্ট দিয়ে সাইন-ইন করুন।
          </p>

          <div className="w-full flex justify-center mb-4 min-h-[50px]" ref={googleBtnRef}>
            {/* Google Sign-In button renders here */}
          </div>
          
          {onCancel && (
            <button 
              onClick={onCancel}
              className="mt-6 text-zinc-600 hover:text-zinc-400 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Cancel Login
            </button>
          )}

          <div className="mt-12 flex items-center gap-2">
             <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
             <span className="text-[8px] text-zinc-600 font-mono tracking-widest uppercase">Encryption Mode: Active</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center animate-in fade-in zoom-in-95">
           <div className="w-12 h-12 border-2 border-zinc-800 border-t-blue-500 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
           <p className="text-[10px] font-mono tracking-[0.3em] text-zinc-400 uppercase animate-pulse">Establishing Identity...</p>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;