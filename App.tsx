
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
  const [meId, setMeId] = useState<string | null>(null);
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
          
          const storedMeId = localStorage.getItem('phopo_me_id');
          if (storedMeId) setMeId(storedMeId);
        }
      } catch (e) { console.error("Initialization Failed", e); } finally { setIsLoading(false); }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!user || isViewingShared || (members.length === 0 && !meId)) return;
    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try { 
        await api.saveMembers(members); 
        if (meId) localStorage.setItem('phopo_me_id', meId);
        else localStorage.removeItem('phopo_me_id');
      } catch (e) { console.error("Sync Error", e); } finally { setIsSyncing(false); }
    }, 1500);
    return () => clearTimeout(timer);
  }, [members, user, isViewingShared, meId]);

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
    setMeId(null);
    localStorage.removeItem('phopo_me_id');
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
    setMeId(newId);
    setSelectedId(newId);
    setTimeout(() => handleResetView(), 500);
  }, [user, lang]);

  const handleUpdateMember = useCallback((updated: FamilyMember) => {
    if (!user) return;
    setMembers(prev => {
      let nextMembers = prev.map(m => m.id === updated.id ? updated : m);
      // Bi-directional spouse linkage logic
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
    if (meId === id) setMeId(null);
    setSelectedId(null);
  }, [user, meId]);

  const handleAiParsing = async () => {
    if (!aiInput.trim() || !user) return;
    setIsAiLoading(true);
    try {
      const parsedData: ParsedFamilyMember[] = await parseFamilyText(aiInput, members);
      
      setMembers(prev => {
        const nameToIdMap = new Map<string, string>();
        prev.forEach(m => nameToIdMap.set(m.name, m.id));
        
        const timestamp = Date.now();
        let nextMembers = [...prev];

        // 1. Create or Identify individuals
        parsedData.forEach((data, idx) => {
          if (!data.name) return;
          const trimmedName = data.name.trim();
          if (!nameToIdMap.has(trimmedName)) {
            const newId = `ai-${timestamp}-${idx}`;
            nameToIdMap.set(trimmedName, newId);
            nextMembers.push({
              id: newId,
              name: trimmedName,
              gender: (data.gender as any) || 'male',
              birthDate: data.birthDate,
              bio: data.bio
            });
          } else {
            // Update basic info for existing members
            const mIdx = nextMembers.findIndex(m => m.name === trimmedName);
            if (mIdx !== -1) {
              if (data.gender) nextMembers[mIdx].gender = data.gender as any;
              if (data.birthDate) nextMembers[mIdx].birthDate = data.birthDate;
              if (data.bio) nextMembers[mIdx].bio = data.bio;
            }
          }
        });

        // 2. Resolve Direct Relationships from AI output
        nextMembers = nextMembers.map(m => {
          const aiData = parsedData.find(d => d.name?.trim() === m.name);
          if (!aiData) return m;

          const updated = { ...m };
          
          // Spouse resolution
          if (aiData.spouseName) {
            const sId = nameToIdMap.get(aiData.spouseName.trim());
            if (sId) updated.spouseId = sId;
          }

          // Parent resolution from parentNames
          if (aiData.parentNames && aiData.parentNames.length > 0) {
            aiData.parentNames.forEach(pName => {
              const pId = nameToIdMap.get(pName.trim());
              if (!pId) return;

              const parentObj = nextMembers.find(pm => pm.id === pId);
              if (!parentObj) return;

              if (parentObj.gender === 'male') updated.parentId1 = pId;
              else if (parentObj.gender === 'female') updated.parentId2 = pId;
              else {
                if (!updated.parentId1) updated.parentId1 = pId;
                else if (!updated.parentId2) updated.parentId2 = pId;
              }
            });
          }
          return updated;
        });

        // 3. Relational Inference Engine
        // Pass A: Auto-link spouses as second parents for existing children
        nextMembers = nextMembers.map(child => {
          const updated = { ...child };
          
          // If child has Parent 1 but not Parent 2, check if Parent 1 has a spouse
          if (updated.parentId1 && !updated.parentId2) {
            const p1 = nextMembers.find(m => m.id === updated.parentId1);
            if (p1?.spouseId) {
              const spouse = nextMembers.find(m => m.id === p1.spouseId);
              if (spouse?.gender === 'female') updated.parentId2 = spouse.id;
            }
          }

          // If child has Parent 2 but not Parent 1, check if Parent 2 has a spouse
          if (updated.parentId2 && !updated.parentId1) {
            const p2 = nextMembers.find(m => m.id === updated.parentId2);
            if (p2?.spouseId) {
              const spouse = nextMembers.find(m => m.id === p2.spouseId);
              if (spouse?.gender === 'male') updated.parentId1 = spouse.id;
            }
          }
          return updated;
        });

        // Pass B: Bi-directional spouse safety (ensure spouse links are mutual)
        nextMembers = nextMembers.map(m => {
          if (!m.spouseId) {
            const partner = nextMembers.find(other => other.spouseId === m.id);
            if (partner) return { ...m, spouseId: partner.id };
          }
          return m;
        });

        return nextMembers;
      });

      setAiInput('');
    } catch (e) { 
      console.error("Advanced AI Processing Error:", e); 
    } finally { 
      setIsAiLoading(false); 
    }
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
        <TreeRenderer 
          ref={treeRef} 
          members={members} 
          onMemberSelect={setSelectedId} 
          selectedId={selectedId || undefined} 
          lang={lang} 
          onInitialize={handleCreateSelf} 
          isReadOnly={isViewingShared} 
          theme={currentTheme} 
          meId={meId}
        />

        {!isViewingShared && (
          <div className="absolute bottom-8 left-0 right-0 px-8 z-40 pointer-events-none">
            <div className="max-w-4xl mx-auto flex items-end gap-4 pointer-events-auto">
              <button 
                onClick={handleAddMember} 
                className="h-16 w-16 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] shadow-2xl flex items-center justify-center transition-all active:scale-90 group shrink-0 border border-white/10"
                title={t.addMember}
              >
                <i className="fas fa-plus text-xl transition-transform group-hover:rotate-90"></i>
              </button>

              <div className="flex-1">
                <div className="h-16 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[24px] p-2 flex items-center gap-2 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/10 shrink-0">
                       <i className="fas fa-magic text-blue-400 text-xs"></i>
                    </div>
                    <input 
                      type="text" 
                      value={aiInput} 
                      onChange={(e) => setAiInput(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleAiParsing()} 
                      placeholder={t.aiPlaceholder} 
                      className="flex-1 bg-transparent border-none focus:outline-none text-white text-sm px-2 placeholder:text-white/20" 
                      disabled={isAiLoading} 
                    />
                    <button 
                      onClick={handleAiParsing} 
                      disabled={isAiLoading || !aiInput.trim()} 
                      className="h-full px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0"
                    >
                      {isAiLoading ? t.parsing : t.aiButton}
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedMember && (
        <MemberEditor 
          member={selectedMember} 
          members={members} 
          onUpdate={handleUpdateMember} 
          onDelete={handleDeleteMember} 
          onClose={() => setSelectedId(null)} 
          lang={lang} 
          isMe={meId === selectedMember.id}
          onSetMe={setMeId}
        />
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} lang={lang} />}
      {shareUrl && <ShareModal url={shareUrl} onClose={() => setShareUrl(null)} lang={lang} />}
    </div>
  );
};

export default App;
