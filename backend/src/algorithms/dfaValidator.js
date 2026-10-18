/**
 * Formal Languages & Automata Theory (FLAT) Module
 * Deterministic Finite Automaton (DFA) for Academic Request Workflows
 * 
 * Formal Definition: M = (Q, Sigma, delta, q0, F)
 * - Q: Finite set of states: { CREATED, VALIDATED, PROCESSING, COMPLETED, REJECTED }
 * - Sigma: Finite input alphabet: { VALIDATE, PROCESS, COMPLETE, REJECT, RESUBMIT }
 * - delta: State transition function (Q x Sigma -> Q)
 * - q0: Start state (CREATED)
 * - F: Set of accepting / final states: { COMPLETED }
 */

export const DFA_SPECIFICATION = {
  name: "Campus Request Lifecycle DFA",
  states: [
    { id: "CREATED", label: "Created State", description: "Request initiated by student.", isInitial: true, isAccepting: false },
    { id: "VALIDATED", label: "Validated", description: "Academic requirements and prerequisites vetted.", isInitial: false, isAccepting: false },
    { id: "PROCESSING", label: "Processing", description: "Departmental review and administrative endorsement underway.", isInitial: false, isAccepting: false },
    { id: "COMPLETED", label: "Completed", description: "Accepting state. Request formally approved and sealed.", isInitial: false, isAccepting: true },
    { id: "REJECTED", label: "Rejected Trap", description: "Non-accepting trap state. Request denied.", isInitial: false, isAccepting: false, isTrap: true }
  ],
  alphabet: [
    { symbol: "VALIDATE", description: "Formally validates student credentials and inputs" },
    { symbol: "PROCESS", description: "Moves validated request into active administrative processing" },
    { symbol: "COMPLETE", description: "Finalizes request into accepting state" },
    { symbol: "REJECT", description: "Denies request and moves to trap state" },
    { symbol: "RESUBMIT", description: "Re-opens rejected request from initial state" }
  ],
  startState: "CREATED",
  acceptingStates: ["COMPLETED", "Q4_REGISTRAR_SEALED"],
  transitionTable: {
    CREATED: {
      VALIDATE: "VALIDATED",
      REJECT: "REJECTED",
      SUBMIT: "VALIDATED"
    },
    VALIDATED: {
      PROCESS: "PROCESSING",
      APPROVE: "PROCESSING",
      ADVISOR_APPROVE: "PROCESSING",
      REJECT: "REJECTED",
      ADVISOR_REJECT: "REJECTED"
    },
    PROCESSING: {
      COMPLETE: "COMPLETED",
      REGISTRAR_SEAL: "COMPLETED",
      REJECT: "REJECTED",
      HOD_REJECT: "REJECTED",
      FAIL: "REJECTED"
    },
    REJECTED: {
      RESUBMIT: "CREATED"
    },
    COMPLETED: {},

    // Backward-compatibility aliases for legacy state labels
    Q0_DRAFT: {
      VALIDATE: "VALIDATED",
      SUBMIT: "VALIDATED"
    },
    Q1_SUBMITTED: {
      VALIDATE: "VALIDATED",
      ADVISOR_APPROVE: "VALIDATED",
      ADVISOR_REJECT: "REJECTED"
    },
    Q2_ADVISOR_VERIFIED: {
      PROCESS: "PROCESSING",
      HOD_APPROVE: "PROCESSING",
      HOD_REJECT: "REJECTED",
      REJECT: "REJECTED"
    },
    Q3_HOD_APPROVED: {
      COMPLETE: "COMPLETED",
      REGISTRAR_SEAL: "COMPLETED",
      REJECT: "REJECTED"
    },
    Q_REJECTED: {
      RESUBMIT: "CREATED"
    },
    Q4_REGISTRAR_SEALED: {}
  }
};

/**
 * Normalizes state name to primary DFA state identifier.
 */
function normalizeStateId(state) {
  if (!state) return "CREATED";
  const upper = String(state).trim().toUpperCase();
  if (upper === "Q0_DRAFT") return "CREATED";
  if (upper === "Q1_SUBMITTED" || upper === "Q2_ADVISOR_VERIFIED") return "VALIDATED";
  if (upper === "Q3_HOD_APPROVED") return "PROCESSING";
  if (upper === "Q4_REGISTRAR_SEALED") return "COMPLETED";
  if (upper === "Q_REJECTED") return "REJECTED";
  return upper;
}

/**
 * Validates a sequence of input transition symbols against the DFA.
 * 
 * @param {Array<string>} inputSymbols - Sequence of actions from Sigma
 * @param {string} [initialState] - Optional start state override (defaults to q0)
 * @returns {Object} Full execution trace with states, transitions, valid flags, and verdict
 */
export function validateDFASequence(inputSymbols = [], initialState = DFA_SPECIFICATION.startState) {
  let currentState = normalizeStateId(initialState);
  const executionTrace = [];
  let isHalted = false;
  let haltReason = null;

  executionTrace.push({
    step: 0,
    fromState: null,
    symbol: null,
    toState: currentState,
    isAcceptedState: DFA_SPECIFICATION.acceptingStates.includes(currentState),
    explanation: `DFA initialized at start state ${currentState}.`
  });

  for (let i = 0; i < inputSymbols.length; i++) {
    const rawSymbol = inputSymbols[i];
    const symbol = String(rawSymbol).trim().toUpperCase();
    const allowedTransitions = DFA_SPECIFICATION.transitionTable[currentState] || {};
    const nextState = allowedTransitions[symbol];

    if (!nextState) {
      isHalted = true;
      haltReason = `Invalid transition: No delta(${currentState}, ${symbol}) defined in DFA transition table.`;
      executionTrace.push({
        step: i + 1,
        fromState: currentState,
        symbol,
        toState: null,
        isAcceptedState: false,
        error: true,
        explanation: haltReason
      });
      break;
    }

    const previousState = currentState;
    currentState = normalizeStateId(nextState);

    executionTrace.push({
      step: i + 1,
      fromState: previousState,
      symbol,
      toState: currentState,
      isAcceptedState: DFA_SPECIFICATION.acceptingStates.includes(currentState),
      error: false,
      explanation: `Transitioned delta(${previousState}, ${symbol}) -> ${currentState}.`
    });
  }

  const isAccepted = !isHalted && DFA_SPECIFICATION.acceptingStates.includes(currentState);

  return {
    automatonType: "Deterministic Finite Automaton (DFA)",
    academicFocus: "FLAT: Formal languages, state transitions, alphabet, and acceptance criteria",
    inputSymbols,
    startState: normalizeStateId(initialState),
    finalState: currentState,
    isAccepted,
    isHalted,
    haltReason,
    trace: executionTrace
  };
}
