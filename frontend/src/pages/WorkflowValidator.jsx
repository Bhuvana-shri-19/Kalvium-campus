import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StateDiagram from '../components/StateDiagram.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ResultMessage from '../components/ResultMessage.jsx';
import { workflowService } from '../services/workflowService.js';
import { formatStatusLabel, formatTimestamp, safeDisplay } from '../utils/formatters.js';
import '../styles/pages.css';

/**
 * Authoritative Canonical DFA Transition Table:
 * 
 *   CREATED + VALIDATE    -> VALIDATED
 *   CREATED + REJECT      -> REJECTED
 *   VALIDATED + PROCESS   -> PROCESSING
 *   VALIDATED + REJECT    -> REJECTED
 *   PROCESSING + COMPLETE -> COMPLETED (Accepting State F)
 *   PROCESSING + REJECT   -> REJECTED (Trap State)
 *   REJECTED + RESUBMIT   -> CREATED  (Optional administrative re-open)
 *   COMPLETED             -> {}       (Terminal accepting state)
 */
const CANONICAL_VALID_TRANSITIONS = {
  CREATED: {
    VALIDATE: 'VALIDATED',
    REJECT: 'REJECTED'
  },
  VALIDATED: {
    PROCESS: 'PROCESSING',
    REJECT: 'REJECTED'
  },
  PROCESSING: {
    COMPLETE: 'COMPLETED',
    REJECT: 'REJECTED'
  },
  REJECTED: {
    RESUBMIT: 'CREATED'
  },
  COMPLETED: {}
};

export default function WorkflowValidator() {
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  // Form input state
  const [formValues, setFormValues] = useState({
    title: 'AI Lab Access Request',
    requestType: 'LAB_ACCESS_PERMISSION',
    department: 'Computer Science',
    priority: 'HIGH',
    studentName: 'Priya Nair',
    studentId: 'KAL-2026-401',
    description: 'Requesting extended evening access to Computing & Innovation Lab for compiler project.'
  });

  const [formErrors, setFormErrors] = useState({});
  const [availableRequests, setAvailableRequests] = useState([]);
  const [selectedExistingId, setSelectedExistingId] = useState('');

  // Active request and workflow state
  const [activeRequest, setActiveRequest] = useState(null);
  const [currentState, setCurrentState] = useState('CREATED');
  const [transitionHistory, setTransitionHistory] = useState([]);
  const [guidedStep, setGuidedStep] = useState(1); // 1: Create, 2: Validate, 3: Process, 4: Complete/Reject, 5: History

  // UI state
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [feedbackAlert, setFeedbackAlert] = useState(null);
  const [invalidTestSymbol, setInvalidTestSymbol] = useState('PROCESS');
  const [showTheoryInspector, setShowTheoryInspector] = useState(false);

  // Compute active step based on state
  const getStepForState = (state) => {
    switch (state) {
      case 'CREATED': return 2;
      case 'VALIDATED': return 3;
      case 'PROCESSING': return 4;
      case 'COMPLETED':
      case 'REJECTED': return 4;
      default: return 1;
    }
  };

  // Load available requests from store on mount for quick selection
  const loadExistingRequests = useCallback(async () => {
    try {
      const response = await workflowService.getHistory();
      const list = Array.isArray(response)
        ? response
        : (response && Array.isArray(response.data) ? response.data : []);
      setAvailableRequests(list);
      return list;
    } catch (err) {
      console.warn('[WorkflowValidator] Could not load existing requests list:', err);
      return [];
    }
  }, []);

  // Select an existing request to inspect / mutate
  const handleSelectRequest = useCallback(async (id) => {
    if (!id) {
      setActiveRequest(null);
      setCurrentState('CREATED');
      setTransitionHistory([]);
      setSelectedExistingId('');
      setGuidedStep(1);
      return;
    }

    setApiLoading(true);
    setApiError(null);
    setFeedbackAlert(null);

    try {
      const response = await workflowService.getRequestById(id);
      const req = response.data || response;

      if (!req || !req.id) {
        throw new Error(`Request '${id}' could not be located in server memory.`);
      }

      setActiveRequest(req);
      const state = req.currentState || 'CREATED';
      setCurrentState(state);
      setTransitionHistory(Array.isArray(req.workflowHistory) ? req.workflowHistory : []);
      setSelectedExistingId(req.id);
      setGuidedStep(getStepForState(state));
    } catch (err) {
      console.error('[WorkflowValidator] Failed to load request:', err);
      setApiError(err.message || 'Could not load selected request from backend.');
    } finally {
      setApiLoading(false);
    }
  }, []);

  // Initial load and URL query param resolution
  useEffect(() => {
    loadExistingRequests().then((list) => {
      const targetId = queryId || (list.length > 0 ? list[0].id : null);
      if (targetId) {
        handleSelectRequest(targetId);
      }
    });
  }, [loadExistingRequests, queryId, handleSelectRequest]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formValues.title.trim()) {
      errors.title = 'Request title is required.';
    }
    if (!formValues.requestType) {
      errors.requestType = 'Please select a request type.';
    }
    if (!formValues.studentName.trim()) {
      errors.studentName = 'Requester name is required.';
    }
    if (!formValues.description.trim()) {
      errors.description = 'Request description / justification is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1: Create a new request in backend and initialize DFA state
  const handleCreateRequest = async (e) => {
    if (e) e.preventDefault();
    setApiError(null);
    setFeedbackAlert(null);

    if (!validateForm()) {
      return;
    }

    setApiLoading(true);

    try {
      const payload = {
        title: formValues.title.trim(),
        requestType: formValues.requestType,
        department: formValues.department || 'Computer Science',
        category: formValues.requestType,
        priority: formValues.priority,
        studentName: formValues.studentName.trim(),
        studentId: formValues.studentId.trim() || 'KAL-2026-401',
        description: formValues.description.trim()
      };

      const response = await workflowService.createRequest(payload);
      const created = response.data || response;

      if (!created || !created.id) {
        throw new Error('Server returned an unexpected payload during request creation.');
      }

      // Update state with newly created request
      setActiveRequest(created);
      setCurrentState('CREATED');
      setTransitionHistory(Array.isArray(created.workflowHistory) ? created.workflowHistory : []);
      setSelectedExistingId(created.id);
      setGuidedStep(2); // Automatically advance to Step 2: Validate!

      setFeedbackAlert({
        type: 'success',
        title: 'Request Initialized in DFA',
        message: `Request ${created.id} ("${created.title}") was successfully created in initial state q₀ = CREATED.`
      });

      // Refresh selector dropdown list
      await loadExistingRequests();
    } catch (err) {
      console.error('[WorkflowValidator] Creation failed:', err);
      setApiError(err.message || 'Failed to create request on the backend.');
    } finally {
      setApiLoading(false);
    }
  };

  // Execute DFA Action Symbol
  const handleExecuteAction = async (symbol, customNotes = null) => {
    if (!activeRequest || !activeRequest.id) {
      setApiError('Please select or create an active request before dispatching actions.');
      return;
    }

    setApiLoading(true);
    setApiError(null);
    setFeedbackAlert(null);

    try {
      const response = await workflowService.executeAction(activeRequest.id, symbol, customNotes);
      const updated = response.data || response;

      if (!updated || !updated.id) {
        throw new Error('Server returned invalid data format after action execution.');
      }

      const newState = updated.currentState;
      setActiveRequest(updated);
      setCurrentState(newState);
      setTransitionHistory(Array.isArray(updated.workflowHistory) ? updated.workflowHistory : []);
      setGuidedStep(getStepForState(newState));

      // Build informative academic feedback message
      if (newState === 'COMPLETED') {
        setFeedbackAlert({
          type: 'success',
          title: 'Formal Acceptance Achieved! (State: COMPLETED)',
          message: `The request sequence has successfully terminated in accepting state F = {COMPLETED}. The document is now formally sealed.`
        });
      } else if (newState === 'REJECTED') {
        setFeedbackAlert({
          type: 'danger',
          title: 'Transitioned to Trap State (REJECTED)',
          message: `The request was dismissed and moved into the non-accepting trap state. Action: ${symbol}.`
        });
      } else {
        setFeedbackAlert({
          type: 'info',
          title: `Transition Successful: ${symbol}`,
          message: `DFA transition δ(${currentState}, ${symbol}) &rarr; ${newState} confirmed by backend.`
        });
      }

      // Refresh list in background
      loadExistingRequests();
    } catch (err) {
      console.warn('[WorkflowValidator] Action rejected by server:', err);
      const serverMsg = err.message || `Action '${symbol}' rejected by DFA controller.`;
      setApiError(serverMsg);

      // Re-fetch request from backend to guarantee UI matches store
      try {
        const recheck = await workflowService.getRequestById(activeRequest.id);
        const trueData = recheck.data || recheck;
        if (trueData) {
          setActiveRequest(trueData);
          setCurrentState(trueData.currentState || currentState);
          setTransitionHistory(Array.isArray(trueData.workflowHistory) ? trueData.workflowHistory : []);
        }
      } catch (syncErr) {
        console.error('[WorkflowValidator] Resync failed:', syncErr);
      }
    } finally {
      setApiLoading(false);
    }
  };

  // Test invalid symbol to demonstrate strict DFA determinism
  const handleTestInvalidAction = async () => {
    if (!invalidTestSymbol) return;
    await handleExecuteAction(invalidTestSymbol, `Strictness check test using symbol ${invalidTestSymbol}`);
  };

  // Transition capabilities for active state
  const validActionsForCurrent = CANONICAL_VALID_TRANSITIONS[currentState] || {};
  const isCompleted = currentState === 'COMPLETED';
  const isRejected = currentState === 'REJECTED';
  const isTerminal = isCompleted || isRejected;

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="FLAT Request Workflow"
        description="Explore how requests move through a finite state machine."
        action={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" className="btn btn-secondary">
              &larr; Back to Dashboard
            </Link>
            <Link to="/request-history" className="btn btn-secondary">
              View Request History
            </Link>
            <StatusBadge status="online" label="DFA Engine Active" />
          </div>
        }
      />

      {/* Request Switcher Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Active Request:
            </span>
            <select
              className="form-select"
              style={{ minWidth: '280px', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              value={selectedExistingId}
              onChange={(e) => handleSelectRequest(e.target.value)}
              disabled={apiLoading}
            >
              <option value="">-- Create New Request --</option>
              {availableRequests.map((req) => (
                <option key={req.id} value={req.id}>
                  {req.id} &bull; {safeDisplay(req.title)} [{req.currentState}]
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {activeRequest ? (
              <span className={`status-pill ${isCompleted ? 'approved' : isRejected ? 'danger' : 'warning'}`}>
                State: <strong>{currentState}</strong>
              </span>
            ) : (
              <span className="status-pill online">Mode: New Request</span>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => handleSelectRequest('')}
            >
              + New Request
            </button>
          </div>
        </div>
      </div>

      {/* Guided 5-Step Progress Indicator */}
      <div className="step-tracker-bar" style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`step-tracker-item ${guidedStep === 1 ? 'active' : activeRequest ? 'completed' : ''}`}
          onClick={() => setGuidedStep(1)}
        >
          <span>1.</span> Create Request
        </button>

        <span style={{ color: 'var(--text-light)' }}>&rarr;</span>

        <button
          type="button"
          className={`step-tracker-item ${guidedStep === 2 ? 'active' : currentState !== 'CREATED' && activeRequest ? 'completed' : ''}`}
          onClick={() => setGuidedStep(2)}
          disabled={!activeRequest}
        >
          <span>2.</span> Validate
        </button>

        <span style={{ color: 'var(--text-light)' }}>&rarr;</span>

        <button
          type="button"
          className={`step-tracker-item ${guidedStep === 3 ? 'active' : (currentState === 'PROCESSING' || isTerminal) ? 'completed' : ''}`}
          onClick={() => setGuidedStep(3)}
          disabled={!activeRequest || currentState === 'CREATED'}
        >
          <span>3.</span> Process
        </button>

        <span style={{ color: 'var(--text-light)' }}>&rarr;</span>

        <button
          type="button"
          className={`step-tracker-item ${guidedStep === 4 ? 'active' : isCompleted ? 'completed' : isRejected ? 'rejected' : ''}`}
          onClick={() => setGuidedStep(4)}
          disabled={!activeRequest || currentState === 'CREATED' || currentState === 'VALIDATED'}
        >
          <span>4.</span> Complete or Reject
        </button>

        <span style={{ color: 'var(--text-light)' }}>&rarr;</span>

        <button
          type="button"
          className={`step-tracker-item ${guidedStep === 5 ? 'active' : ''}`}
          onClick={() => setGuidedStep(5)}
          disabled={!activeRequest}
        >
          <span>5.</span> View History
        </button>
      </div>

      {/* Feedback Alerts */}
      {apiError && (
        <div style={{ marginBottom: '1.25rem' }}>
          <ResultMessage
            type="error"
            title="DFA Transition Error (HTTP 400)"
            text={apiError}
          />
        </div>
      )}

      {feedbackAlert && !apiError && (
        <div style={{ marginBottom: '1.25rem' }}>
          <ResultMessage
            type={feedbackAlert.type}
            title={feedbackAlert.title}
            text={feedbackAlert.message}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: CREATE REQUEST */}
      {/* ========================================================================= */}
      {guidedStep === 1 && (
        <div className="card workflow-form-card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <span className="academic-badge" style={{ background: '#eff6ff', color: '#1e40af', marginBottom: '0.25rem', display: 'inline-block' }}>
                Step 1 of 5
              </span>
              <h2 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                Create Campus Academic Request
              </h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Auto-Initializes to State: <code style={{ fontWeight: '700', color: '#1e40af' }}>CREATED</code>
            </span>
          </div>

          <form onSubmit={handleCreateRequest}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="req-title">Request Title *</label>
                <input
                  id="req-title"
                  type="text"
                  className={`form-input ${formErrors.title ? 'error' : ''}`}
                  placeholder="e.g. AI Research Lab Off-Hours Access"
                  value={formValues.title}
                  onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                />
                {formErrors.title && <span className="field-error-msg">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="req-type">Request Type *</label>
                <select
                  id="req-type"
                  className="form-select"
                  value={formValues.requestType}
                  onChange={(e) => setFormValues({ ...formValues, requestType: e.target.value })}
                >
                  <option value="LAB_ACCESS_PERMISSION">Lab Access Permission</option>
                  <option value="CREDIT_OVERLOAD_EXCEPTION">Credit Overload Exemption</option>
                  <option value="BONAFIDE_CERTIFICATE">Bonafide Certificate</option>
                  <option value="COURSE_REGISTRATION">Course Registration</option>
                  <option value="HOSTEL_LEAVE">Hostel Night Out Pass</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="student-name">Requester Name *</label>
                <input
                  id="student-name"
                  type="text"
                  className={`form-input ${formErrors.studentName ? 'error' : ''}`}
                  placeholder="e.g. Aarav Sharma"
                  value={formValues.studentName}
                  onChange={(e) => setFormValues({ ...formValues, studentName: e.target.value })}
                />
                {formErrors.studentName && <span className="field-error-msg">{formErrors.studentName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="student-id">Student ID</label>
                <input
                  id="student-id"
                  type="text"
                  className="form-input"
                  placeholder="e.g. KAL-2026-401"
                  value={formValues.studentId}
                  onChange={(e) => setFormValues({ ...formValues, studentId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="req-priority">Priority</label>
                <select
                  id="req-priority"
                  className="form-select"
                  value={formValues.priority}
                  onChange={(e) => setFormValues({ ...formValues, priority: e.target.value })}
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="req-dept">Department</label>
                <input
                  id="req-dept"
                  type="text"
                  className="form-input"
                  value={formValues.department}
                  onChange={(e) => setFormValues({ ...formValues, department: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="req-desc">Description / Justification *</label>
              <textarea
                id="req-desc"
                className={`form-textarea ${formErrors.description ? 'error' : ''}`}
                rows="3"
                placeholder="Provide detailed academic justification..."
                value={formValues.description}
                onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
              />
              {formErrors.description && <span className="field-error-msg">{formErrors.description}</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Newly created requests automatically start at Step 2 (Validate).
              </span>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={apiLoading}
                style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
              >
                {apiLoading ? 'Initializing...' : '+ Create & Advance to Step 2 &rarr;'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: VALIDATE REQUEST */}
      {/* ========================================================================= */}
      {guidedStep === 2 && activeRequest && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div>
              <span className="academic-badge" style={{ background: '#eff6ff', color: '#1e40af', marginBottom: '0.25rem', display: 'inline-block' }}>
                Step 2 of 5
              </span>
              <h2 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                Validate Academic Credentials &amp; Prerequisites
              </h2>
            </div>
            <span className="status-pill online">Current State: {currentState}</span>
          </div>

          {/* Request Summary Card */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div><strong>Request ID:</strong> <span>{activeRequest.id}</span></div>
            <div><strong>Title:</strong> <span>{safeDisplay(activeRequest.title)}</span></div>
            <div><strong>Requester:</strong> <span>{safeDisplay(activeRequest.studentName)}</span></div>
            <div><strong>Priority:</strong> <span className={`priority-tag ${activeRequest.priority ? activeRequest.priority.toString().toLowerCase() : 'medium'}`}>{activeRequest.priority || 'MEDIUM'}</span></div>
          </div>

          {/* Educational Note */}
          <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <h4 style={{ fontWeight: '700', color: '#1e40af', marginBottom: '0.25rem' }}>
              What Validation Does (Automata Rule):
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0, lineHeight: '1.5' }}>
              Validation verifies student eligibility, prerequisite credentials, and department clearance.
              In the DFA, from state <code>CREATED</code>, only two actions are defined:
              <code>VALIDATE</code> (advances to <code>VALIDATED</code>) or <code>REJECT</code> (dismisses to <code>REJECTED</code>).
              Any attempt to jump directly to <code>PROCESS</code> or <code>COMPLETE</code> will be strictly rejected.
            </p>
          </div>

          {/* Available Actions */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Permitted Next Actions:
            </h3>

            {currentState === 'CREATED' ? (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                  onClick={() => handleExecuteAction('VALIDATE', 'Identity and prerequisite credentials verified successfully.')}
                  disabled={apiLoading}
                >
                  ✓ Validate Request (CREATED &rarr; VALIDATED)
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                  onClick={() => handleExecuteAction('REJECT', 'Request denied during initial validation check.')}
                  disabled={apiLoading}
                >
                  ✗ Reject Request (CREATED &rarr; REJECTED)
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', background: '#ecfdf5', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <span style={{ color: '#065f46', fontWeight: '600', fontSize: '0.9rem' }}>
                  ✓ This request has already completed validation! Current state is <strong>{currentState}</strong>.
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => setGuidedStep(getStepForState(currentState))}
                >
                  Advance to Step {getStepForState(currentState)} &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: PROCESS REQUEST */}
      {/* ========================================================================= */}
      {guidedStep === 3 && activeRequest && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div>
              <span className="academic-badge" style={{ background: '#f5f3ff', color: '#6d28d9', marginBottom: '0.25rem', display: 'inline-block' }}>
                Step 3 of 5
              </span>
              <h2 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                Departmental Review &amp; Resource Allocation
              </h2>
            </div>
            <span className="status-pill warning">Current State: {currentState}</span>
          </div>

          {/* Request Summary Card */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div><strong>Request ID:</strong> <span>{activeRequest.id}</span></div>
            <div><strong>Title:</strong> <span>{safeDisplay(activeRequest.title)}</span></div>
            <div><strong>State:</strong> <code style={{ color: '#1e40af', fontWeight: '700' }}>{currentState}</code></div>
            <div><strong>Requester:</strong> <span>{safeDisplay(activeRequest.studentName)}</span></div>
          </div>

          {/* Educational Note */}
          <div style={{ padding: '1rem', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
            <h4 style={{ fontWeight: '700', color: '#6d28d9', marginBottom: '0.25rem' }}>
              What Processing Does (Automata Rule):
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0, lineHeight: '1.5' }}>
              Processing marks the request as actively under administrative review or hardware scheduling.
              In the DFA, from state <code>VALIDATED</code>, only two transitions are permitted:
              <code>PROCESS</code> (transitions to <code>PROCESSING</code>) or <code>REJECT</code> (transitions to <code>REJECTED</code>).
            </p>
          </div>

          {/* Action Controls */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Permitted Actions from VALIDATED:
            </h3>

            {currentState === 'VALIDATED' ? (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                  onClick={() => handleExecuteAction('PROCESS', 'Forwarded to departmental queue for resource allocation.')}
                  disabled={apiLoading}
                >
                  &rarr; Process Request (VALIDATED &rarr; PROCESSING)
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                  onClick={() => handleExecuteAction('REJECT', 'Advisor denied request during processing review.')}
                  disabled={apiLoading}
                >
                  ✗ Reject Request (VALIDATED &rarr; REJECTED)
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Current state is <strong>{currentState}</strong>. Processing actions apply only when in state VALIDATED.
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => setGuidedStep(getStepForState(currentState))}
                >
                  Go to Step {getStepForState(currentState)} &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: COMPLETE OR REJECT */}
      {/* ========================================================================= */}
      {guidedStep === 4 && activeRequest && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div>
              <span className="academic-badge" style={{ background: '#ecfdf5', color: '#047857', marginBottom: '0.25rem', display: 'inline-block' }}>
                Step 4 of 5
              </span>
              <h2 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                Final Disposition &amp; Terminal States
              </h2>
            </div>
            <span className={`status-pill ${isCompleted ? 'approved' : isRejected ? 'danger' : 'warning'}`}>
              State: {currentState}
            </span>
          </div>

          {/* In PROCESSING State */}
          {currentState === 'PROCESSING' && (
            <>
              <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <h4 style={{ fontWeight: '700', color: '#1e40af', marginBottom: '0.25rem' }}>
                  Final Approval or Rejection:
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0, lineHeight: '1.5' }}>
                  The request is currently in <code>PROCESSING</code>. You can now seal it into the formal accepting state
                  <code>COMPLETED</code>, or terminate it into trap state <code>REJECTED</code>.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', background: '#059669', borderColor: '#059669' }}
                  onClick={() => handleExecuteAction('COMPLETE', 'Registrar seal affixed; fulfillment complete.')}
                  disabled={apiLoading}
                >
                  ★ Complete Request (PROCESSING &rarr; COMPLETED [Accepting State F])
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}
                  onClick={() => handleExecuteAction('REJECT', 'Denied due to resource ceiling or lab limit.')}
                  disabled={apiLoading}
                >
                  ✗ Reject Request (PROCESSING &rarr; REJECTED)
                </button>
              </div>
            </>
          )}

          {/* In COMPLETED State (Accepting State) */}
          {isCompleted && (
            <div style={{ padding: '1.5rem', background: '#ecfdf5', borderRadius: '8px', border: '2px solid #059669', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#10004;</div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#047857', marginBottom: '0.5rem' }}>
                Formally Accepted &bull; COMPLETED
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#065f46', maxWidth: '600px', margin: '0 auto 1.25rem auto', lineHeight: '1.6' }}>
                This request successfully navigated the transition function from start state q₀ = CREATED
                to accepting state F = &#123;COMPLETED&#125;. The document is permanently sealed.
                No further state modifications are permitted by the backend.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setGuidedStep(5)}
                >
                  View Step Audit History &rarr;
                </button>
                <Link to="/request-history" className="btn btn-primary">
                  Open in Request History &rarr;
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSelectRequest('')}
                >
                  + Create Another Request
                </button>
              </div>
            </div>
          )}

          {/* In REJECTED State (Trap State) */}
          {isRejected && (
            <div style={{ padding: '1.5rem', background: '#fef2f2', borderRadius: '8px', border: '2px solid #dc2626', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#10006;</div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#b91c1c', marginBottom: '0.5rem' }}>
                Request Denied &bull; REJECTED (Trap State)
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#991b1b', maxWidth: '600px', margin: '0 auto 1.25rem auto', lineHeight: '1.6' }}>
                This request was dismissed and entered the non-accepting trap state.
                Students may rectify document deficiencies and perform an administrative resubmission.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleExecuteAction('RESUBMIT', 'Student rectified document deficiencies and resubmitted.')}
                  disabled={apiLoading}
                >
                  &#8634; Resubmit Request (REJECTED &rarr; CREATED)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setGuidedStep(5)}
                >
                  View Audit History
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSelectRequest('')}
                >
                  + Create New Request
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: VIEW HISTORY */}
      {/* ========================================================================= */}
      {guidedStep === 5 && activeRequest && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div>
              <span className="academic-badge" style={{ background: '#f1f5f9', color: '#475569', marginBottom: '0.25rem', display: 'inline-block' }}>
                Step 5 of 5
              </span>
              <h2 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                Request State Audit History &bull; {activeRequest.id}
              </h2>
            </div>
            <Link to="/request-history" className="btn btn-secondary">
              Open Full Request History &rarr;
            </Link>
          </div>

          {/* Audit History Table */}
          {transitionHistory.length > 0 ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Step #</th>
                    <th>Action Taken</th>
                    <th>From State</th>
                    <th>To State</th>
                    <th>Timestamp</th>
                    <th>Notes / Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {transitionHistory.map((step, idx) => (
                    <tr key={`step-${idx}`}>
                      <td><strong>#{step.step !== undefined ? step.step : idx}</strong></td>
                      <td>
                        <span className="academic-badge" style={{ background: '#f1f5f9', color: '#1e40af' }}>
                          {safeDisplay(step.action)}
                        </span>
                      </td>
                      <td><code>{safeDisplay(step.fromState) || '—'}</code></td>
                      <td>
                        <code style={{ fontWeight: '700', color: step.toState === 'COMPLETED' ? '#059669' : step.toState === 'REJECTED' ? '#dc2626' : '#1e40af' }}>
                          {safeDisplay(step.toState)}
                        </code>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatTimestamp(step.timestamp)}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {safeDisplay(step.note || step.explanation || 'Transition committed.')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
              No previous transition history recorded for this request.
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setGuidedStep(getStepForState(currentState))}
            >
              &larr; Back to Workflow Action (Step {getStepForState(currentState)})
            </button>

            <Link to="/request-history" className="btn btn-primary">
              View All Campus Requests in History &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COLLAPSIBLE AUTOMATA THEORY INSPECTOR & STATE DIAGRAM */}
      {/* ========================================================================= */}
      <div className="card" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Automata Theory &amp; DFA Visualizer
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Inspect the visual state diagram, transition table, and verify strict determinism.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowTheoryInspector((prev) => !prev)}
          >
            {showTheoryInspector ? 'Hide Automata Inspector ▲' : 'Open Automata Inspector ▼'}
          </button>
        </div>

        {showTheoryInspector && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.75rem' }}>
            {/* SVG Visual State Diagram */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Visual DFA Transition Diagram:
              </h4>
              <StateDiagram
                currentState={currentState}
                lastAction={transitionHistory.length > 0 ? transitionHistory[transitionHistory.length - 1].action : null}
              />
            </div>

            {/* Strictness Verification Tool */}
            <div style={{ padding: '1.25rem', background: '#fafbfc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="academic-badge badge-flat">Automata Verification Tool</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  Test Invalid Transition Rejection
                </strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Prove that the backend rejects undefined transitions with HTTP 400 and preserves current state without mutation:
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                <select
                  className="form-select"
                  style={{ maxWidth: '200px', fontSize: '0.85rem' }}
                  value={invalidTestSymbol}
                  onChange={(e) => setInvalidTestSymbol(e.target.value)}
                  disabled={apiLoading}
                >
                  <option value="PROCESS">Symbol: PROCESS</option>
                  <option value="COMPLETE">Symbol: COMPLETE</option>
                  <option value="VALIDATE">Symbol: VALIDATE</option>
                  <option value="RESUBMIT">Symbol: RESUBMIT</option>
                  <option value="INVALID_TOKEN">Symbol: UNKNOWN_ACTION</option>
                </select>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                  onClick={handleTestInvalidAction}
                  disabled={apiLoading || !activeRequest}
                >
                  Dispatch to Backend API &rarr;
                </button>
              </div>
            </div>

            {/* Formal 5-Tuple Description */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Formal DFA Specification: M = (Q, &Sigma;, &delta;, q₀, F)
              </h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <li><strong>Q (States):</strong> CREATED, VALIDATED, PROCESSING, COMPLETED, REJECTED</li>
                <li><strong>&Sigma; (Alphabet):</strong> VALIDATE, PROCESS, COMPLETE, REJECT, RESUBMIT</li>
                <li><strong>q₀ (Initial):</strong> CREATED</li>
                <li><strong>F (Accepting):</strong> {'{'}COMPLETED{'}'}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
