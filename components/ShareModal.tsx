
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Language, translations } from '../translations';
import { FamilyMember } from '../types';

interface ShareModalProps {
  url: string;
  members: FamilyMember[];
  onClose: () => void;
  lang: Language;
}

const ShareModal: React.FC<ShareModalProps> = ({ url, members, onClose, lang }) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || members.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Prepare Data for Force Simulation
    // 1. Nodes
    const nodes = members.map(m => ({ ...m }));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // 2. Links (Connections)
    const links: any[] = [];
    const addedLinks = new Set<string>();

    const addLink = (source: string, target: string, type: 'parent' | 'spouse') => {
      const key = [source, target].sort().join('-');
      if (addedLinks.has(key)) return;
      if (!nodeMap.has(source) || !nodeMap.has(target)) return;
      addedLinks.add(key);
      links.push({ source, target, type });
    };

    members.forEach(m => {
      if (m.parentId1) addLink(m.id, m.parentId1, 'parent');
      if (m.parentId2) addLink(m.id, m.parentId2, 'parent');
      if (m.spouseId) addLink(m.id, m.spouseId, 'spouse');
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // Define Gradients and Filters
    const defs = svg.append("defs");

    // Star Glow Filter
    const filter = defs.append("filter")
      .attr("id", "star-glow")
      .attr("filterUnits", "userSpaceOnUse");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur");
    filter.append("feMerge")
      .selectAll("feMergeNode")
      .data(["coloredBlur", "SourceGraphic"])
      .enter().append("feMergeNode")
      .attr("in", d => d);

    // Simulation Setup
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(d => (d as any).type === 'spouse' ? 50 : 80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    // Draw Links (Constellation Lines)
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => d.type === 'spouse' ? "rgba(255, 215, 0, 0.4)" : "rgba(255, 255, 255, 0.2)")
      .attr("stroke-width", d => d.type === 'spouse' ? 1.5 : 0.8)
      .attr("stroke-dasharray", d => d.type === 'spouse' ? "4,2" : "none");

    // Draw Nodes (Stars)
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Star Circle
    nodeGroup.append("circle")
      .attr("r", d => d.gender === 'male' ? 4 : 4)
      .attr("fill", d => d.gender === 'male' ? "#60a5fa" : "#f472b6")
      .attr("filter", "url(#star-glow)")
      .attr("class", "cursor-pointer hover:scale-150 transition-transform");
    
    // Halo for central nodes or selected ones (optional visual flair)
    nodeGroup.append("circle")
        .attr("r", 8)
        .attr("fill", "transparent")
        .attr("stroke", d => d.gender === 'male' ? "rgba(96, 165, 250, 0.3)" : "rgba(244, 114, 182, 0.3)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,2")
        .attr("class", "animate-pulse");

    // Text Label
    nodeGroup.append("text")
      .text(d => d.name)
      .attr("x", 8)
      .attr("y", 3)
      .attr("fill", "rgba(255,255,255,0.7)")
      .attr("font-size", "8px")
      .attr("font-family", "Outfit, sans-serif")
      .attr("font-weight", "bold")
      .attr("pointer-events", "none")
      .style("text-shadow", "0 0 5px black");

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [members]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-3xl bg-[#020617] animate-in fade-in duration-500">
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all border border-white/10"
      >
        <i className="fas fa-times text-xl"></i>
      </button>

      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 w-full p-8 z-40 flex flex-col items-center pointer-events-none">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <i className="fas fa-star"></i>
            {lang === 'zh' ? '家族宇宙图' : lang === 'ja' ? '家族の宇宙' : 'Family Universe Map'}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-200 to-transparent font-outfit tracking-tighter">
             {lang === 'zh' ? '时空星图' : lang === 'ja' ? '時空マップ' : 'Space-Time Constellation'}
          </h2>
        </div>

        {/* Universe Canvas */}
        <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden bg-[radial-gradient(circle_at_center,#1e293b_0%,#020617_80%)]">
            {/* Background Stars (CSS) */}
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(96,165,250,0.8) 1.5px, transparent 1.5px)', backgroundSize: '120px 120px' }}></div>
            
            {/* D3 Graph Layer */}
            <svg ref={svgRef} className="w-full h-full absolute inset-0"></svg>
            
            {/* Overlay Gradient at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none"></div>
        </div>

        {/* Footer / Share Controls */}
        <div className="absolute bottom-12 left-0 w-full px-4 flex justify-center z-50">
           <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl ring-1 ring-white/10">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-white font-bold text-sm">{t.shareTitle}</span>
                 <span className="text-xs text-white/40">{lang === 'zh' ? '链接有效期：永久' : 'Link never expires'}</span>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                  <i className="fas fa-link text-white/30 text-xs"></i>
                  <input 
                    type="text" 
                    readOnly 
                    value={url}
                    className="flex-1 bg-transparent border-none text-xs text-blue-200/80 focus:outline-none font-mono"
                  />
                </div>
                <button 
                  onClick={handleCopy}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg ${copied ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                >
                  {copied ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
                  {copied ? t.linkCopied : t.copyLink}
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
