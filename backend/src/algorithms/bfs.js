/**
 * Breadth-First Search (BFS) Algorithm for Unweighted Graphs
 * Discipline: Design & Analysis of Algorithms (DAA)
 * 
 * ==============================================================================
 * THEORETICAL ANALYSIS & COMPLEXITY:
 * 
 * Time Complexity: O(V + E)
 * - V is the total number of vertices (locations).
 * - E is the total number of undirected edges (pathways).
 * - In an unweighted graph, BFS guarantees finding the shortest path (minimum hops)
 *   because nodes are explored level-by-level in non-decreasing order of distance.
 *   Each vertex enters the FIFO queue at most once (O(V)), and each adjacent edge
 *   is inspected at most twice in an undirected graph (O(E)).
 * 
 * Space Complexity: O(V) auxiliary space (excluding graph storage)
 * - The FIFO queue stores at most O(V) vertices simultaneously.
 * - The visited Set stores at most O(V) visited vertex identifiers.
 * - The predecessor (parent) map stores at most O(V) entries for path reconstruction.
 * ==============================================================================
 * 
 * Pure algorithmic implementation free of Express, HTTP, or framework dependencies.
 */

/**
 * Executes Breadth-First Search on an unweighted adjacency-list graph to compute
 * the shortest path between start and destination nodes.
 * 
 * @param {Object} graph - Unweighted adjacency list mapping each node ID to an array of neighbor IDs
 * @param {string} start - Unique identifier of the origin landmark
 * @param {string} destination - Unique identifier of the destination landmark
 * @returns {Object} Result object containing:
 *   - found: boolean indicating if a path was found
 *   - path: string[] sequence of node IDs from start to destination (empty if unreachable)
 *   - pathLength: number of edges/hops in the path (0 if start === destination, -1 if unreachable)
 *   - traversalOrder: string[] order in which nodes were dequeued and processed
 *   - visitedNodes: string[] all unique nodes marked as visited during search
 *   - message: human-readable summary of the search result
 * @throws {Error} If graph is invalid or start/destination locations do not exist in graph
 */
export function bfs(graph, start, destination) {
  // Input validation: Graph structure
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
    throw new Error('Invalid graph: Expected an adjacency list object.');
  }

  // Input validation: Start node
  if (!start || typeof start !== 'string') {
    throw new Error(`Invalid start location: "${start}". Must be a valid non-empty string.`);
  }

  // Input validation: Destination node
  if (!destination || typeof destination !== 'string') {
    throw new Error(`Invalid destination location: "${destination}". Must be a valid non-empty string.`);
  }

  // Validate that start and destination exist in graph
  if (!Object.prototype.hasOwnProperty.call(graph, start)) {
    throw new Error(`Start location "${start}" does not exist in the graph.`);
  }

  if (!Object.prototype.hasOwnProperty.call(graph, destination)) {
    throw new Error(`Destination location "${destination}" does not exist in the graph.`);
  }

  // Base Case: Start is destination
  if (start === destination) {
    return {
      found: true,
      path: [start],
      pathLength: 0,
      traversalOrder: [start],
      visitedNodes: [start],
      message: `Start and destination are identical (${start}). Path length is 0 hops.`
    };
  }

  // Standard BFS queue, visited set, and predecessor tracking
  const queue = [start];
  const visited = new Set([start]);
  const parentMap = new Map();
  parentMap.set(start, null);

  const traversalOrder = [];
  let found = false;

  while (queue.length > 0) {
    const current = queue.shift();
    traversalOrder.push(current);

    if (current === destination) {
      found = true;
      break;
    }

    const neighbors = graph[current] || [];
    for (const rawNeighbor of neighbors) {
      // Support string neighbor IDs or object nodes with .node property
      const neighbor = typeof rawNeighbor === 'string'
        ? rawNeighbor
        : (rawNeighbor && typeof rawNeighbor === 'object' ? rawNeighbor.node : null);

      if (!neighbor) continue;

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  // Reconstruct path if destination was reached
  if (found) {
    const path = [];
    let curr = destination;
    while (curr !== null) {
      path.unshift(curr);
      curr = parentMap.get(curr);
    }

    return {
      found: true,
      path,
      pathLength: path.length - 1,
      traversalOrder,
      visitedNodes: Array.from(visited),
      message: `Shortest path discovered with ${path.length - 1} hops (${path.join(' -> ')}).`
    };
  }

  // Clear no-path result if destination was unreachable
  return {
    found: false,
    path: [],
    pathLength: -1,
    traversalOrder,
    visitedNodes: Array.from(visited),
    message: `No path exists from "${start}" to "${destination}". Landmark is unreachable in the current graph.`
  };
}

export const findShortestPathBFS = bfs;
export default bfs;
