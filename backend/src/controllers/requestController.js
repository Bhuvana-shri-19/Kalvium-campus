/**
 * Campus Request Controller (FLAT & Workflow Module)
 * 
 * Express controller for managing academic student requests and executing formal DFA actions:
 *   - Request creation (strictly initialized in CREATED state)
 *   - Request listing with optional status filtering
 *   - Retrieving a single request by unique identifier
 *   - Executing formal DFA workflow actions via workflowService.js
 * 
 * SECURITY & INTEGRITY:
 *   - Never trusts a client-supplied current state; loads actual state from requestsStore.js.
 *   - Validates required fields (title, category) and action symbols.
 *   - Rejects invalid DFA transitions with HTTP 400 without mutating store state.
 *   - Returns HTTP 404 for nonexistent requests.
 *   - Persists all state updates to in-memory requestsStore.js for the runtime of the server.
 */

import {
  createRequest as createRequestStore,
  getRequestById as getRequestByIdStore,
  listRequests as listRequestsStore,
  updateRequest as updateRequestStore
} from '../data/requestsStore.js';
import { workflowService } from '../services/workflowService.js';

/**
 * Controller: Creates a new campus request strictly initialized in CREATED state
 * Route: POST /api/requests (or POST /api/workflow/requests)
 * 
 * Validates:
 *   - title: required non-empty string
 *   - category: required non-empty string (or department/requestType)
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function createRequest(req, res, next) {
  try {
    const payload = req.body || {};

    // Validate title
    const rawTitle = payload.title;
    if (!rawTitle || typeof rawTitle !== 'string' || !rawTitle.trim()) {
      const err = new Error('Request title is required and cannot be empty.');
      err.status = 400;
      return next(err);
    }
    const title = rawTitle.trim();

    // Validate category (also accepts department or requestType aliases)
    const rawCategory = payload.category || payload.department || payload.requestType;
    if (!rawCategory || typeof rawCategory !== 'string' || !rawCategory.trim()) {
      const err = new Error('Request category is required and cannot be empty.');
      err.status = 400;
      return next(err);
    }
    const category = rawCategory.trim();

    const studentName = payload.studentName && typeof payload.studentName === 'string' && payload.studentName.trim()
      ? payload.studentName.trim()
      : 'Kalvium Student';

    const studentId = payload.studentId && typeof payload.studentId === 'string' && payload.studentId.trim()
      ? payload.studentId.trim()
      : 'KAL-2026-GEN';

    const department = payload.department && typeof payload.department === 'string' && payload.department.trim()
      ? payload.department.trim()
      : category;

    const requestType = payload.requestType && typeof payload.requestType === 'string' && payload.requestType.trim()
      ? payload.requestType.trim().toUpperCase()
      : category.toUpperCase().replace(/\s+/g, '_');

    const description = payload.description && typeof payload.description === 'string'
      ? payload.description.trim()
      : '';

    const now = new Date().toISOString();

    // Mandatory rule: Requests are ALWAYS initialized strictly in CREATED state.
    // Client-supplied currentState or status are deliberately disregarded.
    const newRecord = createRequestStore({
      title,
      category,
      department,
      requestType,
      description,
      studentName,
      studentId,
      currentState: 'CREATED',
      status: 'IN_REVIEW',
      sequence: [],
      workflowHistory: [
        {
          step: 0,
          timestamp: now,
          action: 'INITIALIZE',
          fromState: null,
          toState: 'CREATED',
          rejected: false,
          explanation: 'Request initialized at start DFA state CREATED (q0).'
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Request successfully created and initialized in CREATED state.',
      data: newRecord
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller: Lists all stored requests with optional status filtering
 * Route: GET /api/requests (or GET /api/workflow/history)
 * 
 * @param {import('express').Request} req - Express request with optional query.status
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function listRequests(req, res, next) {
  try {
    const { status } = req.query;
    const requests = listRequestsStore(status);

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller: Retrieves a single request by unique identifier
 * Route: GET /api/requests/:id (or GET /api/workflow/history/:id)
 * 
 * @param {import('express').Request} req - Express request with params.id
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function getRequestById(req, res, next) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || !id.trim()) {
      const err = new Error('Valid request identifier (id) is required.');
      err.status = 400;
      return next(err);
    }

    const request = getRequestByIdStore(id.trim());
    if (!request) {
      const err = new Error(`Request with ID '${id.trim()}' not found.`);
      err.status = 404;
      return next(err);
    }

    return res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller: Executes a formal DFA workflow action transition on an existing request
 * Route: POST /api/requests/:id/action (or POST /api/workflow/requests/:id/action)
 * 
 * SECURITY RULE:
 *   - Never trusts client-supplied current state.
 *   - Strictly loads actual state from requestsStore.
 *   - Validates transition using workflowService.js.
 *   - Rejects invalid transitions with HTTP 400 without mutating store state.
 *   - Persists state updates to requestsStore.js.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function executeWorkflowAction(req, res, next) {
  try {
    const id = req.params.id || (req.body && (req.body.id || req.body.requestId));
    if (!id || typeof id !== 'string' || !id.trim()) {
      const err = new Error('Valid request identifier (id) is required to execute a workflow action.');
      err.status = 400;
      return next(err);
    }
    const cleanId = id.trim();

    const rawAction = req.body && (req.body.action || req.body.symbol || req.body.inputSymbol);
    if (!rawAction || typeof rawAction !== 'string' || !rawAction.trim()) {
      const err = new Error('Workflow action symbol (e.g. VALIDATE, PROCESS, COMPLETE, REJECT, RESUBMIT) is required.');
      err.status = 400;
      return next(err);
    }
    const action = rawAction.trim().toUpperCase();

    // 1. Load actual request from store — DO NOT trust any client-supplied state
    const existingRequest = getRequestByIdStore(cleanId);
    if (!existingRequest) {
      const err = new Error(`Request with ID '${cleanId}' not found. Cannot execute workflow action.`);
      err.status = 404;
      return next(err);
    }

    // 2. Extract actual current state strictly from the store
    const actualCurrentState = existingRequest.currentState || 'CREATED';

    // 3. Delegate transition logic strictly to workflowService (FLAT DFA)
    const transitionResult = workflowService.transition(
      actualCurrentState,
      action,
      existingRequest.workflowHistory || []
    );

    // 4. If transition is invalid, reject with HTTP 400 without mutating store state
    if (!transitionResult.isValid) {
      const err = new Error(
        transitionResult.message ||
        `Invalid DFA transition: Action '${action}' is not defined from state '${actualCurrentState}'. State remains '${actualCurrentState}'.`
      );
      err.status = 400;
      return next(err);
    }

    // 5. Determine updated status
    const isAccepted = transitionResult.isAccepted;
    const isRejected = transitionResult.state === 'REJECTED';
    const newStatus = isAccepted ? 'APPROVED' : isRejected ? 'REJECTED' : 'IN_REVIEW';

    const updatedSequence = Array.isArray(existingRequest.sequence)
      ? [...existingRequest.sequence, action]
      : [action];

    // 6. Persist updates in requestsStore for the lifetime of the server
    const updatedRecord = updateRequestStore(cleanId, {
      currentState: transitionResult.state,
      status: newStatus,
      isAccepted,
      sequence: updatedSequence,
      workflowHistory: transitionResult.history,
      action,
      explanation: transitionResult.message
    });

    return res.status(200).json({
      success: true,
      message: transitionResult.message,
      data: updatedRecord,
      transition: {
        action,
        fromState: actualCurrentState,
        toState: transitionResult.state,
        isAccepted,
        status: newStatus
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller grouping with aliases for full backward and forward compatibility
 */
export const requestController = {
  createRequest,
  listRequests,
  getAllRequests: listRequests,
  getRequestById,
  executeWorkflowAction,
  triggerAction: executeWorkflowAction,
  transitionRequest: executeWorkflowAction,
  executeAction: executeWorkflowAction
};

export default requestController;
