
import React, { useState } from 'react';
import { Language, translations } from '../translations';

interface ShareModalProps {
  url: string;
  onClose: () => void;
  lang: Language;
}

const ShareModal: React.FC<ShareModalProps> = ({ url, onClose, lang }) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/40 animate-in zoom-in-95 duration-300">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
          <i className="fas fa-times text-xl"></i>
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 font-outfit">{t.shareTitle}</h2>
        
        <p className="text-white/40 text-sm mb-6">Anyone with this link can view your family tree. It's fully self-contained.</p>

        <div className="flex gap-3">
          <input 
            type="text" 
            readOnly 
            value={url}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/60 focus:outline-none"
          />
          <button 
            onClick={handleCopy}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
          >
            {copied ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
            {copied ? t.linkCopied : t.copyLink}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
