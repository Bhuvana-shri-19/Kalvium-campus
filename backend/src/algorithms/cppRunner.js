/**
 * C++ Native Binary Runner for DAA Graph Algorithms
 * Discipline: Design & Analysis of Algorithms (DAA)
 * 
 * Safely executes compiled native C++ binaries (bfs.exe / dfs.exe) via
 * standard input/output (IPC over stdin/stdout) with strict timeouts and
 * no shell command concatenation.
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate binary directory
const isWindows = process.platform === 'win32';
const exeSuffix = isWindows ? '.exe' : '';

function getBinaryPath(binaryName) {
  const candidatePaths = [
    path.resolve(__dirname, '..', '..', 'bin', `${binaryName}${exeSuffix}`),
    path.resolve(process.cwd(), 'backend', 'bin', `${binaryName}${exeSuffix}`),
    path.resolve(process.cwd(), 'bin', `${binaryName}${exeSuffix}`)
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Native C++ binary '${binaryName}${exeSuffix}' not found. Please compile C++ algorithms by running: npm run build:cpp`
  );
}

/**
 * Normalizes graph adjacency list ensuring all neighbor entries are strings.
 * Compatible with both string IDs and object nodes ({ node: '...' }).
 */
function normalizeGraph(graph) {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
    return null;
  }

  const normalized = {};
  for (const [key, neighbors] of Object.entries(graph)) {
    normalized[key] = (Array.isArray(neighbors) ? neighbors : []).map(neighbor => {
      if (typeof neighbor === 'string') return neighbor;
      if (neighbor && typeof neighbor === 'object') return neighbor.node || neighbor.id || '';
      return '';
    }).filter(Boolean);
  }
  return normalized;
}

/**
 * Executes a native C++ graph algorithm binary with JSON over stdin.
 * 
 * @param {string} binaryName - 'bfs' or 'dfs'
 * @param {Object} payload - { start, destination, graph }
 * @returns {Object} Parsed JSON result from C++ stdout
 */
function executeCppBinary(binaryName, payload) {
  const exePath = getBinaryPath(binaryName);

  const jsonInput = JSON.stringify(payload);

  const result = spawnSync(exePath, [], {
    input: jsonInput,
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024
  });

  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') {
      throw new Error(`C++ ${binaryName} execution timed out after 5000ms.`);
    }
    throw new Error(`Failed to execute C++ binary '${binaryName}': ${result.error.message}`);
  }

  if (result.status !== 0) {
    const errorDetails = (result.stderr || result.stdout || '').trim();
    throw new Error(`C++ binary '${binaryName}' exited with status code ${result.status}: ${errorDetails}`);
  }

  const stdout = (result.stdout || '').trim();
  if (!stdout) {
    throw new Error(`C++ binary '${binaryName}' returned empty output.`);
  }

  try {
    const data = JSON.parse(stdout);
    if (data.success === false) {
      throw new Error(data.error || `Error executing C++ ${binaryName} algorithm.`);
    }
    return data;
  } catch (parseError) {
    if (parseError.message && !parseError.message.includes('JSON')) {
      throw parseError;
    }
    throw new Error(`Invalid JSON output received from C++ binary '${binaryName}': ${stdout}`);
  }
}

/**
 * Executes Breadth-First Search (BFS) using the compiled C++ executable.
 * 
 * @param {Object} graph - Adjacency list
 * @param {string} start - Origin node
 * @param {string} destination - Target node
 * @returns {Object} BFS shortest path result
 */
export function runBFS(graph, start, destination) {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
    throw new Error('Invalid graph: Expected an adjacency list object.');
  }

  if (!start || typeof start !== 'string') {
    throw new Error(`Invalid start location: "${start}". Must be a valid non-empty string.`);
  }

  if (!destination || typeof destination !== 'string') {
    throw new Error(`Invalid destination location: "${destination}". Must be a valid non-empty string.`);
  }

  // Pre-validate node existence to match exact expected error format
  if (!Object.prototype.hasOwnProperty.call(graph, start)) {
    throw new Error(`Start location "${start}" does not exist in the graph.`);
  }

  if (!Object.prototype.hasOwnProperty.call(graph, destination)) {
    throw new Error(`Destination location "${destination}" does not exist in the graph.`);
  }

  const normalizedGraph = normalizeGraph(graph);

  const rawResult = executeCppBinary('bfs', {
    start,
    destination,
    graph: normalizedGraph
  });

  return {
    engine: 'C++ Native Binary (MinGW-w64 x86_64)',
    found: rawResult.found,
    path: rawResult.path || [],
    pathLength: typeof rawResult.pathLength === 'number' ? rawResult.pathLength : -1,
    traversalOrder: rawResult.traversalOrder || [],
    visitedNodes: rawResult.visitedNodes || [],
    message: rawResult.message
  };
}

/**
 * Executes Depth-First Search (DFS) using the compiled C++ executable.
 * 
 * @param {Object} graph - Adjacency list
 * @param {string} start - Origin node
 * @param {string|null} [destination=null] - Optional target node
 * @returns {Object} DFS traversal result
 */
export function runDFS(graph, start, destination = null) {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
    throw new Error('Invalid graph: Expected an adjacency list object.');
  }

  if (!start || typeof start !== 'string') {
    throw new Error(`Invalid start location: "${start}". Must be a valid non-empty string.`);
  }

  if (!Object.prototype.hasOwnProperty.call(graph, start)) {
    throw new Error(`Start location "${start}" does not exist in the graph.`);
  }

  if (destination && !Object.prototype.hasOwnProperty.call(graph, destination)) {
    throw new Error(`Destination location "${destination}" does not exist in the graph.`);
  }

  const normalizedGraph = normalizeGraph(graph);

  const rawResult = executeCppBinary('dfs', {
    start,
    destination: destination || null,
    graph: normalizedGraph
  });

  return {
    engine: 'C++ Native Binary (MinGW-w64 x86_64)',
    start: rawResult.start,
    destination: rawResult.destination,
    destinationFound: rawResult.destinationFound,
    traversalOrder: rawResult.traversalOrder || [],
    visitedNodes: rawResult.visitedNodes || [],
    visitedCount: typeof rawResult.visitedCount === 'number' ? rawResult.visitedCount : (rawResult.visitedNodes?.length || 0),
    treeEdges: rawResult.treeEdges || [],
    message: rawResult.message
  };
}

export default {
  runBFS,
  runDFS
};
