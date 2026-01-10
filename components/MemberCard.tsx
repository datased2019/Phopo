
import React from 'react';
import { FamilyMember } from '../types';

interface MemberCardProps {
  member: FamilyMember;
  onClick: (id: string) => void;
  x: number;
  y: number;
  isSelected?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick, x, y, isSelected }) => {
  const isMale = member.gender === 'male';
  
  return (
    <div 
      className={`absolute node-card-3d cursor-pointer group select-none`}
      style={{ 
        left: x, 
        top: y,
        width: '200px',
        height: '80px',
        transform: `translate3d(-50%, -50%, 0)`,
      }}
      onClick={() => onClick(member.id)}
    >
      {/* 3D Depth Layer (Shadow) */}
      <div className="absolute inset-0 bg-slate-800 rounded-2xl transform translate-z-[-10px] translate-x-1 translate-y-1 opacity-50 blur-sm"></div>
      
      {/* Bio Tooltip (appears on hover) */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-56 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-500 translate-y-4 group-hover:translate-y-0 z-50">
        <div className="relative transform-style-3d transform translate-z-[80px]">
           <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
              <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                <i className="fas fa-quote-left text-[10px] text-blue-400"></i>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Bio / Notes</span>
              </div>
              <p className="text-[11px] leading-relaxed text-white/80 font-medium line-clamp-4 italic">
                {member.bio || "No biography provided for this ancestor. Their story remains to be told."}
              </p>
              {/* Tooltip Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900/60 border-r border-b border-white/10 rotate-45 -mt-2 backdrop-blur-2xl"></div>
           </div>
        </div>
      </div>

      {/* Main Surface */}
      <div className={`
        relative h-full w-full rounded-2xl p-3 flex items-center gap-3
        backdrop-blur-md border transition-all duration-300 transform-style-3d
        ${isSelected 
          ? 'bg-blue-600/30 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
          : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'}
      `}>
        {/* Avatar Container */}
        <div className={`
          relative w-14 h-14 rounded-full flex items-center justify-center shrink-0
          border-2 overflow-hidden shadow-lg
          ${isMale ? 'border-blue-500/50 bg-blue-500/10' : 'border-pink-500/50 bg-pink-500/10'}
        `}>
          {member.photo ? (
            <img src={member.photo} className="w-full h-full object-cover scale-110 transition-transform group-hover:scale-125" alt={member.name} />
          ) : (
            <i className={`fas ${isMale ? 'fa-user' : 'fa-user-nurse'} text-xl ${isMale ? 'text-blue-400' : 'text-pink-400'}`}></i>
          )}
          
          {/* Gender Mini Badge */}
          <div className={`
            absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center border border-slate-900
            ${isMale ? 'bg-blue-500' : 'bg-pink-500'}
          `}>
             <i className={`fas ${isMale ? 'fa-mars' : 'fa-venus'} text-[8px] text-white`}></i>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 overflow-hidden">
          <h3 className="text-white font-bold text-sm truncate font-outfit tracking-tight">{member.name}</h3>
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.15em] mt-0.5">
            {member.birthDate ? member.birthDate.split('-')[0] : 'Unknown'}
          </p>
        </div>

        {/* Edit Hint Icon */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <i className="fas fa-pencil text-[8px] text-white/50"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberCard;
