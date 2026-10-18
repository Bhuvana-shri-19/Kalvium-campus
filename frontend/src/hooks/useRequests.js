import { useState, useEffect, useCallback, useRef } from 'react';
import { workflowService } from '../services/workflowService.js';

/**
 * Custom React hook for fetching and managing campus request history.
 * 
 * Reusable across Dashboard and Request History pages.
 * Handles component unmounting cleanup, real loading states, and truthful error propagation.
 * 
 * @param {boolean} [autoFetch=true] - Whether to load requests immediately on component mount
 * @returns {Object} { requests, loading, error, refresh, count }
 */
export function useRequests(autoFetch = true, initialFilter = 'ALL') {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(initialFilter);
  const isMountedRef = useRef(true);

  const fetchRequests = useCallback(async (statusToFetch) => {
    setLoading(true);
    setError(null);

    const activeStatus = typeof statusToFetch === 'string' ? statusToFetch : filter;

    try {
      const response = await workflowService.getHistory(activeStatus);
      
      // Prevent state updates if component has unmounted
      if (!isMountedRef.current) return;

      // Validate and extract payload array from { success: true, data: [...] }
      const list = Array.isArray(response)
        ? response
        : (response && Array.isArray(response.data) ? response.data : []);

      setRequests(list);
    } catch (err) {
      if (!isMountedRef.current) return;

      const message = err.message || 'Failed to load campus request history from server';
      setError(message);
      setRequests([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [filter]);

  useEffect(() => {
    isMountedRef.current = true;

    if (autoFetch) {
      fetchRequests(filter);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [filter, autoFetch]);

  const updateFilter = useCallback((newStatus) => {
    setFilter(newStatus);
  }, []);

  return {
    requests,
    loading,
    error,
    refresh: () => fetchRequests(filter),
    filter,
    setFilter: updateFilter,
    count: requests.length
  };
}

export default useRequests;
