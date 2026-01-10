
import React, { useState } from 'react';
import { Language, translations } from '../translations';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
  lang: Language;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin, lang }) => {
  const t = translations[lang];
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful login
    onLogin({
      id: 'user-' + Date.now(),
      name: email.split('@')[0],
      email: email,
      provider: 'local',
      avatar: `https://i.pravatar.cc/150?u=${email}`
    });
  };

  const handleSSO = (provider: 'google' | 'github') => {
    // Simulate OIDC flow
    onLogin({
      id: `sso-${provider}-${Date.now()}`,
      name: provider === 'google' ? 'Google User' : 'GitHub Explorer',
      email: `${provider}@example.com`,
      provider: provider,
      avatar: `https://i.pravatar.cc/150?u=${provider}`
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/40 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
          <i className="fas fa-times text-xl"></i>
        </button>

        <div className="p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
              <i className="fas fa-tree text-white text-2xl"></i>
            </div>
            <h2 className="text-3xl font-black text-white font-outfit tracking-tight">
              {isRegister ? t.register : t.login}
            </h2>
          </div>

          <form onSubmit={handleLocalSubmit} className="space-y-4">
            <div>
              <input 
                type="email" 
                placeholder={t.email}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder={t.password}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95">
              {isRegister ? t.register : t.login}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <span className="relative px-4 bg-slate-900 text-xs font-bold text-white/20 uppercase tracking-widest">{t.ssoTitle}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleSSO('google')}
              className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl transition-all"
            >
              <i className="fab fa-google text-red-400"></i>
              <span className="text-sm font-bold">Google</span>
            </button>
            <button 
              onClick={() => handleSSO('github')}
              className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl transition-all"
            >
              <i className="fab fa-github text-white"></i>
              <span className="text-sm font-bold">GitHub</span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm font-bold text-blue-400/60 hover:text-blue-400 transition-colors"
            >
              {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
