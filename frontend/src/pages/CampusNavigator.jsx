import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LocationSelector from '../components/LocationSelector.jsx';
import CampusGraph from '../components/CampusGraph.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ResultMessage from '../components/ResultMessage.jsx';
import { navigationService } from '../services/navigationService.js';
import { formatDistance, safeDisplay } from '../utils/formatters.js';
import '../styles/pages.css';

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

  // Execute BFS via backend API
  const handleRunBFS = async () => {
    if (!startNode || !targetNode) {
      setApiError('Please select both a start location and a destination.');
      return;
    }
    if (startNode === targetNode) {
      setApiError('Start location and destination must be distinct landmarks.');
      return;
    }

    setComputing(true);
    setApiError(null);

    try {
      const response = await navigationService.findShortestPathBFS(startNode, targetNode);
      const data = response.data || response;
      setSearchResult(data);
      setActiveAlgorithm('BFS');
    } catch (err) {
      setApiError(err.message || 'BFS calculation failed.');
      setSearchResult(null);
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

    setComputing(true);
    setApiError(null);

    try {
      const response = await navigationService.traverseDFS(startNode, targetNode || null);
      const data = response.data || response;
      setSearchResult(data);
      setActiveAlgorithm('DFS');
    } catch (err) {
      setApiError(err.message || 'DFS traversal failed.');
      setSearchResult(null);
    } finally {
      setComputing(false);
    }
  };

  // Quick selection when clicking on a graph node
  const handleNodeClick = (node) => {
    if (!startNode || (startNode && targetNode)) {
      setStartNode(node.id);
      setTargetNode('');
    } else if (startNode && !targetNode && node.id !== startNode) {
      setTargetNode(node.id);
    }
  };

  const handleResetSearch = () => {
    setSearchResult(null);
    setActiveAlgorithm(null);
    setApiError(null);
  };

  // Derived route and visited arrays for CampusGraph visualization
  const computedRoutePath = searchResult
    ? (searchResult.path || (searchResult.traversalOrder ? searchResult.traversalOrder.slice(0, 4) : []))
    : [];

  const computedVisitedNodes = searchResult
    ? (searchResult.visitedOrder || searchResult.traversalOrder || [])
    : [];

  const isRouteUnreachable = searchResult && searchResult.found === false;

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="DAA: Campus Navigator"
        description="Graph algorithm exploration on the Kalvium campus network. Compares queue-based Breadth-First Search (BFS) and recursive Depth-First Search (DFS)."
        badge={<span className="academic-badge badge-daa">DAA</span>}
        action={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusBadge status={loadingGraph ? 'warning' : 'online'} label={loadingGraph ? 'Loading Graph...' : 'Graph Engine Ready'} />
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

      {/* Navigator Controls Card */}
      <section className="navigator-controls-card" aria-label="Campus Navigation Route Controls">
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Route Selection &amp; Algorithm Dispatch
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Choose start and target landmarks across the campus graph to trigger real-time algorithmic execution on the backend.
          </p>
        </div>

        {/* Start & Destination Dropdowns */}
        <LocationSelector
          locations={landmarks}
          startLocation={startNode}
          destinationLocation={targetNode}
          onStartChange={setStartNode}
          onDestinationChange={setTargetNode}
          disabled={loadingGraph || computing}
        />

        {/* Action Buttons */}
        <div className="navigator-actions-row">
          <div className="algo-button-group">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunBFS}
              disabled={computing || loadingGraph || !startNode || !targetNode || startNode === targetNode}
            >
              {computing && activeAlgorithm === 'BFS' ? 'Computing BFS...' : 'Compute BFS Shortest Path'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRunDFS}
              disabled={computing || loadingGraph || !startNode}
            >
              {computing && activeAlgorithm === 'DFS' ? 'Running DFS...' : 'Run DFS Traversal'}
            </button>
          </div>

          {searchResult && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetSearch}
              disabled={computing}
            >
              Clear Route &amp; Highlights
            </button>
          )}
        </div>
      </section>

      {/* Campus Graph Visualization */}
      <section aria-label="Campus Landmark Graph Visualization">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Campus Topological Graph
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Tip: Click any landmark circle to quick-select it
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
            routePath={computedRoutePath}
            visitedNodes={computedVisitedNodes}
            startNode={startNode}
            targetNode={targetNode}
            onNodeClick={handleNodeClick}
          />
        )}
      </section>

      {/* Algorithm Output Results Panel */}
      {searchResult && (
        <section className="path-result-card" aria-label="Algorithm Search Results">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="academic-badge badge-daa">
                  {searchResult.algorithm || (activeAlgorithm === 'BFS' ? 'Breadth-First Search (BFS)' : 'Depth-First Search (DFS)')}
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
                  label="Total Distance"
                  value={formatDistance(searchResult.totalDistanceMeters || 0)}
                  description="Physical walking route distance"
                />
                <StatCard
                  label="Hop Count"
                  value={searchResult.hopCount !== undefined ? searchResult.hopCount : '—'}
                  description="Minimum edge traversals"
                />
              </>
            )}

            <StatCard
              label="Visited Landmarks"
              value={computedVisitedNodes.length}
              description="Frontier nodes explored during search"
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

          {/* Traversal Order (DFS) */}
          {activeAlgorithm === 'DFS' && searchResult.traversalOrder && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                DFS Exploration Order:
              </div>
              <div className="visited-chips-list" aria-label="DFS node visitation order">
                {searchResult.traversalOrder.map((nodeId, idx) => (
                  <span key={`dfs-${nodeId}-${idx}`} className="visited-chip">
                    <strong>{idx + 1}.</strong> {nodeId}
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
          {showStepLog && Array.isArray(searchResult.steps) && searchResult.steps.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Academic Step-by-Step Traversal Trace:
              </div>
              <div className="table-wrapper">
                <table className="data-table" aria-label="Step trace table">
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>Action</th>
                      <th>Current Node</th>
                      <th>Frontier Queue / Stack</th>
                      <th>Academic Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResult.steps.map((st, i) => (
                      <tr key={`step-${st.step || i}`}>
                        <td style={{ fontWeight: '700' }}>#{st.step || i + 1}</td>
                        <td>
                          <span className="status-pill online" style={{ fontSize: '0.7rem' }}>
                            {st.action}
                          </span>
                        </td>
                        <td><code>{safeDisplay(st.currentNode)}</code></td>
                        <td>
                          <code style={{ fontSize: '0.75rem' }}>
                            {Array.isArray(st.currentQueue) ? `[${st.currentQueue.join(', ')}]` : '—'}
                          </code>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {st.explanation}
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
            Select a start location and destination in the controls panel above, then click <strong>Compute BFS Shortest Path</strong> or <strong>Run DFS Traversal</strong> to observe live graph exploration.
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
              <span className="academic-badge badge-daa">Queue (FIFO)</span>
            </div>
            <p className="algo-box-desc">
              <strong>Shortest Path Guarantee:</strong> BFS expands frontiers layer by layer (level order) outward from the root node. In an unweighted graph, the first time the destination vertex is dequeued, the path traversed is mathematically proven to have the minimal number of edges (minimum topological hops).
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
              <strong>Time Complexity:</strong> $O(V + E)$ &bull; <strong>Space Complexity:</strong> $O(V)$
            </div>
          </div>

          {/* DFS Academic Breakdown */}
          <div className="algo-box dfs">
            <div className="algo-box-title">
              <span>Depth-First Search (DFS)</span>
              <span className="academic-badge badge-daa">Stack / Recursion</span>
            </div>
            <p className="algo-box-desc">
              <strong>Reachable Exploration:</strong> DFS proceeds immediately deeper into neighboring vertices until dead ends are reached, backtracking up the call stack to uncover alternative branches. While DFS does not guarantee a shortest path, it uncovers connected components, cycle formations, and reachability trees.
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
