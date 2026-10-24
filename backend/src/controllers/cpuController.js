/**
 * CPU Emulator Controller (COA Module)
 * Discipline: Computer Organization and Architecture
 */

import { cpuService } from '../services/cpuService.js';

export const cpuController = {
  getSamplePrograms(req, res, next) {
    try {
      const programs = cpuService.getSamplePrograms();
      res.json({ success: true, data: programs });
    } catch (err) {
      next(err);
    }
  },

  assemble(req, res, next) {
    try {
      const { code } = req.body || {};
      const result = cpuService.assembleProgram(code || '');
      res.json({ success: result.success, data: result });
    } catch (err) {
      next(err);
    }
  },

  loadProgram(req, res, next) {
    try {
      const { code, startAddress, sampleId, sessionId } = req.body || {};

      let result;
      if (sampleId) {
        result = cpuService.loadSample(sampleId, sessionId);
      } else {
        result = cpuService.loadProgram(code || '', startAddress || 0, sessionId);
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (err) {
      next(err);
    }
  },

  step(req, res, next) {
    try {
      const { sessionId, micro } = req.body || {};
      const result = micro
        ? cpuService.stepMicro(sessionId)
        : cpuService.step(sessionId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  run(req, res, next) {
    try {
      const { maxInstructions, sessionId } = req.body || {};
      const result = cpuService.run(maxInstructions, sessionId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  reset(req, res, next) {
    try {
      const { clearMemory, sessionId } = req.body || {};
      const result = cpuService.reset(clearMemory, sessionId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  getState(req, res, next) {
    try {
      const { sessionId } = req.query || {};
      const result = cpuService.getState(sessionId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

export default cpuController;
