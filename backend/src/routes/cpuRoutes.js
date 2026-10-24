/**
 * CPU Emulator Routes (COA Module)
 * Discipline: Computer Organization and Architecture
 * 
 * Endpoints:
 *   - GET  /programs : list pre-configured educational sample assembly programs
 *   - POST /assemble : parse and assemble code into machine words
 *   - POST /load     : load program into memory and initialize PC
 *   - POST /step     : step one instruction or one micro-stage
 *   - POST /run      : execute continuously until HALT or step limit
 *   - POST /reset    : reset CPU registers and state
 *   - GET  /state    : retrieve full register, flag, and memory state
 */

import { Router } from 'express';
import { cpuController } from '../controllers/cpuController.js';

const router = Router();

router.get('/programs', cpuController.getSamplePrograms);
router.post('/assemble', cpuController.assemble);
router.post('/load', cpuController.loadProgram);
router.post('/step', cpuController.step);
router.post('/run', cpuController.run);
router.post('/reset', cpuController.reset);
router.get('/state', cpuController.getState);

export default router;
