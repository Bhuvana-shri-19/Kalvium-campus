/**
 * Kalvium Campus Graph Representation (DAA Module)
 * 
 * Undirected, unweighted adjacency-list graph for the mock Kalvium campus.
 * Defines landmark connections for Breadth-First Search (BFS) shortest path
 * and Depth-First Search (DFS) reachability traversals.
 * 
 * Consistent with campusConfig.js location identifiers:
 * GATE, LIBRARY, BLOCK_A, CAFETERIA, LAB, HOSTEL.
 */

import { CAMPUS_LOCATIONS } from '../config/campusConfig.js';

/**
 * Campus landmark nodes metadata list
 */
export const campusLandmarks = [
  {
    id: "GATE",
    name: "Main Campus Gate",
    code: "GATE",
    category: "Entry / Security",
    description: "Primary security checkpoint, transit turnaround, and campus entrance.",
    coordinates: { x: 70, y: 240 }
  },
  {
    id: "BLOCK_A",
    name: "Academic Block A",
    code: "BLK_A",
    category: "Instructional",
    description: "Core lecture halls, faculty offices, and academic coordination center.",
    coordinates: { x: 190, y: 150 }
  },
  {
    id: "LIBRARY",
    name: "Central Knowledge Library",
    code: "LIB",
    category: "Academic Support",
    description: "Multi-floor knowledge center, digital archives, and quiet study commons.",
    coordinates: { x: 330, y: 90 }
  },
  {
    id: "CAFETERIA",
    name: "Student Cafeteria & Lounge",
    code: "CAFE",
    category: "Student Amenities",
    description: "Central dining pavilion, student lounge, and refreshment hub.",
    coordinates: { x: 210, y: 390 }
  },
  {
    id: "LAB",
    name: "Computing & Innovation Lab",
    code: "LAB",
    category: "Research & Computing",
    description: "Advanced software development suites, hardware test benches, and AI lab.",
    coordinates: { x: 420, y: 220 }
  },
  {
    id: "HOSTEL",
    name: "Student Residential Hostel",
    code: "HOSTEL",
    category: "Residential",
    description: "Undergraduate student residence towers, recreation hall, and study rooms.",
    coordinates: { x: 540, y: 300 }
  }
];

/**
 * Undirected, unweighted adjacency-list graph.
 * Every connection is strictly bidirectional: u in adj[v] <=> v in adj[u].
 * Every node has a valid, non-empty neighbor list.
 */
export const campusGraph = {
  GATE: ["BLOCK_A", "LIBRARY"],
  BLOCK_A: ["GATE", "LIBRARY", "CAFETERIA", "LAB"],
  LIBRARY: ["GATE", "BLOCK_A", "LAB"],
  CAFETERIA: ["BLOCK_A", "LAB", "HOSTEL"],
  LAB: ["BLOCK_A", "LIBRARY", "CAFETERIA", "HOSTEL"],
  HOSTEL: ["CAFETERIA", "LAB"]
};

/**
 * Alias for campusGraph to maintain full compatibility across services
 */
export const campusAdjacencyList = campusGraph;

/**
 * Unique list of undirected edges { from, to }
 */
export const campusEdges = [
  { from: "GATE", to: "BLOCK_A" },
  { from: "GATE", to: "LIBRARY" },
  { from: "BLOCK_A", to: "LIBRARY" },
  { from: "BLOCK_A", to: "CAFETERIA" },
  { from: "BLOCK_A", to: "LAB" },
  { from: "LIBRARY", to: "LAB" },
  { from: "CAFETERIA", to: "LAB" },
  { from: "CAFETERIA", to: "HOSTEL" },
  { from: "LAB", to: "HOSTEL" }
];

/**
 * Helper to retrieve landmark metadata by ID
 * @param {string} id - The landmark identifier (e.g. 'GATE')
 * @returns {Object|null} Landmark object or null
 */
export function getLandmarkById(id) {
  if (!id) return null;
  const normalized = id.trim().toUpperCase();
  return campusLandmarks.find(item => item.id === normalized) || null;
}

/**
 * Helper to retrieve neighbors of a landmark in the graph
 * @param {string} id - The landmark identifier
 * @returns {Array<string>} Array of neighbor IDs
 */
export function getNeighbors(id) {
  if (!id) return [];
  const normalized = id.trim().toUpperCase();
  return campusGraph[normalized] || [];
}

/**
 * Helper to check if an undirected connection exists between two landmarks
 * @param {string} u - First node ID
 * @param {string} v - Second node ID
 * @returns {boolean} True if edge exists
 */
export function hasEdge(u, v) {
  if (!u || !v) return false;
  const uNorm = u.trim().toUpperCase();
  const vNorm = v.trim().toUpperCase();
  const neighbors = campusGraph[uNorm];
  return Boolean(neighbors && neighbors.includes(vNorm));
}

/**
 * Graph symmetry validation utility
 * Verifies that every connection appears in both directions and every node has neighbors.
 * @returns {boolean} True if graph is strictly undirected and valid
 */
export function validateGraphSymmetry() {
  const nodes = Object.keys(campusGraph);
  for (const node of nodes) {
    const neighbors = campusGraph[node];
    if (!Array.isArray(neighbors) || neighbors.length === 0) {
      return false;
    }
    for (const neighbor of neighbors) {
      if (!campusGraph[neighbor] || !campusGraph[neighbor].includes(node)) {
        return false;
      }
    }
  }
  return true;
}

export default {
  campusLandmarks,
  campusGraph,
  campusAdjacencyList,
  campusEdges,
  getLandmarkById,
  getNeighbors,
  hasEdge,
  validateGraphSymmetry
};
