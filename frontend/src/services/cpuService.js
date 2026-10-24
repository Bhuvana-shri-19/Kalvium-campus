/**
 * CPU Emulator Frontend Service (COA Module)
 * Connects React UI to the Express backend /api/cpu endpoints
 */

import { request } from './api.js';

export const cpuService = {
  /**
   * Fetches educational sample assembly programs
   */
  async getPrograms() {
    return request('/cpu/programs', { method: 'GET' });
  },

  /**
   * Validates and assembles source code without loading into memory
   */
  async assemble(code) {
    return request('/cpu/assemble', {
      method: 'POST',
      body: { code }
    });
  },

  /**
   * Loads assembly source or sample program into CPU memory
   */
  async loadProgram({ code, startAddress = 0, sampleId = null, sessionId = 'default' }) {
    return request('/cpu/load', {
      method: 'POST',
      body: { code, startAddress, sampleId, sessionId }
    });
  },

  /**
   * Steps exactly one instruction cycle (or micro-stage if micro=true)
   */
  async step({ micro = false, sessionId = 'default' } = {}) {
    return request('/cpu/step', {
      method: 'POST',
      body: { micro, sessionId }
    });
  },

  /**
   * Executes continuously until HALT or instruction limit
   */
  async run({ maxInstructions = 1000, sessionId = 'default' } = {}) {
    return request('/cpu/run', {
      method: 'POST',
      body: { maxInstructions, sessionId }
    });
  },

  /**
   * Resets the CPU state and registers
   */
  async reset({ clearMemory = false, sessionId = 'default' } = {}) {
    return request('/cpu/reset', {
      method: 'POST',
      body: { clearMemory, sessionId }
    });
  },

  /**
   * Reads current CPU, registers, and memory state
   */
  async getState(sessionId = 'default') {
    return request(`/cpu/state?sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'GET'
    });
  }
};

export default cpuService;
