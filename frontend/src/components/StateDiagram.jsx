import React, { useMemo } from 'react';

/**
 * Shared Formal DFA Specification
 * States: Q = { CREATED, VALIDATED, PROCESSING, COMPLETED, REJECTED }
 * Initial state: q0 = CREATED
 * Accepting states: F = { COMPLETED }
 */
export const SHARED_DFA_STATES = [
  { id: 'CREATED', label: 'CREATED', isInitial: true, isAccepting: false, x: 90, y: 140 },
  { id: 'VALIDATED', label: 'VALIDATED', isInitial: false, isAccepting: false, x: 235, y: 140 },
  { id: 'PROCESSING', label: 'PROCESSING', isInitial: false, isAccepting: false, x: 380, y: 140 },
  { id: 'COMPLETED', label: 'COMPLETED', isInitial: false, isAccepting: true, x: 525, y: 140 },
  { id: 'REJECTED', label: 'REJECTED', isInitial: false, isAccepting: false, isTrap: true, x: 305, y: 310 }
];

export const SHARED_DFA_TRANSITIONS = [
  { from: 'CREATED', to: 'VALIDATED', symbol: 'VALIDATE', pathType: 'straight' },
  { from: 'CREATED', to: 'REJECTED', symbol: 'REJECT', pathType: 'curve_down' },
  { from: 'VALIDATED', to: 'PROCESSING', symbol: 'PROCESS', pathType: 'straight' },
  { from: 'VALIDATED', to: 'REJECTED', symbol: 'REJECT', pathType: 'diagonal_down' },
  { from: 'PROCESSING', to: 'COMPLETED', symbol: 'COMPLETE', pathType: 'straight' },
  { from: 'PROCESSING', to: 'REJECTED', symbol: 'REJECT', pathType: 'diagonal_down' },
  { from: 'REJECTED', to: 'CREATED', symbol: 'RESUBMIT', pathType: 'curve_left' }
];

/**
 * Normalizes input state string to standard DFA state identifier.
 */
function normalizeState(state) {
  if (!state || typeof state !== 'string') return 'CREATED';
  const upper = state.toUpperCase().trim();
  if (upper.includes('DRAFT') || upper === 'Q0_DRAFT' || upper === 'CREATED') return 'CREATED';
  if (upper.includes('SUBMIT') || upper.includes('ADVISOR') || upper === 'VALIDATED') return 'VALIDATED';
  if (upper.includes('HOD') || upper.includes('PROCESS') || upper === 'PROCESSING') return 'PROCESSING';
  if (upper.includes('SEAL') || upper.includes('APPROV') || upper === 'COMPLETED' || upper === 'SUCCESS') return 'COMPLETED';
  if (upper.includes('REJECT') || upper === 'Q_REJECTED') return 'REJECTED';
  return upper;
}

/**
 * Reusable StateDiagram component (FLAT Module).
 * 
 * Renders a Deterministic Finite Automaton (DFA) visualization:
 * - States: CREATED, VALIDATED, PROCESSING, COMPLETED, REJECTED
 * - Initial state: CREATED (marked with start arrow)
 * - Accepting state: COMPLETED (marked with double circle)
 * - Highlights current state and active transitions
 * 
 * @param {Object} props
 * @param {string} [props.currentState='CREATED'] - Identifier of current active state
 * @param {Array<Object>} [props.transitions] - Optional transition definitions override
 * @param {string} [props.activeSymbol] - Optional last-executed transition symbol
 * @param {Function} [props.onStateClick] - Optional callback when state node is clicked
 * @param {string} [props.className=''] - Optional custom CSS class
 */
export default function StateDiagram({
  currentState = 'CREATED',
  transitions = SHARED_DFA_TRANSITIONS,
  activeSymbol,
  onStateClick,
  className = ''
}) {
  const activeNormalizedState = normalizeState(currentState);

  const stateMap = useMemo(() => {
    const map = new Map();
    SHARED_DFA_STATES.forEach(st => map.set(st.id, st));
    return map;
  }, []);

  return (
    <div className={`state-diagram-wrapper ${className}`.trim()}>
      <div className="dfa-svg-container">
        <svg
          viewBox="0 0 620 400"
          className="dfa-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Deterministic Finite Automaton state transition diagram"
        >
          <defs>
            {/* Standard Arrowhead Marker */}
            <marker
              id="dfa-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
            </marker>

            {/* Active Transition Arrowhead */}
            <marker
              id="dfa-arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#2563eb" />
            </marker>

            {/* Node Drop Shadow */}
            <filter id="dfa-node-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.1" />
            </filter>

            {/* Active State Glow */}
            <filter id="dfa-active-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Initial State Incoming Arrow */}
          <g className="dfa-initial-arrow" aria-label="Start transition into CREATED state">
            <line
              x1="25"
              y1="140"
              x2="60"
              y2="140"
              stroke="#2563eb"
              strokeWidth="2.5"
              markerEnd="url(#dfa-arrow-active)"
            />
            <text x="38" y="130" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2563eb">
              start
            </text>
          </g>

          {/* Transition Paths & Labels */}
          <g className="dfa-transitions" aria-label="State transitions">
            {transitions.map((t, index) => {
              const fromState = stateMap.get(t.from);
              const toState = stateMap.get(t.to);
              if (!fromState || !toState) return null;

              const isTransitionActive = 
                activeNormalizedState === t.to &&
                (!activeSymbol || activeSymbol.toUpperCase() === t.symbol.toUpperCase());

              let pathData = '';
              let labelX = 0;
              let labelY = 0;

              if (t.pathType === 'straight') {
                const startX = fromState.x + 28;
                const endX = toState.x - 28;
                pathData = `M ${startX} ${fromState.y} L ${endX} ${toState.y}`;
                labelX = (startX + endX) / 2;
                labelY = fromState.y - 12;
              } else if (t.pathType === 'diagonal_down') {
                const startX = fromState.x + (t.from === 'VALIDATED' ? 12 : -12);
                const startY = fromState.y + 26;
                const endX = toState.x + (t.from === 'VALIDATED' ? -20 : 20);
                const endY = toState.y - 26;
                pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
                labelX = (startX + endX) / 2 + (t.from === 'VALIDATED' ? -22 : 22);
                labelY = (startY + endY) / 2;
              } else if (t.pathType === 'curve_left') {
                const startX = fromState.x - 26;
                const startY = fromState.y;
                const endX = toState.x - 12;
                const endY = toState.y + 26;
                pathData = `M ${startX} ${startY} Q 110 320 ${endX} ${endY}`;
                labelX = 135;
                labelY = 270;
              } else if (t.pathType === 'curve_down') {
                const startX = fromState.x + 8;
                const startY = fromState.y + 26;
                const endX = toState.x - 26;
                const endY = toState.y;
                pathData = `M ${startX} ${startY} Q 150 290 ${endX} ${endY}`;
                labelX = 175;
                labelY = 245;
              }

              return (
                <g key={`trans-${t.from}-${t.to}-${index}`}>
                  {/* Transition Directed Path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isTransitionActive ? '#2563eb' : '#94a3b8'}
                    strokeWidth={isTransitionActive ? 2.5 : 1.75}
                    strokeDasharray={t.isInvalid ? '4 3' : 'none'}
                    markerEnd={isTransitionActive ? 'url(#dfa-arrow-active)' : 'url(#dfa-arrow)'}
                  />

                  {/* Transition Symbol Label */}
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect
                      x="-28"
                      y="-8"
                      width="56"
                      height="16"
                      rx="3"
                      fill="#ffffff"
                      stroke={isTransitionActive ? '#bfdbfe' : '#e2e8f0'}
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fontSize="8.5"
                      fontWeight="700"
                      fill={isTransitionActive ? '#1d4ed8' : '#475569'}
                    >
                      {t.symbol}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* States (Nodes) */}
          <g className="dfa-states" aria-label="Automaton states">
            {SHARED_DFA_STATES.map(state => {
              const isActive = state.id === activeNormalizedState;
              const isAccepting = state.isAccepting;
              const isTrap = state.isTrap;

              let fillColor = '#ffffff';
              let strokeColor = '#475569';
              let textColor = '#0f172a';

              if (isActive) {
                fillColor = '#eff6ff';
                strokeColor = '#1d4ed8';
                textColor = '#1e40af';
              } else if (isAccepting) {
                strokeColor = '#059669';
              } else if (isTrap) {
                strokeColor = '#dc2626';
              }

              return (
                <g
                  key={`state-${state.id}`}
                  className={`dfa-state ${isActive ? 'active' : ''}`}
                  onClick={() => onStateClick && onStateClick(state)}
                  role="button"
                  tabIndex={0}
                  aria-label={`State ${state.label}${isActive ? ' (Current Active State)' : ''}${isAccepting ? ' (Accepting Final State)' : ''}`}
                >
                  {/* Active Outer Pulse Ring */}
                  {isActive && (
                    <circle
                      cx={state.x}
                      cy={state.y}
                      r="34"
                      fill="none"
                      stroke="#93c5fd"
                      strokeWidth="3"
                      opacity="0.8"
                    />
                  )}

                  {/* Outer Main State Circle */}
                  <circle
                    cx={state.x}
                    cy={state.y}
                    r="27"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isActive ? 3 : 2}
                    filter={isActive ? 'url(#dfa-active-glow)' : 'url(#dfa-node-shadow)'}
                  />

                  {/* DOUBLE CIRCLE for Accepting State (COMPLETED) */}
                  {isAccepting && (
                    <circle
                      cx={state.x}
                      cy={state.y}
                      r="22"
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                  )}

                  {/* State Name Label */}
                  <text
                    x={state.x}
                    y={state.y}
                    textAnchor="middle"
                    dy="3.5"
                    fontSize="8.5"
                    fontWeight="700"
                    fill={textColor}
                    pointerEvents="none"
                  >
                    {state.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Automata Visual Legend */}
      <div className="dfa-legend" aria-label="DFA Diagram Legend">
        <div className="legend-item">
          <span className="legend-symbol" style={{ backgroundColor: '#ffffff', border: '2px solid #2563eb' }} />
          <span>Start State (CREATED)</span>
        </div>
        <div className="legend-item">
          <span className="legend-symbol" style={{ backgroundColor: '#eff6ff', border: '3px solid #1d4ed8' }} />
          <span>Active State ({activeNormalizedState})</span>
        </div>
        <div className="legend-item">
          <span 
            className="legend-symbol" 
            style={{ 
              backgroundColor: '#ffffff', 
              border: '2px solid #059669', 
              boxShadow: '0 0 0 2px #059669 inset' 
            }} 
          />
          <span>Accepting State (COMPLETED &mdash; Double Circle)</span>
        </div>
        <div className="legend-item">
          <span className="legend-symbol" style={{ backgroundColor: '#ffffff', border: '2px solid #dc2626' }} />
          <span>Trap State (REJECTED)</span>
        </div>
      </div>
    </div>
  );
}
