/**
 * Academic Request & Workflow Action Routes (FLAT & Automata Module)
 * 
 * Express Router defining endpoints for the student campus request lifecycle:
 *   - POST /: Create a new campus request strictly initialized in CREATED state
 *   - GET /: List requests with optional status filtering (?status=APPROVED, etc.)
 *   - GET /:id: Retrieve a single request by its unique identifier
 *   - POST /:id/action: Submit a formal DFA workflow action transition for a request
 * 
 * Connects directly to requestController.js.
 * Strictly uses express.Router() without creating a new Express application.
 */

import { Router } from 'express';
import { requestController } from '../controllers/requestController.js';

const router = Router();

// 1. Create a request (strictly initialized in CREATED state)
router.post('/', requestController.createRequest);

// 2. List requests (supports ?status=APPROVED | IN_REVIEW | REJECTED query filter)
router.get('/', requestController.listRequests);

// 3. Retrieve a single request by unique identifier (e.g. REQ-1001)
router.get('/:id', requestController.getRequestById);

// 4. Submit a formal DFA workflow action transition for a request
// Accepts JSON body: { action: "VALIDATE" | "PROCESS" | "COMPLETE" | "REJECT" | "RESUBMIT" }
router.post('/:id/action', requestController.executeWorkflowAction);
router.post('/:id/actions', requestController.executeWorkflowAction);
router.post('/:id/transition', requestController.executeWorkflowAction);

// Optional helper route for submitting action when request ID is provided in JSON body
router.post('/action', requestController.executeWorkflowAction);

export default router;
