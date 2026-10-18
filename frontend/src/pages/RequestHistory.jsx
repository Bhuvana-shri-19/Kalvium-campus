import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ResultMessage from '../components/ResultMessage.jsx';
import { useRequests } from '../hooks/useRequests.js';
import { formatStatusLabel, formatTimestamp, safeDisplay } from '../utils/formatters.js';
import '../styles/pages.css';

/**
 * Filter configuration options for request status
 */
const STATUS_FILTERS = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'REJECTED', label: 'Rejected' }
];

export default function RequestHistory() {
  const { requests, loading, error, refresh, filter, setFilter } = useRequests(true, 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Compute status counts dynamically from loaded requests
  const counts = useMemo(() => {
    return {
      ALL: requests.length,
      APPROVED: requests.filter(
        r => r.status === 'APPROVED' || r.currentState === 'COMPLETED' || r.currentState === 'Q4_REGISTRAR_SEALED'
      ).length,
      IN_REVIEW: requests.filter(
        r => r.status === 'IN_REVIEW' || r.status === 'PENDING' || r.currentState === 'PROCESSING' || r.currentState === 'VALIDATED' || r.currentState === 'CREATED' || r.currentState === 'Q2_ADVISOR_VERIFIED'
      ).length,
      REJECTED: requests.filter(
        r => r.status === 'REJECTED' || r.currentState === 'REJECTED' || r.currentState === 'Q_REJECTED'
      ).length
    };
  }, [requests]);

  // Client-side search & filtering across loaded request dataset
  const filteredRequests = useMemo(() => {
    let list = requests;

    // Apply status filter if not already filtered by backend
    if (filter && filter !== 'ALL') {
      const target = filter.toUpperCase();
      list = list.filter(req => {
        const s = (req.status || '').toUpperCase();
        const cs = (req.currentState || '').toUpperCase();
        if (target === 'APPROVED') {
          return s === 'APPROVED' || cs === 'COMPLETED' || cs === 'Q4_REGISTRAR_SEALED';
        }
        if (target === 'IN_REVIEW') {
          return s === 'IN_REVIEW' || s === 'PENDING' || cs === 'PROCESSING' || cs === 'VALIDATED' || cs === 'CREATED' || cs === 'Q2_ADVISOR_VERIFIED';
        }
        if (target === 'REJECTED') {
          return s === 'REJECTED' || cs === 'REJECTED' || cs === 'Q_REJECTED';
        }
        return s === target || cs === target;
      });
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(req =>
        (req.id && req.id.toLowerCase().includes(q)) ||
        (req.title && req.title.toLowerCase().includes(q)) ||
        (req.studentName && req.studentName.toLowerCase().includes(q)) ||
        (req.studentId && req.studentId.toLowerCase().includes(q)) ||
        (req.department && req.department.toLowerCase().includes(q)) ||
        (req.requestType && req.requestType.toLowerCase().includes(q)) ||
        (req.status && req.status.toLowerCase().includes(q)) ||
        (req.currentState && req.currentState.toLowerCase().includes(q))
      );
    }

    return list;
  }, [requests, filter, searchQuery]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Campus Request History &amp; Audit Log"
        description="In-memory repository of submitted academic requests, formal automata verification traces, and hardware cycle telemetry loaded directly from the backend."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={refresh}
              disabled={loading}
              title="Refresh requests from backend in-memory store"
            >
              {loading ? (
                <>
                  <span className="spinner-icon" style={{ width: '14px', height: '14px' }} aria-hidden="true" />
                  <span>Refreshing...</span>
                </>
              ) : (
                <span>&#8635; Refresh Records</span>
              )}
            </button>
            <StatusBadge status="online" label="Store Synced" />
          </div>
        }
      />

      {/* Error State Banner */}
      {error && (
        <ResultMessage
          type="error"
          title="Failed to Load Request History"
          text={`${error}. Please ensure the Express backend is running on http://localhost:5000.`}
          onDismiss={refresh}
        />
      )}

      {/* Filter & Search Toolbar */}
      <section className="history-controls-card" aria-label="Request Filtering and Controls">
        <div className="history-toolbar-row">
          {/* Status Filter Tabs */}
          <div className="filter-tabs-group" role="tablist" aria-label="Filter requests by status">
            {STATUS_FILTERS.map(tab => {
              const isActive = filter === tab.key;
              const countForTab = counts[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`filter-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setFilter(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span className="filter-badge-count">{countForTab}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box and View Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <div className="history-search-wrapper">
              <input
                type="text"
                className="history-search-input"
                placeholder="Search ID, title, student, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search campus requests"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: '0 0.25rem' }}
                  title="Clear search query"
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="view-mode-toggle" role="group" aria-label="View layout toggle">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table view"
                aria-label="Table view"
              >
                Table
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Card grid view"
                aria-label="Card grid view"
              >
                Cards
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <div className="loading-skeleton-box" role="status" aria-live="polite">
          <div className="spinner-icon" aria-hidden="true" />
          <span>Fetching campus requests from backend in-memory store...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredRequests.length === 0 && (
        <div className="empty-history-state" role="status">
          <div className="empty-history-icon" aria-hidden="true">&#128196;</div>
          <div style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {searchQuery || filter !== 'ALL' ? 'No Matching Requests' : 'No Campus Requests Found'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {searchQuery || filter !== 'ALL'
                ? `No request records match the status filter "${filter}" and search query "${searchQuery}". Reset filters to view all records.`
                : 'The backend in-memory request store currently has no logged requests. You can submit and process new requests using the FLAT Workflow Validator.'}
            </p>
          </div>

          {searchQuery || filter !== 'ALL' ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFilter('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filters &amp; Search
            </button>
          ) : (
            <Link to="/workflow" className="btn btn-primary">
              Open Request Workflow Validator &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Loaded Table View */}
      {!loading && !error && filteredRequests.length > 0 && viewMode === 'table' && (
        <div className="table-wrapper">
          <table className="data-table" aria-label="Campus requests audit history table">
            <thead>
              <tr>
                <th scope="col">Request ID</th>
                <th scope="col">Student</th>
                <th scope="col">Title &amp; Category</th>
                <th scope="col">Department</th>
                <th scope="col">Current State</th>
                <th scope="col">Status</th>
                <th scope="col">Submitted At</th>
                <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <code style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                      {req.id}
                    </code>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>
                      {safeDisplay(req.studentName, 'Kalvium Student')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {safeDisplay(req.studentId)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{safeDisplay(req.title)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {safeDisplay(req.requestType || req.category)}
                    </div>
                  </td>
                  <td>{safeDisplay(req.department)}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>
                      {safeDisplay(req.currentState)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge
                      status={req.status || req.currentState}
                      label={formatStatusLabel(req.status || req.currentState)}
                    />
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    {formatTimestamp(req.submittedAt || req.createdAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.775rem' }}
                      onClick={() => setSelectedRequest(req)}
                      title="Inspect DFA trace and COA execution metrics"
                    >
                      Audit Trace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loaded Responsive Card View */}
      {!loading && !error && filteredRequests.length > 0 && viewMode === 'cards' && (
        <div className="history-cards-grid" aria-label="Campus requests card list">
          {filteredRequests.map((req) => (
            <div key={req.id} className="history-card">
              <div>
                <div className="history-card-header">
                  <code style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                    {req.id}
                  </code>
                  <StatusBadge
                    status={req.status || req.currentState}
                    label={formatStatusLabel(req.status || req.currentState)}
                  />
                </div>
                <h3 className="history-card-title">{safeDisplay(req.title)}</h3>
                <div className="history-card-meta" style={{ marginTop: '0.5rem' }}>
                  <div><strong>Category:</strong> {safeDisplay(req.requestType || req.category || req.department)}</div>
                  <div><strong>Student:</strong> {safeDisplay(req.studentName, 'Kalvium Student')} ({safeDisplay(req.studentId)})</div>
                  <div><strong>Current State:</strong> <code>{safeDisplay(req.currentState)}</code></div>
                </div>
              </div>

              <div className="history-card-footer">
                <span>{formatTimestamp(req.submittedAt || req.createdAt)}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                  onClick={() => setSelectedRequest(req)}
                >
                  View Audit Trace &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Audit Modal */}
      {selectedRequest && (
        <div
          className="audit-modal-backdrop"
          onClick={() => setSelectedRequest(null)}
          role="presentation"
        >
          <div
            className="audit-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-modal-title"
          >
            <div className="audit-modal-header">
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.5px' }}>
                  Formal Audit Record
                </span>
                <h2 id="audit-modal-title" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {selectedRequest.title}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Request ID: <code style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{selectedRequest.id}</code> &bull; Submitted: {formatTimestamp(selectedRequest.submittedAt || selectedRequest.createdAt)}
                </div>
              </div>
              <button
                type="button"
                className="audit-modal-close"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close audit log"
              >
                &times;
              </button>
            </div>

            {/* Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student Information</div>
                <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {safeDisplay(selectedRequest.studentName, 'Kalvium Student')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{safeDisplay(selectedRequest.studentId)}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department &amp; Type</div>
                <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {safeDisplay(selectedRequest.department)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{safeDisplay(selectedRequest.requestType)}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automaton Status</div>
                <div style={{ marginTop: '0.35rem' }}>
                  <StatusBadge
                    status={selectedRequest.status || selectedRequest.currentState}
                    label={formatStatusLabel(selectedRequest.status || selectedRequest.currentState)}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {safeDisplay(selectedRequest.currentState)}
                </div>
              </div>
            </div>

            {/* FLAT Automata Transition Sequence */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  FLAT Automata Sequence Trace (&Sigma;*)
                </span>
                <span className="academic-badge badge-flat">DFA Verification</span>
              </div>
              {selectedRequest.sequence && selectedRequest.sequence.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  {selectedRequest.sequence.map((symbol, idx) => (
                    <React.Fragment key={`sym-${idx}`}>
                      <span style={{ padding: '0.25rem 0.55rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: '700', color: '#1e40af', fontFamily: 'monospace' }}>
                        {symbol}
                      </span>
                      {idx < selectedRequest.sequence.length - 1 && (
                        <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>&rarr;</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Initial submission sequence with no subsequent transitions recorded.
                </p>
              )}
            </div>

            {/* COA Hardware Telemetry */}
            {selectedRequest.hardwareExecution && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    COA Hardware Execution Telemetry
                  </span>
                  <span className="academic-badge badge-coa">Von Neumann Pipeline</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ background: '#fafbfc', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Total Cycles</span>
                    <strong>{selectedRequest.hardwareExecution.cycles ?? '—'} cycles</strong>
                  </div>
                  <div style={{ background: '#fafbfc', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Execution Status</span>
                    <strong>{safeDisplay(selectedRequest.hardwareExecution.status)}</strong>
                  </div>
                  {selectedRequest.hardwareExecution.accumulator !== undefined && (
                    <div style={{ background: '#fafbfc', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Accumulator (ACC)</span>
                      <code>0x{Number(selectedRequest.hardwareExecution.accumulator).toString(16).toUpperCase().padStart(4, '0')}</code>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedRequest(null)}
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Academic Architecture & Integration Note */}
      <section className="daa-explanation-card" aria-label="Request Store Academic Context">
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Educational Data Persistence Architecture
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            How campus request records link FLAT automata proofs with COA hardware simulation.
          </p>
        </div>

        <div className="daa-algo-comparison">
          <div className="algo-box bfs" style={{ borderLeftColor: '#2563eb' }}>
            <div className="algo-box-title">
              <span>In-Memory Central Store</span>
              <span className="academic-badge badge-coa">Non-DB Persistence</span>
            </div>
            <p className="algo-box-desc">
              All student requests live inside the Node.js memory space during runtime without external database requirements. New requests created via the Request Workflow Validator or Architecture Simulator are prepended to the live in-memory array, ensuring consistent cross-module state telemetry across simulator sessions.
            </p>
          </div>

          <div className="algo-box dfs" style={{ borderLeftColor: '#059669' }}>
            <div className="algo-box-title">
              <span>Formal Multi-Disciplinary Telemetry</span>
              <span className="academic-badge badge-flat">FLAT &amp; COA Integration</span>
            </div>
            <p className="algo-box-desc">
              Each recorded entry pairs a high-level administrative document with its formal language acceptance trace (FLAT DFA path from $q_0$ to accepting state $F$ or trap $Q_{REJECTED}$) and low-level micro-architectural clock cycles (COA von Neumann pipeline execution).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
