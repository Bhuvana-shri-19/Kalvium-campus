/**
 * Campus Navigation Routes (DAA Module)
 * 
 * Express Router defining endpoints for campus landmark navigation:
 *   - GET /locations: Lists all campus landmarks and graph adjacency list
 *   - GET /bfs?start=...&destination=...: Breadth-First Search shortest route
 *   - GET /dfs?start=...: Depth-First Search reachability traversal
 * 
 * Connected directly to navigationController.js.
 * Strictly uses express.Router() without creating a new Express application.
 */

import { Router } from 'express';
import { navigationController } from '../controllers/navigationController.js';

const router = Router();

// 1. Listing campus locations
router.get('/locations', navigationController.listLocations);
router.get('/landmarks', navigationController.getLandmarks); // Compatibility alias

// 2. Single landmark metadata lookup by ID
router.get('/locations/:id', navigationController.getLandmarkById);
router.get('/landmarks/:id', navigationController.getLandmarkById);

// 3. Breadth-First Search (BFS) shortest path
// Supports GET /bfs?start=...&destination=... as well as POST with body
router.get('/bfs', navigationController.getShortestPathBFS);
router.post('/bfs', navigationController.getShortestPathBFS);

// 4. Depth-First Search (DFS) traversal
// Supports GET /dfs?start=... as well as POST with body
router.get('/dfs', navigationController.getDFSTraversal);
router.post('/dfs', navigationController.getDFSTraversal);

export default router;
