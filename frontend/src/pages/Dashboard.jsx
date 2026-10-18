import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ResultMessage from '../components/ResultMessage.jsx';
import { useRequests } from '../hooks/useRequests.js';
import { formatStatusLabel, formatTimestamp, safeDisplay } from '../utils/formatters.js';
import '../styles/pages.css';

export default function Dashboard() {
  const { requests, loading, error, refresh, count } = useRequests();

  // Compute live statistics directly from real loaded requests (no fake metrics)
  const totalRequests = count || requests.length;
  const approvedRequests = requests.filter(
    (r) => r.status === 'APPROVED' || r.currentState === 'Q4_REGISTRAR_SEALED' || r.currentState === 'COMPLETED'
  ).length;
  const inReviewRequests = requests.filter(
    (r) => r.status === 'IN_REVIEW' || r.status === 'PENDING' || r.currentState === 'Q2_ADVISOR_VERIFIED' || r.currentState === 'PROCESSING'
  ).length;
  const rejectedRequests = requests.filter(
    (r) => r.status === 'REJECTED' || r.currentState === 'Q_REJECTED'
  ).length;

  // Display the 5 most recent requests
  const recentRequests = requests.slice(0, 5);

  return (
    <div className="page-container">
      {/* Welcome Heading & Live Status */}
      <PageHeader
        title="Welcome to Campus Simulation Dashboard"
        description="Unified telemetry, live request audit traces, and interdisciplinary educational engine status across DAA, COA, and FLAT."
        action={
          <div className="dashboard-actions-bar">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={refresh}
              disabled={loading}
              title="Refresh request telemetry from backend"
            >
              {loading ? 'Refreshing...' : '↺ Refresh Telemetry'}
            </button>
            <StatusBadge status="online" label="Engine Active" />
          </div>
        }
      />

      {/* Real Metrics Summary Row */}
      <div className="card-grid" aria-label="Real Request Telemetry">
        <StatCard
          label="Total Logged Requests"
          value={loading ? '...' : totalRequests}
          description="In-memory request records"
          badge={<span className="status-pill online">Active Store</span>}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />

        <StatCard
          label="Approved / Sealed"
          value={loading ? '...' : approvedRequests}
          description="Reached DFA accepting state"
          badge={<span className="status-pill approved">Accepting State</span>}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />

        <StatCard
          label="In Review / Pending"
          value={loading ? '...' : inReviewRequests}
          description="Pending intermediate verification"
          badge={<span className="status-pill warning">Intermediate</span>}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <StatCard
          label="Rejected / Trap"
          value={loading ? '...' : rejectedRequests}
          description="Terminated at DFA trap state"
          badge={<span className="status-pill danger">Trap State</span>}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </div>

      {/* Three Core Academic Subject Modules */}
      <div>
        <div className="features-section-header">
          <h2 className="features-section-title">Academic Modules &amp; Demonstrated Concepts</h2>
          <p className="features-section-desc">
            Direct access to the three foundational computer science laboratories integrated into the simulator.
          </p>
        </div>

        <div className="card-grid">
          {/* DAA Feature Card */}
          <section className="academic-feature-card" aria-label="DAA Campus Navigation Module">
            <div>
              <div className="feature-card-header">
                <span className="academic-badge badge-daa">DAA Laboratory</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Graph Theory</span>
              </div>
              <h3 className="feature-card-title">Campus Navigator (BFS &amp; DFS)</h3>
              <p className="feature-card-p">
                Demonstrates topological graph representation of 6 campus landmarks connected by 9 undirected routes.
              </p>

              <div style={{ marginTop: '0.85rem', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                <strong>Demonstrated Concepts:</strong>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                  <li><strong>BFS:</strong> Queue-driven level-order search discovering unweighted shortest paths and minimum hop counts.</li>
                  <li><strong>DFS:</strong> Stack-driven recursive exploration tracking traversal depth and backtracking tree edges.</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/navigator" className="btn btn-primary" style={{ width: '100%' }}>
                Launch Campus Navigator &rarr;
              </Link>
            </div>
          </section>

          {/* COA Feature Card */}
          <section className="academic-feature-card" aria-label="COA Hardware Architecture Module">
            <div>
              <div className="feature-card-header">
                <span className="academic-badge badge-coa">COA Laboratory</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Hardware Pipeline</span>
              </div>
              <h3 className="feature-card-title">Computer Architecture Simulator</h3>
              <p className="feature-card-p">
                Simulates instruction execution cycles through von Neumann units with active tri-bus signal monitoring.
              </p>

              <div style={{ marginTop: '0.85rem', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                <strong>Demonstrated Concepts:</strong>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                  <li><strong>4 Units:</strong> Input Unit &rarr; Memory (0x00A0..0x00B0) &rarr; CPU (CU &amp; ALU) &rarr; Output Unit.</li>
                  <li><strong>Tri-Bus:</strong> Data Bus (payload), Address Bus (memory pointers), Control Bus (R/W timing strobes).</li>
                  <li><strong>Registers:</strong> PC, MAR, MDR, IR, ACC lifecycle tracking.</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/architecture" className="btn btn-primary" style={{ width: '100%' }}>
                Launch Architecture Sim &rarr;
              </Link>
            </div>
          </section>

          {/* FLAT Feature Card */}
          <section className="academic-feature-card" aria-label="FLAT Workflow Validator Module">
            <div>
              <div className="feature-card-header">
                <span className="academic-badge badge-flat">FLAT Laboratory</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Automata Theory</span>
              </div>
              <h3 className="feature-card-title">Request Workflow Validator</h3>
              <p className="feature-card-p">
                Formalizes academic document approval paths as a Deterministic Finite Automaton (DFA).
              </p>

              <div style={{ marginTop: '0.85rem', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                <strong>Demonstrated Concepts:</strong>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                  <li><strong>5-Tuple DFA:</strong> Formal state set $Q$, alphabet $\Sigma$, transition function $\delta$, start $q_0$, final states $F$.</li>
                  <li><strong>Accepting State:</strong> Double-circle COMPLETED state notation versus dead-end REJECTED trap states.</li>
                  <li><strong>Strict Determinism:</strong> Invalid transition sequence rejection.</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/workflow" className="btn btn-primary" style={{ width: '100%' }}>
                Launch Workflow Validator &rarr;
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Recent Requests Summary Section */}
      <section className="recent-requests-card" aria-label="Recent Requests Summary">
        <div className="recent-requests-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Recent Campus Requests
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Real-time audit log of student submissions and execution traces loaded from the backend.
            </p>
          </div>

          <Link to="/history" className="btn btn-secondary">
            View All in Request History &rarr;
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <ResultMessage
            type="error"
            title="Failed to Load Request Telemetry"
            text={`${error}. Verify that the backend Express server is running on http://localhost:5000.`}
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-skeleton-box" role="status" aria-live="polite">
            <div className="spinner-icon" aria-hidden="true" />
            <span>Loading live request telemetry from backend...</span>
          </div>
        )}

        {/* Loaded Requests Table */}
        {!loading && !error && recentRequests.length > 0 && (
          <div className="table-wrapper">
            <table className="data-table" aria-label="Recent requests telemetry table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Student</th>
                  <th>Request Title &amp; Type</th>
                  <th>Department</th>
                  <th>Current State</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <span className="request-id-link">{req.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{safeDisplay(req.studentName)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                        {safeDisplay(req.studentId)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{safeDisplay(req.title)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {safeDisplay(req.requestType)}
                      </div>
                    </td>
                    <td>{safeDisplay(req.department)}</td>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.15rem 0.35rem', borderRadius: '3px' }}>
                        {safeDisplay(req.currentState)}
                      </code>
                    </td>
                    <td>
                      <StatusBadge status={req.status} label={formatStatusLabel(req.status || req.currentState)} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatTimestamp(req.submittedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && recentRequests.length === 0 && (
          <div className="loading-skeleton-box" style={{ padding: '2rem 1rem' }}>
            <p style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              No Campus Requests Recorded
            </p>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Submit a student request via the Workflow Validator to initiate DFA validation and hardware simulation.
            </p>
            <Link to="/workflow" className="btn btn-primary">
              Create New Request in Workflow &rarr;
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
