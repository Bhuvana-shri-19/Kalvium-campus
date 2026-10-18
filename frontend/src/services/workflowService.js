import { request } from './api.js';

export const workflowService = {
  getDFASpec() {
    return request('/workflow/dfa-spec');
  },

  validateSequence(sequence, initialState) {
    return request('/workflow/validate', {
      method: 'POST',
      body: { sequence, initialState }
    });
  },

  getHistory(status) {
    const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/workflow/history${query}`);
  },

  getRequestById(id) {
    return request(`/workflow/history/${id}`);
  },

  createRequest(payload) {
    return request('/workflow/requests', {
      method: 'POST',
      body: payload
    });
  },

  executeAction(id, action) {
    return request(`/workflow/requests/${id}/action`, {
      method: 'POST',
      body: { action }
    });
  }
};
