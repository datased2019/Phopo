
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
  
  // Helper to format year or return placeholder
  const getDisplayYear = () => {
    if (!member.birthDate) return '----';
    const str = member.birthDate.toString().trim();
    if (str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str === '') return '----';
    return str.split('-')[0];
  };

  // Theme configuration mapping
  // We use shadow rings instead of thin borders for better anti-aliasing in 3D
  const themeStyles = {
    standard: {
      // Dark Glass with distinct edges
      card: `backdrop-blur-xl ${isMe ? 'bg-slate-900/90 ring-2 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]' : isSelected ? 'bg-blue-900/90 ring-2 ring-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.4)]' : 'bg-slate-900/80 ring-1 ring-white/30 hover:bg-slate-800/90 hover:ring-white/50'}`,
      shape: 'rounded-2xl',
      avatarBorder: isMale ? 'ring-2 ring-blue-500 bg-blue-950' : 'ring-2 ring-pink-500 bg-pink-950',
      textColor: 'text-white font-bold',
      subTextColor: 'text-blue-200/60 font-semibold',
      genderBadge: isMale ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white',
      meBadge: 'bg-yellow-400 text-black',
      depthColor: 'bg-slate-950',
      tooltip: 'bg-slate-900 border-white/20'
    },
    minimalist: {
      // High contrast white paper look
      card: `bg-white ${isMe ? 'ring-4 ring-black shadow-2xl' : isSelected ? 'ring-4 ring-blue-600' : 'ring-2 ring-gray-900 hover:ring-4'}`,
      shape: 'rounded-lg',
      avatarBorder: 'ring-2 ring-gray-100 bg-gray-50',
      textColor: 'text-black font-extrabold tracking-tight',
      subTextColor: 'text-gray-500 font-bold',
      genderBadge: isMale ? 'bg-black text-white' : 'bg-gray-200 text-black',
      meBadge: 'bg-black text-white',
      depthColor: 'bg-gray-300',
      tooltip: 'bg-white border-black text-black shadow-[8px_8px_0px_rgba(0,0,0,1)]'
    },
    cartoon: {
      // Pop art colors
      card: `bg-yellow-50 ${isMe ? 'ring-4 ring-red-500 shadow-[4px_4px_0px_rgba(0,0,0,1)]' : isSelected ? 'ring-4 ring-blue-500 shadow-[4px_4px_0px_rgba(0,0,0,1)]' : 'ring-4 ring-black hover:translate-y-[-2px] shadow-[4px_4px_0px_rgba(0,0,0,1)]'}`,
      shape: 'rounded-xl',
      avatarBorder: 'ring-2 ring-black bg-white',
      textColor: 'text-black font-black',
      subTextColor: 'text-black/60 font-bold',
      genderBadge: isMale ? 'bg-blue-400 text-black border border-black' : 'bg-pink-400 text-black border border-black',
      meBadge: 'bg-red-500 text-white border-2 border-black',
      depthColor: 'bg-black', // Cartoon usually doesn't use the depth blur layer, but solid shadow
      tooltip: 'bg-yellow-100 border-2 border-black text-black'
    },
    cyberpunk: {
      // Neon Glows
      card: `bg-black/90 ${isMe ? 'border-2 border-yellow-400 shadow-[0_0_20px_#facc15,inset_0_0_20px_rgba(250,204,21,0.2)]' : isSelected ? 'border-2 border-cyan-400 shadow-[0_0_20px_#22d3ee,inset_0_0_20px_rgba(34,211,238,0.2)]' : 'border-2 border-fuchsia-600 shadow-[0_0_10px_#d946ef] hover:border-white hover:shadow-[0_0_20px_white]'}`,
      shape: 'rounded-none clip-path-polygon', // We simulate angular cuts via rounded-none for now
      avatarBorder: 'border-2 border-cyan-500 bg-black',
      textColor: 'text-cyan-400 font-mono font-bold tracking-wider',
      subTextColor: 'text-fuchsia-500 font-mono font-bold text-[10px]',
      genderBadge: 'bg-yellow-400 text-black font-bold',
      meBadge: 'bg-yellow-400 text-black font-bold box-decoration-clone',
      depthColor: 'bg-fuchsia-900/50',
      tooltip: 'bg-black border border-cyan-500 text-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
    },
    blueprint: {
      // Technical drawing
      card: `bg-blue-900 ${isMe ? 'border-2 border-white border-dashed' : isSelected ? 'border-2 border-white' : 'border border-white/60 hover:bg-blue-800'}`,
      shape: 'rounded-sm',
      avatarBorder: 'border border-white/50 bg-blue-950',
      textColor: 'text-white font-mono font-bold',
      subTextColor: 'text-white/70 font-mono',
      genderBadge: 'bg-white text-blue-900',
      meBadge: 'bg-white text-blue-900',
      depthColor: 'bg-blue-950',
      tooltip: 'bg-blue-900 border border-white text-white font-mono'
    },
    nature: {
      card: `backdrop-blur-xl ${isMe ? 'bg-emerald-900/90 ring-2 ring-yellow-400' : isSelected ? 'bg-emerald-800/90 ring-2 ring-emerald-400' : 'bg-emerald-950/80 ring-1 ring-emerald-400/30 hover:bg-emerald-900/90'}`,
      shape: 'rounded-3xl',
      avatarBorder: 'ring-2 ring-emerald-400/50 bg-emerald-950',
      textColor: 'text-emerald-50 font-bold',
      subTextColor: 'text-emerald-200/60 font-semibold',
      genderBadge: 'bg-emerald-600 text-white',
      meBadge: 'bg-yellow-500 text-white',
      depthColor: 'bg-emerald-950',
      tooltip: 'bg-emerald-950 border-emerald-500/30'
    },
    royal: {
      card: `bg-purple-950 ${isMe ? 'ring-2 ring-yellow-400 shadow-xl' : isSelected ? 'ring-2 ring-purple-400' : 'ring-1 ring-yellow-600/40 hover:ring-yellow-500'}`,
      shape: 'rounded-xl',
      avatarBorder: 'ring-2 ring-yellow-500 bg-purple-900',
      textColor: 'text-yellow-50 font-serif font-bold tracking-wide',
      subTextColor: 'text-yellow-500/80 font-serif',
      genderBadge: 'bg-purple-600 text-yellow-400 border border-yellow-500',
      meBadge: 'bg-yellow-500 text-purple-900 font-serif',
      depthColor: 'bg-purple-950',
      tooltip: 'bg-purple-950 border border-yellow-500/50'
    }
  };

  const style = (themeStyles as any)[theme] || themeStyles.standard;

  return (
    <div 
      className={`absolute node-card-3d cursor-pointer group select-none ${isMe || isSelected ? 'z-50' : 'z-10 hover:z-50'}`}
      style={{ 
        left: x, 
        top: y,
        width: '220px', // Slightly wider for better text flow
        height: '84px',
        transform: `translate3d(-50%, -50%, ${isMe ? '20px' : '0px'})`,
      }}
      onClick={() => onClick(member.id)}
    >
      {/* 3D Depth Layer (The "Side" of the card) */}
      {theme !== 'minimalist' && theme !== 'blueprint' && (
        <div className={`absolute inset-0 opacity-100 translate-z-[-6px] translate-x-[6px] translate-y-[6px] ${style.shape} ${style.depthColor} transition-colors duration-300`}></div>
      )}
      
      {/* Me Badge */}
      {isMe && (
        <div className={`
          absolute -top-3 -right-3 z-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-transform group-hover:scale-110
          ${style.meBadge}
        `}>
          {meLabel}
        </div>
      )}

      {/* --- Hover Bio Tooltip --- */}
      <div className={`
        absolute left-[100%] top-0 ml-6 w-72 p-5 
        rounded-2xl shadow-2xl 
        opacity-0 pointer-events-none translate-x-4
        group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto
        transition-all duration-200 ease-out z-[100]
        border backdrop-blur-3xl
        ${style.tooltip || 'bg-black/90 border-white/10 text-white'}
      `}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-1 h-5 rounded-full ${isMale ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
          <span className="text-sm font-black uppercase tracking-widest opacity-80">{member.name}</span>
        </div>
        <div className="max-h-48 overflow-y-auto custom-scrollbar">
          <p className="text-sm leading-relaxed font-medium opacity-90">
            {member.bio || (
              <span className="opacity-50 italic font-normal">
                {member.gender === 'male' ? '这位先生' : '这位女士'} 暂时没有留下文字记录，正在等待你书写家园的故事。
              </span>
            )}
          </p>
        </div>
        {getDisplayYear() !== '----' && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between opacity-60">
            <span className="text-[10px] font-bold uppercase tracking-tighter">Born</span>
            <span className="text-xs font-mono font-bold">{member.birthDate}</span>
          </div>
        )}
      </div>

      {/* Main Surface */}
      <div className={`
        relative h-full w-full p-3.5 flex items-center gap-4 transition-all duration-300
        ${style.card} ${style.shape}
      `}>
        {/* Avatar Container */}
        <div className={`
          relative w-14 h-14 flex items-center justify-center shrink-0 overflow-hidden shadow-sm transition-all
          ${style.avatarBorder} ${style.shape} ${theme === 'standard' ? 'rounded-xl' : ''}
        `}>
          {member.photo ? (
            <img src={member.photo} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={member.name} />
          ) : (
            <i className={`fas ${isMale ? 'fa-user' : 'fa-user-nurse'} text-2xl opacity-70`}></i>
          )}
          
          <div className={`
            absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center shadow-md
            ${style.genderBadge}
          `}>
             <i className={`fas ${isMale ? 'fa-mars' : 'fa-venus'} text-[10px]`}></i>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 overflow-hidden min-w-0">
          <h3 className={`text-base truncate ${style.textColor}`}>{member.name}</h3>
          <p className={`text-[10px] uppercase tracking-[0.15em] mt-1 ${style.subTextColor}`}>
            {getDisplayYear()}
          </p>
        </div>

        {/* Edit Hint Icon */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${theme === 'minimalist' ? 'bg-gray-100' : 'bg-white/10'}`}>
            <i className={`fas fa-pencil text-[10px] opacity-60 ${style.textColor}`}></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberCard;
