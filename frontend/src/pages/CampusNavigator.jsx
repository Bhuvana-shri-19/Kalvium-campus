import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LocationSelector from '../components/LocationSelector.jsx';
import CampusGraph from '../components/CampusGraph.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ResultMessage from '../components/ResultMessage.jsx';
import { navigationService } from '../services/navigationService.js';
import { formatDistance, safeDisplay } from '../utils/formatters.js';
import '../styles/pages.css';

/**
 * Builds step-by-step animation frames for BFS traversal.
 * Animates FIFO frontier expansion, active nodes, adjacent edges, and final shortest route.
 */
function buildBfsAnimationFrames(result, adjacencyList) {
  const frames = [];
  const start = result.startNode;
  const target = result.targetNode;
  const order = Array.isArray(result.traversalOrder) ? result.traversalOrder : [];
  const path = Array.isArray(result.path) ? result.path : [];
  const found = result.found !== false;
  const hops = typeof result.hopCount === 'number' ? result.hopCount : path.length - 1;

  if (start === target) {
    frames.push({
      title: 'Identical Origin & Destination',
      activeNode: start,
      visitedNodes: [start],
      activeEdges: [],
      routePath: [start],
      queue: [start],
      description: `Origin and destination are identical (${start}). Traversal distance is 0 hops.`
    });
    return frames;
  }

  // Frame 0: Enqueue origin
  frames.push({
    title: 'Initialize BFS Frontier Queue',
    activeNode: start,
    visitedNodes: [start],
    activeEdges: [],
    routePath: [],
    queue: [start],
    description: `Initialize FIFO queue with start landmark '${start}'. Marked '${start}' as visited with distance 0.`
  });

  // Intermediate frames: Dequeue each node in level order
  const visitedAccum = [start];
  for (let i = 0; i < order.length; i++) {
    const curr = order[i];
    if (!visitedAccum.includes(curr)) {
      visitedAccum.push(curr);
    }

    // Identify connecting edge from an already visited predecessor
    let activeEdges = [];
    if (i > 0) {
      for (const prev of visitedAccum) {
        const rawNeighbors = adjacencyList[prev] || [];
        const neighborIds = rawNeighbors.map(n => (typeof n === 'string' ? n : (n.node || n.id)));
        if (neighborIds.includes(curr)) {
          activeEdges = [{ from: prev, to: curr }];
          break;
        }
      }
    }

    const remainingInQueue = order.slice(i + 1, Math.min(i + 4, order.length));

    frames.push({
      title: `Dequeue & Explore: ${curr}`,
      activeNode: curr,
      visitedNodes: [...visitedAccum],
      activeEdges,
      routePath: [],
      queue: remainingInQueue.length > 0 ? remainingInQueue : ['Empty'],
      description: `Dequeued '${curr}' from FIFO queue (Step ${i + 1} of ${order.length}). Inspecting unvisited neighbor pathways.`
    });
  }

  // Final Frame: Shortest path illumination or unreachable alert
  if (found && path.length > 0) {
    frames.push({
      title: `Shortest Path Found: ${path.join(' ➔ ')}`,
      activeNode: target,
      visitedNodes: [...order],
      activeEdges: [],
      routePath: path,
      queue: ['Target Reached'],
      description: `Target landmark '${target}' reached! BFS mathematical guarantee: minimal edges (${hops} ${hops === 1 ? 'hop' : 'hops'}, ~${hops * 120}m walking distance).`
    });
  } else {
    frames.push({
      title: `Target Landmark Unreachable`,
      activeNode: null,
      visitedNodes: [...order],
      activeEdges: [],
      routePath: [],
      queue: ['Queue Exhausted'],
      description: `Queue exhausted without reaching '${target}'. No valid path exists in this graph partition.`
    });
  }

  return frames;
}

/**
 * Builds step-by-step animation frames for DFS traversal.
 * Animates deep recursive exploration, call stack, tree edges, and backtracking.
 */
function buildDfsAnimationFrames(result) {
  const frames = [];
  const start = result.startNode;
  const target = result.targetNode;
  const order = Array.isArray(result.traversalOrder) ? result.traversalOrder : [];
  const treeEdges = Array.isArray(result.treeEdges) ? result.treeEdges : [];
  const targetFound = result.targetFound || result.destinationFound;

  if (start === target) {
    frames.push({
      title: 'Identical Origin & Destination',
      activeNode: start,
      visitedNodes: [start],
      activeEdges: [],
      treeEdges: [],
      routePath: [],
      stack: [start],
      description: `Start and destination are identical (${start}). DFS halts immediately at root node.`
    });
    return frames;
  }

  // Frame 0: Push origin onto stack
  frames.push({
    title: 'Initialize Recursive Call Stack',
    activeNode: start,
    visitedNodes: [start],
    activeEdges: [],
    treeEdges: [],
    routePath: [],
    stack: [start],
    description: `Starting Depth-First Search at root '${start}'. Pushed to call stack and marked visited.`
  });

  // Intermediate frames: Deep edge traversals
  const treeAccum = [];
  const visitedAccum = [start];

  for (let i = 0; i < treeEdges.length; i++) {
    const edge = treeEdges[i];
    treeAccum.push(edge);
    if (!visitedAccum.includes(edge.to)) {
      visitedAccum.push(edge.to);
    }

    const isTarget = target && edge.to === target;

    frames.push({
      title: isTarget ? `Target Discovered: ${edge.to}` : `DFS Deep Exploration: ${edge.from} ➔ ${edge.to}`,
      activeNode: edge.to,
      visitedNodes: [...visitedAccum],
      activeEdges: [edge],
      treeEdges: [...treeAccum],
      routePath: [],
      stack: [...visitedAccum],
      description: isTarget
        ? `Destination landmark '${edge.to}' discovered along recursive branch '${edge.from}' ➔ '${edge.to}'. DFS halts.`
        : `Diving deeper: Traversing pathway from '${edge.from}' to '${edge.to}'. Pushing '${edge.to}' onto call stack.`
    });
  }

  // Final Frame: DFS Traversal Complete
  frames.push({
    title: target && targetFound ? `DFS Target Discovery Complete` : `DFS Traversal Complete`,
    activeNode: target && targetFound ? target : (order[order.length - 1] || null),
    visitedNodes: [...order],
    activeEdges: [],
    treeEdges: [...treeEdges],
    routePath: [],
    stack: ['Stack Unwound'],
    description: target && targetFound
      ? `DFS reached destination '${target}'. Spanning tree branch identified across ${treeEdges.length} edges. (Note: DFS discovers reachability, not minimal hop distance).`
      : `DFS traversal complete. Explored all ${order.length} reachable campus landmarks. Spanning tree formed without cycles.`
  });

  return frames;
}

export default function CampusNavigator() {
  const [landmarks, setLandmarks] = useState([]);
  const [adjacencyList, setAdjacencyList] = useState({});
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [computing, setComputing] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [startNode, setStartNode] = useState('GATE');
  const [targetNode, setTargetNode] = useState('HOSTEL');
  const [activeAlgorithm, setActiveAlgorithm] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [showStepLog, setShowStepLog] = useState(false);

  // Step-by-Step Animation Playback State
  const [animationFrames, setAnimationFrames] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(800); // 800ms (1x Normal) | 400ms (2x Fast)

  // Load campus landmarks and graph adjacency list from backend
  const fetchCampusGraph = useCallback(async () => {
    setLoadingGraph(true);
    setApiError(null);

    try {
      const response = await navigationService.getLandmarks();
      const payload = response.data || response;

      const loadedLandmarks = Array.isArray(payload.landmarks) ? payload.landmarks : [];
      const loadedAdj = payload.adjacencyList || {};

      setLandmarks(loadedLandmarks);
      setAdjacencyList(loadedAdj);

      // Default start and destination if available
      if (loadedLandmarks.length >= 2) {
        setStartNode(loadedLandmarks[0].id);
        setTargetNode(loadedLandmarks[loadedLandmarks.length - 1].id);
      }
    } catch (err) {
      console.error('[CampusNavigator] Failed to load landmarks:', err);
      setApiError(err.message || 'Unable to connect to campus navigation API.');
    } finally {
      setLoadingGraph(false);
    }
  }, []);

  useEffect(() => {
    fetchCampusGraph();
  }, [fetchCampusGraph]);

  // Automated playback timer
  useEffect(() => {
    if (!isPlaying) return;
    if (animationFrames.length <= 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= animationFrames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, animationFrames.length, playbackSpeed]);

  // Execute BFS via backend API
  const handleRunBFS = async () => {
    if (!startNode || !targetNode) {
      setApiError('Please select both a start location and a destination.');
      return;
    }
    
    // Graceful handling of identical start and destination
    if (startNode === targetNode) {
      const identicalResult = {
        algorithm: 'Breadth-First Search (BFS)',
        engine: 'Native C++ Binary (MinGW-w64 x86_64)',
        academicFocus: 'DAA: Level-order traversal & unweighted shortest path guarantees',
        startNode,
        targetNode,
        found: true,
        path: [startNode],
        pathDetails: [landmarks.find(l => l.id === startNode) || { id: startNode, name: startNode }],
        hopCount: 0,
        pathLength: 0,
        totalDistanceMeters: 0,
        traversalOrder: [startNode],
        visitedNodes: [startNode],
        visitedOrder: [startNode],
        visitedCount: 1,
        message: `Origin and destination are identical (${startNode}). Traversal distance is 0 hops.`
      };
      setSearchResult(identicalResult);
      setActiveAlgorithm('BFS');
      setApiError(null);

      const frames = buildBfsAnimationFrames(identicalResult, adjacencyList);
      setAnimationFrames(frames);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      return;
    }

    setComputing(true);
    setApiError(null);

    try {
      const response = await navigationService.findShortestPathBFS(startNode, targetNode);
      const data = response.data || response;
      setSearchResult(data);
      setActiveAlgorithm('BFS');

      // Initialize animation frames and trigger playback
      const frames = buildBfsAnimationFrames(data, adjacencyList);
      setAnimationFrames(frames);
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } catch (err) {
      setApiError(err.message || 'BFS calculation failed.');
      setSearchResult(null);
      setAnimationFrames([]);
    } finally {
      setComputing(false);
    }
  };

  // Execute DFS via backend API
  const handleRunDFS = async () => {
    if (!startNode) {
      setApiError('Please select a starting landmark for DFS traversal.');
      return;
    }

    // Graceful handling when start and target are identical in DFS
    if (targetNode && startNode === targetNode) {
      const identicalDfsResult = {
        algorithm: 'Depth-First Search (DFS)',
        engine: 'Native C++ Binary (MinGW-w64 x86_64)',
        academicFocus: 'DAA: Recursive exploration and cycle prevention',
        startNode,
        targetNode,
        targetFound: true,
        destinationFound: true,
        traversalOrder: [startNode],
        visitedNodes: [startNode],
        visitedCount: 1,
        treeEdges: [],
        message: `Start and target landmark are identical (${startNode}). Traversal halts immediately at root node.`
      };
      setSearchResult(identicalDfsResult);
      setActiveAlgorithm('DFS');
      setApiError(null);

      const frames = buildDfsAnimationFrames(identicalDfsResult);
      setAnimationFrames(frames);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      return;
    }

    setComputing(true);
    setApiError(null);

    try {
      const response = await navigationService.traverseDFS(startNode, targetNode || null);
      const data = response.data || response;
      setSearchResult(data);
      setActiveAlgorithm('DFS');

      // Initialize animation frames and trigger playback
      const frames = buildDfsAnimationFrames(data);
      setAnimationFrames(frames);
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } catch (err) {
      setApiError(err.message || 'DFS traversal failed.');
      setSearchResult(null);
      setAnimationFrames([]);
    } finally {
      setComputing(false);
    }
  };

  // Quick selection when clicking on a graph landmark
  const handleNodeClick = (node) => {
    if (!startNode || (startNode && targetNode)) {
      setStartNode(node.id);
      setTargetNode('');
      setSearchResult(null);
      setAnimationFrames([]);
      setActiveAlgorithm(null);
    } else if (startNode && !targetNode && node.id !== startNode) {
      setTargetNode(node.id);
    } else if (startNode && !targetNode && node.id === startNode) {
      // Allow choosing same node if explicitly clicked
      setTargetNode(node.id);
    }
  };

  const handleResetSearch = () => {
    setSearchResult(null);
    setActiveAlgorithm(null);
    setAnimationFrames([]);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setApiError(null);
  };

  // Derived current animation frame (or fallback to static search result)
  const currentFrame = animationFrames.length > 0
    ? (animationFrames[currentStepIndex] || animationFrames[animationFrames.length - 1])
    : null;

  const activeRoutePath = currentFrame
    ? currentFrame.routePath
    : (searchResult?.path || []);

  const activeVisitedNodes = currentFrame
    ? currentFrame.visitedNodes
    : (searchResult?.visitedOrder || searchResult?.traversalOrder || []);

  const activeNodeHighlight = currentFrame
    ? currentFrame.activeNode
    : null;

  const activeEdgesHighlight = currentFrame
    ? currentFrame.activeEdges
    : [];

  const activeTreeEdgesHighlight = currentFrame
    ? (currentFrame.treeEdges || searchResult?.treeEdges || [])
    : (searchResult?.treeEdges || []);

  const isRouteUnreachable = searchResult && searchResult.found === false;
  const isIdenticalSelection = Boolean(startNode && targetNode && startNode === targetNode);

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="DAA: Campus Navigator"
        description="Interactive pictorial campus map exploring Breadth-First Search (BFS) and Depth-First Search (DFS) on the Kalvium campus graph. Powered by native C++ algorithm binaries."
        badge={<span className="academic-badge badge-daa">DAA</span>}
        action={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusBadge status={loadingGraph ? 'warning' : 'online'} label={loadingGraph ? 'Loading Graph...' : 'C++ Engine Ready'} />
          </div>
        }
      />

      {/* Global API Error Notice */}
      {apiError && (
        <ResultMessage
          type="error"
          title="Navigation API Notice"
          text={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      {/* Identical Start & Destination Notice */}
      {isIdenticalSelection && !searchResult && (
        <ResultMessage
          type="info"
          title="Identical Origin and Destination"
          text={`Origin and destination are both set to '${startNode}'. Running algorithms will yield a 0-hop immediate traversal.`}
        />
      )}

      {/* Navigator Controls Card */}
      <section className="navigator-controls-card" aria-label="Campus Navigation Route Controls">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Route Selection &amp; C++ Traversal Dispatch
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Choose origin and destination landmarks using the selectors below or by clicking directly on the campus map buildings.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="status-pill online" style={{ fontSize: '0.75rem', fontWeight: '600' }}>
              ⚡ C++ Executables Active
            </span>
          </div>
        </div>

        {/* Start & Destination Dropdowns */}
        <LocationSelector
          locations={landmarks}
          startLocation={startNode}
          destinationLocation={targetNode}
          onStartChange={(val) => {
            setStartNode(val);
            if (searchResult) handleResetSearch();
          }}
          onDestinationChange={(val) => {
            setTargetNode(val);
            if (searchResult) handleResetSearch();
          }}
          disabled={loadingGraph || computing}
        />

        {/* Action Buttons */}
        <div className="navigator-actions-row">
          <div className="algo-button-group">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunBFS}
              disabled={computing || loadingGraph || !startNode || !targetNode}
            >
              {computing && activeAlgorithm === 'BFS' ? 'Executing C++ BFS...' : 'Compute BFS Shortest Path'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRunDFS}
              disabled={computing || loadingGraph || !startNode}
            >
              {computing && activeAlgorithm === 'DFS' ? 'Executing C++ DFS...' : 'Run DFS Traversal'}
            </button>
          </div>

          {searchResult && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetSearch}
              disabled={computing}
            >
              Clear Route &amp; Reset Map
            </button>
          )}
        </div>
      </section>

      {/* Step-by-Step Traversal Playback Toolbar */}
      {animationFrames.length > 0 && (
        <section className="playback-toolbar-card" aria-label="Step-by-Step Traversal Playback Controls">
          <div className="playback-header">
            <div className="playback-title-row">
              <span className={`playback-algo-pill ${activeAlgorithm === 'BFS' ? 'bfs' : 'dfs'}`}>
                {activeAlgorithm === 'BFS' ? 'BFS Frontier Playback' : 'DFS Deep Traversal Playback'}
              </span>
              <span className="playback-step-counter">
                Step <strong>{currentStepIndex + 1}</strong> of <strong>{animationFrames.length}</strong>
              </span>
            </div>

            {/* Animation Speed Selector */}
            <div className="playback-speed-group">
              <span className="playback-speed-label">Speed:</span>
              <button
                type="button"
                className={`speed-pill ${playbackSpeed === 800 ? 'active' : ''}`}
                onClick={() => setPlaybackSpeed(800)}
                aria-label="Set normal playback speed 1x"
              >
                1x Normal
              </button>
              <button
                type="button"
                className={`speed-pill ${playbackSpeed === 400 ? 'active' : ''}`}
                onClick={() => setPlaybackSpeed(400)}
                aria-label="Set fast playback speed 2x"
              >
                2x Fast
              </button>
            </div>
          </div>

          {/* Current Step Educational Narration Banner */}
          <div className="playback-narration-box">
            <div className="narration-header">
              <div className="narration-node-badge">
                {currentFrame?.activeNode ? (
                  <>
                    <span className="pulse-indicator" aria-hidden="true" />
                    <span>Active Landmark: <strong>{currentFrame.activeNode}</strong></span>
                  </>
                ) : (
                  <span>Status: <strong>Finished</strong></span>
                )}
              </div>
              <span className="narration-action">{currentFrame?.title}</span>
            </div>
            <p className="narration-text">{currentFrame?.description}</p>
          </div>

          {/* Scrubber Range Slider */}
          <div className="playback-scrubber-row">
            <input
              type="range"
              min={0}
              max={animationFrames.length - 1}
              value={currentStepIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentStepIndex(Number(e.target.value));
              }}
              className="playback-slider"
              aria-label="Algorithm traversal step scrubber slider"
            />
          </div>

          {/* Playback Buttons & Live Data Status */}
          <div className="playback-buttons-row">
            <div className="playback-btn-group">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(0);
                }}
                disabled={currentStepIndex === 0}
                title="Restart from beginning"
              >
                ⏮ Start
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(prev => Math.max(0, prev - 1));
                }}
                disabled={currentStepIndex === 0}
                title="Step backward"
              >
                ◀ Step
              </button>
              <button
                type="button"
                className={`btn ${isPlaying ? 'btn-warning' : 'btn-primary'} btn-sm`}
                onClick={() => {
                  if (currentStepIndex >= animationFrames.length - 1) {
                    setCurrentStepIndex(0);
                    setIsPlaying(true);
                  } else {
                    setIsPlaying(p => !p);
                  }
                }}
                title={isPlaying ? 'Pause animation' : 'Play animation'}
              >
                {isPlaying ? '⏸ Pause' : (currentStepIndex >= animationFrames.length - 1 ? '↺ Replay' : '▶ Play')}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(prev => Math.min(animationFrames.length - 1, prev + 1));
                }}
                disabled={currentStepIndex >= animationFrames.length - 1}
                title="Step forward"
              >
                Step ▶
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(animationFrames.length - 1);
                }}
                disabled={currentStepIndex >= animationFrames.length - 1}
                title="Jump to end of traversal"
              >
                End ⏭
              </button>
            </div>

            <div className="playback-live-queue">
              {activeAlgorithm === 'BFS' ? (
                <span>Frontier FIFO Queue: <code>[{currentFrame?.queue?.join(', ') || '—'}]</code></span>
              ) : (
                <span>Discovery Spanning Tree: <strong>{currentFrame?.treeEdges?.length || 0} edges</strong></span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Campus Illustrated Map Visualization */}
      <section aria-label="Campus Landmark Graph Visualization">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Interactive Campus Map &bull; 6 Landmarks &bull; 9 Actual Pathways
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            💡 Tip: Click any landmark building to select Origin or Destination
          </span>
        </div>

        {loadingGraph ? (
          <div className="loading-skeleton-box">
            <div className="spinner-icon" aria-hidden="true" />
            <span>Loading campus map nodes and adjacency matrix from backend...</span>
          </div>
        ) : (
          <CampusGraph
            nodes={landmarks}
            connections={adjacencyList}
            routePath={activeRoutePath}
            visitedNodes={activeVisitedNodes}
            startNode={startNode}
            targetNode={targetNode}
            activeNode={activeNodeHighlight}
            activeEdges={activeEdgesHighlight}
            treeEdges={activeTreeEdgesHighlight}
            algorithm={activeAlgorithm}
            onNodeClick={handleNodeClick}
          />
        )}
      </section>

      {/* Algorithm Output Results Panel */}
      {searchResult && (
        <section className="path-result-card" aria-label="Algorithm Search Results">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="academic-badge badge-daa">
                  {searchResult.algorithm || (activeAlgorithm === 'BFS' ? 'Breadth-First Search (BFS)' : 'Depth-First Search (DFS)')}
                </span>
                <span className="status-pill online" style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                  ⚡ {searchResult.engine || 'C++ Native Binary (MinGW-w64)'}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Execution Complete
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {activeAlgorithm === 'BFS' ? 'BFS Shortest Path Result' : 'DFS Reachability Traversal'}
              </h3>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowStepLog(prev => !prev)}
            >
              {showStepLog ? 'Hide Step Traces ▲' : 'Inspect Step Traces ▼'}
            </button>
          </div>

          {/* Unreachable Route Warning */}
          {isRouteUnreachable && (
            <ResultMessage
              type="warning"
              title="Target Landmark Unreachable"
              text={`No valid pathway exists between '${safeDisplay(startNode)}' and '${safeDisplay(targetNode)}' in the current campus graph partition.`}
            />
          )}

          {/* Metric Stats Cards */}
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {activeAlgorithm === 'BFS' && (
              <>
                <StatCard
                  label="Shortest Path Length"
                  value={searchResult.hopCount !== undefined ? `${searchResult.hopCount} ${searchResult.hopCount === 1 ? 'hop' : 'hops'}` : '—'}
                  description="Minimum edge traversals mathematically guaranteed by BFS"
                  badge={<span className="status-pill online">Optimal</span>}
                />
                <StatCard
                  label="Approx. Walking Distance"
                  value={searchResult.hopCount !== undefined ? `${searchResult.hopCount * 120} m` : '—'}
                  description="Estimated campus route (~120m per pathway hop)"
                />
              </>
            )}

            {activeAlgorithm === 'DFS' && (
              <>
                <StatCard
                  label="Reachability Result"
                  value={searchResult.targetFound || searchResult.destinationFound ? 'Reached' : (searchResult.targetNode ? 'Not Reached' : 'Completed')}
                  description={searchResult.targetNode ? `Target landmark '${searchResult.targetNode}' reachability verified` : 'Complete graph traversal across partition'}
                  badge={<span className="status-pill online">DFS</span>}
                />
                <StatCard
                  label="Spanning Tree Edges"
                  value={searchResult.treeEdges ? searchResult.treeEdges.length : '—'}
                  description="Discovery tree edges traversed without creating cycles"
                />
              </>
            )}

            <StatCard
              label="Visited Landmarks"
              value={searchResult.visitedCount || (searchResult.visitedNodes ? searchResult.visitedNodes.length : activeVisitedNodes.length)}
              description="Frontier nodes explored during algorithmic search"
            />
          </div>

          {/* Path Breadcrumbs (BFS Shortest Route) */}
          {activeAlgorithm === 'BFS' && searchResult.path && searchResult.path.length > 0 && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Computed Shortest Path:
              </div>
              <div className="path-breadcrumbs" aria-label="Shortest path sequence">
                {searchResult.path.map((nodeId, idx) => (
                  <React.Fragment key={`path-step-${nodeId}`}>
                    <span className="path-node-chip">
                      <span>{idx + 1}.</span>
                      <span>{nodeId}</span>
                    </span>
                    {idx < searchResult.path.length - 1 && (
                      <span className="path-arrow" aria-hidden="true">&rarr;</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* DFS Exploration Order */}
          {activeAlgorithm === 'DFS' && searchResult.traversalOrder && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                DFS Exploration Order:
              </div>
              <div className="visited-chips-list" aria-label="DFS node visitation order">
                {searchResult.traversalOrder.map((nodeId, idx) => (
                  <span key={`dfs-${nodeId}-${idx}`} className="visited-chip" style={{ background: '#f5f3ff', borderColor: '#ddd6fe', color: '#6d28d9' }}>
                    <strong>{idx + 1}.</strong> {nodeId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* DFS Spanning Tree Edges */}
          {activeAlgorithm === 'DFS' && Array.isArray(searchResult.treeEdges) && searchResult.treeEdges.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Discovered Spanning Tree Edges:
              </div>
              <div className="visited-chips-list" aria-label="DFS tree edges">
                {searchResult.treeEdges.map((edge, idx) => (
                  <span key={`tree-edge-${edge.from}-${edge.to}-${idx}`} className="visited-chip" style={{ background: '#faf5ff', borderColor: '#e9d5ff', color: '#7c3aed' }}>
                    {edge.from} ➔ {edge.to}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Visited Sequence (BFS) */}
          {activeAlgorithm === 'BFS' && searchResult.visitedOrder && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Queue Discovery Sequence:
              </div>
              <div className="visited-chips-list">
                {searchResult.visitedOrder.map((nodeId, idx) => (
                  <span key={`visited-${nodeId}`} className="visited-chip" style={{ fontSize: '0.725rem' }}>
                    {idx + 1}. {nodeId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Exploration Trace Table */}
          {showStepLog && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Academic Step-by-Step Traversal Trace ({animationFrames.length} Frames):
              </div>
              <div className="table-wrapper">
                <table className="data-table" aria-label="Step trace table">
                  <thead>
                    <tr>
                      <th>Frame</th>
                      <th>Stage</th>
                      <th>Active Node</th>
                      <th>Frontier State</th>
                      <th>Academic Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animationFrames.map((frame, i) => (
                      <tr key={`frame-${i}`} className={currentStepIndex === i ? 'highlighted-row' : ''}>
                        <td style={{ fontWeight: '700' }}>#{i + 1}</td>
                        <td>
                          <span className={`status-pill ${activeAlgorithm === 'BFS' ? 'online' : 'offline'}`} style={{ fontSize: '0.7rem' }}>
                            {frame.title}
                          </span>
                        </td>
                        <td><code>{safeDisplay(frame.activeNode || 'None')}</code></td>
                        <td>
                          <code style={{ fontSize: '0.75rem' }}>
                            {activeAlgorithm === 'BFS'
                              ? (Array.isArray(frame.queue) ? `[${frame.queue.join(', ')}]` : '—')
                              : (Array.isArray(frame.treeEdges) ? `${frame.treeEdges.length} edges` : '—')}
                          </code>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {frame.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Empty Initial Search State */}
      {!searchResult && !loadingGraph && (
        <div className="loading-skeleton-box" style={{ padding: '2rem 1.5rem' }}>
          <p style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.25rem' }}>
            No Traversal Computed Yet
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '520px', lineHeight: '1.5' }}>
            Select a start location and destination in the controls panel above (or click landmark buildings on the map), then click <strong>Compute BFS Shortest Path</strong> or <strong>Run DFS Traversal</strong> to observe animated C++ graph exploration.
          </p>
        </div>
      )}

      {/* Academic Explanation Card: BFS vs DFS */}
      <section className="daa-explanation-card" aria-label="Theoretical DAA Concepts">
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
            DAA Concepts Demonstrated
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Rigorous mathematical principles underlying Breadth-First Search and Depth-First Search on campus graph topologies.
          </p>
        </div>

        <div className="daa-algo-comparison">
          {/* BFS Academic Breakdown */}
          <div className="algo-box bfs">
            <div className="algo-box-title">
              <span>Breadth-First Search (BFS)</span>
              <span className="academic-badge badge-daa">C++ Binary (FIFO Queue)</span>
            </div>
            <p className="algo-box-desc">
              <strong>Shortest Path Guarantee:</strong> BFS expands frontiers layer by layer (level order) outward from the root node. In an unweighted graph, the first time the destination vertex is dequeued, the path traversed is mathematically proven to have the minimal number of edges (minimum topological hops). Implemented in native C++ (<code>bfs.cpp</code>) using <code>std::queue</code> and <code>std::set</code>.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
              <strong>Time Complexity:</strong> $O(V + E)$ &bull; <strong>Space Complexity:</strong> $O(V)$
            </div>
          </div>

          {/* DFS Academic Breakdown */}
          <div className="algo-box dfs">
            <div className="algo-box-title">
              <span>Depth-First Search (DFS)</span>
              <span className="academic-badge badge-daa">C++ Binary (Recursion)</span>
            </div>
            <p className="algo-box-desc">
              <strong>Reachable Exploration:</strong> DFS proceeds immediately deeper into neighboring vertices until dead ends are reached, backtracking up the call stack to uncover alternative branches. Implemented in native C++ (<code>dfs.cpp</code>) with deterministic neighbor iteration and cycle avoidance. <em>Note: DFS does NOT guarantee a shortest path.</em>
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
              <strong>Time Complexity:</strong> $O(V + E)$ &bull; <strong>Space Complexity:</strong> $O(V)$ (recursion depth)
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
