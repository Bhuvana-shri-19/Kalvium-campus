import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import '../styles/pages.css';

/**
 * ProjectGuide Component (Phase 9)
 * 
 * Provides an accessible, comprehensive academic walkthrough explaining the entire system.
 * Designed to serve as a complete reference for viva voce, academic evaluation, and college presentations.
 */
export default function ProjectGuide() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '1. Project Overview & Architecture' },
    { id: 'modules', label: '2. Academic Modules (DAA, COA, FLAT)' },
    { id: 'algorithms', label: '3. BFS & DFS Graph Theory' },
    { id: 'hardware', label: '4. COA Tri-Bus Pipeline' },
    { id: 'automata', label: '5. FLAT DFA State Machine' },
    { id: 'data-storage', label: '6. API & In-Memory Storage' },
    { id: 'viva-guide', label: '7. Presentation & Demo Script' },
    { id: 'deployment', label: '8. Deployment & Cloud Hosting' }
  ];

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Project Guide & Educational Architecture"
        description="A complete academic reference explaining how the simulator bridges theoretical computer science curricula with full-stack software development."
        action={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/dashboard" className="btn btn-secondary">
              &larr; Back to Dashboard
            </Link>
            <StatusBadge status="online" label="Reference Active" />
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="step-tracker-bar" style={{ marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`step-tracker-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Project Overview & Architecture */}
      {activeTab === 'overview' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              1. What the Project Is &amp; Why It Was Built
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              The <strong>Kalvium Campus Navigator &amp; Request Processing Simulator</strong> is an interdisciplinary full-stack application designed to unify three foundational pillars of the Computer Science &amp; Engineering curriculum:
            </p>
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: '1rem' }}>
              <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <span className="academic-badge badge-daa" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>DAA Module</span>
                <h4 style={{ fontWeight: '700', color: '#1e40af', marginBottom: '0.25rem' }}>Design &amp; Analysis of Algorithms</h4>
                <p style={{ fontSize: '0.85rem', color: '#334155' }}>
                  Models physical campus navigation as an undirected graph, computing level-order shortest paths using <strong>Breadth-First Search (BFS)</strong> and reachability using <strong>Depth-First Search (DFS)</strong>.
                </p>
              </div>

              <div style={{ padding: '1rem', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                <span className="academic-badge badge-coa" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>COA Module</span>
                <h4 style={{ fontWeight: '700', color: '#6d28d9', marginBottom: '0.25rem' }}>Computer Organization &amp; Architecture</h4>
                <p style={{ fontSize: '0.85rem', color: '#334155' }}>
                  Simulates a 4-stage von Neumann hardware execution pipeline (Input Unit &rarr; Memory Unit &rarr; CPU &rarr; Output Unit) with active tri-bus signaling (Data, Address, Control) and register updates (PC, MAR, MDR, IR, ACC).
                </p>
              </div>

              <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <span className="academic-badge badge-flat" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>FLAT Module</span>
                <h4 style={{ fontWeight: '700', color: '#047857', marginBottom: '0.25rem' }}>Formal Languages &amp; Automata Theory</h4>
                <p style={{ fontSize: '0.85rem', color: '#334155' }}>
                  Formalizes the academic request verification lifecycle as a mathematical <strong>Deterministic Finite Automaton (DFA)</strong> $M = (Q, \Sigma, \delta, q_0, F)$, strictly enforcing deterministic transitions and rejecting undefined inputs.
                </p>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Full-Stack Architecture &amp; Technology Stack
            </h3>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.7', color: 'var(--text-muted)' }}>
              <li><strong>Frontend:</strong> React 18 single-page application built with Vite and React Router v6. Utilizes modular CSS custom properties (tokens) without bulky external UI libraries.</li>
              <li><strong>Backend:</strong> Node.js (v18+) with Express server using ES Module syntax (<code>import/export</code>).</li>
              <li><strong>Native Algorithm Engine (DAA):</strong> Compiled native C++ binaries (<code>bfs.cpp</code>, <code>dfs.cpp</code>) executed via standard stream IPC (<code>stdin/stdout</code> JSON) with strict execution timeouts.</li>
              <li><strong>Communication:</strong> RESTful JSON APIs over HTTP (<code>fetch</code> client) with consistent JSON response envelopes (<code>{`{ success, data, message }`}</code>).</li>
              <li><strong>Automated Testing:</strong> Node.js native test runner (<code>node --test</code>) running 56 comprehensive tests covering algorithmic guarantees, pipeline sequentiality, and DFA determinism.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Academic Modules */}
      {activeTab === 'modules' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              2. Module Specifications: Inputs, Outputs &amp; APIs
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Each module operates with precise mathematical boundaries and clearly defined input/output interfaces:
            </p>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Core Purpose</th>
                  <th>Accepted Inputs</th>
                  <th>Produced Outputs</th>
                  <th>Backend Endpoints</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="academic-badge badge-daa">DAA</span></td>
                  <td>Topological shortest path &amp; tree traversal</td>
                  <td><code>startNode</code>, <code>targetNode</code> (e.g. <code>GATE</code>, <code>HOSTEL</code>)</td>
                  <td>Hops, path array, visited vertices order, traversal step traces</td>
                  <td><code>GET /api/navigation/bfs</code><br /><code>GET /api/navigation/dfs</code></td>
                </tr>
                <tr>
                  <td><span className="academic-badge badge-coa">COA</span></td>
                  <td>Instruction fetch/decode/execute simulation</td>
                  <td><code>studentId</code>, <code>requestType</code>, <code>creditUnits</code>, <code>priority</code></td>
                  <td>Active stage (0..3), Bus signals (Data, Address, Control), Registers (PC, MAR, MDR, IR, ACC)</td>
                  <td><code>POST /api/processing/start</code><br /><code>POST /api/processing/advance</code></td>
                </tr>
                <tr>
                  <td><span className="academic-badge badge-flat">FLAT</span></td>
                  <td>DFA request state lifecycle validation</td>
                  <td><code>id</code> (e.g. <code>REQ-1001</code>), <code>action</code> symbol (<code>VALIDATE</code>, <code>PROCESS</code>, <code>COMPLETE</code>, <code>REJECT</code>)</td>
                  <td>New state, transition success/rejection, formal audit log</td>
                  <td><code>POST /api/requests</code><br /><code>POST /api/requests/:id/action</code></td>
                </tr>
                <tr>
                  <td><span className="academic-badge" style={{ background: '#f1f5f9', color: '#475569' }}>History</span></td>
                  <td>Comprehensive request audit telemetry</td>
                  <td>Filters (status, priority), search query, sorting parameters</td>
                  <td>Filtered request list, modal detailed audit view, status metrics</td>
                  <td><code>GET /api/requests</code><br /><code>GET /api/requests/:id</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: BFS & DFS */}
      {activeTab === 'algorithms' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              3. Graph Theory: BFS &amp; DFS Traversal Analysis
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              The campus map is modeled as an undirected, unweighted graph $G = (V, E)$ consisting of 6 landmark vertices ($V$) and 9 connecting pathways ($E$).
            </p>
          </div>

          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <div style={{ padding: '1.25rem', background: '#fafbfc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e40af' }}>Breadth-First Search (BFS)</h3>
                <span className="academic-badge badge-daa">Queue-Based (FIFO)</span>
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                <li><strong>Theoretical Property:</strong> Guarantees the unweighted shortest path (minimum hop count) between origin and target.</li>
                <li><strong>Mechanism:</strong> Explores nodes level-by-level using a First-In, First-Out (FIFO) queue. Nodes at distance $k$ are exhausted before examining nodes at distance $k+1$.</li>
                <li><strong>Time Complexity:</strong> $\mathcal{O}(V + E)$ where every vertex enters the queue once and every edge is traversed twice.</li>
                <li><strong>Space Complexity:</strong> $\mathcal{O}(V)$ auxiliary space for the queue and visited set.</li>
                <li><strong>Campus Example:</strong> <code>GATE &rarr; HOSTEL</code> traverses <code>GATE &rarr; BLOCK_A &rarr; LAB &rarr; HOSTEL</code> with exactly <strong>3 hops</strong>.</li>
              </ul>
            </div>

            <div style={{ padding: '1.25rem', background: '#fafbfc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#6d28d9' }}>Depth-First Search (DFS)</h3>
                <span className="academic-badge badge-coa">Stack / Recursion</span>
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                <li><strong>Theoretical Property:</strong> Determines reachability, topological discovery order, and cycle-free tree edges.</li>
                <li><strong>Mechanism:</strong> Deeply explores each adjacent branch before backtracking, maintaining visited states to prevent infinite loops.</li>
                <li><strong>Time Complexity:</strong> $\mathcal{O}(V + E)$.</li>
                <li><strong>Space Complexity:</strong> $\mathcal{O}(V)$ recursive call stack depth.</li>
                <li><strong>Key Difference:</strong> DFS does <em>not</em> guarantee the shortest path, but visits every reachable node deterministically.</li>
              </ul>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Campus Graph Adjacency List:</h4>
            <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', overflowX: 'auto' }}>
{`GATE:      ["BLOCK_A", "LIBRARY"]
BLOCK_A:   ["GATE", "LIBRARY", "CAFETERIA", "LAB"]
LIBRARY:   ["GATE", "BLOCK_A", "LAB"]
CAFETERIA: ["BLOCK_A", "LAB", "HOSTEL"]
LAB:       ["BLOCK_A", "LIBRARY", "CAFETERIA", "HOSTEL"]
HOSTEL:    ["CAFETERIA", "LAB"]`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: COA Tri-Bus Pipeline */}
      {activeTab === 'hardware' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              4. Computer Organization: 4-Stage von Neumann Execution Pipeline
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              The simulator models instruction execution through 4 core functional units connected via a tri-bus architecture:
            </p>
          </div>

          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div style={{ padding: '1rem', background: '#fafbfc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '700', color: '#1e40af', marginBottom: '0.25rem' }}>Stage 0: Input Unit</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Ingests student request payload into peripheral input buffer. Initializes Program Counter (PC = 0x00A0) and prepares data bus latch.
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#fafbfc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '700', color: '#6d28d9', marginBottom: '0.25rem' }}>Stage 1: Memory Unit</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Memory Address Register (MAR) loads target address. Data bus transfers request structure from RAM cell (0x00A0..0x00B0) into Memory Data Register (MDR).
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#fafbfc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '700', color: '#047857', marginBottom: '0.25rem' }}>Stage 2: CPU Unit</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Instruction Register (IR) decodes request operation. Arithmetic Logic Unit (ALU) verifies credit thresholds (e.g. 18 &le; 24 credits) and updates Accumulator (ACC).
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#fafbfc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '700', color: '#b45309', marginBottom: '0.25rem' }}>Stage 3: Output Unit</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Final verified status latched into output register. Control bus signals execution complete. Pipeline clamps at Stage 3 preventing out-of-bounds advancement.
              </p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              The Tri-Bus Architecture Explained
            </h3>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
              <li><strong>Data Bus (Bidirectional):</strong> Carries the raw data payload (request bytes, student credit values, execution flags).</li>
              <li><strong>Address Bus (Unidirectional from CPU/DMA):</strong> Carries physical memory pointers (e.g., <code>0x00A0</code>, <code>0x00A4</code>).</li>
              <li><strong>Control Bus (Bidirectional Strobes):</strong> Emits coordination pulses: <code>MEM_READ</code>, <code>MEM_WRITE</code>, <code>ALU_EXEC</code>, <code>BUS_BUSY</code>.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 5: FLAT DFA State Machine */}
      {activeTab === 'automata' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              5. Formal Languages &amp; Automata Theory: The Request DFA
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              The request approval workflow is implemented strictly as a 5-tuple Deterministic Finite Automaton $M = (Q, \Sigma, \delta, q_0, F)$:
            </p>
          </div>

          <div style={{ background: '#fafbfc', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Formal 5-Tuple Definition:</h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
              <li><strong>$Q$ (Finite State Set):</strong> <code>{'{ CREATED, VALIDATED, PROCESSING, COMPLETED, REJECTED }'}</code></li>
              <li><strong>$\Sigma$ (Input Alphabet):</strong> <code>{'{ VALIDATE, PROCESS, COMPLETE, REJECT, RESUBMIT }'}</code></li>
              <li><strong>$q_0$ (Start State):</strong> <code>CREATED</code> &mdash; Every request strictly begins here.</li>
              <li><strong>$F$ (Accepting States):</strong> <code>{'{ COMPLETED }'}</code> &mdash; The only state where a request is formally accepted into language $L(M)$.</li>
              <li><strong>$\delta$ (Transition Function):</strong> Deterministic mapping $Q \times \Sigma \to Q$.</li>
            </ul>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Current State $q$</th>
                  <th>Input Symbol $\sigma$</th>
                  <th>Next State $\delta(q, \sigma)$</th>
                  <th>Status Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>CREATED</code></td>
                  <td><code>VALIDATE</code></td>
                  <td><code>VALIDATED</code></td>
                  <td>Intermediate</td>
                  <td>Vets credentials and prerequisite eligibility</td>
                </tr>
                <tr>
                  <td><code>CREATED</code></td>
                  <td><code>REJECT</code></td>
                  <td><code>REJECTED</code></td>
                  <td>Trap State</td>
                  <td>Immediate denial upon intake</td>
                </tr>
                <tr>
                  <td><code>VALIDATED</code></td>
                  <td><code>PROCESS</code></td>
                  <td><code>PROCESSING</code></td>
                  <td>Intermediate</td>
                  <td>Enters departmental review queue</td>
                </tr>
                <tr>
                  <td><code>VALIDATED</code></td>
                  <td><code>REJECT</code></td>
                  <td><code>REJECTED</code></td>
                  <td>Trap State</td>
                  <td>Advisor or department denial</td>
                </tr>
                <tr>
                  <td><code>PROCESSING</code></td>
                  <td><code>COMPLETE</code></td>
                  <td><code>COMPLETED</code></td>
                  <td><strong>Accepting State ($F$)</strong></td>
                  <td>Registrar seal applied; request fulfilled</td>
                </tr>
                <tr>
                  <td><code>PROCESSING</code></td>
                  <td><code>REJECT</code></td>
                  <td><code>REJECTED</code></td>
                  <td>Trap State</td>
                  <td>Failed resource allocation or cap exceeded</td>
                </tr>
                <tr>
                  <td><code>REJECTED</code></td>
                  <td><code>RESUBMIT</code></td>
                  <td><code>CREATED</code></td>
                  <td>Re-open Action</td>
                  <td>Permits student to re-open from trap state with corrections</td>
                </tr>
                <tr>
                  <td><code>COMPLETED</code></td>
                  <td><em>Any Symbol</em></td>
                  <td>&empty; (Rejected)</td>
                  <td><strong>Terminal</strong></td>
                  <td>Accepting state is sealed; backend returns HTTP 400</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
            <h4 style={{ fontWeight: '700', color: '#047857', marginBottom: '0.25rem' }}>Strict Determinism Invariant:</h4>
            <p style={{ fontSize: '0.85rem', color: '#065f46', lineHeight: '1.5' }}>
              If an action symbol has no defined transition in $\delta(q, \sigma)$ (for example, attempting <code>COMPLETE</code> directly on <code>CREATED</code>), the backend Express controller immediately rejects the action with <strong>HTTP 400 Bad Request</strong>. The in-memory state remains completely unmodified, ensuring determinism is mathematically preserved.
            </p>
          </div>
        </div>
      )}

      {/* Tab 6: API & Storage */}
      {activeTab === 'data-storage' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              6. Data Model, API Endpoints &amp; In-Memory Storage
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Understanding the data architecture, endpoint specifications, and state persistence semantics:
            </p>
          </div>

          <div style={{ background: '#fafbfc', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              The In-Memory Storage Model
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Requests are managed by an encapsulated JavaScript array (<code>_store</code> in <code>backend/src/data/requestsStore.js</code>).
            </p>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem', borderRadius: '6px', marginTop: '0.75rem' }}>
              <strong style={{ color: '#b45309', display: 'block', marginBottom: '0.25rem' }}>
                &bull; In-Memory Volatility Note (Academic Requirement):
              </strong>
              <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0, lineHeight: '1.5' }}>
                All student request submissions and state transitions persist in memory for the active runtime of the Node.js server. If the backend process is stopped or restarted, the store resets to its default 3 seed requests (<code>REQ-1001</code>, <code>REQ-1002</code>, <code>REQ-1003</code>). This was intentionally chosen to keep the educational simulator self-contained with zero external database dependencies.
              </p>
            </div>
          </div>

          <div style={{ background: '#fafbfc', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Standard Request JSON Data Model
            </h3>
            <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', overflowX: 'auto' }}>
{`{
  "id": "REQ-1004",
  "title": "Extended High-Performance GPU Access",
  "studentName": "Priya Sundaram",
  "studentId": "KAL-2026-401",
  "requestType": "LAB_ACCESS_PERMISSION",
  "department": "Computer Science",
  "priority": "HIGH",
  "description": "Deep learning model training for capstone project.",
  "currentState": "CREATED",
  "status": "IN_REVIEW",
  "sequence": ["VALIDATE"],
  "createdAt": "2026-10-19T10:45:00.000Z",
  "workflowHistory": [
    {
      "step": 0,
      "timestamp": "2026-10-19T10:45:00.000Z",
      "action": "SUBMIT",
      "fromState": null,
      "toState": "CREATED",
      "note": "Request initialized."
    }
  ]
}`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 7: Presentation Script */}
      {activeTab === 'viva-guide' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              7. College Presentation &amp; Viva Voce Demonstration Script
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Follow this step-by-step 3-minute sequence during your college demo or project presentation:
            </p>
          </div>

          <div className="history-step-list">
            <div className="history-step-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="academic-badge" style={{ background: '#1e40af', color: '#ffffff' }}>Step 1: Introduction</span>
                <strong>Open Dashboard &amp; Explain the Vision (30 seconds)</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Point out that the system models an academic request across three levels: Physical Graph Routing (DAA), Silicon Hardware Execution (COA), and Formal State Machine Validation (FLAT). Show the live summary cards displaying actual in-memory request metrics.
              </p>
            </div>

            <div className="history-step-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="academic-badge badge-daa">Step 2: DAA Demo</span>
                <strong>Demonstrate BFS Shortest Path (45 seconds)</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Navigate to <strong>Campus Navigator</strong>. Select <code>Start: GATE</code> and <code>Destination: HOSTEL</code>. Click <strong>Find Shortest Route (BFS)</strong>. Explain why BFS guarantees minimum hop count (3 hops: GATE &rarr; BLOCK_A &rarr; LAB &rarr; HOSTEL) due to level-order exploration. Compare this with DFS reachability.
              </p>
            </div>

            <div className="history-step-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="academic-badge badge-coa">Step 3: COA Demo</span>
                <strong>Step Through von Neumann Pipeline (45 seconds)</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Navigate to <strong>Computer Architecture</strong>. Step through the 4 stages: Input Unit &rarr; Memory Unit &rarr; CPU &rarr; Output Unit. Show how the MAR loads memory address <code>0x00A0</code>, how the ALU tests credit limit boundaries, and how the tri-bus control strobe coordinates each cycle.
              </p>
            </div>

            <div className="history-step-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="academic-badge badge-flat">Step 4: FLAT Demo</span>
                <strong>Execute Request DFA &amp; Prove Determinism (60 seconds)</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Navigate to <strong>Request Workflow</strong>. Create a request (state: <code>CREATED</code>). Click <strong>Validate</strong> &rarr; state transitions to <code>VALIDATED</code>. Click <strong>Process</strong> &rarr; state transitions to <code>PROCESSING</code>. Click <strong>Complete</strong> &rarr; state reaches accepting state <code>COMPLETED</code>. Finally, attempt an invalid action to show the live HTTP 400 rejection proving strict automata determinism!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Deployment & Cloud Hosting */}
      {activeTab === 'deployment' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              8. Production Deployment &amp; Cloud Hosting Architecture
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              This guide provides step-by-step instructions for deploying the full-stack simulator to cloud platforms such as <strong>Render</strong>, <strong>Railway</strong>, <strong>Vercel</strong>, or containerized via <strong>Docker</strong>.
            </p>
          </div>

          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <div style={{ padding: '1.25rem', background: '#fafbfc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.5rem' }}>
                Option A: Single-Service Monolith (Render / Railway / VPS)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                Recommended for turnkey deployment. Express serves both the REST API and the compiled React SPA from <code>frontend/dist</code> on a single port.
              </p>
              <div style={{ background: '#0f172a', color: '#38bdf8', padding: '0.85rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                <div># Build Command</div>
                <div style={{ color: '#a5f3fc' }}>npm run install:all &amp;&amp; npm run build</div>
                <div style={{ marginTop: '0.5rem' }}># Start Command</div>
                <div style={{ color: '#a5f3fc' }}>node backend/server.js</div>
              </div>
            </div>

            <div style={{ padding: '1.25rem', background: '#fafbfc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#047857', marginBottom: '0.5rem' }}>
                Option B: Split Cloud Deployment (Vercel + Render)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                Host the Vite frontend on <strong>Vercel / Netlify</strong> and the Node.js + C++ backend on <strong>Render / Railway</strong>.
              </p>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                <li><strong>Backend:</strong> Deploy <code>backend/</code> with build command <code>npm run build:cpp</code> and start command <code>node server.js</code>.</li>
                <li><strong>Frontend:</strong> Deploy <code>frontend/</code> with environment variable: <code>VITE_API_BASE_URL=https://your-backend.onrender.com/api</code>.</li>
              </ul>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Cross-Platform C++ Compilation on Linux Hosts
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Standard cloud platforms run on Linux. The build script (<code>scripts/build-cpp.js</code>) automatically detects <code>g++</code> / <code>clang++</code> in the host environment and compiles native ELF executables (<code>backend/bin/bfs</code>, <code>backend/bin/dfs</code>) with executable file permissions (<code>chmod +x</code>).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
