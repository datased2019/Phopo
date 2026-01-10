
import React, { useMemo, useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import * as d3 from 'd3';
import { FamilyMember, ThemeId } from '../types';
import MemberCard from './MemberCard';
import { Language, translations } from '../translations';

interface TreeRendererProps {
  members: FamilyMember[];
  onMemberSelect: (id: string) => void;
  selectedId?: string;
  lang: Language;
  onInitialize?: () => void;
  isReadOnly?: boolean;
  theme?: ThemeId;
}

export interface TreeRendererRef {
  resetView: () => void;
}

interface HierarchyNode extends Partial<FamilyMember> {
  id: string;
  parentId?: string;
}

const TreeRenderer = forwardRef<TreeRendererRef, TreeRendererProps>(({ 
  members, 
  onMemberSelect, 
  selectedId, 
  lang,
  onInitialize,
  isReadOnly,
  theme = 'standard'
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomWrapperRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<HTMLDivElement, unknown> | null>(null);
  const t = translations[lang];
  
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [rotation, setRotation] = useState({ rx: 55, rz: 15 });
  const [interactionMode, setInteractionMode] = useState<'pan' | 'rotate'>('pan');
  
  const isDragging = useRef(false);
  const lastInteractionPos = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    resetView: () => {
      if (!containerRef.current || !zoomBehaviorRef.current) return;
      setRotation({ rx: 55, rz: 15 });
      const initialTransform = d3.zoomIdentity
        .translate(window.innerWidth / 2, window.innerHeight / 4)
        .scale(1.2);
      d3.select(containerRef.current)
        .transition()
        .duration(750)
        .ease(d3.easeCubicInOut)
        .call(zoomBehaviorRef.current.transform, initialTransform);
    }
  }));

  const { nodes, links, nodeMap } = useMemo(() => {
    if (members.length === 0) return { nodes: [], links: [], nodeMap: new Map() };
    const VIRTUAL_ROOT_ID = 'virtual-root';
    const memberMap = new Map<string, FamilyMember>(members.map(m => [m.id, m]));
    const hierarchyData: HierarchyNode[] = [
      { id: VIRTUAL_ROOT_ID },
      ...members.map(m => {
        let parentId = m.parentId1 || m.parentId2;
        if (!parentId && m.spouseId) {
          const spouse = memberMap.get(m.spouseId);
          if (spouse && (spouse.parentId1 || spouse.parentId2)) {
            parentId = spouse.parentId1 || spouse.parentId2;
          }
        }
        return { ...m, parentId: parentId || VIRTUAL_ROOT_ID };
      })
    ];
    try {
      const stratify = d3.stratify<HierarchyNode>().id(d => d.id).parentId(d => d.parentId);
      const root = stratify(hierarchyData);
      const treeLayout = d3.tree<HierarchyNode>().nodeSize([280, 350]).separation((a, b) => (a.parent === b.parent ? 1.4 : 2.0));
      const laidOutRoot = treeLayout(root);
      const allNodes = laidOutRoot.descendants().filter(d => d.id !== VIRTUAL_ROOT_ID);
      const allLinks = laidOutRoot.links().filter(l => l.source.id !== VIRTUAL_ROOT_ID);
      const map = new Map<string, { x: number, y: number }>();
      allNodes.forEach(n => { map.set(n.id!, { x: n.x, y: n.y }); });
      return { nodes: allNodes, links: allLinks, nodeMap: map };
    } catch (e) {
      console.error("Layout Error:", e);
      return { nodes: [], links: [], nodeMap: new Map() };
    }
  }, [members]);

  useEffect(() => {
    if (!containerRef.current) return;
    const zoomBehavior = d3.zoom<HTMLDivElement, unknown>().scaleExtent([0.1, 4]).filter((event) => {
        if (event.type === 'mousedown' && event.button === 2) return false; 
        if (interactionMode === 'rotate' && event.type !== 'wheel') return false; 
        return true;
      }).on('zoom', (event) => setTransform(event.transform));
    zoomBehaviorRef.current = zoomBehavior;
    d3.select(containerRef.current).call(zoomBehavior).call(zoomBehavior.transform, d3.zoomIdentity.translate(window.innerWidth / 2, window.innerHeight / 4).scale(1.2));
  }, [interactionMode]);

  const handleStartInteraction = (x: number, y: number, isRightClick: boolean) => {
    if (isRightClick || interactionMode === 'rotate') {
      isDragging.current = true;
      lastInteractionPos.current = { x, y };
    }
  };

  const handleMoveInteraction = useCallback((x: number, y: number) => {
    if (!isDragging.current) return;
    const deltaX = x - lastInteractionPos.current.x;
    const deltaY = y - lastInteractionPos.current.y;
    setRotation(prev => ({ rx: Math.min(Math.max(prev.rx - deltaY * 0.5, 20), 85), rz: prev.rz - deltaX * 0.5 }));
    lastInteractionPos.current = { x, y };
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMoveInteraction(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => { if (e.touches.length === 1) handleMoveInteraction(e.touches[0].clientX, e.touches[0].clientY); };
    const onEnd = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [handleMoveInteraction]);

  const themeColors = {
    standard: { p1: '#60a5fa', p2: '#f472b6', sp: '#10b981', bg: 'bg-[#020617]' },
    minimalist: { p1: '#000', p2: '#000', sp: '#888', bg: 'bg-[#fafafa]' },
    cartoon: { p1: '#ff4d4d', p2: '#ffcc00', sp: '#33ccff', bg: 'bg-white' },
    handdrawn: { p1: '#2f4f4f', p2: '#8b4513', sp: '#556b2f', bg: 'bg-[#fdf6e3]' },
    flat: { p1: '#indigo-500', p2: '#rose-500', sp: '#emerald-500', bg: 'bg-slate-900' },
    vintage: { p1: '#8b4513', p2: '#a0522d', sp: '#cd853f', bg: 'bg-[#f5f5dc]' },
    cyberpunk: { p1: '#22d3ee', p2: '#d946ef', sp: '#fbbf24', bg: 'bg-black' },
    nature: { p1: '#22c55e', p2: '#a855f7', sp: '#f97316', bg: 'bg-green-50' },
    royal: { p1: '#ffd700', p2: '#ffffff', sp: '#ff00ff', bg: 'bg-purple-950' },
    blueprint: { p1: '#ffffff', p2: '#ffffff', sp: '#ffffff', bg: 'bg-blue-900' }
  };
  const colors = themeColors[theme] || themeColors.standard;

  const renderLinks = () => {
    const lineGenerator = d3.linkVertical<any, any>().x(d => d.x).y(d => d.y);
    const processedPairs = new Set<string>();
    const spouseLinks = members.filter(m => m.spouseId).map(m => {
        const pairId = [m.id, m.spouseId].sort().join('-');
        if (processedPairs.has(pairId)) return null;
        processedPairs.add(pairId);
        const source = nodeMap.get(m.id);
        const target = nodeMap.get(m.spouseId!);
        if (source && target) return { source, target };
        return null;
      }).filter(Boolean) as any[];

    const secondaryLinks = members.filter(m => m.parentId1 && m.parentId2).map(m => {
        const source = nodeMap.get(m.parentId2!);
        const target = nodeMap.get(m.id);
        if (source && target) return { source, target };
        return null;
      }).filter(Boolean) as any[];

    const isTech = theme === 'cyberpunk' || theme === 'blueprint';

    return (
      <svg className="absolute inset-0 overflow-visible pointer-events-none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {links.map((link, i) => {
          const targetData = link.target.data as HierarchyNode;
          const isReal = targetData.parentId1 === link.source.id || targetData.parentId2 === link.source.id;
          if (!isReal) return null;
          return <path key={`p-${i}`} d={lineGenerator(link) || ''} fill="none" stroke={colors.p1} strokeWidth={isTech ? 1.5 : 2.5} strokeDasharray={theme === 'handdrawn' ? 'none' : '10,5'} strokeLinecap="round" className="animate-[dash_30s_linear_infinite]" style={{ filter: isTech ? 'url(#glow)' : 'none' }} />;
        })}
        {secondaryLinks.map((link, i) => (
          <path key={`s-${i}`} d={lineGenerator(link) || ''} fill="none" stroke={colors.p2} strokeWidth={isTech ? 1.5 : 2.5} strokeDasharray="10,5" strokeLinecap="round" className="animate-[dash_30s_linear_infinite] opacity-80" style={{ filter: isTech ? 'url(#glow)' : 'none' }} />
        ))}
        {spouseLinks.map((link, i) => {
           const midX = (link.source.x + link.target.x) / 2;
           const d = `M ${link.source.x} ${link.source.y} Q ${midX} ${link.source.y - 30} ${link.target.x} ${link.target.y}`;
           return <path key={`sp-${i}`} d={d} fill="none" stroke={colors.sp} strokeWidth="3" strokeDasharray="8,4" strokeLinecap="round" className="animate-[dash_20s_linear_infinite]" style={{ filter: isTech ? 'url(#glow)' : 'none' }} />;
        })}
        {nodes.map(n => <circle key={`dot-${n.id}`} cx={n.x} cy={n.y - 50} r="2.5" fill={colors.p1} className="animate-pulse" />)}
      </svg>
    );
  };

  return (
    <div 
      ref={containerRef} 
      onMouseDown={(e) => handleStartInteraction(e.clientX, e.clientY, e.button === 2)}
      onTouchStart={(e) => { if (e.touches.length === 1) handleStartInteraction(e.touches[0].clientX, e.touches[0].clientY, false); }}
      onContextMenu={(e) => e.preventDefault()} 
      className={`relative w-full h-full overflow-hidden isometric-container transition-colors duration-1000 ${colors.bg} ${interactionMode === 'rotate' ? 'cursor-alias' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {/* Background Grids for Blueprint or Cyberpunk */}
      {theme === 'blueprint' && (
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      )}
      {theme === 'cyberpunk' && (
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)', backgroundSize: '80px 80px' }}></div>
      )}

      <div ref={zoomWrapperRef} className="w-full h-full transform-style-3d" style={{ transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.k})` }}>
        <div className="relative w-0 h-0 left-0 top-0 transform-style-3d transition-transform duration-75 ease-out" style={{ transform: `rotateX(${rotation.rx}deg) rotateZ(${rotation.rz}deg)` }}>
          {renderLinks()}
          {nodes.map(node => (
            <MemberCard key={node.id} member={node.data as FamilyMember} onClick={onMemberSelect} x={node.x} y={node.y} isSelected={selectedId === node.id} theme={theme} />
          ))}
        </div>
      </div>

      {nodes.length === 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/60 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative w-full max-w-4xl bg-slate-900/40 border border-white/10 rounded-[64px] p-8 sm:p-16 md:p-24 shadow-[0_0_120px_rgba(0,0,0,0.8)] text-center ring-1 ring-white/10 overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-white text-3xl sm:text-5xl md:text-6xl font-black mb-4 font-outfit tracking-tighter">{t.emptyTreeTitle}</h3>
              <p className="text-white/50 text-base sm:text-xl md:text-2xl leading-relaxed mb-8 sm:mb-16 max-w-3xl mx-auto font-light">{t.emptyTreeSub}</p>
              {!isReadOnly && onInitialize && <button onClick={onInitialize} className="group relative w-full max-w-md py-5 sm:py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[16px] sm:rounded-[32px] font-black text-xl sm:text-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-6">{t.createSelf}</button>}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-8 right-8 flex flex-col gap-4 items-end z-10">
        <div className="flex gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl">
          <button onClick={() => setInteractionMode('pan')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${interactionMode === 'pan' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}><i className="fas fa-arrows-alt"></i><span className="hidden sm:inline ml-2">{t.panMode}</span></button>
          <button onClick={() => setInteractionMode('rotate')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${interactionMode === 'rotate' ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white'}`}><i className="fas fa-sync-alt"></i><span className="hidden sm:inline ml-2">{t.rotateMode}</span></button>
        </div>
        <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-bold text-white/60 uppercase tracking-widest border border-white/10 pointer-events-none flex items-center gap-2">
            <i className="fas fa-expand"></i> {t.scale}: {Math.round(transform.k * 100)}%
        </div>
      </div>
    </div>
  );
});

export default TreeRenderer;
