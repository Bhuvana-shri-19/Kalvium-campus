import React, { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import StateDiagram, { SHARED_DFA_STATES } from '../components/StateDiagram.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ResultMessage from '../components/ResultMessage.jsx';
import { workflowService } from '../services/workflowService.js';
import { formatStatusLabel, safeDisplay } from '../utils/formatters.js';
import '../styles/pages.css';

/**
 * Valid action symbols permitted per DFA state according to theoretical transition table delta(Q, Sigma)
 */
const VALID_ACTIONS_MAP = {
  CREATED: [
    { symbol: 'VALIDATE', label: '1. VALIDATE Credentials', description: 'delta(CREATED, VALIDATE) -> VALIDATED' },
    { symbol: 'REJECT', label: 'Deny / REJECT', description: 'delta(CREATED, REJECT) -> REJECTED (Trap)', isDanger: true }
  ],
  VALIDATED: [
    { symbol: 'PROCESS', label: '2. PROCESS Endorsement', description: 'delta(VALIDATED, PROCESS) -> PROCESSING' },
    { symbol: 'REJECT', label: 'Deny / REJECT', description: 'delta(VALIDATED, REJECT) -> REJECTED (Trap)', isDanger: true }
  ],
  PROCESSING: [
    { symbol: 'COMPLETE', label: '3. COMPLETE & Seal', description: 'delta(PROCESSING, COMPLETE) -> COMPLETED (Accepting)' },
    { symbol: 'REJECT', label: 'Deny / REJECT', description: 'delta(PROCESSING, REJECT) -> REJECTED (Trap)', isDanger: true }
  ],
  REJECTED: [
    { symbol: 'RESUBMIT', label: 'Restart / RESUBMIT', description: 'delta(REJECTED, RESUBMIT) -> CREATED' }
  ],
  COMPLETED: []
};

const ALL_ACTION_SYMBOLS = ['VALIDATE', 'PROCESS', 'COMPLETE', 'REJECT'];

export default function WorkflowValidator() {
  const [formValues, setFormValues] = useState({
    title: '',
    category: '',
    description: '',
    studentName: 'Priya Nair',
    studentId: 'KAL-2026-401'
  });

  const [formErrors, setFormErrors] = useState({});
  const [activeRequest, setActiveRequest] = useState(null);
  const [currentState, setCurrentState] = useState('CREATED');
  const [transitionSequence, setTransitionSequence] = useState([]);
  const [transitionHistory, setTransitionHistory] = useState([]);
  const [lastSymbol, setLastSymbol] = useState(null);

  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [validationAlert, setValidationAlert] = useState(null);

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    if (!formValues.title.trim()) {
      errors.title = 'Request title is required.';
    }
    if (!formValues.category.trim()) {
      errors.category = 'Please select a request category.';
    }
    if (!formValues.description.trim()) {
      errors.description = 'Request description / academic justification is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create new request and initialize DFA
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setApiError(null);
    setValidationAlert(null);

    if (!validateForm()) {
      return;
    }

    setApiLoading(true);

    try {
      const payload = {
        title: formValues.title.trim(),
        department: formValues.category,
        requestType: formValues.category.toUpperCase().replace(/\s+/g, '_'),
        studentName: formValues.studentName.trim(),
        studentId: formValues.studentId.trim(),
        sequence: []
      };

      const response = await workflowService.createRequest(payload);
      const created = response.data || response;

      setActiveRequest(created);
      setCurrentState('CREATED');
      setTransitionSequence([]);
      setTransitionHistory([
        {
          step: 0,
          fromState: null,
          symbol: null,
          toState: 'CREATED',
          timestamp: new Date().toLocaleTimeString(),
          explanation: 'Request initialized at start state CREATED (q0).'
        }
      ]);
      setLastSymbol(null);
    } catch (err) {
      console.error('[WorkflowValidator] Creation failed:', err);
      setApiError(err.message || 'Failed to initialize request on the backend.');
    } finally {
      setApiLoading(false);
    }
  };

  // Trigger a DFA action transition (Validated against Backend API as source of truth)
  const handleTriggerAction = async (symbol) => {
    if (!activeRequest) {
      setValidationAlert({
        type: 'warning',
        title: 'No Active Request',
        text: 'Please fill out and create a campus request before dispatching workflow actions.'
      });
      return;
    }

    setApiLoading(true);
    setValidationAlert(null);
    setApiError(null);

    const nextSequence = [...transitionSequence, symbol];

    try {
      // Call backend API to validate transition against formal DFA table
      const response = await workflowService.validateSequence(nextSequence, 'CREATED');
      const result = response.data || response;

      // Backend rejected transition (e.g. attempted COMPLETE from CREATED)
      if (result.isHalted) {
        setValidationAlert({
          type: 'warning',
          title: 'Invalid DFA Transition Blocked',
          text: result.haltReason || `Symbol '${symbol}' is not defined from state '${currentState}'. Frontend adheres strictly to backend transition table.`
        });
        return;
      }

      // Backend approved transition
      const newState = result.finalState;
      setCurrentState(newState);
      setTransitionSequence(nextSequence);
      setLastSymbol(symbol);

      const latestTrace = result.trace && result.trace.length > 0
        ? result.trace[result.trace.length - 1]
        : {};

      setTransitionHistory(prev => [
        ...prev,
        {
          step: nextSequence.length,
          fromState: currentState,
          symbol,
          toState: newState,
          timestamp: new Date().toLocaleTimeString(),
          explanation: latestTrace.explanation || `Transitioned delta(${currentState}, ${symbol}) -> ${newState}.`,
          isAccepted: result.isAccepted,
          isTrap: newState === 'REJECTED'
        }
      ]);
    } catch (err) {
      console.error('[WorkflowValidator] Transition error:', err);
      setApiError(err.message || 'Failed to validate transition with backend server.');
    } finally {
      setApiLoading(false);
    }
  };

  const handleResetWorkflow = () => {
    setActiveRequest(null);
    setCurrentState('CREATED');
    setTransitionSequence([]);
    setTransitionHistory([]);
    setLastSymbol(null);
    setValidationAlert(null);
    setApiError(null);
  };

  const isCompleted = currentState === 'COMPLETED';
  const isRejected = currentState === 'REJECTED';
  const permittedActions = VALID_ACTIONS_MAP[currentState] || [];
  const permittedSymbolSet = new Set(permittedActions.map(a => a.symbol));

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="FLAT: Request Workflow Validator"
        description="Formal Language & Automata Theory simulator modeling student academic approvals as a Deterministic Finite Automaton (DFA) with strict backend transition enforcement."
        badge={<span className="academic-badge badge-flat">FLAT</span>}
        action={
          <StatusBadge
            status={isCompleted ? 'approved' : isRejected ? 'rejected' : 'online'}
            label={isCompleted ? 'Accepted State (L(M))' : isRejected ? 'Trap State (Rejected)' : `State: ${currentState}`}
          />
        }
      />

      {/* Backend API Error Banner */}
      {apiError && (
        <ResultMessage
          type="error"
          title="Backend Validation Error"
          text={`${apiError}. Please ensure the Express backend is online.`}
          onDismiss={() => setApiError(null)}
        />
      )}

      {/* Validation Alert / Rejection Banner */}
      {validationAlert && (
        <ResultMessage
          type={validationAlert.type}
          title={validationAlert.title}
          text={validationAlert.text}
          onDismiss={() => setValidationAlert(null)}
        />
      )}

      {/* Success Notification on Accepted State */}
      {isCompleted && (
        <ResultMessage
          type="success"
          title="Formal Request Acceptance: String Accepted by DFA"
          text={`The transition sequence [${transitionSequence.join(' -> ')}] reached accepting state COMPLETED (q ∈ F). All academic prerequisites and departmental seals are satisfied.`}
        />
      )}

      {/* Error Notification on Trap State */}
      {isRejected && (
        <ResultMessage
          type="error"
          title="Formal Request Rejection: Trap State Encountered"
          text="The DFA transitioned into non-accepting trap state REJECTED. The submission has been denied. You may click 'RESUBMIT' to restart from CREATED state."
        />
      )}

      {/* Grid: Request Form + State Diagram */}
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Request Creation Form */}
        <section className="workflow-form-card" aria-label="Campus Request Submission Form">
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Create Campus Request
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Submit an administrative request to generate the initial DFA token in state <strong>CREATED</strong>.
            </p>
          </div>

          <form onSubmit={handleCreateRequest} noValidate>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="req-title-input" className="form-label">
                <span>Request Title *</span>
              </label>
              <input
                id="req-title-input"
                type="text"
                placeholder="e.g. AI Research Lab Off-Hours Access"
                className={`form-select ${formErrors.title ? 'has-error' : ''}`}
                value={formValues.title}
                onChange={(e) => {
                  setFormValues(prev => ({ ...prev, title: e.target.value }));
                  if (formErrors.title) setFormErrors(prev => ({ ...prev, title: null }));
                }}
                disabled={apiLoading}
              />
              {formErrors.title && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{formErrors.title}</span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="req-category-select" className="form-label">
                <span>Category *</span>
              </label>
              <select
                id="req-category-select"
                className={`form-select ${formErrors.category ? 'has-error' : ''}`}
                value={formValues.category}
                onChange={(e) => {
                  setFormValues(prev => ({ ...prev, category: e.target.value }));
                  if (formErrors.category) setFormErrors(prev => ({ ...prev, category: null }));
                }}
                disabled={apiLoading}
              >
                <option value="">-- Select Administrative Category --</option>
                <option value="Academic">Academic Exception / Credit Overload</option>
                <option value="Facilities">Laboratory &amp; Facilities Access</option>
                <option value="Examination">Hall Ticket &amp; Re-evaluation</option>
                <option value="Administration">Bonafide / Official Seal</option>
              </select>
              {formErrors.category && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{formErrors.category}</span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="req-desc-input" className="form-label">
                <span>Description &amp; Academic Justification *</span>
              </label>
              <textarea
                id="req-desc-input"
                rows="3"
                placeholder="Provide student rationale and academic justification..."
                className={`form-select ${formErrors.description ? 'has-error' : ''}`}
                value={formValues.description}
                onChange={(e) => {
                  setFormValues(prev => ({ ...prev, description: e.target.value }));
                  if (formErrors.description) setFormErrors(prev => ({ ...prev, description: null }));
                }}
                disabled={apiLoading}
                style={{ resize: 'vertical' }}
              />
              {formErrors.description && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{formErrors.description}</span>
              )}
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="req-student-name" className="form-label">Student Name</label>
                <input
                  id="req-student-name"
                  type="text"
                  className="form-select"
                  value={formValues.studentName}
                  onChange={(e) => setFormValues(prev => ({ ...prev, studentName: e.target.value }))}
                  disabled={apiLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="req-student-id" className="form-label">Student ID</label>
                <input
                  id="req-student-id"
                  type="text"
                  className="form-select"
                  value={formValues.studentId}
                  onChange={(e) => setFormValues(prev => ({ ...prev, studentId: e.target.value }))}
                  disabled={apiLoading}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={apiLoading}
              >
                {apiLoading && !activeRequest ? 'Initializing...' : 'Initialize & Create Request'}
              </button>

              {activeRequest && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetWorkflow}
                  disabled={apiLoading}
                >
                  Clear Active Request
                </button>
              )}
            </div>
          </form>

          {activeRequest && (
            <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.825rem' }}>
              <div><strong>Active Request Token:</strong> <code style={{ color: 'var(--color-primary)' }}>{activeRequest.id}</code></div>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {activeRequest.title} &bull; {activeRequest.department}
              </div>
            </div>
          )}
        </section>

        {/* State Diagram Card */}
        <section className="workflow-form-card" aria-label="DFA Transition Graph Visualization">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Deterministic Finite Automaton (M)
            </h2>
            <span className="academic-badge badge-flat">5-Tuple DFA</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            $M = (Q, \Sigma, \delta, q_0, F)$ where $F =$ {'{ COMPLETED }'}. Real-time state highlighting tracks formal transitions.
          </p>

          <StateDiagram
            currentState={currentState}
            activeSymbol={lastSymbol}
          />
        </section>
      </div>

      {/* Action Dispatch Panel */}
      <section className="workflow-actions-card" aria-label="Permitted Workflow Actions">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Trigger Workflow Action Transition (&Sigma;)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Actions are validated against the backend DFA transition table. Permitted transitions from <strong>{currentState}</strong> are highlighted below.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current State:</span>
            <StatusBadge
              status={isCompleted ? 'approved' : isRejected ? 'rejected' : 'online'}
              label={formatStatusLabel(currentState)}
            />
          </div>
        </div>

        {/* Buttons for All Standard Symbols */}
        <div className="action-buttons-grid">
          {ALL_ACTION_SYMBOLS.map(symbol => {
            const isPermitted = permittedSymbolSet.has(symbol);
            const isDanger = symbol === 'REJECT';

            let btnClass = 'action-dispatch-btn';
            if (isPermitted) {
              btnClass += isDanger ? ' danger-valid' : ' valid';
            } else {
              btnClass += ' disabled';
            }

            return (
              <button
                key={symbol}
                type="button"
                className={btnClass}
                onClick={() => handleTriggerAction(symbol)}
                disabled={apiLoading || !activeRequest || isCompleted}
                title={isPermitted ? `Execute delta(${currentState}, ${symbol})` : `Invalid: No transition delta(${currentState}, ${symbol})`}
              >
                <span>{symbol}</span>
                <span className="action-status-tag">
                  {isPermitted ? '&check; Permitted' : '&cross; Undefined'}
                </span>
              </button>
            );
          })}

          {/* Special Resubmit Option for Trap State */}
          {isRejected && (
            <button
              type="button"
              className="action-dispatch-btn valid"
              onClick={() => handleTriggerAction('RESUBMIT')}
              disabled={apiLoading}
            >
              <span>RESUBMIT</span>
              <span className="action-status-tag">&check; Re-Open to CREATED</span>
            </button>
          )}
        </div>
      </section>

      {/* Transition History Audit Trail */}
      <section className="transition-history-card" aria-label="DFA Transition Execution History">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Automaton Transition History
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Step-by-step mathematical transition trace $\delta(q_{i}, \sigma_{i}) \to q_{i+1}$ recorded for this request.
            </p>
          </div>

          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            {transitionHistory.length} Recorded Steps
          </span>
        </div>

        {transitionHistory.length === 0 ? (
          <div className="loading-skeleton-box" style={{ padding: '1.5rem' }}>
            <span>No transitions executed. Create a request and trigger an action above.</span>
          </div>
        ) : (
          <div className="history-step-list">
            {transitionHistory.map((step) => (
              <div
                key={`trace-step-${step.step}`}
                className={`history-step-item ${step.isAccepted ? 'accepted' : step.isTrap ? 'rejected' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                    Step #{step.step}
                  </span>
                  {step.symbol ? (
                    <span>
                      Triggered <code>{step.symbol}</code> &rarr; Reached <strong>{step.toState}</strong>
                    </span>
                  ) : (
                    <span><strong>Initial State: {step.toState}</strong></span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {step.explanation}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {step.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Academic Explanation Card */}
      <section className="daa-explanation-card" aria-label="Theoretical FLAT Concepts">
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Formal Languages &amp; Automata Theory Concepts Demonstrated
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Rigorous automata properties demonstrated by the campus workflow validator.
          </p>
        </div>

        <div className="daa-algo-comparison">
          <div className="algo-box bfs" style={{ borderLeftColor: '#059669' }}>
            <div className="algo-box-title">
              <span>Deterministic Transition Function</span>
              <span className="academic-badge badge-flat">&delta;: Q &times; &Sigma; &rarr; Q</span>
            </div>
            <p className="algo-box-desc">
              For any given state and input symbol, there is at most one unique destination state. Non-deterministic transitions are prohibited. If an input symbol has no entry in $\delta(q, \sigma)$, the automaton halts immediately with an invalid transition error, protecting the integrity of campus approvals.
            </p>
          </div>

          <div className="algo-box dfs" style={{ borderLeftColor: '#2563eb' }}>
            <div className="algo-box-title">
              <span>Formal Language Acceptance</span>
              <span className="academic-badge badge-flat">L(M) Acceptance</span>
            </div>
            <p className="algo-box-desc">
              A student request is formally accepted if and only if the consumed symbol sequence navigates the transition function from initial state q0 = CREATED to an element of the final states set F = &#123;COMPLETED&#125;. Requests ending in trap state REJECTED are discarded.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
