import { Router } from 'express';
import { architectureController } from '../controllers/architectureController.js';

const router = Router();

router.get('/specs', architectureController.getSpecs);
router.post('/process', architectureController.simulate);

export default router;
