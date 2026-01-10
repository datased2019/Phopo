
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FamilyMember, User, ThemeId } from './types';
import TreeRenderer, { TreeRendererRef } from './components/TreeRenderer';
import MemberEditor from './components/MemberEditor';
import AuthModal from './components/AuthModal';
import ShareModal from './components/ShareModal';
import LandingPage from './components/LandingPage';
import { parseFamilyText, ParsedFamilyMember } from './services/geminiService';
import { Language, translations } from './translations';
import { api } from './services/api';
import { generateShareLink } from './services/persistenceService';

const App: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [lang, setLang] = useState<Language>('zh');
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('standard');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isViewingShared, setIsViewingShared] = useState(false);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const treeRef = useRef<TreeRendererRef>(null);
  const t = translations[lang];

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('tree');
        if (encoded) {
          const shared = await api.getSharedTree(encoded);
          setMembers(shared);
          setIsViewingShared(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          const data = await api.getMembers();
          setMembers(data.length > 0 ? data : []);
        }
      } catch (e) { console.error("Initialization Failed", e); } finally { setIsLoading(false); }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!user || isViewingShared || members.length === 0) return;
    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try { await api.saveMembers(members); } catch (e) { console.error("Sync Error", e); } finally { setIsSyncing(false); }
    }, 1500);
    return () => clearTimeout(timer);
  }, [members, user, isViewingShared]);

  const handleLogin = async (u: User) => {
    const loggedUser = await api.login(u.email, u.provider);
    setUser(loggedUser);
    setShowAuth(false);
    const data = await api.getMembers();
    if (data.length > 0) setMembers(data);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setIsViewingShared(false);
    setMembers([]);
  };

  const handleShare = () => { setShareUrl(generateShareLink(members)); };
  const handleResetView = () => { treeRef.current?.resetView(); };

  const selectedMember = members.find(m => m.id === selectedId);

  const handleAddMember = useCallback(() => {
    if (!user) { setShowAuth(true); return; }
    const newId = `m-${Date.now()}`;
    const newMember: FamilyMember = { id: newId, name: lang === 'zh' ? '新成员' : 'New Member', gender: 'male' };
    setMembers(prev => [...prev, newMember]);
    setSelectedId(newId);
  }, [lang, user]);

  const handleCreateSelf = useCallback(() => {
    if (!user) return;
    const newId = `m-self-${Date.now()}`;
    setMembers([{ id: newId, name: user.name, gender: 'male', photo: user.avatar, bio: lang === 'zh' ? '这是我。' : 'This is me.' }]);
    setSelectedId(newId);
  }, [user, lang]);

  const handleUpdateMember = useCallback((updated: FamilyMember) => {
    if (!user) return;
    setMembers(prev => {
      let nextMembers = prev.map(m => m.id === updated.id ? updated : m);
      if (updated.spouseId) {
        nextMembers = nextMembers.map(m => {
          if (m.id === updated.spouseId) return { ...m, spouseId: updated.id };
          if (m.spouseId === updated.id && m.id !== updated.spouseId) return { ...m, spouseId: undefined };
          return m;
        });
      } else {
        nextMembers = nextMembers.map(m => { if (m.spouseId === updated.id) return { ...m, spouseId: undefined }; return m; });
      }
      return nextMembers;
    });
  }, [user]);

  const handleDeleteMember = useCallback((id: string) => {
    if (!user) return;
    setMembers(prev => prev.filter(m => m.id !== id));
    setSelectedId(null);
  }, [user]);

  const handleAiParsing = async () => {
    if (!aiInput.trim() || !user) return;
    setIsAiLoading(true);
    try {
      const parsedData: ParsedFamilyMember[] = await parseFamilyText(aiInput);
      setMembers(prev => {
        const nameToIdMap = new Map<string, string>();
        prev.forEach(m => nameToIdMap.set(m.name, m.id));
        const timestamp = Date.now();
        const newMembersToAdd: FamilyMember[] = [];
        parsedData.forEach((data, idx) => {
          if (data.name && !nameToIdMap.has(data.name)) {
            const newId = `ai-${timestamp}-${idx}`;
            nameToIdMap.set(data.name, newId);
            newMembersToAdd.push({ id: newId, name: data.name, gender: (data.gender as any) || 'male', birthDate: data.birthDate, bio: data.bio });
          }
        });
        const allNodesBase = [...prev, ...newMembersToAdd];
        const resolved = allNodesBase.map(member => {
          const aiUpdate = parsedData.find(d => d.name === member.name);
          if (!aiUpdate) return member;
          const updatedMember = { ...member };
          if (aiUpdate.fatherName) { const fId = nameToIdMap.get(aiUpdate.fatherName); if (fId) updatedMember.parentId1 = fId; }
          if (aiUpdate.motherName) { const mId = nameToIdMap.get(aiUpdate.motherName); if (mId) updatedMember.parentId2 = mId; }
          if (aiUpdate.spouseName) { const sId = nameToIdMap.get(aiUpdate.spouseName); if (sId) updatedMember.spouseId = sId; }
          return updatedMember;
        });
        return resolved.map(member => {
          if (!member.spouseId) { const p = resolved.find(m => m.spouseId === member.id); if (p) return { ...member, spouseId: p.id }; }
          return member;
        });
      });
      setAiInput('');
    } catch (e) { console.error("AI Error:", e); } finally { setIsAiLoading(false); }
  };

  if (isLoading) return <div className="h-screen w-screen bg-[#020617] flex items-center justify-center animate-pulse"><div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl"><i className="fas fa-tree text-white text-2xl"></i></div></div>;

  if (!user && !isViewingShared) return <div className="h-screen w-screen bg-[#020617]"><LandingPage onStart={() => setShowAuth(true)} lang={lang} />{showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} lang={lang} />}</div>;

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col font-outfit text-white transition-colors duration-1000 ${currentTheme === 'minimalist' ? 'bg-white' : 'bg-[#020617]'}`}>
      <header className={`fixed top-0 left-0 right-0 z-40 h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between border-b transition-all duration-1000 ${currentTheme === 'minimalist' ? 'bg-white/80 border-gray-100 text-gray-900' : 'bg-[#020617]/40 border-white/5 text-white'} backdrop-blur-xl`}>
        <div className="flex items-center gap-4 sm:gap-10">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${currentTheme === 'minimalist' ? 'bg-black' : 'bg-blue-600'}`}><i className="fas fa-tree text-white text-xs sm:text-sm"></i></div>
            <div className="hidden xs:block"><h1 className="text-lg sm:text-xl font-black tracking-tighter leading-none uppercase">{t.appName}</h1><p className="text-[8px] sm:text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mt-1">{t.subtitle}</p></div>
          </div>
          <div className="hidden lg:flex items-center bg-white/5 rounded-2xl border border-white/10 p-1">
            {(['zh', 'en', 'ja'] as Language[]).map(l => (<button key={l} onClick={() => setLang(l)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${lang === l ? 'bg-blue-600 text-white' : 'opacity-40 hover:opacity-100'}`}>{l}</button>))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Switcher */}
          <div className="relative">
             <button onClick={() => setShowThemeMenu(!showThemeMenu)} className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-[11px] font-bold border transition-all ${currentTheme === 'minimalist' ? 'bg-gray-100 border-gray-200 text-gray-600' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <i className="fas fa-palette text-blue-400"></i>
                <span className="hidden sm:inline">{t.theme}</span>
             </button>
             {showThemeMenu && (
               <div className="absolute top-full right-0 mt-3 w-56 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-2 z-[60] overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-1 gap-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {(Object.keys(t.themes) as ThemeId[]).map(themeId => (
                      <button 
                        key={themeId} 
                        onClick={() => { setCurrentTheme(themeId); setShowThemeMenu(false); }}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${currentTheme === themeId ? 'bg-blue-600 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                      >
                         <div className={`w-3 h-3 rounded-full ${themeId === 'standard' ? 'bg-blue-500' : themeId === 'minimalist' ? 'bg-white border border-gray-300' : themeId === 'cartoon' ? 'bg-yellow-400' : themeId === 'cyberpunk' ? 'bg-magenta-500' : themeId === 'nature' ? 'bg-green-500' : themeId === 'royal' ? 'bg-purple-500' : 'bg-slate-400'}`}></div>
                         {t.themes[themeId]}
                      </button>
                    ))}
                  </div>
               </div>
             )}
          </div>

          <button onClick={handleResetView} className={`p-2 sm:px-5 sm:py-2.5 rounded-2xl text-[11px] font-bold border transition-all ${currentTheme === 'minimalist' ? 'bg-gray-100 border-gray-200 text-gray-600' : 'bg-white/5 border-white/10'}`} title={t.resetView}><i className="fas fa-compress-arrows-alt text-blue-400"></i><span className="hidden sm:inline ml-2">{t.resetView}</span></button>
          <button onClick={handleShare} className={`p-2 sm:px-5 sm:py-2.5 rounded-2xl text-[11px] font-bold border transition-all ${currentTheme === 'minimalist' ? 'bg-gray-100 border-gray-200 text-gray-600' : 'bg-white/5 border-white/10'}`}><i className="fas fa-share-alt text-indigo-400"></i><span className="hidden sm:inline ml-2">{t.share}</span></button>

          <div className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 p-1 rounded-2xl">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl overflow-hidden border border-white/10"><img src={user?.avatar || `https://i.pravatar.cc/150?u=${user?.email}`} alt="" className="w-full h-full object-cover" /></div>
            <button onClick={handleLogout} className="opacity-40 hover:opacity-100 text-[10px] sm:text-xs font-bold pr-2 sm:pr-3 transition-colors"><span className="hidden sm:inline">{t.logout}</span><i className="fas fa-power-off sm:hidden"></i></button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        <TreeRenderer ref={treeRef} members={members} onMemberSelect={setSelectedId} selectedId={selectedId || undefined} lang={lang} onInitialize={handleCreateSelf} isReadOnly={isViewingShared} theme={currentTheme} />
        {!isViewingShared && (
          <div className="absolute left-6 bottom-32 sm:bottom-8 flex flex-col gap-4">
            <button onClick={handleAddMember} className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all active:scale-90 group"><i className="fas fa-plus text-lg sm:text-xl transition-transform group-hover:rotate-90"></i></button>
          </div>
        )}
        {!isViewingShared && (
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 sm:px-8">
            <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[24px] sm:rounded-[32px] p-1.5 sm:p-2 flex items-center gap-1 sm:gap-2 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiParsing()} placeholder={t.aiPlaceholder} className="flex-1 bg-transparent border-none focus:outline-none text-white text-xs sm:text-sm px-4 placeholder:text-white/20" disabled={isAiLoading} />
                <button onClick={handleAiParsing} disabled={isAiLoading || !aiInput.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 text-white px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">{isAiLoading ? t.parsing : t.aiButton}</button>
            </div>
          </div>
        )}
      </main>

      {selectedMember && (<MemberEditor member={selectedMember} members={members} onUpdate={handleUpdateMember} onDelete={handleDeleteMember} onClose={() => setSelectedId(null)} lang={lang} />)}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} lang={lang} />}
      {shareUrl && <ShareModal url={shareUrl} onClose={() => setShareUrl(null)} lang={lang} />}
    </div>
  );
};

export default App;
