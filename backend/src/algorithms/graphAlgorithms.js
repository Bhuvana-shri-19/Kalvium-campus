/**
 * Graph Traversal and Shortest Path Algorithms (DAA Module)
 * Implements Breadth-First Search (BFS) and Depth-First Search (DFS)
 * with step-by-step academic traces for educational visualization.
 */

import { campusAdjacencyList, getLandmarkById } from '../data/campusGraph.js';
export { bfs, findShortestPathBFS } from './bfs.js';
export { dfs } from './dfs.js';

/**
 * Executes Breadth-First Search (BFS) to find the shortest path (minimum hops)
 * between a start node and a destination node.
 * 
 * @param {string} startNodeId - Identifier of starting landmark
 * @param {string} targetNodeId - Identifier of target landmark
 * @param {Object} graph - Adjacency list representation
 * @returns {Object} Search result containing path, visited nodes, hop count, and step logs
 */
export function executeBFS(startNodeId, targetNodeId, graph = campusAdjacencyList) {
  if (!graph[startNodeId] || !graph[targetNodeId]) {
    throw new Error(`Invalid start (${startNodeId}) or target (${targetNodeId}) node.`);
  }

  const queue = [startNodeId];
  const visited = new Set([startNodeId]);
  const parentMap = { [startNodeId]: null };
  const explorationSteps = [];
  let found = false;

  explorationSteps.push({
    step: 1,
    action: 'INITIALIZE',
    currentNode: startNodeId,
    currentQueue: [...queue],
    visited: Array.from(visited),
    explanation: `Started BFS at ${startNodeId}. Added to queue and marked as visited.`
  });

  let stepCounter = 1;

  while (queue.length > 0) {
    const current = queue.shift();
    stepCounter++;

    if (current === targetNodeId) {
      found = true;
      explorationSteps.push({
        step: stepCounter,
        action: 'TARGET_REACHED',
        currentNode: current,
        currentQueue: [...queue],
        visited: Array.from(visited),
        explanation: `Target landmark ${targetNodeId} reached!`
      });
      break;
    }

    const neighbors = graph[current] || [];
    const addedNeighbors = [];

    for (const edge of neighbors) {
      const neighbor = typeof edge === 'string' ? edge : (edge && edge.node ? edge.node : edge);
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap[neighbor] = current;
        queue.push(neighbor);
        addedNeighbors.push(neighbor);
      }
    }

    explorationSteps.push({
      step: stepCounter,
      action: 'EXPAND_NEIGHBORS',
      currentNode: current,
      discoveredNeighbors: addedNeighbors,
      currentQueue: [...queue],
      visited: Array.from(visited),
      explanation: `Dequeued ${current}. Visited unvisited neighbors: [${addedNeighbors.join(', ')}].`
    });
  }

  // Reconstruct path
  const path = [];
  let totalDistance = 0;

  if (found) {
    let curr = targetNodeId;
    while (curr !== null) {
      path.unshift(curr);
      curr = parentMap[curr];
    }

    // Calculate total walking distance or hop count along the path
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      const edge = (graph[from] || []).find(e => (typeof e === 'object' && e !== null ? e.node : e) === to);
      if (edge && typeof edge === 'object' && edge.weight) {
        totalDistance += edge.weight;
      } else {
        totalDistance += 1;
      }
    }
  }

  const detailedPath = path.map(id => getLandmarkById(id) || { id, name: id });

  return {
    algorithm: 'Breadth-First Search (BFS)',
    academicFocus: 'DAA: Level-order traversal & unweighted shortest path guarantees',
    startNode: startNodeId,
    targetNode: targetNodeId,
    found,
    path,
    pathDetails: detailedPath,
    hopCount: path.length > 0 ? path.length - 1 : 0,
    totalDistanceMeters: totalDistance,
    visitedOrder: Array.from(visited),
    steps: explorationSteps
  };
}

/**
 * Executes Depth-First Search (DFS) traversal starting from a node.
 * 
 * @param {string} startNodeId - Identifier of starting landmark
 * @param {string|null} targetNodeId - Optional target landmark to stop upon reaching
 * @param {Object} graph - Adjacency list representation
 * @returns {Object} DFS traversal log, visited order, and traversal tree edges
 */
export function executeDFS(startNodeId, targetNodeId = null, graph = campusAdjacencyList) {
  if (!graph[startNodeId]) {
    throw new Error(`Invalid start node: ${startNodeId}`);
  }

  const visited = new Set();
  const traversalOrder = [];
  const treeEdges = [];
  const steps = [];
  let stepCounter = 0;
  let targetFound = false;

  function dfsRecursive(currentNode, parent = null) {
    if (targetNodeId && targetFound) return;

    visited.add(currentNode);
    traversalOrder.push(currentNode);
    stepCounter++;

    if (parent) {
      treeEdges.push({ from: parent, to: currentNode });
    }

    steps.push({
      step: stepCounter,
      action: 'VISIT_NODE',
      currentNode,
      parent,
      visited: Array.from(visited),
      explanation: `Exploring node ${currentNode} in depth${parent ? ` from ${parent}` : ''}.`
    });

    if (currentNode === targetNodeId) {
      targetFound = true;
      return;
    }

    const neighbors = graph[currentNode] || [];
    for (const edge of neighbors) {
      const neighbor = typeof edge === 'string' ? edge : (edge && edge.node ? edge.node : edge);
      if (!visited.has(neighbor)) {
        dfsRecursive(neighbor, currentNode);
        if (targetNodeId && targetFound) return;
      }
    }

    steps.push({
      step: ++stepCounter,
      action: 'BACKTRACK',
      currentNode,
      parent,
      visited: Array.from(visited),
      explanation: `All branches from ${currentNode} explored. Backtracking.`
    });
  }

  dfsRecursive(startNodeId, null);

  return {
    algorithm: 'Depth-First Search (DFS)',
    academicFocus: 'DAA: Recursive exploration, backtracking, and spanning tree formation',
    startNode: startNodeId,
    targetNode: targetNodeId,
    targetFound: targetNodeId ? targetFound : null,
    traversalOrder,
    treeEdges,
    visitedCount: visited.size,
    steps
  };
}
