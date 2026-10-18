import { Router } from 'express';
import { workflowController } from '../controllers/workflowController.js';
import { requestController } from '../controllers/requestController.js';

const router = Router();

// Formal DFA automata specification & validation
router.get('/dfa-spec', workflowController.getDFASpec);
router.post('/validate', workflowController.validateSequence);

// Request retrieval & history
router.get('/history', requestController.listRequests);
router.get('/history/:id', requestController.getRequestById);
router.get('/requests', requestController.listRequests);
router.get('/requests/:id', requestController.getRequestById);

// Request creation (strictly initialized in CREATED state)
router.post('/requests', requestController.createRequest);

// Workflow action execution & state transitions
router.post('/requests/:id/action', requestController.executeWorkflowAction);
router.post('/requests/:id/transition', requestController.executeWorkflowAction);
router.post('/action', requestController.executeWorkflowAction);

export default router;
