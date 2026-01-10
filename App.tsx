
import React, { useState, useCallback, useEffect } from 'react';
import { FamilyMember, User } from './types';
import TreeRenderer from './components/TreeRenderer';
import MemberEditor from './components/MemberEditor';
import AuthModal from './components/AuthModal';
import ShareModal from './components/ShareModal';
import LandingPage from './components/LandingPage';
import { parseFamilyText, ParsedFamilyMember } from './services/geminiService';
import { Language, translations } from './translations';
import { api } from './services/api';
import { generateShareLink, loadSharedTree } from './services/persistenceService';

const App: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [lang, setLang] = useState<Language>('zh');
  const [showAuth, setShowAuth] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isViewingShared, setIsViewingShared] = useState(false);
  
  // Full-Stack States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const t = translations[lang];

  // 1. Initial Data Fetch
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
      } catch (e) {
        console.error("Initialization Failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // 2. Automated Sync Logic
  useEffect(() => {
    if (!user || isViewingShared || members.length === 0) return;

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try {
        await api.saveMembers(members);
      } catch (e) {
        console.error("Sync Error", e);
      } finally {
        setIsSyncing(false);
      }
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

  const handleShare = () => {
    const url = generateShareLink(members);
    setShareUrl(url);
  };

  const selectedMember = members.find(m => m.id === selectedId);

  const handleAddMember = useCallback(() => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    const newId = `m-${Date.now()}`;
    const newMember: FamilyMember = {
      id: newId,
      name: lang === 'zh' ? '新成员' : lang === 'ja' ? '新メンバー' : 'New Member',
      gender: 'male',
    };
    setMembers(prev => [...prev, newMember]);
    setSelectedId(newId);
  }, [lang, user]);

  const handleCreateSelf = useCallback(() => {
    if (!user) return;
    const newId = `m-self-${Date.now()}`;
    const newMember: FamilyMember = {
      id: newId,
      name: user.name,
      gender: 'male',
      photo: user.avatar,
      bio: lang === 'zh' ? '这是我。' : 'This is me.'
    };
    setMembers([newMember]);
    setSelectedId(newId);
  }, [user, lang]);

  const handleUpdateMember = useCallback((updated: FamilyMember) => {
    if (!user) return;
    setMembers(prev => {
      let nextMembers = prev.map(m => m.id === updated.id ? updated : m);
      
      // Automatic Bidirectional Spouse Update
      if (updated.spouseId) {
        nextMembers = nextMembers.map(m => {
          if (m.id === updated.spouseId) {
            return { ...m, spouseId: updated.id };
          }
          if (m.spouseId === updated.id && m.id !== updated.spouseId) {
            return { ...m, spouseId: undefined };
          }
          return m;
        });
      } else {
        nextMembers = nextMembers.map(m => {
          if (m.spouseId === updated.id) {
            return { ...m, spouseId: undefined };
          }
          return m;
        });
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
        const currentMembers = [...prev];
        const newMembers: FamilyMember[] = [];
        
        // 1. Create a combined lookup for existing and new members by name
        const nameToIdMap = new Map<string, string>();
        currentMembers.forEach(m => nameToIdMap.set(m.name, m.id));

        // 2. First Pass: Instantiate new members and map names
        parsedData.forEach((data, idx) => {
          if (!data.name) return;
          
          // If member already exists by name, don't recreate, but update if necessary
          let memberId = nameToIdMap.get(data.name);
          if (!memberId) {
            memberId = `ai-${Date.now()}-${idx}`;
            nameToIdMap.set(data.name, memberId);
            const newMember: FamilyMember = {
              id: memberId,
              name: data.name,
              gender: (data.gender as any) || 'male',
              birthDate: data.birthDate,
              bio: data.bio,
            };
            newMembers.push(newMember);
          }
        });

        const allPotentialMembers = [...currentMembers, ...newMembers];

        // 3. Second Pass: Resolve relationships using nameToIdMap
        parsedData.forEach(data => {
          if (!data.name) return;
          const memberId = nameToIdMap.get(data.name);
          const memberIndex = allPotentialMembers.findIndex(m => m.id === memberId);
          
          if (memberIndex !== -1) {
            const member = allPotentialMembers[memberIndex];
            
            if (data.fatherName) {
              const fId = nameToIdMap.get(data.fatherName);
              if (fId) member.parentId1 = fId;
            }
            if (data.motherName) {
              const mId = nameToIdMap.get(data.motherName);
              if (mId) member.parentId2 = mId;
            }
            if (data.spouseName) {
              const sId = nameToIdMap.get(data.spouseName);
              if (sId) {
                member.spouseId = sId;
                // Ensure bidirectional spouse link
                const spouse = allPotentialMembers.find(m => m.id === sId);
                if (spouse) spouse.spouseId = member.id;
              }
            }
          }
        });

        return [...allPotentialMembers];
      });

      setAiInput('');
    } catch (e) {
      console.error("AI Error:", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const showLanding = !user && !isViewingShared;

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center animate-bounce shadow-2xl">
            <i className="fas fa-tree text-white text-2xl"></i>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showLanding) {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col">
          <div className="fixed top-8 right-8 z-50 flex gap-2">
            {(['zh', 'en', 'ja'] as Language[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all backdrop-blur-md ${lang === l ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 hover:text-white border border-white/10'}`}
              >
                {l}
              </button>
            ))}
            <button 
              onClick={() => setShowAuth(true)}
              className="bg-white/5 hover:bg-white/10 text-white px-5 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 transition-all ml-2"
            >
              {t.login}
            </button>
          </div>
          <LandingPage onStart={() => setShowAuth(true)} lang={lang} />
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} lang={lang} />}
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden text-slate-200 bg-[#020617]">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-3xl font-black text-white font-outfit tracking-tighter flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl">
              <i className="fas fa-tree text-white text-sm"></i>
            </div>
            {t.appName}<span className="text-blue-500">.</span>
          </h1>
          <div className="flex items-center gap-2 mt-2 ml-13">
             <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
             <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em]">
                {isSyncing ? t.syncing : (isViewingShared ? t.readOnly : t.synced)}
             </p>
          </div>
        </div>

        <div className="flex gap-4 pointer-events-auto items-center">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl flex gap-1 mr-4">
            {(['zh', 'en', 'ja'] as Language[]).map(l => (
              <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${lang === l ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>{l}</button>
            ))}
          </div>

          <button onClick={handleShare} className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 text-sm font-bold shadow-lg">
            <i className="fas fa-share-nodes text-indigo-400"></i>
            {t.share}
          </button>

          {!isViewingShared && (
            <button onClick={handleAddMember} className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 text-sm font-bold shadow-lg">
              <i className="fas fa-plus text-blue-400"></i>
              {t.addMember}
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3 ml-2 group relative">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">{t.welcome.split('，')[0]}</p>
                <p className="text-xs font-bold text-white">{user.name}</p>
              </div>
              <img src={user.avatar} className="w-10 h-10 rounded-xl border border-white/10 shadow-lg" alt={user.name} />
              <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all">
                <button onClick={handleLogout} className="bg-slate-900 border border-white/10 px-6 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors whitespace-nowrap shadow-2xl">
                  <i className="fas fa-power-off mr-2"></i>{t.logout}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all ml-2">
              <i className="fas fa-user-circle mr-2"></i>{t.login}
            </button>
          )}
        </div>
      </header>

      {/* Visualizer */}
      <main className="w-full h-full relative z-0">
        <TreeRenderer 
          members={members} 
          onMemberSelect={setSelectedId} 
          selectedId={selectedId || undefined} 
          lang={lang} 
          onInitialize={handleCreateSelf}
          isReadOnly={isViewingShared}
        />
      </main>

      {/* AI Panel */}
      {user && !isViewingShared && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-20">
          <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-2 ring-1 ring-white/5">
            <div className="pl-4 text-blue-400/60"><i className="fas fa-sparkles"></i></div>
            <input type="text" placeholder={t.aiPlaceholder} className="flex-1 bg-transparent px-2 py-3.5 focus:outline-none text-sm text-white placeholder:text-white/20" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiParsing()} />
            <button disabled={isAiLoading || !aiInput.trim()} onClick={handleAiParsing} className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isAiLoading || !aiInput.trim() ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}>
              {isAiLoading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
              <span>{isAiLoading ? t.parsing : t.aiButton}</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      {selectedMember && user && !isViewingShared && (
        <MemberEditor member={selectedMember} members={members} onUpdate={handleUpdateMember} onDelete={handleDeleteMember} onClose={() => setSelectedId(null)} lang={lang} />
      )}

      {/* Modals */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} lang={lang} />}
      {shareUrl && <ShareModal url={shareUrl} onClose={() => setShareUrl(null)} lang={lang} />}

      {/* Interaction Tips */}
      <div className="absolute top-1/2 right-8 -translate-y-1/2 flex flex-col items-center gap-6 opacity-40 hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <div className="flex flex-col gap-2 items-center"><div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[10px]"><i className="fas fa-mouse-pointer"></i></div><div className="text-[9px] font-black uppercase tracking-tighter vertical-text text-white/50">{t.leftPan}</div></div>
        <div className="flex flex-col gap-2 items-center"><div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-blue-400"><i className="fas fa-sync-alt"></i></div><div className="text-[9px] font-black uppercase tracking-tighter vertical-text text-blue-400/70">{t.rightRotate}</div></div>
        <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
        <div className="flex flex-col gap-2 items-center"><div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[10px]"><i className="fas fa-arrows-up-down"></i></div><div className="text-[9px] font-black uppercase tracking-tighter vertical-text text-white/50">{t.scrollZoom}</div></div>
      </div>
    </div>
  );
};

export default App;
