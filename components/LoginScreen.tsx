
import React, { useState } from 'react';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulated detected accounts on the device
  const detectedAccounts = [
    { name: 'User Identity', email: 'user@gmail.com', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' }
  ];

  const handleSelectAccount = (account: { name: string, email: string, img: string }) => {
    setIsConnecting(true);
    setIsSelectorOpen(false);
    
    // Simulate verification delay
    setTimeout(() => {
      const userData: User = {
        name: account.name,
        email: account.email,
        picture: account.img
      };
      onLogin(userData);
    }, 1200);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(emailInput)) {
      setError('Please enter a valid @gmail.com address');
      return;
    }

    handleSelectAccount({
      name: emailInput.split('@')[0],
      email: emailInput,
      img: `https://api.dicebear.com/7.x/avataaars/svg?seed=${emailInput}`
    });
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] relative overflow-hidden">
      {/* Neural Background Decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {!isConnecting ? (
        <div className="max-w-md w-full px-6 py-12 glass rounded-[40px] border border-zinc-800 shadow-2xl z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-xl">
             <span className="text-black font-black text-3xl">W</span>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">ULTRAWAN</h1>
          <p className="text-zinc-500 text-sm mb-12 leading-relaxed px-4">
            Welcome back. Your personal AI companion is ready.<br/>
            Please verify your identity to continue.
          </p>

          <button 
            onClick={() => setIsSelectorOpen(true)}
            className="group w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-black px-6 py-4 rounded-2xl font-bold transition-all shadow-xl active:scale-95"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className="mt-12 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Verified System Access</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
           <div className="w-12 h-12 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin mb-6"></div>
           <p className="text-xs font-mono tracking-widest text-zinc-400 uppercase">Synchronizing Neural Data...</p>
        </div>
      )}

      {/* Account Selector Modal */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-zinc-900 w-full max-w-[360px] rounded-[28px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 text-center">
              <svg className="mx-auto mb-4" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <h2 className="text-xl font-medium text-zinc-800">Choose an account</h2>
              <p className="text-sm text-zinc-500 mt-1">to continue to Ultrawan</p>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {!showManual ? (
                <>
                  {detectedAccounts.map((acc, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSelectAccount(acc)}
                      className="w-full px-6 py-3 flex items-center gap-4 hover:bg-zinc-50 transition-colors border-t border-zinc-100 first:border-t-0 text-left"
                    >
                      <img src={acc.img} className="w-8 h-8 rounded-full border border-zinc-200" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">{acc.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{acc.email}</p>
                      </div>
                    </button>
                  ))}
                  <button 
                    onClick={() => setShowManual(true)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors border-t border-zinc-100 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    </div>
                    <span className="text-sm font-medium text-zinc-700">Use another account</span>
                  </button>
                </>
              ) : (
                <div className="px-6 pb-8 pt-2">
                  <form onSubmit={handleManualLogin}>
                    <input 
                      autoFocus
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Email address (@gmail.com)"
                      className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all mb-4"
                    />
                    {error && <p className="text-red-500 text-[11px] mb-4 font-medium">{error}</p>}
                    <div className="flex justify-between items-center">
                      <button 
                        type="button"
                        onClick={() => { setShowManual(false); setError(null); }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Back
                      </button>
                      <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-50 text-[10px] text-zinc-400 text-center leading-relaxed">
              To continue, Google will share your name, email address, and profile picture with Ultrawan. 
              <span className="text-blue-600 hover:underline cursor-pointer ml-1">Privacy Policy</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-8 text-zinc-700 text-[10px] font-mono tracking-widest uppercase flex gap-4">
        <span>SECURITY_PROTOCOL_V4</span>
        <span className="opacity-30">|</span>
        <span>GMAIL_PROVIDER_ACTIVE</span>
      </div>
    </div>
  );
};

export default LoginScreen;
