
// Added missing React import to resolve namespace error
import React from 'react';
import { FamilyMember, ThemeId } from '../types';

interface MemberCardProps {
  member: FamilyMember;
  onClick: (id: string) => void;
  x: number;
  y: number;
  isSelected?: boolean;
  theme?: ThemeId;
  isMe?: boolean;
  meLabel?: string;
}

const MemberCard: React.FC<MemberCardProps> = ({ 
  member, onClick, x, y, isSelected, theme = 'standard', isMe, meLabel = "ME" 
}) => {
  const isMale = member.gender === 'male';
  
  // Theme configuration mapping
  const themeStyles = {
    standard: {
      card: `backdrop-blur-md border ${isMe ? 'border-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'border-white/20'} hover:bg-white/20 ${isSelected ? 'bg-blue-600/30 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`,
      shape: 'rounded-2xl',
      avatarBorder: isMale ? 'border-blue-500/50 bg-blue-500/10' : 'border-pink-500/50 bg-pink-500/10',
      textColor: 'text-white',
      subTextColor: 'text-white/40',
      genderBadge: isMale ? 'bg-blue-500' : 'bg-pink-500',
      meBadge: 'bg-yellow-400 text-black',
      tooltip: 'bg-black/60 border-white/10'
    },
    minimalist: {
      card: `bg-white border ${isMe ? 'border-black ring-4 ring-black/5 shadow-xl' : isSelected ? 'border-black ring-2 ring-black/5' : 'border-gray-100 hover:border-gray-300'}`,
      shape: 'rounded-none',
      avatarBorder: 'border-gray-200 bg-gray-50',
      textColor: 'text-gray-900',
      subTextColor: 'text-gray-400',
      genderBadge: isMale ? 'bg-blue-400' : 'bg-pink-400',
      meBadge: 'bg-black text-white',
      tooltip: 'bg-white border-gray-200 shadow-xl text-gray-800'
    },
    cyberpunk: {
      card: `bg-black/80 border ${isMe ? 'border-yellow-400 shadow-[0_0_20px_#facc15]' : isSelected ? 'border-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'border-magenta-500 shadow-[0_0_10px_#d946ef] hover:border-white'}`,
      shape: 'rounded-sm',
      avatarBorder: 'border-cyan-500/50 bg-cyan-950',
      textColor: 'text-cyan-400 font-mono',
      subTextColor: 'text-magenta-400 text-[8px]',
      genderBadge: 'bg-yellow-400 text-black',
      meBadge: 'bg-yellow-400 text-black',
      tooltip: 'bg-black/90 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.2)]'
    }
    // Fallback logic handled below
  };

  const style = (themeStyles as any)[theme] || themeStyles.standard;

  return (
    <div 
      className={`absolute node-card-3d cursor-pointer group select-none transition-all duration-500 ${isMe || isSelected ? 'z-50' : 'z-10 hover:z-50'}`}
      style={{ 
        left: x, 
        top: y,
        width: '200px',
        height: '80px',
        transform: `translate3d(-50%, -50%, ${isMe ? '20px' : '0px'})`,
      }}
      onClick={() => onClick(member.id)}
    >
      {/* 3D Depth Layer */}
      {theme !== 'minimalist' && theme !== 'blueprint' && (
        <div className={`absolute inset-0 opacity-50 blur-sm translate-z-[-10px] translate-x-1 translate-y-1 ${style.shape} ${theme === 'cartoon' ? 'bg-black' : isMe ? 'bg-yellow-600/20' : 'bg-slate-800'}`}></div>
      )}
      
      {/* Me Badge */}
      {isMe && (
        <div className={`
          absolute -top-3 -right-3 z-50 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl border border-black/10 transition-transform group-hover:scale-110
          ${style.meBadge}
        `}>
          {meLabel}
        </div>
      )}

      {/* --- Hover Bio Tooltip --- */}
      <div className={`
        absolute left-[105%] top-1/2 -translate-y-1/2 ml-4 w-72 p-5 
        backdrop-blur-2xl border rounded-3xl shadow-2xl 
        opacity-0 pointer-events-none translate-x-4
        group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto
        transition-all duration-300 ease-out z-[100]
        ${style.tooltip || 'bg-black/70 border-white/10 text-white'}
      `}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-1 h-4 rounded-full ${isMale ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
          <span className="text-xs font-black uppercase tracking-widest opacity-40">{member.name}</span>
        </div>
        <div className="max-h-48 overflow-y-auto custom-scrollbar">
          <p className="text-sm leading-relaxed font-medium">
            {member.bio || (
              <span className="opacity-30 italic font-normal">
                {member.gender === 'male' ? '这位先生' : '这位女士'} 暂时没有留下文字记录，正在等待你书写家园的故事。
              </span>
            )}
          </p>
        </div>
        {member.birthDate && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between opacity-50">
            <span className="text-[10px] font-bold uppercase tracking-tighter">Born</span>
            <span className="text-[10px] font-mono">{member.birthDate}</span>
          </div>
        )}
      </div>

      {/* Main Surface */}
      <div className={`
        relative h-full w-full p-3 flex items-center gap-3 transition-all duration-300 transform-style-3d
        ${style.card} ${style.shape}
      `}>
        {/* Avatar Container */}
        <div className={`
          relative w-14 h-14 flex items-center justify-center shrink-0 overflow-hidden shadow-inner transition-all
          ${style.avatarBorder} ${style.shape}
        `}>
          {member.photo ? (
            <img src={member.photo} className="w-full h-full object-cover transition-transform group-hover:scale-125" alt={member.name} />
          ) : (
            <i className={`fas ${isMale ? 'fa-user' : 'fa-user-nurse'} text-xl opacity-60`}></i>
          )}
          
          <div className={`
            absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center border border-black/10
            ${style.genderBadge}
          `}>
             <i className={`fas ${isMale ? 'fa-mars' : 'fa-venus'} text-[8px] text-white`}></i>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 overflow-hidden">
          <h3 className={`font-bold text-sm truncate tracking-tight ${style.textColor}`}>{member.name}</h3>
          <p className={`text-[9px] font-black uppercase tracking-[0.15em] mt-0.5 ${style.subTextColor}`}>
            {member.birthDate ? member.birthDate.split('-')[0] : '????'}
          </p>
        </div>

        {/* Edit Hint Icon */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-5 h-5 bg-black/5 rounded-full flex items-center justify-center">
            <i className={`fas fa-pencil text-[8px] opacity-40 ${style.textColor}`}></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberCard;
