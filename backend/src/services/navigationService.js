/**
 * Campus Navigation Service (DAA Module)
 * 
 * Coordinates campus graph landmarks with Breadth-First Search (BFS)
 * and Depth-First Search (DFS) algorithms.
 * Validates requested locations and structures algorithmic outputs for JSON delivery.
 * 
 * Strictly separated from HTTP request/response handling.
 */

import { campusLandmarks, campusGraph, getLandmarkById } from '../data/campusGraph.js';
import { bfs } from '../algorithms/bfs.js';
import { dfs } from '../algorithms/dfs.js';

export const navigationService = {
  /**
   * Retrieves all campus landmark locations and the adjacency list
   * @returns {Object} { landmarks: Array, adjacencyList: Object, totalLocations: number }
   */
  listLocations() {
    return {
      landmarks: campusLandmarks,
      adjacencyList: campusGraph,
      totalLocations: campusLandmarks.length
    };
  },

  /**
   * Backward-compatible alias for listLocations
   */
  getLandmarks() {
    return this.listLocations();
  },

  /**
   * Retrieves a single campus landmark by its identifier
   * @param {string} id - Landmark identifier
   * @returns {Object} Landmark metadata
   * @throws {Error} If location ID is missing or not found
   */
  getLandmark(id) {
    if (!id || typeof id !== 'string') {
      const err = new Error('Location ID must be a non-empty string.');
      err.status = 400;
      throw err;
    }

    const landmark = getLandmarkById(id);
    if (!landmark) {
      const err = new Error(`Landmark with ID '${id}' not found in campus database.`);
      err.status = 404;
      throw err;
    }

    return landmark;
  },

  /**
   * Finds the shortest route between start and destination using Breadth-First Search (BFS)
   * 
   * @param {string} startNode - Origin landmark identifier
   * @param {string} targetNode - Destination landmark identifier
   * @returns {Object} Structured route result with path, hops, visited order, and landmark details
   * @throws {Error} If start or target nodes are missing or invalid
   */
  findShortestRoute(startNode, targetNode, graph = campusGraph) {
    if (!startNode || typeof startNode !== 'string') {
      const err = new Error('Start location identifier is required.');
      err.status = 400;
      throw err;
    }

    if (!targetNode || typeof targetNode !== 'string') {
      const err = new Error('Target destination identifier is required.');
      err.status = 400;
      throw err;
    }

    const startNorm = startNode.trim().toUpperCase();
    const targetNorm = targetNode.trim().toUpperCase();

    if (!graph[startNorm]) {
      const err = new Error(`Start location '${startNode}' does not exist in the campus graph.`);
      err.status = 404;
      throw err;
    }

    if (!graph[targetNorm]) {
      const err = new Error(`Target destination '${targetNode}' does not exist in the campus graph.`);
      err.status = 404;
      throw err;
    }

    // Execute pure BFS algorithm
    const bfsResult = bfs(graph, startNorm, targetNorm);

    // Enrich path with detailed landmark metadata
    const pathDetails = bfsResult.path.map(id => getLandmarkById(id) || { id, name: id });

    // Calculate realistic walking distance along path nodes (using coordinates or 100m baseline)
    let totalDistanceMeters = 0;
    for (let i = 0; i < pathDetails.length - 1; i++) {
      const a = pathDetails[i]?.coordinates;
      const b = pathDetails[i + 1]?.coordinates;
      if (a && b) {
        totalDistanceMeters += Math.round(Math.hypot(b.x - a.x, b.y - a.y));
      } else {
        totalDistanceMeters += 120;
      }
    }

    return {
      algorithm: 'Breadth-First Search (BFS)',
      engine: bfsResult.engine || 'Native C++ Binary (MinGW-w64 x86_64)',
      academicFocus: 'DAA: Level-order traversal & unweighted shortest path guarantees',
      startNode: startNorm,
      targetNode: targetNorm,
      found: bfsResult.found,
      path: bfsResult.path,
      pathDetails,
      hopCount: bfsResult.pathLength,
      pathLength: bfsResult.pathLength,
      totalDistanceMeters,
      traversalOrder: bfsResult.traversalOrder,
      visitedNodes: bfsResult.visitedNodes,
      visitedOrder: bfsResult.traversalOrder,
      visitedCount: bfsResult.visitedNodes.length,
      message: bfsResult.message
    };
  },

  /**
   * Backward-compatible alias for findShortestRoute
   */
  findShortestPathBFS(startNode, targetNode) {
    return this.findShortestRoute(startNode, targetNode);
  },

  /**
   * Computes Depth-First Search traversal starting from an origin landmark
   * 
   * @param {string} startNode - Origin landmark identifier
   * @param {string|null} [targetNode=null] - Optional destination landmark to halt traversal
   * @returns {Object} Structured traversal result with order, tree edges, and visited landmarks
   * @throws {Error} If start or target nodes are missing or invalid
   */
  calculateDFSTraversal(startNode, targetNode = null, graph = campusGraph) {
    if (!startNode || typeof startNode !== 'string') {
      const err = new Error('Start location identifier is required for DFS traversal.');
      err.status = 400;
      throw err;
    }

    const startNorm = startNode.trim().toUpperCase();
    const targetNorm = targetNode ? targetNode.trim().toUpperCase() : null;

    if (!graph[startNorm]) {
      const err = new Error(`Start location '${startNode}' does not exist in the campus graph.`);
      err.status = 404;
      throw err;
    }

    if (targetNorm && !graph[targetNorm]) {
      const err = new Error(`Target destination '${targetNode}' does not exist in the campus graph.`);
      err.status = 404;
      throw err;
    }

    // Execute pure DFS algorithm
    const dfsResult = dfs(graph, startNorm, targetNorm);

    const traversalDetails = dfsResult.traversalOrder.map(id => getLandmarkById(id) || { id, name: id });

    return {
      algorithm: 'Depth-First Search (DFS)',
      engine: dfsResult.engine || 'Native C++ Binary (MinGW-w64 x86_64)',
      academicFocus: 'DAA: Deep recursive exploration, backtracking, and spanning tree discovery',
      startNode: startNorm,
      targetNode: targetNorm,
      targetFound: dfsResult.destinationFound,
      traversalOrder: dfsResult.traversalOrder,
      traversalDetails,
      visitedNodes: dfsResult.visitedNodes,
      visitedOrder: dfsResult.traversalOrder,
      visitedCount: dfsResult.visitedCount,
      treeEdges: dfsResult.treeEdges,
      message: dfsResult.message
    };
  },

  /**
   * Backward-compatible alias for calculateDFSTraversal
   */
  traverseDFS(startNode, targetNode = null) {
    return this.calculateDFSTraversal(startNode, targetNode);
  }
};

export default navigationService;
