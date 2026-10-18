import React, { useMemo } from 'react';

// Fallback coordinate mappings for known campus nodes if missing from payload
const FALLBACK_COORDINATES = {
  GATE: { x: 70, y: 240 },
  ADMIN: { x: 190, y: 130 },
  LIBRARY: { x: 330, y: 90 },
  TECH_HUB: { x: 440, y: 220 },
  CSE_BLOCK: { x: 260, y: 260 },
  CAFETERIA: { x: 210, y: 390 },
  SPORTS: { x: 400, y: 390 },
  HOSTEL: { x: 540, y: 300 }
};

/**
 * Reusable CampusGraph component for DAA Graph Algorithm visualization.
 * 
 * Pure presentation component: does NOT compute BFS or DFS algorithms internally.
 * Renders nodes, weighted pathways, traversal highlights, and active shortest routes via SVG.
 * 
 * @param {Object} props
 * @param {Array<Object>} props.nodes - Campus landmarks [{ id, name, code, category, coordinates }]
 * @param {Object|Array} props.connections - Graph adjacency list or edge array
 * @param {Array<string>} [props.routePath=[]] - Sequence of node IDs in the computed path
 * @param {Array<string>} [props.visitedNodes=[]] - Sequence of node IDs visited during traversal
 * @param {string} [props.startNode=''] - Start landmark ID
 * @param {string} [props.targetNode=''] - Target landmark ID
 * @param {Function} [props.onNodeClick] - Optional callback when landmark is clicked
 * @param {string} [props.className=''] - Optional custom CSS class
 */
export default function CampusGraph({
  nodes = [],
  connections = {},
  routePath = [],
  visitedNodes = [],
  startNode = '',
  targetNode = '',
  onNodeClick,
  className = ''
}) {
  // Map of node ID to coordinates
  const nodeMap = useMemo(() => {
    const map = new Map();
    nodes.forEach(node => {
      const coords = node.coordinates || FALLBACK_COORDINATES[node.id] || { x: 300, y: 240 };
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

  // Unique list of edges to render
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
      <div className="graph-svg-container">
        <svg
          viewBox="0 0 620 480"
          className="graph-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Kalvium campus landmark graph and traversal pathways"
        >
          <defs>
            <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1e40af" floodOpacity="0.3" />
            </filter>
            <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Render Graph Edges (Background & Active Route Lines) */}
          <g className="graph-edges" aria-label="Campus pathways">
            {uniqueEdges.map(edge => {
              const source = nodeMap.get(edge.from);
              const target = nodeMap.get(edge.to);
              if (!source || !target) return null;

              const isRouteEdge = routeEdgeSet.has(`${edge.from}---${edge.to}`);
              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;

              return (
                <g key={`edge-${edge.from}-${edge.to}`}>
                  {/* Connection Pathway Line */}
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isRouteEdge ? '#2563eb' : '#cbd5e1'}
                    strokeWidth={isRouteEdge ? 4 : 2}
                    strokeDasharray={isRouteEdge ? 'none' : '4 3'}
                    filter={isRouteEdge ? 'url(#route-glow)' : undefined}
                    strokeLinecap="round"
                  />

                  {/* Distance / Weight Label along the edge */}
                  {edge.weight && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-18"
                        y="-9"
                        width="36"
                        height="18"
                        rx="4"
                        fill="#ffffff"
                        stroke={isRouteEdge ? '#bfdbfe' : '#e2e8f0'}
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        dy="3.5"
                        fontSize="9"
                        fontWeight={isRouteEdge ? '700' : '500'}
                        fill={isRouteEdge ? '#1e40af' : '#64748b'}
                      >
                        {edge.weight}m
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Render Graph Nodes (Landmarks) */}
          <g className="graph-nodes" aria-label="Campus landmark nodes">
            {Array.from(nodeMap.values()).map(node => {
              const isStart = node.id === startNode || (routePath.length > 0 && routePath[0] === node.id);
              const isTarget = node.id === targetNode || (routePath.length > 0 && routePath[routePath.length - 1] === node.id);
              const isOnRoute = routeNodeSet.has(node.id);
              const isVisited = visitedSet.has(node.id);
              const visitedIndex = visitedNodes.indexOf(node.id);

              let fillColor = '#ffffff';
              let strokeColor = '#64748b';
              let strokeWidth = 2;
              let textColor = '#0f172a';

              if (isStart) {
                fillColor = '#2563eb';
                strokeColor = '#1e3a8a';
                strokeWidth = 3;
                textColor = '#ffffff';
              } else if (isTarget) {
                fillColor = '#059669';
                strokeColor = '#065f46';
                strokeWidth = 3;
                textColor = '#ffffff';
              } else if (isOnRoute) {
                fillColor = '#3b82f6';
                strokeColor = '#1d4ed8';
                strokeWidth = 2.5;
                textColor = '#ffffff';
              } else if (isVisited) {
                fillColor = '#eff6ff';
                strokeColor = '#3b82f6';
                strokeWidth = 2;
                textColor = '#1e40af';
              }

              return (
                <g
                  key={`node-${node.id}`}
                  className="graph-node"
                  onClick={() => onNodeClick && onNodeClick(node)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${node.name} (${node.id})${isStart ? ' - Start' : ''}${isTarget ? ' - Target' : ''}`}
                >
                  {/* Outer Highlight Ring for Start/Target */}
                  {(isStart || isTarget) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="26"
                      fill="none"
                      stroke={isStart ? '#93c5fd' : '#a7f3d0'}
                      strokeWidth="3"
                      opacity="0.8"
                    />
                  )}

                  {/* Main Landmark Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="20"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    filter="url(#node-glow)"
                  />

                  {/* Landmark Node Code */}
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dy="4"
                    fontSize="10"
                    fontWeight="700"
                    fill={textColor}
                    pointerEvents="none"
                  >
                    {node.code || node.id.slice(0, 4)}
                  </text>

                  {/* Traversal Step Number Badge */}
                  {isVisited && visitedIndex >= 0 && !isStart && !isTarget && (
                    <g transform={`translate(${node.x + 13}, ${node.y - 13})`}>
                      <circle cx="0" cy="0" r="7" fill="#1e40af" />
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        dy="2.5"
                        fontSize="8"
                        fontWeight="700"
                        fill="#ffffff"
                      >
                        {visitedIndex + 1}
                      </text>
                    </g>
                  )}

                  {/* Node Name Label Below Node */}
                  <text
                    x={node.x}
                    y={node.y + 32}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="600"
                    fill="#1e293b"
                    pointerEvents="none"
                  >
                    {node.name.length > 20 ? `${node.name.slice(0, 18)}...` : node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Graph Visual Legend */}
      <div className="graph-legend" aria-label="Campus map graph legend">
        <div className="legend-item">
          <span className="legend-symbol" style={{ backgroundColor: '#2563eb' }} />
          <span>Start Node</span>
        </div>
        <div className="legend-item">
          <span className="legend-symbol" style={{ backgroundColor: '#059669' }} />
          <span>Target Node</span>
        </div>
        <div className="legend-item">
          <span className="legend-line" style={{ backgroundColor: '#2563eb', height: '4px' }} />
          <span>Active Shortest Path</span>
        </div>
        <div className="legend-item">
          <span className="legend-symbol" style={{ backgroundColor: '#eff6ff', border: '1px solid #3b82f6' }} />
          <span>Visited / Explored</span>
        </div>
        <div className="legend-item">
          <span className="legend-line" style={{ borderTop: '2px dashed #94a3b8' }} />
          <span>Campus Pathway</span>
        </div>
      </div>
    </div>
  );
}
