/**
 * Computer Processing Simulation Routes (COA Module)
 * 
 * Express Router defining endpoints for the conceptual von Neumann functional-unit pipeline:
 *   Input Unit -> Memory Unit -> CPU -> Output Unit
 * 
 * Routes:
 *   - POST /start: Initializes a new simulation with optional JSON body payload
 *   - POST /advance: Steps an active simulation forward by one stage (JSON body { simulationId } or :id)
 *   - POST /reset: Resets an active simulation back to Stage 0 (JSON body { simulationId } or :id)
 * 
 * Connects directly to processingController.js.
 * Strictly uses express.Router() without creating a new Express application.
 */

import { Router } from 'express';
import { processingController } from '../controllers/processingController.js';

const router = Router();

// 1. Start a computer processing simulation
router.post('/start', processingController.startSimulation);
router.post('/', processingController.startSimulation);

// 2. Advance a simulation stage (supports JSON body { simulationId } or route parameter)
router.post('/advance', processingController.advanceStage);
router.post('/advance/:id', processingController.advanceStage);
router.post('/:id/advance', processingController.advanceStage);

// 3. Reset a simulation back to Stage 0 (supports JSON body { simulationId } or route parameter)
router.post('/reset', processingController.resetSimulation);
router.post('/reset/:id', processingController.resetSimulation);
router.post('/:id/reset', processingController.resetSimulation);

// 4. Session state retrieval and educational overview
router.get('/overview', processingController.getEducationalOverview);
router.get('/:id', processingController.getSimulation);

export default router;
