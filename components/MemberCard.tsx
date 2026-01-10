
import React from 'react';
import { FamilyMember, ThemeId } from '../types';

interface MemberCardProps {
  member: FamilyMember;
  onClick: (id: string) => void;
  x: number;
  y: number;
  isSelected?: boolean;
  theme?: ThemeId;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick, x, y, isSelected, theme = 'standard' }) => {
  const isMale = member.gender === 'male';
  
  // Theme configuration mapping
  const themeStyles = {
    standard: {
      card: `backdrop-blur-md border border-white/20 hover:bg-white/20 ${isSelected ? 'bg-blue-600/30 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`,
      shape: 'rounded-2xl',
      avatarBorder: isMale ? 'border-blue-500/50 bg-blue-500/10' : 'border-pink-500/50 bg-pink-500/10',
      textColor: 'text-white',
      subTextColor: 'text-white/40',
      genderBadge: isMale ? 'bg-blue-500' : 'bg-pink-500'
    },
    minimalist: {
      card: `bg-white border ${isSelected ? 'border-black ring-2 ring-black/5' : 'border-gray-100 hover:border-gray-300'}`,
      shape: 'rounded-none',
      avatarBorder: 'border-gray-200 bg-gray-50',
      textColor: 'text-gray-900',
      subTextColor: 'text-gray-400',
      genderBadge: isMale ? 'bg-blue-400' : 'bg-pink-400'
    },
    cartoon: {
      card: `bg-yellow-100 border-4 border-black ${isSelected ? 'translate-y-[-4px] translate-x-[-4px] shadow-[6px_6px_0_0_#000]' : 'hover:translate-y-[-2px] shadow-[4px_4px_0_0_#000]'}`,
      shape: 'rounded-3xl',
      avatarBorder: 'border-2 border-black bg-white',
      textColor: 'text-black',
      subTextColor: 'text-black/60',
      genderBadge: isMale ? 'bg-blue-400 border-black border-2' : 'bg-pink-400 border-black border-2'
    },
    handdrawn: {
      card: `bg-[#fdf6e3] border-2 border-slate-700 ${isSelected ? 'ring-2 ring-blue-500' : ''}`,
      shape: 'rounded-[30%_70%_70%_30%/30%_30%_70%_70%]',
      avatarBorder: 'border-2 border-slate-700 bg-slate-100',
      textColor: 'text-slate-800',
      subTextColor: 'text-slate-400',
      genderBadge: isMale ? 'bg-blue-500' : 'bg-pink-500'
    },
    flat: {
      card: `${isSelected ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'}`,
      shape: 'rounded-lg',
      avatarBorder: 'bg-white/10',
      textColor: 'text-white',
      subTextColor: 'text-white/50',
      genderBadge: isMale ? 'bg-blue-400' : 'bg-pink-400'
    },
    vintage: {
      card: `bg-[#d2b48c]/30 border-2 border-[#8b4513]/40 ${isSelected ? 'bg-[#d2b48c]/60 border-[#8b4513]' : ''}`,
      shape: 'rounded-md',
      avatarBorder: 'border-2 border-[#8b4513]/20 bg-[#f5f5dc]',
      textColor: 'text-[#5d4037]',
      subTextColor: 'text-[#8b4513]/60',
      genderBadge: 'bg-[#8b4513]'
    },
    cyberpunk: {
      card: `bg-black/80 border ${isSelected ? 'border-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'border-magenta-500 shadow-[0_0_10px_#d946ef] hover:border-white'}`,
      shape: 'rounded-sm',
      avatarBorder: 'border-cyan-500/50 bg-cyan-950',
      textColor: 'text-cyan-400 font-mono',
      subTextColor: 'text-magenta-400 text-[8px]',
      genderBadge: 'bg-yellow-400 text-black'
    },
    nature: {
      card: `bg-green-50 border border-green-200 ${isSelected ? 'bg-green-100 border-green-500 shadow-lg shadow-green-200' : 'hover:bg-green-100/50'}`,
      shape: 'rounded-full',
      avatarBorder: 'border-green-300 bg-white',
      textColor: 'text-green-900',
      subTextColor: 'text-green-600/60',
      genderBadge: 'bg-green-500'
    },
    royal: {
      card: `bg-purple-950 border-2 border-gold-500 ${isSelected ? 'ring-2 ring-gold-400 shadow-[0_0_20px_gold]' : ''}`,
      shape: 'rounded-xl',
      avatarBorder: 'border-2 border-gold-400 bg-purple-900',
      textColor: 'text-gold-100',
      subTextColor: 'text-gold-500/80 font-serif',
      genderBadge: 'bg-gold-500'
    },
    blueprint: {
      card: `bg-blue-950/40 border border-blue-400/30 ${isSelected ? 'bg-blue-900/60 border-blue-200 ring-1 ring-blue-300/50' : 'hover:bg-blue-900/30'}`,
      shape: 'rounded-none',
      avatarBorder: 'border border-blue-400/50 bg-blue-900/40',
      textColor: 'text-blue-200 font-mono',
      subTextColor: 'text-blue-400/60',
      genderBadge: 'bg-blue-400'
    }
  };

  const style = themeStyles[theme] || themeStyles.standard;

  return (
    <div 
      className={`absolute node-card-3d cursor-pointer group select-none transition-all duration-500`}
      style={{ 
        left: x, 
        top: y,
        width: '200px',
        height: '80px',
        transform: `translate3d(-50%, -50%, 0)`,
      }}
      onClick={() => onClick(member.id)}
    >
      {/* Dynamic Handdrawn filter if theme is handdrawn */}
      {theme === 'handdrawn' && (
         <svg className="hidden">
           <filter id="handdrawn-filter">
             <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
             <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
           </filter>
         </svg>
      )}

      {/* 3D Depth Layer */}
      {theme !== 'minimalist' && theme !== 'blueprint' && (
        <div className={`absolute inset-0 opacity-50 blur-sm translate-z-[-10px] translate-x-1 translate-y-1 ${style.shape} ${theme === 'cartoon' ? 'bg-black' : 'bg-slate-800'}`}></div>
      )}
      
      {/* Main Surface */}
      <div className={`
        relative h-full w-full p-3 flex items-center gap-3 transition-all duration-300 transform-style-3d
        ${style.card} ${style.shape}
        ${theme === 'handdrawn' ? '[filter:url(#handdrawn-filter)]' : ''}
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
