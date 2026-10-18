/**
 * Depth-First Search (DFS) Algorithm for Adjacency-List Graphs
 * Discipline: Design & Analysis of Algorithms (DAA)
 * 
 * ==============================================================================
 * THEORETICAL ANALYSIS & COMPLEXITY:
 * 
 * Time Complexity: O(V + E)
 * - V is the total number of vertices (locations).
 * - E is the total number of undirected edges (pathways).
 * - Every reachable vertex is visited at most once due to the visited set (O(V)).
 * - Every edge incident to a reachable vertex is inspected at most twice in an
 *   undirected graph during neighbor iteration (O(E)).
 * 
 * Space Complexity: O(V) auxiliary space (excluding input graph storage)
 * - The recursive call stack (or explicit stack) reaches a maximum depth of O(V)
 *   in the worst-case scenario of a linear/skewed graph tree.
 * - The visited Set stores at most O(V) vertex identifiers to prevent cycles.
 * - The traversal order array retains at most O(V) elements.
 * 
 * ALGORITHMIC PROPERTIES & IMPORTANT DISCLAIMER:
 * - Determinism: The traversal order is completely deterministic and follows the
 *   exact order of neighbors defined in the graph's adjacency list.
 * - Cycle Avoidance: A visited Set tracks already discovered vertices, preventing
 *   infinite recursion across cyclic and undirected graph pathways.
 * - NO Shortest-Path Guarantee: Unlike Breadth-First Search (BFS), Depth-First Search
 *   explores deeply along each branch before backtracking. DFS DOES NOT GUARANTEE
 *   the shortest path (minimum hops or distance) between locations. It is designed
 *   for topological exploration, connectivity testing, and reachable subgraph analysis.
 * ==============================================================================
 * 
 * Pure algorithmic implementation free of Express, HTTP, or framework dependencies.
 */

/**
 * Executes Depth-First Search (DFS) starting from a validated origin node.
 * Traversal follows the exact order of neighbors in the adjacency list deterministically.
 * 
 * @param {Object} graph - Adjacency list mapping each node ID to an array of neighbor IDs
 * @param {string} start - Unique identifier of the starting landmark
 * @param {string} [destination=null] - Optional destination node to halt traversal upon discovery
 * @returns {Object} Result object containing:
 *   - start: string identifier of the starting node
 *   - destination: string identifier or null
 *   - destinationFound: boolean or null if no destination provided
 *   - traversalOrder: string[] sequence of visited nodes in depth-first order
 *   - visitedNodes: string[] all unique nodes discovered during traversal
 *   - visitedCount: number of unique nodes visited
 *   - treeEdges: Array<{ from: string, to: string }> discovery edges forming the DFS spanning tree
 *   - message: human-readable explanation of traversal results
 * @throws {Error} If graph is invalid or start node does not exist in graph
 */
export function dfs(graph, start, destination = null) {
  // Input validation: Graph structure
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
    throw new Error('Invalid graph: Expected an adjacency list object.');
  }

  // Input validation: Start node
  if (!start || typeof start !== 'string') {
    throw new Error(`Invalid start location: "${start}". Must be a valid non-empty string.`);
  }

  // Validate start node exists in graph
  if (!Object.prototype.hasOwnProperty.call(graph, start)) {
    throw new Error(`Start location "${start}" does not exist in the graph.`);
  }

  // Validate optional destination node if provided
  if (destination && !Object.prototype.hasOwnProperty.call(graph, destination)) {
    throw new Error(`Destination location "${destination}" does not exist in the graph.`);
  }

  const visited = new Set();
  const traversalOrder = [];
  const treeEdges = [];
  let destinationFound = false;

  /**
   * Deterministic recursive DFS traversal
   * Visits neighbors in the exact order they appear in the graph adjacency array.
   */
  function traverse(current, parent = null) {
    if (destination && destinationFound) return;

    visited.add(current);
    traversalOrder.push(current);

    if (parent) {
      treeEdges.push({ from: parent, to: current });
    }

    if (destination && current === destination) {
      destinationFound = true;
      return;
    }

    const neighbors = graph[current] || [];
    for (const rawNeighbor of neighbors) {
      // Support string neighbor IDs or object nodes with .node property
      const neighbor = typeof rawNeighbor === 'string'
        ? rawNeighbor
        : (rawNeighbor && typeof rawNeighbor === 'object' ? rawNeighbor.node : null);

      if (!neighbor) continue;

      if (!visited.has(neighbor)) {
        traverse(neighbor, current);
        if (destination && destinationFound) return;
      }
    }
  }

  traverse(start, null);

  return {
    start,
    destination: destination || null,
    destinationFound: destination ? destinationFound : null,
    traversalOrder,
    visitedNodes: Array.from(visited),
    visitedCount: visited.size,
    treeEdges,
    message: destination
      ? (destinationFound
          ? `DFS explored ${visited.size} nodes and reached target "${destination}". Note: DFS does not guarantee the shortest path.`
          : `DFS explored all ${visited.size} reachable nodes from "${start}", but target "${destination}" was unreachable.`)
      : `DFS explored all ${visited.size} reachable nodes from "${start}".`
  };
}

export const executeDFS = dfs;
export default dfs;
