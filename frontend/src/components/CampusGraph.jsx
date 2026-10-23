import React, { useState, useMemo } from 'react';

/**
 * Fallback coordinate mappings for known campus nodes (designed for 780x520 canvas)
 */
const PICTORIAL_COORDINATES = {
  GATE: { x: 100, y: 260 },
  BLOCK_A: { x: 250, y: 150 },
  LIBRARY: { x: 450, y: 95 },
  CAFETERIA: { x: 250, y: 410 },
  LAB: { x: 530, y: 240 },
  HOSTEL: { x: 680, y: 350 }
};

/**
 * Illustrated architectural building components for the 6 Kalvium campus landmarks.
 */
function BuildingIllustration({ node, isStart, isTarget, isOnRoute, isVisited, isActive, isHovered }) {
  const { id } = node;

  // Render specific landmark building based on ID
  switch (id) {
    case 'GATE':
      return (
        <g className="building-gate" filter="url(#drop-shadow-soft)">
          {/* Paved entrance turnaround */}
          <ellipse cx="0" cy="18" rx="36" ry="14" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M-40,18 C-20,30 20,30 40,18" fill="none" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1.5" />
          
          {/* Main Stone Pillars */}
          <rect x="-30" y="-22" width="12" height="36" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
          <rect x="-32" y="-25" width="16" height="5" rx="1" fill="#64748b" />
          <rect x="18" y="-22" width="12" height="36" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
          <rect x="16" y="-25" width="16" height="5" rx="1" fill="#64748b" />
          
          {/* Wrought-Iron Arch & Kalvium Plaque */}
          <path d="M-24,-20 C-10,-38 10,-38 24,-20" fill="none" stroke="#1e293b" strokeWidth="3" />
          <rect x="-16" y="-34" width="32" height="10" rx="2" fill="#1e40af" stroke="#ffffff" strokeWidth="1" />
          <text x="0" y="-27" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#ffffff" letterSpacing="0.5">GATE</text>

          {/* Security Cabin */}
          <rect x="2" y="-12" width="14" height="20" rx="2" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
          <rect x="4" y="-8" width="10" height="7" fill="#60a5fa" opacity="0.85" />
          {/* Barrier Arm */}
          <line x1="-18" y1="-2" x2="2" y2="-2" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 2" />
        </g>
      );

    case 'BLOCK_A':
      return (
        <g className="building-block-a" filter="url(#drop-shadow-soft)">
          {/* Main Academic Hall Structure */}
          <rect x="-36" y="-28" width="72" height="48" rx="3" fill="#ffffff" stroke="#334155" strokeWidth="1.8" />
          {/* Roof line with accent trim */}
          <path d="M-38,-28 L0,-42 L38,-28 Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.5" />
          {/* Pediment Clock */}
          <circle cx="0" cy="-33" r="4.5" fill="#ffffff" stroke="#1e3a8a" strokeWidth="1" />
          <line x1="0" y1="-33" x2="0" y2="-35" stroke="#1e3a8a" strokeWidth="0.8" />
          <line x1="0" y1="-33" x2="2" y2="-33" stroke="#1e3a8a" strokeWidth="0.8" />

          {/* Classroom Windows (3 Rows) */}
          <g fill="#93c5fd" stroke="#60a5fa" strokeWidth="0.5">
            <rect x="-28" y="-22" width="12" height="8" rx="1" />
            <rect x="-10" y="-22" width="20" height="8" rx="1" />
            <rect x="16" y="-22" width="12" height="8" rx="1" />

            <rect x="-28" y="-10" width="12" height="8" rx="1" />
            <rect x="-10" y="-10" width="20" height="8" rx="1" />
            <rect x="16" y="-10" width="12" height="8" rx="1" />
          </g>

          {/* Grand Entrance Pillars & Double Door */}
          <rect x="-10" y="4" width="20" height="16" fill="#1e293b" />
          <line x1="-8" y1="4" x2="-8" y2="20" stroke="#f8fafc" strokeWidth="1.5" />
          <line x1="8" y1="4" x2="8" y2="20" stroke="#f8fafc" strokeWidth="1.5" />
          {/* Entrance Steps */}
          <line x1="-16" y1="20" x2="16" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
        </g>
      );

    case 'LIBRARY':
      return (
        <g className="building-library" filter="url(#drop-shadow-soft)">
          {/* Classical Library Columns & Podium */}
          <rect x="-38" y="-22" width="76" height="42" rx="2" fill="#f8fafc" stroke="#334155" strokeWidth="1.8" />
          {/* Neoclassical Pediment Roof */}
          <path d="M-42,-22 L0,-40 L42,-22 Z" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
          {/* Central Dome behind pediment */}
          <path d="M-18,-30 C-18,-48 18,-48 18,-30 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.2" opacity="0.9" />

          {/* 4 Majestic Columns */}
          <rect x="-30" y="-20" width="6" height="36" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
          <rect x="-12" y="-20" width="6" height="36" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
          <rect x="6" y="-20" width="6" height="36" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
          <rect x="24" y="-20" width="6" height="36" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />

          {/* Open Book Emblem on Pediment */}
          <path d="M-7,-28 C-4,-30 0,-29 0,-27 C0,-29 4,-30 7,-28 L7,-24 C4,-26 0,-25 0,-23 C0,-25 -4,-26 -7,-24 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />

          {/* Library Steps */}
          <rect x="-34" y="16" width="68" height="4" fill="#cbd5e1" />
        </g>
      );

    case 'CAFETERIA':
      return (
        <g className="building-cafeteria" filter="url(#drop-shadow-soft)">
          {/* Outdoor Patio Foundation */}
          <ellipse cx="0" cy="10" rx="38" ry="20" fill="#fef3c7" stroke="#fde68a" strokeWidth="1.5" />
          
          {/* Dining Pavilion Rotunda */}
          <rect x="-28" y="-24" width="56" height="34" rx="16" fill="#ffffff" stroke="#d97706" strokeWidth="1.8" />
          {/* Striped Dining Canopy Awning */}
          <path d="M-32,-16 Q0,-32 32,-16 L30,-10 Q0,-24 -30,-10 Z" fill="#ea580c" />
          <path d="M-24,-14 Q0,-27 24,-14" stroke="#ffffff" strokeWidth="3" strokeDasharray="6 6" fill="none" />

          {/* Panoramic Glass Windows */}
          <rect x="-20" y="-8" width="40" height="12" rx="4" fill="#67e8f9" opacity="0.8" stroke="#06b6d4" strokeWidth="0.8" />
          
          {/* Patio Umbrellas & Tables */}
          <g transform="translate(-24, 12)">
            <circle cx="0" cy="0" r="6" fill="#ef4444" stroke="#dc2626" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="2" fill="#ffffff" />
          </g>
          <g transform="translate(24, 12)">
            <circle cx="0" cy="0" r="6" fill="#3b82f6" stroke="#2563eb" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="2" fill="#ffffff" />
          </g>
        </g>
      );

    case 'LAB':
      return (
        <g className="building-lab" filter="url(#drop-shadow-soft)">
          {/* Modern Silicon / Glass Research Complex */}
          <rect x="-34" y="-26" width="68" height="46" rx="4" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.8" />
          {/* Flat Tech Roof with Antenna */}
          <rect x="-36" y="-30" width="72" height="5" fill="#334155" />
          <line x1="20" y1="-30" x2="20" y2="-44" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="20" cy="-44" r="2.5" fill="#ef4444" className="animate-pulse" />
          <path d="M16,-40 C18,-42 22,-42 24,-40" fill="none" stroke="#38bdf8" strokeWidth="1" />
          <path d="M13,-37 C17,-41 23,-41 27,-37" fill="none" stroke="#38bdf8" strokeWidth="1" />

          {/* High-Tech Blue Ribbon Glass Curtain */}
          <rect x="-26" y="-20" width="52" height="12" rx="2" fill="#0284c7" opacity="0.9" />
          <line x1="-26" y1="-14" x2="26" y2="-14" stroke="#38bdf8" strokeWidth="0.8" />
          <line x1="-9" y1="-20" x2="-9" y2="-8" stroke="#38bdf8" strokeWidth="0.8" />
          <line x1="9" y1="-20" x2="9" y2="-8" stroke="#38bdf8" strokeWidth="0.8" />

          {/* Microchip Server Grid on Bottom */}
          <g fill="#38bdf8" opacity="0.85">
            <rect x="-24" y="-2" width="10" height="16" rx="1" />
            <rect x="-10" y="-2" width="10" height="16" rx="1" />
            <rect x="4" y="-2" width="10" height="16" rx="1" />
            <rect x="18" y="-2" width="6" height="16" rx="1" fill="#10b981" />
          </g>
        </g>
      );

    case 'HOSTEL':
      return (
        <g className="building-hostel" filter="url(#drop-shadow-soft)">
          {/* Twin Tower Residential Dormitory */}
          {/* West Tower */}
          <rect x="-32" y="-30" width="30" height="50" rx="3" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
          <polygon points="-34,-30 -17,-44 0,-30" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1" />
          {/* East Tower */}
          <rect x="2" y="-30" width="30" height="50" rx="3" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
          <polygon points="0,-30 17,-44 34,-30" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1" />

          {/* Central Connecting Breezeway */}
          <rect x="-4" y="-12" width="8" height="24" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />

          {/* Student Room Windows with cozy lighting */}
          <g fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6">
            <rect x="-26" y="-22" width="6" height="7" rx="1" />
            <rect x="-14" y="-22" width="6" height="7" rx="1" />
            <rect x="-26" y="-10" width="6" height="7" rx="1" />
            <rect x="-14" y="-10" width="6" height="7" rx="1" />
            <rect x="-26" y="2" width="6" height="7" rx="1" />
            <rect x="-14" y="2" width="6" height="7" rx="1" />

            <rect x="8" y="-22" width="6" height="7" rx="1" />
            <rect x="20" y="-22" width="6" height="7" rx="1" />
            <rect x="8" y="-10" width="6" height="7" rx="1" />
            <rect x="20" y="-10" width="6" height="7" rx="1" />
            <rect x="8" y="2" width="6" height="7" rx="1" />
            <rect x="20" y="2" width="6" height="7" rx="1" />
          </g>
        </g>
      );

    default:
      return (
        <circle cx="0" cy="0" r="22" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
      );
  }
}

/**
 * Renders decorative trees, ponds, and campus environment.
 */
function CampusScenery() {
  return (
    <g className="campus-scenery" pointerEvents="none">
      {/* Central Campus Quad Lawn */}
      <path
        d="M 280,190 C 360,150 440,160 490,210 C 440,300 360,330 280,300 Z"
        fill="#e2f5e4"
        stroke="#c6e8c9"
        strokeWidth="1.5"
        opacity="0.9"
      />

      {/* Central Fountain / Water Pond in Quad */}
      <g transform="translate(370, 240)">
        <ellipse cx="0" cy="0" rx="24" ry="15" fill="#bae6fd" stroke="#38bdf8" strokeWidth="2" />
        <ellipse cx="0" cy="0" rx="16" ry="10" fill="#7dd3fc" />
        <circle cx="0" cy="0" r="4" fill="#0284c7" />
        {/* Fountain Water Spray */}
        <path d="M0,0 C-6,-12 0,-16 0,-16 C0,-16 6,-12 0,0" fill="none" stroke="#ffffff" strokeWidth="1.5" />
      </g>

      {/* Decorative Tree Clusters */}
      {/* Grove near Main Gate */}
      <g transform="translate(130, 180)">
        <circle cx="0" cy="0" r="14" fill="#15803d" opacity="0.9" />
        <circle cx="-8" cy="-5" r="11" fill="#16a34a" opacity="0.9" />
        <circle cx="8" cy="-4" r="10" fill="#22c55e" opacity="0.9" />
      </g>
      <g transform="translate(90, 360)">
        <circle cx="0" cy="0" r="15" fill="#15803d" opacity="0.9" />
        <circle cx="6" cy="-6" r="11" fill="#16a34a" opacity="0.9" />
      </g>

      {/* Grove between Library and Lab */}
      <g transform="translate(560, 130)">
        <circle cx="0" cy="0" r="16" fill="#15803d" opacity="0.9" />
        <circle cx="-8" cy="-6" r="12" fill="#16a34a" opacity="0.9" />
        <circle cx="8" cy="-5" r="12" fill="#22c55e" opacity="0.9" />
      </g>

      {/* Grove south of Cafeteria */}
      <g transform="translate(380, 440)">
        <circle cx="0" cy="0" r="15" fill="#15803d" opacity="0.9" />
        <circle cx="-7" cy="-5" r="11" fill="#16a34a" opacity="0.9" />
        <circle cx="8" cy="-3" r="10" fill="#22c55e" opacity="0.9" />
      </g>

      {/* Residential Greenery around Hostel */}
      <g transform="translate(710, 240)">
        <circle cx="0" cy="0" r="14" fill="#15803d" opacity="0.9" />
        <circle cx="6" cy="-5" r="11" fill="#16a34a" opacity="0.9" />
      </g>
      <g transform="translate(715, 430)">
        <circle cx="0" cy="0" r="16" fill="#15803d" opacity="0.9" />
        <circle cx="-8" cy="-5" r="12" fill="#22c55e" opacity="0.9" />
      </g>

      {/* Campus Compass Rose (North Arrow) in Top Right */}
      <g transform="translate(710, 55)">
        <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* North pointer (Red) */}
        <polygon points="0,-14 4,0 0,-2" fill="#ef4444" />
        {/* South pointer (Slate) */}
        <polygon points="0,14 4,0 0,2" fill="#64748b" />
        {/* East/West pointers */}
        <polygon points="14,0 0,4 2,0" fill="#94a3b8" />
        <polygon points="-14,0 0,4 -2,0" fill="#94a3b8" />
        <text x="0" y="-18" textAnchor="middle" fontSize="8" fontWeight="800" fill="#ef4444">N</text>
      </g>

      {/* Campus Map Title & Scale in Top Left */}
      <g transform="translate(20, 25)">
        <rect x="0" y="0" width="170" height="28" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" opacity="0.95" />
        <text x="10" y="14" fontSize="10" fontWeight="800" fill="#1e293b">KALVIUM CAMPUS MAP</text>
        <text x="10" y="23" fontSize="7.5" fontWeight="600" fill="#64748b">Illustrative Topological Layout &bull; 6 Landmarks</text>
      </g>
    </g>
  );
}

/**
 * Interactive Pictorial Campus Map component for DAA Graph Algorithm visualization.
 * 
 * Accurately connects the 6 campus landmarks according to the actual configured
 * 9 pathways in backend campusGraph.js. Displays illustrated building structures,
 * pathways, start/destination pins, live BFS/DFS animated frontiers, and hovering tooltips.
 */
export default function CampusGraph({
  nodes = [],
  connections = {},
  routePath = [],
  visitedNodes = [],
  startNode = '',
  targetNode = '',
  activeNode = '',
  activeEdges = [],
  treeEdges = [],
  algorithm = '',
  onNodeClick,
  className = ''
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [viewMode, setViewMode] = useState('pictorial'); // 'pictorial' | 'topology'

  // Map node ID to 780x520 coordinates
  const nodeMap = useMemo(() => {
    const map = new Map();
    nodes.forEach(node => {
      const coords = PICTORIAL_COORDINATES[node.id] || node.coordinates || { x: 380, y: 260 };
      map.set(node.id, { ...node, x: coords.x, y: coords.y });
    });
    return map;
  }, [nodes]);

  // Set of route edges for O(1) active path lookup
  const routeEdgeSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(routePath) && routePath.length > 1) {
      for (let i = 0; i < routePath.length - 1; i++) {
        const u = routePath[i];
        const v = routePath[i + 1];
        set.add(`${u}---${v}`);
        set.add(`${v}---${u}`);
      }
    }
    return set;
  }, [routePath]);

  // Set of tree edges (DFS discovery spanning tree)
  const treeEdgeSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(treeEdges) && treeEdges.length > 0) {
      treeEdges.forEach(edge => {
        set.add(`${edge.from}---${edge.to}`);
        set.add(`${edge.to}---${edge.from}`);
      });
    }
    return set;
  }, [treeEdges]);

  // Unique list of edges to render from graph
  const uniqueEdges = useMemo(() => {
    const edgeMap = new Map();

    if (Array.isArray(connections)) {
      connections.forEach(edge => {
        const [a, b] = [edge.from, edge.to].sort();
        const key = `${a}---${b}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, { from: edge.from, to: edge.to, weight: edge.weight });
        }
      });
    } else if (connections && typeof connections === 'object') {
      Object.keys(connections).forEach(fromNode => {
        const neighbors = connections[fromNode] || [];
        neighbors.forEach(edge => {
          const toNode = typeof edge === 'string' ? edge : (edge && edge.node ? edge.node : edge);
          if (!toNode) return;
          const [a, b] = [fromNode, toNode].sort();
          const key = `${a}---${b}`;
          if (!edgeMap.has(key)) {
            edgeMap.set(key, { from: fromNode, to: toNode, weight: typeof edge === 'object' && edge !== null ? edge.weight : undefined });
          }
        });
      });
    }

    return Array.from(edgeMap.values());
  }, [connections]);

  const visitedSet = useMemo(() => new Set(visitedNodes), [visitedNodes]);
  const routeNodeSet = useMemo(() => new Set(routePath), [routePath]);

  return (
    <div className={`campus-graph-wrapper ${className}`.trim()}>
      
      {/* Top Map View Controls & Mode Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[var(--text-main)] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            Interactive Campus Navigator
          </span>
          <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
            &bull; Click any building to set Origin or Destination
          </span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-lg border border-[var(--border)] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('pictorial')}
            className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'pictorial' ? 'bg-[var(--bg-surface)] text-[var(--color-primary)] shadow-xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >
            Illustrated Map
          </button>
          <button
            type="button"
            onClick={() => setViewMode('topology')}
            className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'topology' ? 'bg-[var(--bg-surface)] text-[var(--color-primary)] shadow-xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >
            Graph Topology
          </button>
        </div>
      </div>

      {/* Main SVG Map Canvas */}
      <div className="graph-svg-container relative">
        <svg
          viewBox="0 0 780 520"
          className="graph-svg w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Kalvium Illustrated Campus Map for BFS and DFS Search"
        >
          <defs>
            {/* Soft drop shadow for buildings */}
            <filter id="drop-shadow-soft" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.12" />
            </filter>
            
            {/* Glowing route highlight filter */}
            <filter id="route-path-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#2563eb" floodOpacity="0.5" />
            </filter>

            {/* Glowing active search frontier */}
            <filter id="active-pulse-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#f59e0b" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Canvas: Campus Grass or Topology Grid */}
          {viewMode === 'pictorial' ? (
            <>
              {/* Lush Campus Grass Base */}
              <rect x="0" y="0" width="780" height="520" fill="#f4faf5" />
              <CampusScenery />
            </>
          ) : (
            <rect x="0" y="0" width="780" height="520" fill="#fafbfd" />
          )}

          {/* ================================================================
              CAMPUS ROADS & PATHWAYS (The 9 Graph Edges)
              ================================================================ */}
          <g className="campus-pathways" aria-label="Campus Pathways">
            {uniqueEdges.map(edge => {
              const source = nodeMap.get(edge.from);
              const target = nodeMap.get(edge.to);
              if (!source || !target) return null;

              const isRouteEdge = routeEdgeSet.has(`${edge.from}---${edge.to}`);
              const isTreeEdge = treeEdgeSet.has(`${edge.from}---${edge.to}`);
              const isEdgeActive = activeEdges.some(e => 
                (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from)
              );

              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;

              return (
                <g key={`edge-${edge.from}-${edge.to}`} className="pathway-group">
                  {/* Outer Road Pavement (Width 18px in pictorial, 3px in topology) */}
                  {viewMode === 'pictorial' ? (
                    <>
                      {/* Paved Pedestrian Walkway Base */}
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="#cbd5e1"
                        strokeWidth="20"
                        strokeLinecap="round"
                      />
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="#f1f5f9"
                        strokeWidth="16"
                        strokeLinecap="round"
                      />
                      {/* Center Walking Track Dashed Line */}
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="5 5"
                        strokeLinecap="round"
                      />
                    </>
                  ) : (
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="#cbd5e1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* Active Exploration Frontier (Animated Search Wave) */}
                  {isEdgeActive && (
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="#f59e0b"
                      strokeWidth={viewMode === 'pictorial' ? 8 : 4}
                      filter="url(#active-pulse-glow)"
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                  )}

                  {/* DFS Discovery Spanning Tree Edge Highlight */}
                  {isTreeEdge && algorithm === 'DFS' && (
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="#7c3aed"
                      strokeWidth={viewMode === 'pictorial' ? 7 : 3.5}
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                  )}

                  {/* BFS Shortest Route Highlight (Glowing Blue Highway) */}
                  {isRouteEdge && (
                    <g>
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="#3b82f6"
                        strokeWidth={viewMode === 'pictorial' ? 12 : 5}
                        strokeLinecap="round"
                        filter="url(#route-path-glow)"
                        opacity="0.6"
                      />
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="#1d4ed8"
                        strokeWidth={viewMode === 'pictorial' ? 6 : 3.5}
                        strokeLinecap="round"
                      />
                    </g>
                  )}

                  {/* Illustrative Distance / Hop Badge along the pathway */}
                  <g transform={`translate(${midX}, ${midY})`} pointerEvents="none">
                    <rect
                      x="-18"
                      y="-8"
                      width="36"
                      height="16"
                      rx="4"
                      fill="#ffffff"
                      stroke={isRouteEdge ? '#3b82f6' : '#cbd5e1'}
                      strokeWidth={isRouteEdge ? '1.5' : '1'}
                      filter="url(#drop-shadow-soft)"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fontSize="8"
                      fontWeight="700"
                      fill={isRouteEdge ? '#1d4ed8' : '#475569'}
                    >
                      ~120m
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* ================================================================
              CAMPUS LANDMARKS (The 6 Building Nodes)
              ================================================================ */}
          <g className="campus-landmarks" aria-label="Campus Landmarks">
            {Array.from(nodeMap.values()).map(node => {
              const isStart = node.id === startNode;
              const isTarget = node.id === targetNode;
              const isOnRoute = routeNodeSet.has(node.id);
              const isVisited = visitedSet.has(node.id);
              const isCurrentActive = activeNode === node.id;
              const isHovered = hoveredNode && hoveredNode.id === node.id;
              const visitedIndex = visitedNodes.indexOf(node.id);

              return (
                <g
                  key={`landmark-${node.id}`}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="landmark-interactive-group cursor-pointer transition-transform"
                  onClick={() => onNodeClick && onNodeClick(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.name} (${node.id})${isStart ? ' - Origin' : ''}${isTarget ? ' - Destination' : ''}`}
                >
                  {/* Active Frontier Spotlight Wave */}
                  {isCurrentActive && (
                    <circle
                      cx="0"
                      cy="0"
                      r="44"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                      strokeDasharray="6 4"
                      className="animate-spin"
                    />
                  )}

                  {/* Start Node Pulse Ring */}
                  {isStart && (
                    <circle
                      cx="0"
                      cy="0"
                      r="42"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                      opacity="0.8"
                      className="animate-pulse"
                    />
                  )}

                  {/* Target Node Pulse Ring */}
                  {isTarget && (
                    <circle
                      cx="0"
                      cy="0"
                      r="42"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                      opacity="0.8"
                      className="animate-pulse"
                    />
                  )}

                  {/* Building Artwork or Topology Circle */}
                  {viewMode === 'pictorial' ? (
                    <BuildingIllustration
                      node={node}
                      isStart={isStart}
                      isTarget={isTarget}
                      isOnRoute={isOnRoute}
                      isVisited={isVisited}
                      isActive={isCurrentActive}
                      isHovered={isHovered}
                    />
                  ) : (
                    <circle
                      cx="0"
                      cy="0"
                      r="22"
                      fill={isStart ? '#2563eb' : (isTarget ? '#059669' : (isOnRoute ? '#3b82f6' : (isVisited ? '#eff6ff' : '#ffffff')))}
                      stroke={isStart ? '#1e3a8a' : (isTarget ? '#065f46' : (isOnRoute ? '#1d4ed8' : '#64748b'))}
                      strokeWidth="2.5"
                    />
                  )}

                  {/* Floating Status Badges Over Building */}
                  {/* Start Pin */}
                  {isStart && (
                    <g transform="translate(0, -42)" filter="url(#drop-shadow-soft)">
                      <rect x="-24" y="-12" width="48" height="18" rx="9" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="0" y="0" textAnchor="middle" dy="1" fontSize="8.5" fontWeight="800" fill="#ffffff" letterSpacing="0.5">
                        START
                      </text>
                    </g>
                  )}

                  {/* Destination Pin */}
                  {isTarget && (
                    <g transform="translate(0, -42)" filter="url(#drop-shadow-soft)">
                      <rect x="-24" y="-12" width="48" height="18" rx="9" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="0" y="0" textAnchor="middle" dy="1" fontSize="8.5" fontWeight="800" fill="#ffffff" letterSpacing="0.5">
                        DEST
                      </text>
                    </g>
                  )}

                  {/* Visited Sequence Badge (#1, #2, etc.) */}
                  {isVisited && visitedIndex >= 0 && !isStart && !isTarget && (
                    <g transform="translate(24, -26)" filter="url(#drop-shadow-soft)">
                      <circle cx="0" cy="0" r="10" fill={algorithm === 'DFS' ? '#7c3aed' : '#2563eb'} stroke="#ffffff" strokeWidth="1.5" />
                      <text x="0" y="0" textAnchor="middle" dy="3" fontSize="9" fontWeight="800" fill="#ffffff">
                        {visitedIndex + 1}
                      </text>
                    </g>
                  )}

                  {/* Landmark Name Banner Below Landmark */}
                  <g transform="translate(0, 32)" pointerEvents="none">
                    <rect
                      x={-(node.name.length * 3.5 + 8)}
                      y="-8"
                      width={(node.name.length * 7 + 16)}
                      height="16"
                      rx="8"
                      fill="#ffffff"
                      stroke={isStart ? '#2563eb' : (isTarget ? '#059669' : (isOnRoute ? '#3b82f6' : '#cbd5e1'))}
                      strokeWidth={isOnRoute || isStart || isTarget ? '1.5' : '1'}
                      filter="url(#drop-shadow-soft)"
                    />
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      dy="3.5"
                      fontSize="9"
                      fontWeight="700"
                      fill={isStart ? '#1e40af' : (isTarget ? '#047857' : '#0f172a')}
                    >
                      {node.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Information Tooltip Card */}
        {hoveredNode && (
          <div
            className="absolute z-30 pointer-events-none p-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 max-w-xs text-xs space-y-1 transition-opacity animate-in fade-in duration-150"
            style={{
              left: `${Math.min(Math.max(hoveredNode.x / 780 * 100, 15), 75)}%`,
              top: `${Math.min(hoveredNode.y / 520 * 100 + 8, 70)}%`,
              transform: 'translate(-50%, 0)'
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-extrabold text-blue-400 text-sm">{hoveredNode.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 font-bold">{hoveredNode.id}</span>
            </div>
            <div className="text-[11px] text-slate-300">{hoveredNode.description}</div>
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Category: <strong className="text-slate-200">{hoveredNode.category || 'Academic'}</strong></span>
              <span className="text-blue-400 font-semibold">Click to Select</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="graph-legend flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-xs" />
            <span className="font-medium">Origin Landmark</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-xs" />
            <span className="font-medium">Destination Landmark</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 rounded bg-blue-600 shadow-xs" />
            <span className="font-medium">BFS Shortest Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 rounded bg-purple-600 shadow-xs" />
            <span className="font-medium">DFS Spanning Edge</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-white shadow-xs animate-pulse" />
            <span className="font-medium">Frontier Node</span>
          </div>
        </div>

        <div className="text-[11px] text-[var(--text-muted)] italic">
          Campus Model: 6 Landmarks &bull; 9 Pathways
        </div>
      </div>

    </div>
  );
}
