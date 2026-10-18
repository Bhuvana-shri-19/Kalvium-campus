import { architectureService } from '../services/architectureService.js';

export const architectureController = {
  getSpecs(req, res, next) {
    try {
      const specs = architectureService.getSpecifications();
      res.json({ success: true, data: specs });
    } catch (error) {
      next(error);
    }
  },

  simulate(req, res, next) {
    try {
      const result = architectureService.simulateExecution(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
};
