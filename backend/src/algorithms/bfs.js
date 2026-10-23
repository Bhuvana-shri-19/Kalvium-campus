/**
 * Breadth-First Search (BFS) Algorithm for Unweighted Graphs
 * Discipline: Design & Analysis of Algorithms (DAA)
 * Implementation: Native C++ Engine (bfs.exe / bfs)
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
 * Authoritative algorithm execution is performed by the compiled native C++ binary
 * (backend/bin/bfs.exe) via safe standard input/output IPC without shell invocation.
 */

import { runBFS } from './cppRunner.js';

/**
 * Executes Breadth-First Search on an unweighted adjacency-list graph to compute
 * the shortest path between start and destination nodes via compiled C++ binary.
 * 
 * @param {Object} graph - Unweighted adjacency list mapping each node ID to an array of neighbor IDs
 * @param {string} start - Unique identifier of the origin landmark
 * @param {string} destination - Unique identifier of the destination landmark
 * @returns {Object} Result object containing:
 *   - engine: string describing the native C++ engine
 *   - found: boolean indicating if a path was found
 *   - path: string[] sequence of node IDs from start to destination (empty if unreachable)
 *   - pathLength: number of edges/hops in the path (0 if start === destination, -1 if unreachable)
 *   - traversalOrder: string[] order in which nodes were dequeued and processed
 *   - visitedNodes: string[] all unique nodes marked as visited during search
 *   - message: human-readable summary of the search result
 * @throws {Error} If graph is invalid or start/destination locations do not exist in graph
 */
export function bfs(graph, start, destination) {
  return runBFS(graph, start, destination);
}

export const findShortestPathBFS = bfs;
export default bfs;
