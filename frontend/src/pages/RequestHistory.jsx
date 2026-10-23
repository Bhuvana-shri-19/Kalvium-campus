import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ResultMessage from '../components/ResultMessage.jsx';
import { useRequests } from '../hooks/useRequests.js';
import { formatStatusLabel, formatTimestamp, safeDisplay } from '../utils/formatters.js';
import '../styles/pages.css';

/**
 * Filter options for approval status
 */
const APPROVAL_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Approval Statuses' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PENDING', label: 'In Review / Pending' },
  { value: 'REJECTED', label: 'Rejected' }
];

/**
 * Filter options for processing status (DFA State)
 */
const PROCESSING_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Processing Statuses' },
  { value: 'CREATED', label: 'Created (q0)' },
  { value: 'VALIDATED', label: 'Validated (q1)' },
  { value: 'PROCESSING', label: 'Processing (q2)' },
  { value: 'COMPLETED', label: 'Completed (Accepting State)' },
  { value: 'REJECTED', label: 'Rejected (Trap State)' }
];

/**
 * Helper to derive normalized approval status and label
 */
function getApprovalStatusMeta(req) {
  const s = (req.status || '').toUpperCase();
  const cs = (req.currentState || '').toUpperCase();

  if (s === 'APPROVED' || cs === 'COMPLETED' || cs === 'Q4_REGISTRAR_SEALED') {
    return { status: 'approved', label: 'Approved' };
  }
  if (s === 'REJECTED' || cs === 'REJECTED' || cs === 'Q_REJECTED') {
    return { status: 'rejected', label: 'Rejected' };
  }
  return { status: 'pending', label: 'In Review' };
}

/**
 * Helper to derive normalized processing status and label
 */
function getProcessingStatusMeta(req) {
  const cs = (req.currentState || '').toUpperCase();

  switch (cs) {
    case 'COMPLETED':
    case 'Q4_REGISTRAR_SEALED':
      return { status: 'completed', label: 'Completed' };
    case 'PROCESSING':
    case 'Q3_HOD_APPROVED':
      return { status: 'processing', label: 'Processing' };
    case 'VALIDATED':
    case 'Q2_ADVISOR_VERIFIED':
      return { status: 'validated', label: 'Validated' };
    case 'CREATED':
    case 'Q0_DRAFT':
    case 'Q1_SUBMITTED':
      return { status: 'created', label: 'Created' };
    case 'REJECTED':
    case 'Q_REJECTED':
      return { status: 'rejected', label: 'Rejected' };
    default:
      return { status: 'neutral', label: formatStatusLabel(cs) };
  }
}

/**
 * Helper to format request priority
 */
function renderPriorityBadge(priority) {
  if (typeof priority === 'string') {
    const upper = priority.toUpperCase();
    if (upper === 'HIGH' || upper === 'URGENT' || upper === 'P1') {
      return <span className="priority-tag p1">High</span>;
    }
    if (upper === 'MEDIUM' || upper === 'NORMAL' || upper === 'P2') {
      return <span className="priority-tag p2">Medium</span>;
    }
    if (upper === 'LOW' || upper === 'P3') {
      return <span className="priority-tag normal">Low</span>;
    }
    return <span className="priority-tag normal">{priority}</span>;
  }
  const p = priority !== undefined && priority !== null ? Number(priority) : 2;
  if (p === 1) return <span className="priority-tag p1">High</span>;
  if (p === 2) return <span className="priority-tag p2">Medium</span>;
  return <span className="priority-tag normal">Low</span>;
}

export default function RequestHistory() {
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const { requests, loading, error, refresh } = useRequests(true, 'ALL');

  // Search, filter, and sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [processingFilter, setProcessingFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'OLDEST'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Auto-open modal if URL has ?id=...
  useEffect(() => {
    if (queryId && requests.length > 0 && !selectedRequest) {
      const match = requests.find((r) => r.id === queryId);
      if (match) {
        setSelectedRequest(match);
      }
    }
  }, [queryId, requests, selectedRequest]);

  // 1. Calculate Summary Counts directly from loaded data
  const summaryCounts = useMemo(() => {
    let total = requests.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let completed = 0;

    requests.forEach((req) => {
      const s = (req.status || '').toUpperCase();
      const cs = (req.currentState || '').toUpperCase();

      // Completed
      if (cs === 'COMPLETED' || cs === 'Q4_REGISTRAR_SEALED' || s === 'COMPLETED') {
        completed++;
      }

      // Approved
      if (s === 'APPROVED' || cs === 'COMPLETED' || cs === 'Q4_REGISTRAR_SEALED') {
        approved++;
      }

      // Rejected
      if (s === 'REJECTED' || cs === 'REJECTED' || cs === 'Q_REJECTED') {
        rejected++;
      }

      // Pending / In Review
      if (
        s === 'PENDING' ||
        s === 'IN_REVIEW' ||
        cs === 'CREATED' ||
        cs === 'VALIDATED' ||
        cs === 'PROCESSING' ||
        cs === 'Q0_DRAFT' ||
        cs === 'Q1_SUBMITTED' ||
        cs === 'Q2_ADVISOR_VERIFIED'
      ) {
        if (s !== 'APPROVED' && s !== 'REJECTED' && cs !== 'COMPLETED' && cs !== 'REJECTED') {
          pending++;
        }
      }
    });

    return { total, pending, approved, rejected, completed };
  }, [requests]);

  // 2. Client-side Search, Multi-criteria Filtering & Sorting
  const filteredRequests = useMemo(() => {
    let list = [...requests];

    // Search by Request ID or Request Title
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((req) => {
        const idMatch = req.id && req.id.toLowerCase().includes(q);
        const titleMatch = req.title && req.title.toLowerCase().includes(q);
        return idMatch || titleMatch;
      });
    }

    // Filter by Approval Status
    if (approvalFilter !== 'ALL') {
      const target = approvalFilter.toUpperCase();
      list = list.filter((req) => {
        const s = (req.status || '').toUpperCase();
        const cs = (req.currentState || '').toUpperCase();
        if (target === 'APPROVED') {
          return s === 'APPROVED' || cs === 'COMPLETED' || cs === 'Q4_REGISTRAR_SEALED';
        }
        if (target === 'PENDING' || target === 'IN_REVIEW') {
          return (
            (s === 'PENDING' || s === 'IN_REVIEW' || cs === 'CREATED' || cs === 'VALIDATED' || cs === 'PROCESSING') &&
            cs !== 'COMPLETED' &&
            cs !== 'REJECTED'
          );
        }
        if (target === 'REJECTED') {
          return s === 'REJECTED' || cs === 'REJECTED' || cs === 'Q_REJECTED';
        }
        return s === target;
      });
    }

    // Filter by Processing Status (DFA State)
    if (processingFilter !== 'ALL') {
      const target = processingFilter.toUpperCase();
      list = list.filter((req) => {
        const cs = (req.currentState || '').toUpperCase();
        if (target === 'COMPLETED') {
          return cs === 'COMPLETED' || cs === 'Q4_REGISTRAR_SEALED';
        }
        if (target === 'REJECTED') {
          return cs === 'REJECTED' || cs === 'Q_REJECTED';
        }
        if (target === 'CREATED') {
          return cs === 'CREATED' || cs === 'Q0_DRAFT' || cs === 'Q1_SUBMITTED';
        }
        if (target === 'VALIDATED') {
          return cs === 'VALIDATED' || cs === 'Q2_ADVISOR_VERIFIED';
        }
        if (target === 'PROCESSING') {
          return cs === 'PROCESSING' || cs === 'Q3_HOD_APPROVED';
        }
        return cs === target;
      });
    }

    // Sort by submission date (newest first by default)
    list.sort((a, b) => {
      const dateA = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return sortBy === 'OLDEST' ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [requests, searchQuery, approvalFilter, processingFilter, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || approvalFilter !== 'ALL' || processingFilter !== 'ALL' || sortBy !== 'NEWEST';

  const handleResetFilters = () => {
    setSearchQuery('');
    setApprovalFilter('ALL');
    setProcessingFilter('ALL');
    setSortBy('NEWEST');
  };

  return (
    <div className="page-container">
      {/* 1. Page Header */}
      <PageHeader
        title="Request History"
        description="View and track all previously submitted requests."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/dashboard" className="btn btn-secondary" aria-label="Navigate back to Dashboard">
              &larr; Back to Dashboard
            </Link>
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
                <span>&#8635; Refresh</span>
              )}
            </button>
            <StatusBadge status="online" label="Store Synced" />
          </div>
        }
      />

      {/* Error Notice with Retry */}
      {error && (
        <ResultMessage
          type="error"
          title="Failed to Load Request History"
          text={`${error}. Please ensure the backend Express server is running on http://localhost:5000.`}
          actionLabel="Retry Connection"
          onAction={refresh}
          onDismiss={refresh}
        />
      )}

      {/* 2. Summary Cards Grid */}
      <section className="summary-cards-grid" aria-label="Request Status Metrics">
        <StatCard
          label="Total Requests"
          value={loading ? '...' : summaryCounts.total}
          description="In-memory store"
          badge={<span className="status-pill neutral">Active Records</span>}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />

        <StatCard
          label="Pending Requests"
          value={loading ? '...' : summaryCounts.pending}
          description="Awaiting review / action"
          badge={<span className="status-pill pending">Pending</span>}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <StatCard
          label="Approved Requests"
          value={loading ? '...' : summaryCounts.approved}
          description="Administrative approval"
          badge={<span className="status-pill approved">Approved</span>}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />

        <StatCard
          label="Rejected Requests"
          value={loading ? '...' : summaryCounts.rejected}
          description="Terminated at trap state"
          badge={<span className="status-pill rejected">Trap State</span>}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />

        <StatCard
          label="Completed Requests"
          value={loading ? '...' : summaryCounts.completed}
          description="Reached accepting state"
          badge={<span className="status-pill completed">COMPLETED</span>}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        />
      </section>

      {/* 3. Search and Filtering Controls Card */}
      <section className="history-controls-card" aria-label="Search and filter controls">
        <div className="history-toolbar-row">
          {/* Search Box */}
          <div className="history-search-wrapper">
            <input
              type="text"
              className="history-search-input"
              placeholder="Search by Request ID or request title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search requests by ID or title"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', padding: '0 0.25rem' }}
                title="Clear search"
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          {/* Filter Selects & Sorting */}
          <div className="history-filters-row">
            {/* Filter by Approval Status */}
            <div className="history-filter-group">
              <label htmlFor="approval-status-select" className="history-filter-label">
                Approval:
              </label>
              <select
                id="approval-status-select"
                className="history-filter-select"
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
              >
                {APPROVAL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Processing Status */}
            <div className="history-filter-group">
              <label htmlFor="processing-status-select" className="history-filter-label">
                Processing:
              </label>
              <select
                id="processing-status-select"
                className="history-filter-select"
                value={processingFilter}
                onChange={(e) => setProcessingFilter(e.target.value)}
              >
                {PROCESSING_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort by Submission Date */}
            <div className="history-filter-group">
              <label htmlFor="sort-by-select" className="history-filter-label">
                Sort:
              </label>
              <select
                id="sort-by-select"
                className="history-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                onClick={handleResetFilters}
                title="Reset all search queries and filters"
              >
                Reset Filters
              </button>
            )}

            {/* Layout Toggle */}
            <div className="view-mode-toggle" role="group" aria-label="View layout toggle">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
                aria-label="Table View"
              >
                Table
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Cards View"
                aria-label="Cards View"
              >
                Cards
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Loading Skeleton Indicator */}
      {loading && (
        <div className="loading-skeleton-box" role="status" aria-live="polite">
          <div className="spinner-icon" aria-hidden="true" />
          <span>Loading request history records from backend in-memory store...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredRequests.length === 0 && (
        <div className="empty-history-state" role="status">
          <div className="empty-history-icon" aria-hidden="true">&#128196;</div>
          <div style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {hasActiveFilters ? 'No Matching Requests' : 'No Campus Requests Found'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {hasActiveFilters
                ? 'No request records match your search criteria and filters. Clear or reset filters to display all submitted records.'
                : 'The backend in-memory request store currently has no logged requests. You can submit and process new requests using the FLAT Workflow Validator.'}
            </p>
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
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

      {/* 4. Request History Table View */}
      {!loading && !error && filteredRequests.length > 0 && viewMode === 'table' && (
        <div className="table-wrapper">
          <table className="data-table" aria-label="Campus requests history table">
            <thead>
              <tr>
                <th scope="col">Request ID</th>
                <th scope="col">Request Title</th>
                <th scope="col">Requester</th>
                <th scope="col">Request Type</th>
                <th scope="col">Priority</th>
                <th scope="col">Submission Date</th>
                <th scope="col">Approval Status</th>
                <th scope="col">Processing Status</th>
                <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const approvalMeta = getApprovalStatusMeta(req);
                const processingMeta = getProcessingStatusMeta(req);

                return (
                  <tr key={req.id}>
                    {/* Request ID */}
                    <td>
                      <code style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '0.825rem' }}>
                        {req.id}
                      </code>
                    </td>

                    {/* Request Title */}
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)', maxWidth: '240px' }}>
                        {safeDisplay(req.title)}
                      </div>
                      {req.department && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {req.department}
                        </div>
                      )}
                    </td>

                    {/* Requester */}
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                        {safeDisplay(req.studentName, 'Kalvium Student')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {safeDisplay(req.studentId, 'KAL-2026-GEN')}
                      </div>
                    </td>

                    {/* Request Type */}
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                        {safeDisplay(req.requestType || req.category)}
                      </span>
                    </td>

                    {/* Priority */}
                    <td>
                      {renderPriorityBadge(req.priority)}
                    </td>

                    {/* Submission Date */}
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {formatTimestamp(req.submittedAt || req.createdAt)}
                    </td>

                    {/* Approval Status */}
                    <td>
                      <StatusBadge
                        status={approvalMeta.status}
                        label={approvalMeta.label}
                      />
                    </td>

                    {/* Processing Status */}
                    <td>
                      <StatusBadge
                        status={processingMeta.status}
                        label={processingMeta.label}
                      />
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
                        onClick={() => setSelectedRequest(req)}
                        title="View complete request information and audit trace"
                        aria-label={`View details for ${req.id}`}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4b. Responsive Card View (for mobile or toggle) */}
      {!loading && !error && filteredRequests.length > 0 && viewMode === 'cards' && (
        <div className="history-cards-grid" aria-label="Campus requests card list">
          {filteredRequests.map((req) => {
            const approvalMeta = getApprovalStatusMeta(req);
            const processingMeta = getProcessingStatusMeta(req);

            return (
              <article key={req.id} className="history-card">
                <div>
                  <div className="history-card-header">
                    <code style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                      {req.id}
                    </code>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <StatusBadge status={approvalMeta.status} label={approvalMeta.label} />
                      <StatusBadge status={processingMeta.status} label={processingMeta.label} />
                    </div>
                  </div>

                  <h3 className="history-card-title">{safeDisplay(req.title)}</h3>

                  <div className="history-card-meta" style={{ marginTop: '0.5rem' }}>
                    <div><strong>Requester:</strong> {safeDisplay(req.studentName, 'Kalvium Student')} ({safeDisplay(req.studentId)})</div>
                    <div><strong>Type:</strong> {safeDisplay(req.requestType || req.category)}</div>
                    <div><strong>Priority:</strong> {renderPriorityBadge(req.priority)}</div>
                    <div><strong>Submitted:</strong> {formatTimestamp(req.submittedAt || req.createdAt)}</div>
                  </div>
                </div>

                <div className="history-card-footer">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    State: <code>{safeDisplay(req.currentState)}</code>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => setSelectedRequest(req)}
                    aria-label={`View details for ${req.id}`}
                  >
                    View Details &rarr;
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 5. View Details Modal */}
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
            {/* Modal Header */}
            <div className="audit-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <code style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                    {selectedRequest.id}
                  </code>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>&bull;</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                    Request Details &amp; Workflow Trace
                  </span>
                </div>
                <h2 id="audit-modal-title" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {safeDisplay(selectedRequest.title)}
                </h2>
              </div>
              <button
                type="button"
                className="audit-modal-close"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close request details modal"
              >
                &times;
              </button>
            </div>

            {/* Overview Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
              {/* Requester Information */}
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Requester</div>
                <div style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {safeDisplay(selectedRequest.studentName, 'Kalvium Student')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ID: {safeDisplay(selectedRequest.studentId, 'KAL-2026-GEN')}
                </div>
              </div>

              {/* Department & Request Type */}
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Category &amp; Department</div>
                <div style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {safeDisplay(selectedRequest.department, 'Computer Science')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {safeDisplay(selectedRequest.requestType || selectedRequest.category)}
                </div>
              </div>

              {/* Priority */}
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Priority Level</div>
                <div style={{ marginTop: '0.35rem' }}>
                  {renderPriorityBadge(selectedRequest.priority)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Level {selectedRequest.priority ?? 1}
                </div>
              </div>

              {/* Status Summary */}
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Current Status</div>
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  <StatusBadge
                    status={getApprovalStatusMeta(selectedRequest).status}
                    label={getApprovalStatusMeta(selectedRequest).label}
                  />
                  <StatusBadge
                    status={getProcessingStatusMeta(selectedRequest).status}
                    label={getProcessingStatusMeta(selectedRequest).label}
                  />
                </div>
                <div style={{ fontSize: '0.725rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  DFA: {safeDisplay(selectedRequest.currentState)}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <strong>Submitted:</strong> {formatTimestamp(selectedRequest.submittedAt || selectedRequest.createdAt)}
              </div>
              <div>
                <strong>Last Updated:</strong> {formatTimestamp(selectedRequest.updatedAt || selectedRequest.submittedAt || selectedRequest.createdAt)}
              </div>
            </div>

            {/* Description / Academic Justification */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Request Description &amp; Academic Justification
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                {selectedRequest.description && selectedRequest.description.trim()
                  ? selectedRequest.description
                  : 'No extended narrative provided at initial submission. Standard academic curriculum review rules applied.'}
              </p>
            </div>

            {/* Approval Comments & Decision Notes */}
            {(selectedRequest.explanation || selectedRequest.approvalComments || selectedRequest.note) && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e', marginBottom: '0.35rem' }}>
                  Approval Comments &amp; Processing Notes
                </div>
                <p style={{ fontSize: '0.85rem', color: '#78350f', lineHeight: '1.45', margin: 0 }}>
                  {selectedRequest.explanation || selectedRequest.approvalComments || selectedRequest.note}
                </p>
              </div>
            )}

            {/* Formal DFA Automata Transition Sequence */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  FLAT Automata Sequence Trace (&Sigma;*)
                </span>
                <span className="academic-badge badge-flat">DFA Verification</span>
              </div>
              {selectedRequest.sequence && selectedRequest.sequence.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginTop: '0.25rem' }}>
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
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                  Initial submission at state CREATED. No subsequent symbol transitions dispatched yet.
                </p>
              )}
            </div>

            {/* Workflow History Audit Log */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  Workflow History &amp; Transition Audit Trail
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedRequest.workflowHistory?.length || 0} Recorded Steps
                </span>
              </div>

              {selectedRequest.workflowHistory && selectedRequest.workflowHistory.length > 0 ? (
                <div className="table-wrapper" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.775rem' }} aria-label="Workflow step history">
                    <thead>
                      <tr>
                        <th>Step</th>
                        <th>Action</th>
                        <th>Transition</th>
                        <th>Timestamp</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.workflowHistory.map((step, idx) => (
                        <tr key={`step-${idx}`}>
                          <td><strong>#{step.step ?? idx}</strong></td>
                          <td>
                            <code style={{ color: 'var(--color-primary)', fontWeight: '700' }}>
                              {step.action || 'INITIALIZE'}
                            </code>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace' }}>
                              {step.fromState ? `${step.fromState} → ` : ''}{step.toState}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {formatTimestamp(step.timestamp)}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {step.note || step.explanation || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                  No historical transition records available for this request.
                </p>
              )}
            </div>

            {/* COA Hardware Execution Telemetry */}
            {selectedRequest.hardwareExecution && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    COA Computer Architecture Hardware Telemetry
                  </span>
                  <span className="academic-badge badge-coa">von Neumann Pipeline</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
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

            {/* Persistence Notice */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <em>Notice:</em> Request records are stored in the backend Node.js process memory for development demonstration. State resets when the backend server restarts.
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedRequest(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
