/**
 * Campus Navigation Controller (DAA Module)
 * 
 * Express controller orchestrating HTTP requests for campus landmark navigation.
 * Validates request parameters and delegates graph traversal operations directly
 * to navigationService.js.
 * 
 * Strictly contains NO algorithm implementation details.
 */

import { navigationService } from '../services/navigationService.js';

/**
 * Controller function: Lists all campus locations and graph adjacency matrix
 * Route: GET /api/navigation/locations (or /api/navigation/landmarks)
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function listLocations(req, res, next) {
  try {
    const locationsData = navigationService.listLocations();
    return res.status(200).json({
      success: true,
      count: locationsData.landmarks ? locationsData.landmarks.length : 0,
      data: locationsData
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller function: Retrieves a single campus landmark by identifier
 * Route: GET /api/navigation/landmarks/:id
 * 
 * @param {import('express').Request} req - Express request with params.id
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function getLandmarkById(req, res, next) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || !id.trim()) {
      const err = new Error('A valid, non-empty location identifier is required.');
      err.status = 400;
      return next(err);
    }

    const landmark = navigationService.getLandmark(id.trim());
    return res.status(200).json({
      success: true,
      data: landmark
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller function: Requests a Breadth-First Search (BFS) shortest path
 * Route: POST /api/navigation/bfs (also supports GET with query parameters)
 * 
 * Accepts:
 *   - Body or Query: { startNode, targetNode } (aliases: start, destination)
 * 
 * Validates:
 *   - startNode and targetNode presence, type, and distinctness
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function getShortestPathBFS(req, res, next) {
  try {
    // Read parameters from GET query params or POST body
    const payload = { ...(req.query || {}), ...(req.body || {}) };
    const rawStart = payload.start || payload.startNode || payload.startLocation || payload.origin;
    const rawTarget = payload.destination || payload.targetNode || payload.target || payload.destinationLocation;

    // Validate start parameter
    if (!rawStart || typeof rawStart !== 'string' || !rawStart.trim()) {
      const err = new Error('Start location identifier (startNode) is required and must be a non-empty string.');
      err.status = 400;
      return next(err);
    }

    // Validate target parameter
    if (!rawTarget || typeof rawTarget !== 'string' || !rawTarget.trim()) {
      const err = new Error('Target destination identifier (targetNode) is required and must be a non-empty string.');
      err.status = 400;
      return next(err);
    }

    const startNode = rawStart.trim().toUpperCase();
    const targetNode = rawTarget.trim().toUpperCase();

    // Validate distinctness
    if (startNode === targetNode) {
      const err = new Error('Start location and target destination must be distinct landmarks.');
      err.status = 400;
      return next(err);
    }

    // Delegate calculation entirely to navigation service
    const routeResult = navigationService.findShortestRoute(startNode, targetNode);

    return res.status(200).json({
      success: true,
      data: routeResult
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller function: Requests a Depth-First Search (DFS) traversal
 * Route: POST /api/navigation/dfs (also supports GET with query parameters)
 * 
 * Accepts:
 *   - Body or Query: { startNode, targetNode? } (aliases: start, destination?)
 * 
 * Validates:
 *   - startNode presence and string type
 *   - targetNode string type if provided
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function getDFSTraversal(req, res, next) {
  try {
    // Read parameters from GET query params or POST body
    const payload = { ...(req.query || {}), ...(req.body || {}) };
    const rawStart = payload.start || payload.startNode || payload.startLocation || payload.origin;
    const rawTarget = payload.destination || payload.targetNode || payload.target || payload.destinationLocation;

    // Validate start parameter
    if (!rawStart || typeof rawStart !== 'string' || !rawStart.trim()) {
      const err = new Error('Start location identifier (startNode) is required for DFS traversal and must be a non-empty string.');
      err.status = 400;
      return next(err);
    }

    const startNode = rawStart.trim().toUpperCase();
    const targetNode = rawTarget && typeof rawTarget === 'string' && rawTarget.trim()
      ? rawTarget.trim().toUpperCase()
      : null;

    // Delegate calculation entirely to navigation service
    const traversalResult = navigationService.calculateDFSTraversal(startNode, targetNode);

    return res.status(200).json({
      success: true,
      data: traversalResult
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Navigation controller grouping with standard function aliases
 */
export const navigationController = {
  listLocations,
  getLandmarks: listLocations,
  getLandmarkById,
  getShortestPathBFS,
  findShortestRoute: getShortestPathBFS,
  runBFS: getShortestPathBFS,
  getDFSTraversal,
  calculateDFSTraversal: getDFSTraversal,
  runDFS: getDFSTraversal
};

export default navigationController;
