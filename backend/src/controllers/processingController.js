/**
 * Computer Organization & Architecture (COA Module)
 * Processing Simulation Controller
 * 
 * Express controller managing conceptual von Neumann functional-unit pipeline simulations:
 *   Input Unit -> Memory Unit -> CPU -> Output Unit
 * 
 * Validates request data and delegates execution to processingService.js.
 * Handles missing or invalid simulation identifiers with precise HTTP status codes.
 * Strictly avoids inventing successful results upon operation failure.
 */

import { processingService } from '../services/processingService.js';

/**
 * Helper: Extracts simulation identifier from request params, body, or query
 * @param {import('express').Request} req - Express request
 * @returns {string|null}
 */
function extractSimulationId(req) {
  const paramId = req.params ? (req.params.id || req.params.simulationId) : null;
  const bodyId = req.body ? (req.body.simulationId || req.body.id) : null;
  const queryId = req.query ? (req.query.simulationId || req.query.id) : null;

  const raw = paramId || bodyId || queryId;
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : null;
}

/**
 * Controller: Starts a new computer functional-unit processing simulation
 * Route: POST /api/processing/start (or POST /api/architecture/simulation/start)
 * 
 * Validates optional initial request parameters:
 *   - priority (integer between 1 and 5)
 *   - creditUnits (positive integer between 1 and 40)
 *   - title, studentName, studentId, department (strings)
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function startSimulation(req, res, next) {
  try {
    const payload = req.body || {};

    // Validate priority if provided
    if (payload.priority !== undefined && payload.priority !== null) {
      const priorityNum = Number(payload.priority);
      if (!Number.isInteger(priorityNum) || priorityNum < 1 || priorityNum > 5) {
        const err = new Error('Priority level must be an integer between 1 and 5.');
        err.status = 400;
        return next(err);
      }
    }

    // Validate creditUnits if provided
    if (payload.creditUnits !== undefined && payload.creditUnits !== null) {
      const creditsNum = Number(payload.creditUnits);
      if (!Number.isInteger(creditsNum) || creditsNum < 1 || creditsNum > 40) {
        const err = new Error('Credit units must be a positive integer between 1 and 40.');
        err.status = 400;
        return next(err);
      }
    }

    // Validate string fields if provided
    for (const field of ['title', 'studentName', 'studentId', 'department', 'requestType']) {
      if (payload[field] !== undefined && payload[field] !== null && typeof payload[field] !== 'string') {
        const err = new Error(`Field '${field}' must be a string.`);
        err.status = 400;
        return next(err);
      }
    }

    // Initialize simulation via processing service
    const simulation = processingService.startSimulation(payload);

    return res.status(201).json({
      success: true,
      simulationId: simulation.simulationId,
      currentStage: simulation.currentStage,
      explanation: simulation.currentStage.explanation,
      activeUnit: simulation.activeUnit,
      currentStageIndex: simulation.currentStageIndex,
      totalStages: simulation.totalStages,
      isComplete: simulation.isComplete,
      canAdvance: simulation.canAdvance,
      data: simulation
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller: Advances an active simulation by exactly one stage
 * Route: POST /api/processing/advance (or POST /api/processing/:id/advance)
 * 
 * Validates simulation identifier and enforces failure if missing or not found.
 * Does NOT invent mock successful states when operations fail.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function advanceStage(req, res, next) {
  try {
    const simulationId = extractSimulationId(req);

    if (!simulationId) {
      const err = new Error('Simulation identifier (simulationId) is required to advance stage.');
      err.status = 400;
      return next(err);
    }

    // Check existence in service
    const existing = processingService.getSimulationById(simulationId);
    if (!existing) {
      const err = new Error(`Simulation with identifier '${simulationId}' not found. Cannot advance nonexistent session.`);
      err.status = 404;
      return next(err);
    }

    // Advance stage via service
    const updated = processingService.advanceStage(simulationId);

    return res.status(200).json({
      success: true,
      simulationId: updated.simulationId,
      currentStage: updated.currentStage,
      explanation: updated.currentStage.explanation,
      activeUnit: updated.activeUnit,
      currentStageIndex: updated.currentStageIndex,
      totalStages: updated.totalStages,
      isComplete: updated.isComplete,
      canAdvance: updated.canAdvance,
      data: updated
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller: Resets a simulation back to Stage 0 (Input Unit)
 * Route: POST /api/processing/reset (or POST /api/processing/:id/reset)
 * 
 * Validates simulation identifier and enforces failure if missing or not found.
 * Does NOT invent mock successful states when operations fail.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function resetSimulation(req, res, next) {
  try {
    const simulationId = extractSimulationId(req);

    if (!simulationId) {
      const err = new Error('Simulation identifier (simulationId) is required to reset simulation.');
      err.status = 400;
      return next(err);
    }

    // Check existence in service
    const existing = processingService.getSimulationById(simulationId);
    if (!existing) {
      const err = new Error(`Simulation with identifier '${simulationId}' not found. Cannot reset nonexistent session.`);
      err.status = 404;
      return next(err);
    }

    // Reset simulation via service
    const reset = processingService.resetSimulation(simulationId);

    return res.status(200).json({
      success: true,
      simulationId: reset.simulationId,
      currentStage: reset.currentStage,
      explanation: reset.currentStage.explanation,
      activeUnit: reset.activeUnit,
      currentStageIndex: reset.currentStageIndex,
      totalStages: reset.totalStages,
      isComplete: reset.isComplete,
      canAdvance: reset.canAdvance,
      data: reset
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller: Retrieves current stage and state of an existing simulation
 * Route: GET /api/processing/:id
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function getSimulation(req, res, next) {
  try {
    const simulationId = extractSimulationId(req);

    if (!simulationId) {
      const err = new Error('Simulation identifier is required.');
      err.status = 400;
      return next(err);
    }

    const simulation = processingService.getSimulationById(simulationId);
    if (!simulation) {
      const err = new Error(`Simulation with identifier '${simulationId}' not found.`);
      err.status = 404;
      return next(err);
    }

    return res.status(200).json({
      success: true,
      simulationId: simulation.simulationId,
      currentStage: simulation.currentStage,
      explanation: simulation.currentStage.explanation,
      activeUnit: simulation.activeUnit,
      currentStageIndex: simulation.currentStageIndex,
      totalStages: simulation.totalStages,
      isComplete: simulation.isComplete,
      canAdvance: simulation.canAdvance,
      data: simulation
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller: Retrieves educational overview of functional units and tri-bus concepts
 * Route: GET /api/processing/overview
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function getEducationalOverview(req, res, next) {
  try {
    const overview = processingService.getEducationalOverview();
    return res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Default grouped controller export
 */
export const processingController = {
  startSimulation,
  start: startSimulation,
  advanceStage,
  advance: advanceStage,
  resetSimulation,
  reset: resetSimulation,
  getSimulation,
  getEducationalOverview
};

export default processingController;
