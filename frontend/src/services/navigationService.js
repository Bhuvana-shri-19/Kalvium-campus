import { request } from './api.js';

export const navigationService = {
  getLandmarks() {
    return request('/navigation/landmarks');
  },

  getLandmark(id) {
    return request(`/navigation/landmarks/${id}`);
  },

  findShortestPathBFS(startNode, targetNode) {
    return request('/navigation/bfs', {
      method: 'POST',
      body: { startNode, targetNode }
    });
  },

  traverseDFS(startNode, targetNode = null) {
    return request('/navigation/dfs', {
      method: 'POST',
      body: { startNode, targetNode }
    });
  }
};
