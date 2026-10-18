import { ARCHITECTURE_SPECS, simulateArchitectureExecution } from '../algorithms/architectureSimulator.js';

export const architectureService = {
  getSpecifications() {
    return ARCHITECTURE_SPECS;
  },

  simulateExecution(requestPacket) {
    if (!requestPacket || typeof requestPacket !== 'object') {
      const err = new Error('Invalid request payload for architecture simulation');
      err.status = 400;
      throw err;
    }
    return simulateArchitectureExecution(requestPacket);
  }
};
