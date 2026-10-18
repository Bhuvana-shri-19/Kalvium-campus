import { workflowService } from '../services/workflowService.js';

export const workflowController = {
  getDFASpec(req, res, next) {
    try {
      const spec = workflowService.getDFASpecification();
      res.json({ success: true, data: spec });
    } catch (error) {
      next(error);
    }
  },

  validateSequence(req, res, next) {
    try {
      const { sequence, initialState } = req.body;
      const result = workflowService.validateSequence(sequence, initialState);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  getAllRequests(req, res, next) {
    try {
      const { status } = req.query;
      const requests = workflowService.getAllRequests(status);
      res.json({ success: true, count: requests.length, data: requests });
    } catch (error) {
      next(error);
    }
  },

  getRequestById(req, res, next) {
    try {
      const request = workflowService.getRequestById(req.params.id);
      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  createRequest(req, res, next) {
    try {
      const created = workflowService.createAndProcessRequest(req.body);
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      next(error);
    }
  }
};
