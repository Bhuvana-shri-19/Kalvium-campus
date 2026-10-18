/**
 * Kalvium Campus Navigator & Request Processing Simulator
 * In-Memory Request Store (Development Environment)
 * 
 * ==============================================================================
 * IMPORTANT DISCLAIMER & ARCHITECTURAL NOTICE:
 * 
 * 1. DEVELOPMENT IN-MEMORY PERSISTENCE ONLY:
 *    This module maintains mock campus student requests in Node.js runtime process
 *    memory for local development and academic demonstrations.
 * 
 * 2. VOLATILE STATE:
 *    All data stored in this module RESETS COMPLETELY whenever the Node.js server
 *    process restarts, crashes, or is redeployed. It does NOT provide durable
 *    production persistence (no PostgreSQL, MongoDB, or disk database backing).
 * 
 * 3. ENCAPSULATION & IMMUTABILITY:
 *    The internal storage array is private and never exposed directly. Callers
 *    receive cloned objects to prevent accidental or arbitrary external mutations.
 * ==============================================================================
 */

// Private, encapsulated in-memory storage array
const _store = [
  {
    id: "REQ-1001",
    studentId: "KAL-2026-101",
    studentName: "Aarav Sharma",
    requestType: "LAB_ACCESS_PERMISSION",
    title: "AI Research Lab Off-Hours Access",
    department: "Computer Science",
    status: "APPROVED",
    currentState: "COMPLETED",
    sequence: ["VALIDATE", "PROCESS", "COMPLETE"],
    createdAt: "2026-10-15T09:30:00.000Z",
    submittedAt: "2026-10-15T09:30:00.000Z",
    updatedAt: "2026-10-15T10:15:00.000Z",
    workflowHistory: [
      {
        step: 0,
        timestamp: "2026-10-15T09:30:00.000Z",
        action: "SUBMIT",
        fromState: null,
        toState: "Q1_SUBMITTED",
        note: "Request submitted by student Aarav Sharma."
      },
      {
        step: 1,
        timestamp: "2026-10-15T09:45:00.000Z",
        action: "ADVISOR_APPROVE",
        fromState: "Q1_SUBMITTED",
        toState: "Q2_ADVISOR_VERIFIED",
        note: "Academic advisor verified laboratory prerequisite completion."
      },
      {
        step: 2,
        timestamp: "2026-10-15T10:00:00.000Z",
        action: "HOD_APPROVE",
        fromState: "Q2_ADVISOR_VERIFIED",
        toState: "Q3_HOD_APPROVED",
        note: "Department Head approved off-hours physical access."
      },
      {
        step: 3,
        timestamp: "2026-10-15T10:15:00.000Z",
        action: "REGISTRAR_SEAL",
        fromState: "Q3_HOD_APPROVED",
        toState: "Q4_REGISTRAR_SEALED",
        note: "Registrar applied official institutional seal. DFA accepted."
      }
    ],
    hardwareExecution: {
      cycles: 7,
      accumulator: 1,
      status: "SUCCESS"
    }
  },
  {
    id: "REQ-1002",
    studentId: "KAL-2026-204",
    studentName: "Diya Patel",
    requestType: "CREDIT_OVERLOAD_EXCEPTION",
    title: "Dual Specialization 26 Credits Exemption",
    department: "Information Science",
    status: "REJECTED",
    currentState: "REJECTED",
    sequence: ["VALIDATE", "REJECT"],
    createdAt: "2026-10-16T11:15:00.000Z",
    submittedAt: "2026-10-16T11:15:00.000Z",
    updatedAt: "2026-10-16T11:30:00.000Z",
    workflowHistory: [
      {
        step: 0,
        timestamp: "2026-10-16T11:15:00.000Z",
        action: "VALIDATE",
        fromState: "CREATED",
        toState: "VALIDATED",
        note: "Credentials vetted."
      },
      {
        step: 1,
        timestamp: "2026-10-16T11:30:00.000Z",
        action: "REJECT",
        fromState: "VALIDATED",
        toState: "REJECTED",
        note: "Advisor denied request: Maximum term credit ceiling exceeded. Transitioned to Trap state."
      }
    ],
    hardwareExecution: {
      cycles: 7,
      accumulator: 0,
      status: "REJECTED_CREDIT_LIMIT"
    }
  },
  {
    id: "REQ-1003",
    studentId: "KAL-2026-315",
    studentName: "Rohan Varma",
    requestType: "BONAFIDE_CERTIFICATE",
    title: "Passport Application Bonafide Certificate",
    department: "Data Science",
    status: "IN_REVIEW",
    currentState: "VALIDATED",
    sequence: ["VALIDATE"],
    createdAt: "2026-10-17T08:45:00.000Z",
    submittedAt: "2026-10-17T08:45:00.000Z",
    updatedAt: "2026-10-17T09:10:00.000Z",
    workflowHistory: [
      {
        step: 0,
        timestamp: "2026-10-17T08:45:00.000Z",
        action: "SUBMIT",
        fromState: null,
        toState: "Q1_SUBMITTED",
        note: "Bonafide certificate request submitted by Rohan Varma."
      },
      {
        step: 1,
        timestamp: "2026-10-17T09:10:00.000Z",
        action: "ADVISOR_APPROVE",
        fromState: "Q1_SUBMITTED",
        toState: "Q2_ADVISOR_VERIFIED",
        note: "Advisor verified student enrollment standing. Awaiting HOD review."
      }
    ],
    hardwareExecution: {
      cycles: 5,
      accumulator: 1,
      status: "PENDING_HOD"
    }
  }
];

// Sequential counter for generating clean, unique IDs in development
let _idCounter = 1004;

/**
 * Deep clone utility to prevent external caller mutation of internal store objects
 * @param {any} obj - Object to clone
 * @returns {any} Deep clone of object
 */
function clone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generates a unique, human-readable development request identifier
 * @returns {string} Unique ID (e.g. 'REQ-1004')
 */
export function generateRequestId() {
  const uniqueId = `REQ-${_idCounter++}`;
  return uniqueId;
}

/**
 * Creates and stores a new student campus request
 * 
 * @param {Object} requestData - Initial payload properties
 * @returns {Object} Deep clone of the newly created request
 */
export function createRequest(requestData = {}) {
  const now = new Date().toISOString();
  const id = requestData.id || generateRequestId();

  const newRequest = {
    id,
    studentId: requestData.studentId || "KAL-2026-GEN",
    studentName: requestData.studentName || "Kalvium Student",
    requestType: requestData.requestType || "GENERAL_REQUEST",
    title: requestData.title || "Campus Administrative Request",
    department: requestData.department || "Computer Science",
    status: requestData.status || "IN_REVIEW",
    currentState: requestData.currentState || "CREATED",
    sequence: Array.isArray(requestData.sequence) ? [...requestData.sequence] : ["SUBMIT"],
    createdAt: now,
    submittedAt: now,
    updatedAt: now,
    workflowHistory: Array.isArray(requestData.workflowHistory)
      ? [...requestData.workflowHistory]
      : [
          {
            step: 0,
            timestamp: now,
            action: "SUBMIT",
            fromState: null,
            toState: requestData.currentState || "CREATED",
            note: "Request initialized in development in-memory store."
          }
        ],
    hardwareExecution: requestData.hardwareExecution
      ? clone(requestData.hardwareExecution)
      : null,
    dfaValidation: requestData.dfaValidation
      ? clone(requestData.dfaValidation)
      : null
  };

  // Add to front of store for reverse-chronological order
  _store.unshift(newRequest);

  return clone(newRequest);
}

/**
 * Backward-compatible alias for createRequest
 */
export const addRequest = createRequest;

/**
 * Retrieves a single request by its unique ID
 * 
 * @param {string} id - The request identifier (e.g. 'REQ-1001')
 * @returns {Object|null} Deep clone of the request, or null if not found
 */
export function getRequestById(id) {
  if (!id) return null;
  const found = _store.find(req => req.id === id);
  return found ? clone(found) : null;
}

/**
 * Lists all requests, optionally filtered by status or state
 * 
 * @param {string} [filterStatus] - Optional status filter ('ALL', 'APPROVED', 'IN_REVIEW', 'REJECTED')
 * @returns {Array<Object>} Cloned array of matching requests
 */
export function listRequests(filterStatus) {
  if (filterStatus && filterStatus !== 'ALL') {
    const target = filterStatus.toUpperCase();
    const filtered = _store.filter(req => {
      const s = (req.status || '').toUpperCase();
      const cs = (req.currentState || '').toUpperCase();
      if (target === 'APPROVED' || target === 'COMPLETED') {
        return s === 'APPROVED' || cs === 'COMPLETED' || cs === 'Q4_REGISTRAR_SEALED';
      }
      if (target === 'IN_REVIEW' || target === 'PENDING' || target === 'PROCESSING') {
        return s === 'IN_REVIEW' || s === 'PENDING' || cs === 'PROCESSING' || cs === 'VALIDATED' || cs === 'CREATED' || cs === 'Q2_ADVISOR_VERIFIED';
      }
      if (target === 'REJECTED') {
        return s === 'REJECTED' || cs === 'REJECTED' || cs === 'Q_REJECTED';
      }
      return s === target || cs === target;
    });
    return filtered.map(clone);
  }
  return _store.map(clone);
}

/**
 * Backward-compatible alias for listRequests
 */
export const getAllRequests = listRequests;

/**
 * Updates an existing request while updating timestamp and recording workflow history
 * 
 * @param {string} id - Request identifier
 * @param {Object} updateData - Properties to update
 * @returns {Object|null} Cloned updated request, or null if ID not found
 */
export function updateRequest(id, updateData = {}) {
  if (!id) return null;

  const index = _store.findIndex(req => req.id === id);
  if (index === -1) {
    return null;
  }

  const existing = _store[index];
  const now = new Date().toISOString();

  // Create workflow audit log entry if action or state changed
  const history = Array.isArray(existing.workflowHistory) ? [...existing.workflowHistory] : [];
  if (updateData.action || updateData.currentState || updateData.status) {
    history.push({
      step: history.length,
      timestamp: now,
      action: updateData.action || "UPDATE",
      fromState: existing.currentState,
      toState: updateData.currentState || existing.currentState,
      note: updateData.note || updateData.explanation || `Status updated to ${updateData.status || updateData.currentState}.`
    });
  }

  const updatedRecord = {
    ...existing,
    ...updateData,
    id: existing.id,             // Immutable ID
    createdAt: existing.createdAt, // Immutable creation time
    submittedAt: existing.submittedAt,
    updatedAt: now,
    workflowHistory: history
  };

  _store[index] = updatedRecord;

  return clone(updatedRecord);
}

/**
 * Returns total count of stored requests
 * @returns {number}
 */
export function getRequestCount() {
  return _store.length;
}

/**
 * Diagnostic helper: Clears store and resets test data (useful for test suites)
 */
export function resetStore() {
  _store.length = 0;
  _idCounter = 1001;
}

export default {
  createRequest,
  addRequest,
  getRequestById,
  listRequests,
  getAllRequests,
  updateRequest,
  generateRequestId,
  getRequestCount,
  resetStore
};
