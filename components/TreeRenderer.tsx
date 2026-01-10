
import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { FamilyMember } from '../types';
import MemberCard from './MemberCard';
import { Language, translations } from '../translations';

interface TreeRendererProps {
  members: FamilyMember[];
  onMemberSelect: (id: string) => void;
  selectedId?: string;
  lang: Language;
  onInitialize?: () => void;
  isReadOnly?: boolean;
}

interface HierarchyNode extends Partial<FamilyMember> {
  id: string;
  parentId?: string;
}

const TreeRenderer: React.FC<TreeRendererProps> = ({ 
  members, 
  onMemberSelect, 
  selectedId, 
  lang,
  onInitialize,
  isReadOnly
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomWrapperRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];
  
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [rotation, setRotation] = useState({ rx: 55, rz: 15 });
  
  const isRightDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const { nodes, links, nodeMap } = useMemo(() => {
    if (members.length === 0) return { nodes: [], links: [], nodeMap: new Map() };

    const VIRTUAL_ROOT_ID = 'virtual-root';
    const memberMap = new Map<string, FamilyMember>(members.map(m => [m.id, m]));

    // Step 1: Prepare hierarchy data with "Spouse Alignment" logic
    const hierarchyData: HierarchyNode[] = [
      { id: VIRTUAL_ROOT_ID },
      ...members.map(m => {
        let parentId = m.parentId1 || m.parentId2;

        // If current member has no parents, check if their spouse has parents.
        // If spouse has parents, "borrow" them for layout purposes to ensure they sit on the same level.
        if (!parentId && m.spouseId) {
          const spouse = memberMap.get(m.spouseId);
          if (spouse && (spouse.parentId1 || spouse.parentId2)) {
            parentId = spouse.parentId1 || spouse.parentId2;
          }
        }

        return {
          ...m,
          parentId: parentId || VIRTUAL_ROOT_ID
        };
      })
    ];

    try {
      const stratify = d3.stratify<HierarchyNode>()
        .id(d => d.id)
        .parentId(d => d.parentId);

      const root = stratify(hierarchyData);
      
      const treeLayout = d3.tree<HierarchyNode>()
        .nodeSize([280, 350]) 
        .separation((a, b) => (a.parent === b.parent ? 1.4 : 2.0));

      const laidOutRoot = treeLayout(root);
      const allNodes = laidOutRoot.descendants().filter(d => d.id !== VIRTUAL_ROOT_ID);
      const allLinks = laidOutRoot.links().filter(l => l.source.id !== VIRTUAL_ROOT_ID);

      const map = new Map<string, { x: number, y: number }>();
      allNodes.forEach(n => {
        map.set(n.id!, { x: n.x, y: n.y });
      });

      return { nodes: allNodes, links: allLinks, nodeMap: map };
    } catch (e) {
      console.error("Layout Error:", e);
      return { nodes: [], links: [], nodeMap: new Map() };
    }
  }, [members]);

  useEffect(() => {
    if (!containerRef.current) return;

    const zoomBehavior = d3.zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.1, 4])
      .filter((event) => {
        return event.button === 0 || event.type === 'wheel';
      })
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    const selection = d3.select(containerRef.current);
    selection.call(zoomBehavior);

    selection.call(
      zoomBehavior.transform, 
      d3.zoomIdentity.translate(window.innerWidth / 2, window.innerHeight / 4).scale(1.2)
    );
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) {
      isRightDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (!isRightDragging.current) return;
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      setRotation(prev => ({
        rx: Math.min(Math.max(prev.rx - deltaY * 0.5, 20), 85),
        rz: prev.rz - deltaX * 0.5
      }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUpGlobal = () => { isRightDragging.current = false; };
    window.addEventListener('mousemove', handleMouseMoveGlobal);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, []);

  const renderLinks = () => {
    const lineGenerator = d3.linkVertical<any, any>().x(d => d.x).y(d => d.y);
    
    // Spouse Links (Green)
    const processedPairs = new Set<string>();
    const spouseLinks = members
      .filter(m => m.spouseId)
      .map(m => {
        const pairId = [m.id, m.spouseId].sort().join('-');
        if (processedPairs.has(pairId)) return null;
        processedPairs.add(pairId);

        const source = nodeMap.get(m.id);
        const target = nodeMap.get(m.spouseId!);
        if (source && target) return { source, target };
        return null;
      }).filter(Boolean) as { source: { x: number, y: number }, target: { x: number, y: number } }[];

    // Secondary links logic: Since D3 hierarchy only supports one parent natively,
    // we use the D3 tree links for the "Primary" parent and manually draw the "Secondary" one.
    const secondaryLinks = members
      .filter(m => m.parentId1 && m.parentId2)
      .map(m => {
        const source = nodeMap.get(m.parentId2!);
        const target = nodeMap.get(m.id);
        if (source && target) return { source, target };
        return null;
      }).filter(Boolean) as { source: { x: number, y: number }, target: { x: number, y: number } }[];

    return (
      <svg className="absolute inset-0 overflow-visible pointer-events-none">
        <defs>
          <linearGradient id="treeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#db2777" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="spouseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        
        {/* Primary Bloodlines - Validated against actual parent IDs */}
        {links.map((link, i) => {
          const targetData = link.target.data as HierarchyNode;
          // Only render if the link represents a real parent-child relationship in our data
          const isRealLink = targetData.parentId1 === link.source.id || targetData.parentId2 === link.source.id;
          if (!isRealLink) return null;

          return (
            <path 
              key={`primary-${i}`} 
              d={lineGenerator(link) || ''} 
              fill="none" 
              stroke="url(#treeGradient)" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              className="transition-all duration-300" 
            />
          );
        })}
        
        {/* Secondary Bloodlines */}
        {secondaryLinks.map((link, i) => (
          <path key={`secondary-${i}`} d={lineGenerator(link) || ''} fill="none" stroke="url(#secondaryGradient)" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-300 opacity-80" />
        ))}

        {/* Spouse Links (Green Horizontal) */}
        {spouseLinks.map((link, i) => {
           const midX = (link.source.x + link.target.x) / 2;
           const d = `M ${link.source.x} ${link.source.y} Q ${midX} ${link.source.y - 30} ${link.target.x} ${link.target.y}`;
           return (
             <path 
               key={`spouse-${i}`} 
               d={d} 
               fill="none" 
               stroke="url(#spouseGradient)" 
               strokeWidth="3" 
               strokeDasharray="8,4" 
               strokeLinecap="round" 
               className="animate-[dash_20s_linear_infinite]" 
             />
           );
        })}

        {nodes.map(n => (
          <circle key={`dot-${n.id}`} cx={n.x} cy={n.y - 50} r="2.5" fill="#60a5fa" className="animate-pulse" />
        ))}
      </svg>
    );
  };

  return (
    <div ref={containerRef} onMouseDown={handleMouseDown} onContextMenu={(e) => e.preventDefault()} className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing isometric-container">
      <div ref={zoomWrapperRef} className="w-full h-full transform-style-3d" style={{ transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.k})` }}>
        <div className="relative w-0 h-0 left-0 top-0 transform-style-3d transition-transform duration-75 ease-out" style={{ transform: `rotateX(${rotation.rx}deg) rotateZ(${rotation.rz}deg)` }}>
          {renderLinks()}
          {nodes.map(node => (
            <MemberCard key={node.id} member={node.data as FamilyMember} onClick={onMemberSelect} x={node.x} y={node.y} isSelected={selectedId === node.id} />
          ))}
        </div>
      </div>

      {nodes.length === 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/60 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative w-full max-w-4xl bg-slate-900/40 border border-white/10 rounded-[64px] p-16 md:p-24 shadow-[0_0_120px_rgba(0,0,0,0.8)] text-center ring-1 ring-white/10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-40 bg-blue-600/20 blur-[100px] rounded-full"></div>
            <div className="relative z-10">
              <div className="relative mb-16 inline-block">
                <div className="absolute inset-0 bg-blue-500/20 blur-[50px] rounded-full animate-pulse"></div>
                <div className="relative w-40 h-40 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[48px] flex items-center justify-center mx-auto shadow-2xl rotate-[15deg] group hover:rotate-0 transition-transform duration-700">
                  <i className="fas fa-fingerprint text-6xl text-white"></i>
                </div>
              </div>
              <h3 className="text-white text-5xl md:text-6xl font-black mb-8 font-outfit tracking-tighter">{t.emptyTreeTitle}</h3>
              <p className="text-white/50 text-xl md:text-2xl leading-relaxed mb-16 max-w-3xl mx-auto font-light">{t.emptyTreeSub}</p>
              {!isReadOnly && onInitialize && (
                <div className="flex flex-col items-center gap-8">
                  <button onClick={onInitialize} className="group relative w-full max-w-md overflow-hidden py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[32px] font-black text-2xl transition-all shadow-[0_0_60px_rgba(37,99,235,0.4)] active:scale-95 flex items-center justify-center gap-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <i className="fas fa-id-card text-white/80"></i>
                    {t.createSelf}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-10 right-10 flex flex-col gap-2 items-end z-10">
        <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-white/60 uppercase tracking-widest border border-white/10 pointer-events-none flex items-center gap-2">
          <i className="fas fa-expand"></i> {t.scale}: {Math.round(transform.k * 100)}%
        </div>
        <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-white/60 uppercase tracking-widest border border-white/10 pointer-events-none flex items-center gap-2">
          <i className="fas fa-sync-alt"></i> {t.rotation}: {Math.round(rotation.rz)}°
        </div>
      </div>
    </div>
  );
};

export default TreeRenderer;
