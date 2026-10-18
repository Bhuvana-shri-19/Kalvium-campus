import { request } from './api.js';

export const architectureService = {
  getSpecs() {
    return request('/architecture/specs');
  },

  simulateProcess(payload) {
    return request('/architecture/process', {
      method: 'POST',
      body: payload
    });
  }
};
