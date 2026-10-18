/**
 * Campus Navigation Backend Test Suite (DAA Module)
 * 
 * Tests:
 *   1. BFS Shortest Path Guarantee (GATE to HOSTEL)
 *   2. DFS Traversal (Deterministic reachability, cycle avoidance, zero duplicates)
 *   3. Invalid Location IDs (Clear client errors with status 400/404)
 *   4. Unreachable Destination (Valid no-path response with found: false)
 *   5. Express HTTP Endpoints Integration
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { bfs } from '../src/algorithms/bfs.js';
import { dfs } from '../src/algorithms/dfs.js';
import { campusGraph, campusLandmarks, hasEdge } from '../src/data/campusGraph.js';
import { navigationService } from '../src/services/navigationService.js';
import { app } from '../src/app.js';

describe('Campus Navigation Backend (DAA Module)', () => {

  // ============================================================================
  // 1. BFS Shortest Path Verification
  // ============================================================================
  describe('1. Breadth-First Search (BFS) Shortest Path Algorithm', () => {
    it('should find the optimal shortest path from GATE to HOSTEL with exactly 3 hops', () => {
      const result = bfs(campusGraph, 'GATE', 'HOSTEL');

      assert.strictEqual(result.found, true, 'BFS should find a path from GATE to HOSTEL');
      assert.strictEqual(result.pathLength, 3, 'Shortest path from GATE to HOSTEL must be exactly 3 hops');
      assert.strictEqual(result.path.length, 4, 'Path with 3 hops must contain exactly 4 vertices');
      assert.strictEqual(result.path[0], 'GATE', 'Path must begin at GATE');
      assert.strictEqual(result.path[result.path.length - 1], 'HOSTEL', 'Path must terminate at HOSTEL');

      // Verify each step follows a valid edge in the campus graph
      for (let i = 0; i < result.path.length - 1; i++) {
        const u = result.path[i];
        const v = result.path[i + 1];
        assert.strictEqual(hasEdge(u, v), true, `Edge between ${u} and ${v} must exist in campusGraph`);
      }

      // Check level-order traversal ordering
      assert.strictEqual(result.traversalOrder[0], 'GATE');
      assert.ok(result.visitedNodes.includes('HOSTEL'));
    });

    it('should return 0 hops when start and destination are identical', () => {
      const result = bfs(campusGraph, 'LIBRARY', 'LIBRARY');

      assert.strictEqual(result.found, true);
      assert.strictEqual(result.pathLength, 0);
      assert.deepStrictEqual(result.path, ['LIBRARY']);
    });

    it('should enrich route via navigationService with realistic metadata and distance', () => {
      const route = navigationService.findShortestRoute('GATE', 'HOSTEL');

      assert.strictEqual(route.found, true);
      assert.strictEqual(route.hopCount, 3);
      assert.strictEqual(route.path.length, 4);
      assert.strictEqual(route.pathDetails.length, 4);
      assert.strictEqual(route.pathDetails[0].name, 'Main Campus Gate');
      assert.strictEqual(route.pathDetails[3].name, 'Student Residential Hostel');
      assert.ok(route.totalDistanceMeters > 0, 'Total distance in meters must be positive');
    });
  });

  // ============================================================================
  // 2. DFS Traversal (Single-visit guarantee & cycle avoidance)
  // ============================================================================
  describe('2. Depth-First Search (DFS) Traversal Verification', () => {
    it('should visit every reachable node exactly once without duplicates', () => {
      const result = dfs(campusGraph, 'GATE');

      assert.strictEqual(result.start, 'GATE');
      assert.strictEqual(result.visitedCount, 6, 'All 6 campus nodes must be discovered');
      assert.strictEqual(result.traversalOrder.length, 6, 'Traversal order length must equal 6');

      // Check no duplicate nodes in traversal order
      const uniqueVisited = new Set(result.traversalOrder);
      assert.strictEqual(
        uniqueVisited.size,
        result.traversalOrder.length,
        'DFS traversal must never visit any node more than once'
      );

      // Verify all landmark IDs are valid
      const validIds = new Set(campusLandmarks.map(l => l.id));
      for (const node of result.traversalOrder) {
        assert.ok(validIds.has(node), `Node ${node} in traversal order must be a valid landmark`);
      }

      // In an undirected connected graph of V vertices, DFS spanning tree must have V - 1 tree edges
      assert.strictEqual(result.treeEdges.length, 5, 'DFS spanning tree over 6 nodes must have exactly 5 discovery edges');
      for (const edge of result.treeEdges) {
        assert.strictEqual(hasEdge(edge.from, edge.to), true, `Tree edge (${edge.from} -> ${edge.to}) must exist in graph`);
      }
    });

    it('should halt exploration once target is reached without duplicate visits', () => {
      const result = dfs(campusGraph, 'GATE', 'CAFETERIA');

      assert.strictEqual(result.destinationFound, true);
      assert.ok(result.traversalOrder.includes('CAFETERIA'));
      assert.strictEqual(result.traversalOrder[result.traversalOrder.length - 1], 'CAFETERIA');

      // Ensure no duplicates up to the target
      const uniqueVisited = new Set(result.traversalOrder);
      assert.strictEqual(uniqueVisited.size, result.traversalOrder.length);
    });

    it('should provide complete traversal through navigationService', () => {
      const result = navigationService.calculateDFSTraversal('BLOCK_A');

      assert.strictEqual(result.visitedCount, 6);
      assert.strictEqual(result.traversalDetails.length, 6);
      const uniqueNames = new Set(result.traversalDetails.map(d => d.id));
      assert.strictEqual(uniqueNames.size, 6, 'No node repeated in traversalDetails');
    });
  });

  // ============================================================================
  // 3. Invalid Location IDs (Client Error Handling)
  // ============================================================================
  describe('3. Invalid Location IDs & Error Handling', () => {
    it('should throw an error for non-existent start location in pure BFS', () => {
      assert.throws(
        () => bfs(campusGraph, 'NONEXISTENT_NODE', 'HOSTEL'),
        /Start location "NONEXISTENT_NODE" does not exist in the graph/
      );
    });

    it('should throw an error for non-existent destination location in pure BFS', () => {
      assert.throws(
        () => bfs(campusGraph, 'GATE', 'UNKNOWN_TARGET'),
        /Destination location "UNKNOWN_TARGET" does not exist in the graph/
      );
    });

    it('should throw an error for non-existent start node in pure DFS', () => {
      assert.throws(
        () => dfs(campusGraph, 'INVALID_ORIGIN'),
        /Start location "INVALID_ORIGIN" does not exist in the graph/
      );
    });

    it('should return 404 client error in navigationService for unknown start location', () => {
      try {
        navigationService.findShortestRoute('PHANTOM_LOC', 'HOSTEL');
        assert.fail('Should have thrown an error');
      } catch (err) {
        assert.strictEqual(err.status, 404, 'Must return 404 client error');
        assert.ok(err.message.includes('PHANTOM_LOC'));
      }
    });

    it('should return 404 client error in navigationService for unknown target location', () => {
      try {
        navigationService.findShortestRoute('GATE', 'PHANTOM_LOC');
        assert.fail('Should have thrown an error');
      } catch (err) {
        assert.strictEqual(err.status, 404, 'Must return 404 client error');
        assert.ok(err.message.includes('PHANTOM_LOC'));
      }
    });

    it('should return 400 client error for missing or empty start/target parameters', () => {
      try {
        navigationService.findShortestRoute('', 'HOSTEL');
        assert.fail('Should have thrown an error');
      } catch (err) {
        assert.strictEqual(err.status, 400, 'Must return 400 client error');
      }
    });

    it('should return 404 client error when landmark lookup by ID fails', () => {
      try {
        navigationService.getLandmark('DOES_NOT_EXIST');
        assert.fail('Should have thrown an error');
      } catch (err) {
        assert.strictEqual(err.status, 404, 'Must return 404 client error');
      }
    });
  });

  // ============================================================================
  // 4. Unreachable Destination (Valid No-Path Response)
  // ============================================================================
  describe('4. Unreachable Destination Handling', () => {
    // Construct a disconnected test graph with two disjoint components
    const disconnectedGraph = {
      GATE: ['BLOCK_A'],
      BLOCK_A: ['GATE'],
      REMOTE_ANNEX: ['OBSERVATORY'],
      OBSERVATORY: ['REMOTE_ANNEX']
    };

    it('should return found: false with empty path and pathLength: -1 in BFS for unreachable node', () => {
      const result = bfs(disconnectedGraph, 'GATE', 'REMOTE_ANNEX');

      assert.strictEqual(result.found, false, 'found must be false when destination is unreachable');
      assert.deepStrictEqual(result.path, [], 'path must be an empty array');
      assert.strictEqual(result.pathLength, -1, 'pathLength must be -1 when unreachable');
      assert.ok(result.traversalOrder.includes('GATE'));
      assert.ok(result.traversalOrder.includes('BLOCK_A'));
      assert.strictEqual(result.traversalOrder.includes('REMOTE_ANNEX'), false, 'Unreachable node must not be in traversal');
      assert.ok(result.message.includes('No path exists'), 'Message must clearly explain no path exists');
    });

    it('should return destinationFound: false in DFS when target cannot be reached', () => {
      const result = dfs(disconnectedGraph, 'GATE', 'REMOTE_ANNEX');

      assert.strictEqual(result.destinationFound, false, 'destinationFound must be false for unreachable target');
      assert.strictEqual(result.visitedCount, 2, 'Should explore only the 2 connected nodes in the start component');
      assert.deepStrictEqual(result.visitedNodes, ['GATE', 'BLOCK_A']);
      assert.ok(result.message.includes('unreachable'), 'Message must indicate target was unreachable');
    });

    it('should return a structured no-path response via navigationService', () => {
      const route = navigationService.findShortestRoute('GATE', 'REMOTE_ANNEX', disconnectedGraph);

      assert.strictEqual(route.found, false);
      assert.deepStrictEqual(route.path, []);
      assert.strictEqual(route.hopCount, -1);
      assert.strictEqual(route.pathLength, -1);
      assert.strictEqual(route.totalDistanceMeters, 0);
      assert.ok(route.message.includes('No path exists'));
    });
  });

  // ============================================================================
  // 5. Express HTTP Endpoints Integration
  // ============================================================================
  describe('5. Navigation HTTP Endpoints Integration', () => {
    let server;
    let baseUrl;

    before(async () => {
      await new Promise((resolve) => {
        server = app.listen(0, () => {
          const port = server.address().port;
          baseUrl = `http://localhost:${port}`;
          resolve();
        });
      });
    });

    after(async () => {
      if (server) {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('GET /api/navigation/locations should return 200 and all 6 campus landmarks', async () => {
      const res = await fetch(`${baseUrl}/api/navigation/locations`);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.count, 6);
      assert.strictEqual(json.data.landmarks.length, 6);
      assert.ok(json.data.adjacencyList.GATE);
    });

    it('GET /api/navigation/locations/:id should return 200 for valid landmark', async () => {
      const res = await fetch(`${baseUrl}/api/navigation/locations/GATE`);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.id, 'GATE');
      assert.strictEqual(json.data.name, 'Main Campus Gate');
    });

    it('GET /api/navigation/locations/:id should return 404 for non-existent landmark', async () => {
      const res = await fetch(`${baseUrl}/api/navigation/locations/INVALID_LOC`);
      assert.strictEqual(res.status, 404);

      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('INVALID_LOC'));
    });

    it('GET /api/navigation/bfs should find shortest path from GATE to HOSTEL (3 hops)', async () => {
      const res = await fetch(`${baseUrl}/api/navigation/bfs?start=GATE&destination=HOSTEL`);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.found, true);
      assert.strictEqual(json.data.hopCount, 3);
      assert.deepStrictEqual(json.data.path, ['GATE', 'BLOCK_A', 'CAFETERIA', 'HOSTEL']);
    });

    it('POST /api/navigation/bfs with JSON body should compute shortest path', async () => {
      const res = await fetch(`${baseUrl}/api/navigation/bfs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: 'GATE', destination: 'HOSTEL' })
      });
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.found, true);
      assert.strictEqual(json.data.hopCount, 3);
    });

    it('GET /api/navigation/bfs with identical start and target should return 400', async () => {
      const res = await fetch(`${baseUrl}/api/navigation/bfs?start=GATE&destination=GATE`);
      assert.strictEqual(res.status, 400);

      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('distinct'));
    });

    it('GET /api/navigation/bfs missing destination should return 400', async () => {
      const res = await fetch(`${baseUrl}/api/navigation/bfs?start=GATE`);
      assert.strictEqual(res.status, 400);

      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('targetNode') || json.error.includes('Target destination'));
    });

    it('GET /api/navigation/bfs with invalid start location should return 404', async () => {
      const res = await fetch(`${baseUrl}/api/navigation/bfs?start=INVALID_NODE&destination=HOSTEL`);
      assert.strictEqual(res.status, 404);

      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('INVALID_NODE'));
    });

    it('GET /api/navigation/dfs should return 200 with traversal of unique nodes', async () => {
      const res = await fetch(`${baseUrl}/api/navigation/dfs?start=GATE`);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.visitedCount, 6);
      const uniqueNodes = new Set(json.data.traversalOrder);
      assert.strictEqual(uniqueNodes.size, 6, 'No duplicate nodes in HTTP DFS traversal');
    });

    it('GET /api/navigation/dfs with invalid start should return 404', async () => {
      const res = await fetch(`${baseUrl}/api/navigation/dfs?start=INVALID_NODE`);
      assert.strictEqual(res.status, 404);

      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('INVALID_NODE'));
    });
  });
});
