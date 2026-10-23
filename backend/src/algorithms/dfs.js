/**
 * Depth-First Search (DFS) Algorithm for Adjacency-List Graphs
 * Discipline: Design & Analysis of Algorithms (DAA)
 * Implementation: Native C++ Engine (dfs.exe / dfs)
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
 * Authoritative algorithm execution is performed by the compiled native C++ binary
 * (backend/bin/dfs.exe) via safe standard input/output IPC without shell invocation.
 */

import { runDFS } from './cppRunner.js';

/**
 * Executes Depth-First Search (DFS) starting from a validated origin node via compiled C++ binary.
 * Traversal follows the exact order of neighbors in the adjacency list deterministically.
 * 
 * @param {Object} graph - Adjacency list mapping each node ID to an array of neighbor IDs
 * @param {string} start - Unique identifier of the starting landmark
 * @param {string|null} [destination=null] - Optional destination node to halt traversal upon discovery
 * @returns {Object} Result object containing:
 *   - engine: string describing the native C++ engine
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
  return runDFS(graph, start, destination);
}

export const executeDFS = dfs;
export default dfs;
