
import React from 'react';
import { FamilyMember, Gender } from '../types';
import { Language, translations } from '../translations';

interface MemberEditorProps {
  member: FamilyMember;
  members: FamilyMember[];
  onUpdate: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  lang: Language;
}

const MemberEditor: React.FC<MemberEditorProps> = ({ member, members, onUpdate, onDelete, onClose, lang }) => {
  const t = translations[lang];

  const handleChange = (field: keyof FamilyMember, value: string) => {
    if (field === 'birthDate' && value) {
      const parts = value.split('-');
      if (parts[0] && parts[0].length > 4) return;
    }
    onUpdate({ ...member, [field]: value });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-slate-900/95 backdrop-blur-3xl border-l border-white/10 p-6 sm:p-8 shadow-2xl z-[60] overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white font-outfit">{t.details}</h2>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-2">
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <div className="space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">{t.name}</label>
          <input
            type="text"
            value={member.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-white/20"
            placeholder={t.namePlaceholder}
          />
        </div>

        {/* Photo URL */}
        <div>
          <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">{t.photoUrl}</label>
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {member.photo ? (
                <img src={member.photo} className="w-full h-full object-cover" alt="" />
              ) : (
                <i className="fas fa-image text-white/10"></i>
              )}
            </div>
            <input
              type="text"
              value={member.photo || ''}
              onChange={(e) => handleChange('photo', e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs placeholder:text-white/20"
              placeholder="https://images.unsplash.com/..."
            />
          </div>
          <p className="text-[9px] text-white/30 mt-2 italic">{t.photoTip}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gender Select */}
          <div>
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">{t.gender}</label>
            <div className="relative">
              <select
                value={member.gender}
                onChange={(e) => handleChange('gender', e.target.value as Gender)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
              >
                <option value="male" className="bg-slate-900">{t.male}</option>
                <option value="female" className="bg-slate-900">{t.female}</option>
                <option value="other" className="bg-slate-900">{t.other}</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none text-[10px]"></i>
            </div>
          </div>
          {/* Birth Date Input */}
          <div>
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">{t.birthDate}</label>
            <input
              type="date"
              value={member.birthDate || ''}
              max={today}
              min="1000-01-01"
              onChange={(e) => handleChange('birthDate', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Spouse Select */}
        <div>
          <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">{t.spouse}</label>
          <div className="relative">
            <select
              value={member.spouseId || ''}
              onChange={(e) => handleChange('spouseId', e.target.value)}
              className="w-full bg-slate-800 border border-emerald-500/20 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">{t.none}</option>
              {members.filter(m => m.id !== member.id).map(m => (
                <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>
              ))}
            </select>
            <i className="fas fa-ring absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400/40 pointer-events-none text-[10px]"></i>
          </div>
        </div>

        {/* Parent 1 Select */}
        <div>
          <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">{t.parent1}</label>
          <div className="relative">
            <select
              value={member.parentId1 || ''}
              onChange={(e) => handleChange('parentId1', e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">{t.none}</option>
              {members.filter(m => m.id !== member.id).map(m => (
                <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>
              ))}
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none text-[10px]"></i>
          </div>
        </div>

        {/* Parent 2 Select */}
        <div>
          <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">{t.parent2}</label>
          <div className="relative">
            <select
              value={member.parentId2 || ''}
              onChange={(e) => handleChange('parentId2', e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">{t.none}</option>
              {members.filter(m => m.id !== member.id).map(m => (
                <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>
              ))}
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none text-[10px]"></i>
          </div>
        </div>

        {/* Bio Textarea */}
        <div>
          <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">{t.bio}</label>
          <textarea
            value={member.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm placeholder:text-white/20 resize-none"
            placeholder={t.bioPlaceholder}
          />
        </div>

        {/* Delete Button */}
        <div className="pt-6 border-t border-white/5">
          <button 
            onClick={() => onDelete(member.id)}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 group"
          >
            <i className="fas fa-trash-alt opacity-50 group-hover:opacity-100 transition-opacity"></i>
            {t.deleteMember}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberEditor;
