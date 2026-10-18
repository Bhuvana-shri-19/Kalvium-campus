/**
 * Formal Languages & Automata Theory (FLAT Module)
 * Academic Request Workflow Service & DFA Engine
 * 
 * ==============================================================================
 * FORMAL DFA SPECIFICATION: M = (Q, Sigma, delta, q0, F)
 * 
 * 1. Q (States):
 *    { CREATED, VALIDATED, PROCESSING, COMPLETED, REJECTED }
 * 
 * 2. Sigma (Input Alphabet):
 *    { VALIDATE, PROCESS, COMPLETE, REJECT }
 * 
 * 3. delta (Deterministic Transition Function):
 *    - CREATED + VALIDATE    -> VALIDATED
 *    - CREATED + REJECT      -> REJECTED
 *    - VALIDATED + PROCESS   -> PROCESSING
 *    - VALIDATED + REJECT    -> REJECTED
 *    - PROCESSING + COMPLETE -> COMPLETED
 *    - PROCESSING + REJECT   -> REJECTED (trap denial)
 *    - REJECTED + RESUBMIT   -> CREATED  (re-opening)
 * 
 * 4. q0 (Initial State):
 *    CREATED
 * 
 * 5. F (Accepting / Final States):
 *    { COMPLETED } (represented by double circle in state diagram)
 * 
 * STRICT DETERMINISM RULE:
 * Any undefined transition delta(q, sigma) is rejected immediately without
 * changing the current state.
 * ==============================================================================
 */

import { getAllRequests, getRequestById, addRequest } from '../data/requestsStore.js';
import { simulateArchitectureExecution } from '../algorithms/architectureSimulator.js';

/**
 * Single Source of Truth for DFA Definition
 */
export const DFA_DEFINITION = Object.freeze({
  name: "Kalvium Student Request Workflow DFA",
  states: Object.freeze({
    CREATED: "CREATED",
    VALIDATED: "VALIDATED",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    REJECTED: "REJECTED"
  }),
  alphabet: Object.freeze(["VALIDATE", "PROCESS", "COMPLETE", "REJECT", "RESUBMIT"]),
  startState: "CREATED",
  acceptingState: "COMPLETED",
  acceptingStates: Object.freeze(["COMPLETED", "Q4_REGISTRAR_SEALED"]),
  trapStates: Object.freeze(["REJECTED", "Q_REJECTED"]),
  transitionTable: Object.freeze({
    CREATED: Object.freeze({
      VALIDATE: "VALIDATED",
      REJECT: "REJECTED",
      SUBMIT: "VALIDATED"
    }),
    VALIDATED: Object.freeze({
      PROCESS: "PROCESSING",
      REJECT: "REJECTED",
      APPROVE: "PROCESSING",
      ADVISOR_APPROVE: "PROCESSING",
      ADVISOR_REJECT: "REJECTED"
    }),
    PROCESSING: Object.freeze({
      COMPLETE: "COMPLETED",
      REJECT: "REJECTED",
      REGISTRAR_SEAL: "COMPLETED",
      HOD_APPROVE: "COMPLETED",
      HOD_REJECT: "REJECTED",
      FAIL: "REJECTED"
    }),
    REJECTED: Object.freeze({
      RESUBMIT: "CREATED"
    }),
    COMPLETED: Object.freeze({}),

    // Legacy state aliases for seamless backward-compatibility
    Q0_DRAFT: Object.freeze({
      VALIDATE: "VALIDATED",
      SUBMIT: "VALIDATED",
      REJECT: "REJECTED"
    }),
    Q1_SUBMITTED: Object.freeze({
      VALIDATE: "VALIDATED",
      ADVISOR_APPROVE: "VALIDATED",
      ADVISOR_REJECT: "REJECTED",
      REJECT: "REJECTED"
    }),
    Q2_ADVISOR_VERIFIED: Object.freeze({
      PROCESS: "PROCESSING",
      HOD_APPROVE: "PROCESSING",
      HOD_REJECT: "REJECTED",
      REJECT: "REJECTED"
    }),
    Q3_HOD_APPROVED: Object.freeze({
      COMPLETE: "COMPLETED",
      REGISTRAR_SEAL: "COMPLETED",
      REJECT: "REJECTED"
    }),
    Q_REJECTED: Object.freeze({
      RESUBMIT: "CREATED"
    }),
    Q4_REGISTRAR_SEALED: Object.freeze({})
  })
});

/**
 * Normalizes a state label to canonical DFA state
 * @param {string} state - Raw state string
 * @returns {string} Normalized canonical state
 */
export function normalizeState(state) {
  if (!state) return DFA_DEFINITION.startState;
  const upper = String(state).trim().toUpperCase();
  if (upper === "Q0_DRAFT") return "CREATED";
  if (upper === "Q1_SUBMITTED" || upper === "Q2_ADVISOR_VERIFIED") return "VALIDATED";
  if (upper === "Q3_HOD_APPROVED") return "PROCESSING";
  if (upper === "Q4_REGISTRAR_SEALED") return "COMPLETED";
  if (upper === "Q_REJECTED") return "REJECTED";
  return upper;
}

/**
 * Executes a single DFA state transition delta(q, sigma).
 * Rejects undefined transitions without mutating current state.
 * 
 * @param {string} currentState - Current state (e.g. 'CREATED')
 * @param {string} inputSymbol - Input action from Sigma (e.g. 'VALIDATE', 'PROCESS', 'COMPLETE', 'REJECT')
 * @param {Array<Object>} [history=[]] - Prior transition history records
 * @returns {Object} Result { isValid, state, currentState, isAccepted, message, history }
 */
export function transition(currentState = "CREATED", inputSymbol, history = []) {
  const normState = normalizeState(currentState);
  const normSymbol = String(inputSymbol || "").trim().toUpperCase();
  const currentHistory = Array.isArray(history) ? [...history] : [];
  const now = new Date().toISOString();

  // Validate state existence
  const allowedTransitions = DFA_DEFINITION.transitionTable[normState];
  if (!allowedTransitions) {
    const errorMsg = `Invalid state: '${normState}' is not a recognized DFA state. State remains unchanged.`;
    return {
      isValid: false,
      state: normState,
      currentState: normState,
      isAccepted: false,
      message: errorMsg,
      history: [
        ...currentHistory,
        {
          timestamp: now,
          action: normSymbol,
          fromState: normState,
          toState: normState,
          rejected: true,
          explanation: errorMsg
        }
      ]
    };
  }

  const nextStateRaw = allowedTransitions[normSymbol];

  // Rejection rule: Undefined transition leaves current state strictly unchanged
  if (!nextStateRaw) {
    const rejectionMsg = `Undefined transition rejected: Input symbol '${normSymbol}' is not allowed from state '${normState}'. State remains '${normState}'.`;
    return {
      isValid: false,
      state: normState,
      currentState: normState,
      isAccepted: DFA_DEFINITION.acceptingStates.includes(normState),
      message: rejectionMsg,
      history: [
        ...currentHistory,
        {
          timestamp: now,
          action: normSymbol,
          fromState: normState,
          toState: normState,
          rejected: true,
          explanation: rejectionMsg
        }
      ]
    };
  }

  const nextState = normalizeState(nextStateRaw);
  const isAccepted = DFA_DEFINITION.acceptingStates.includes(nextState);

  const successMsg = isAccepted
    ? `Transition accepted: delta(${normState}, ${normSymbol}) -> ${nextState}. Request reached accepting state!`
    : `Transition successful: delta(${normState}, ${normSymbol}) -> ${nextState}.`;

  return {
    isValid: true,
    state: nextState,
    currentState: nextState,
    isAccepted,
    message: successMsg,
    history: [
      ...currentHistory,
      {
        timestamp: now,
        action: normSymbol,
        fromState: normState,
        toState: nextState,
        rejected: false,
        explanation: successMsg
      }
    ]
  };
}

/**
 * Validates a consumed sequence of symbols across the DFA
 * 
 * @param {Array<string>} sequence - Array of action symbols
 * @param {string} [initialState='CREATED'] - Starting state
 * @returns {Object} Execution trace, final state, and acceptance verdict
 */
export function validateSequence(sequence = [], initialState = "CREATED") {
  if (!Array.isArray(sequence)) {
    const err = new Error("Input sequence must be an array of symbols");
    err.status = 400;
    throw err;
  }

  let currentState = normalizeState(initialState);
  let history = [
    {
      step: 0,
      timestamp: new Date().toISOString(),
      action: null,
      fromState: null,
      toState: currentState,
      rejected: false,
      explanation: `DFA initialized at start state ${currentState}.`
    }
  ];

  let isHalted = false;
  let haltReason = null;

  for (let i = 0; i < sequence.length; i++) {
    const symbol = sequence[i];
    const result = transition(currentState, symbol, history);
    history = result.history;

    if (!result.isValid) {
      isHalted = true;
      haltReason = result.message;
      break;
    }

    currentState = result.state;
  }

  const isAccepted = !isHalted && DFA_DEFINITION.acceptingStates.includes(currentState);

  return {
    automatonType: "Deterministic Finite Automaton (DFA)",
    academicFocus: "FLAT: Formal languages, state transitions, alphabet, and acceptance criteria",
    inputSymbols: sequence,
    startState: normalizeState(initialState),
    finalState: currentState,
    currentState,
    isAccepted,
    isHalted,
    haltReason,
    trace: history,
    history
  };
}

/**
 * Checks if a given state is in the set of accepting final states
 * @param {string} state - The state to check
 * @returns {boolean} True if state is accepting
 */
export function isAcceptingState(state) {
  return DFA_DEFINITION.acceptingStates.includes(normalizeState(state));
}

/**
 * Returns all valid next input actions permitted from a given state
 * @param {string} state - The current state
 * @returns {Array<string>} Permitted input symbols
 */
export function getAvailableActions(state) {
  const norm = normalizeState(state);
  const transitions = DFA_DEFINITION.transitionTable[norm] || {};
  return Object.keys(transitions);
}

/**
 * Service orchestrator coordinating DFA validation and in-memory request storage
 */
export const workflowService = {
  getDFASpecification() {
    return DFA_DEFINITION;
  },

  transition(currentState, inputSymbol, history) {
    return transition(currentState, inputSymbol, history);
  },

  validateSequence(sequence, initialState) {
    return validateSequence(sequence, initialState);
  },

  isAcceptingState(state) {
    return isAcceptingState(state);
  },

  getAvailableActions(state) {
    return getAvailableActions(state);
  },

  getAllRequests(status) {
    return getAllRequests(status);
  },

  getRequestById(id) {
    const request = getRequestById(id);
    if (!request) {
      const err = new Error(`Request with ID '${id}' not found`);
      err.status = 404;
      throw err;
    }
    return request;
  },

  createAndProcessRequest(payload) {
    const { studentId, studentName, requestType, title, department, sequence = ["SUBMIT"] } = payload;
    
    if (!studentId || !requestType || !title) {
      const err = new Error("studentId, requestType, and title are required fields");
      err.status = 400;
      throw err;
    }

    // Step 1: Validate sequence with DFA (FLAT)
    const dfaValidation = validateSequence(sequence);

    // Step 2: Simulate Hardware Execution (COA)
    const hardwareExecution = simulateArchitectureExecution({
      studentId,
      requestType,
      creditUnits: payload.creditUnits || 18,
      priority: payload.priority || 1
    });

    const status = dfaValidation.isAccepted
      ? "APPROVED"
      : dfaValidation.isHalted
      ? "INVALID_TRANSITION"
      : dfaValidation.finalState === "REJECTED" || dfaValidation.finalState === "Q_REJECTED"
      ? "REJECTED"
      : "IN_REVIEW";

    const newRecord = addRequest({
      studentId,
      studentName: studentName || "Kalvium Student",
      requestType,
      title,
      department: department || "Computer Science",
      currentState: dfaValidation.finalState,
      status,
      sequence,
      dfaValidation,
      hardwareExecution: {
        cycles: hardwareExecution.steps.length,
        status: hardwareExecution.status,
        finalRegisters: hardwareExecution.finalRegisters
      }
    });

    return newRecord;
  }
};

export default workflowService;
