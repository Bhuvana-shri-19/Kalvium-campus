/**
 * CPU Emulator Service (COA Module)
 * Discipline: Computer Organization and Architecture
 * 
 * Manages CPU emulator sessions, handles assembly and execution requests,
 * and maintains isolated session state.
 */

import { CpuEngine } from '../algorithms/cpu/cpuEngine.js';
import { assemble, disassemble } from '../algorithms/cpu/assembler.js';
import { SAMPLE_PROGRAMS, getSampleProgramById } from '../algorithms/cpu/samplePrograms.js';

// Default global emulator instance
let defaultCpu = new CpuEngine();

// In-memory isolated sessions map (for multi-user/multi-tab support)
const sessions = new Map();

function getCpuInstance(sessionId = 'default') {
  if (!sessionId || sessionId === 'default') {
    return defaultCpu;
  }
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new CpuEngine());
  }
  return sessions.get(sessionId);
}

export const cpuService = {
  /**
   * Retrieves list of educational sample programs
   */
  getSamplePrograms() {
    return SAMPLE_PROGRAMS.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      expectedOutput: p.expectedOutput,
      code: p.code
    }));
  },

  /**
   * Assembles assembly source code without loading into memory
   */
  assembleProgram(sourceCode) {
    if (typeof sourceCode !== 'string') {
      const err = new Error('Source code must be provided as a string.');
      err.status = 400;
      throw err;
    }

    return assemble(sourceCode);
  },

  /**
   * Assembles and loads program into CPU memory, resetting execution state
   */
  loadProgram(sourceCode, startAddress = 0, sessionId = 'default') {
    const cpu = getCpuInstance(sessionId);

    const assembled = assemble(sourceCode, startAddress);
    if (!assembled.success) {
      return {
        success: false,
        errors: assembled.errors,
        cpuState: cpu.getState()
      };
    }

    cpu.loadProgram(assembled.machineCode, startAddress);

    return {
      success: true,
      assembled,
      cpuState: cpu.getState()
    };
  },

  /**
   * Loads a pre-built sample program by ID
   */
  loadSample(sampleId, sessionId = 'default') {
    const sample = getSampleProgramById(sampleId);
    if (!sample) {
      const err = new Error(`Sample program '${sampleId}' not found.`);
      err.status = 404;
      throw err;
    }

    return this.loadProgram(sample.code, 0, sessionId);
  },

  /**
   * Executes exactly one instruction cycle
   */
  step(sessionId = 'default') {
    const cpu = getCpuInstance(sessionId);
    const stepResult = cpu.stepInstruction();
    return {
      success: !cpu.isError,
      stepResult,
      cpuState: cpu.getState()
    };
  },

  /**
   * Executes exactly one micro-stage (FETCH -> DECODE -> EXECUTE -> MEMORY -> WRITEBACK)
   */
  stepMicro(sessionId = 'default') {
    const cpu = getCpuInstance(sessionId);
    const microResult = cpu.stepMicroStage();
    return {
      success: !cpu.isError,
      microResult,
      cpuState: cpu.getState()
    };
  },

  /**
   * Executes instructions continuously up to maxInstructions limit
   */
  run(maxInstructions = 1000, sessionId = 'default') {
    const cpu = getCpuInstance(sessionId);
    const limit = Math.min(Math.max(Number(maxInstructions) || 1000, 1), 50000);
    const runResult = cpu.run(limit);
    return {
      success: runResult.success,
      runResult,
      cpuState: cpu.getState()
    };
  },

  /**
   * Resets the CPU state and registers
   */
  reset(clearMemory = false, sessionId = 'default') {
    const cpu = getCpuInstance(sessionId);
    cpu.reset(Boolean(clearMemory));
    return {
      success: true,
      message: 'CPU state reset successfully.',
      cpuState: cpu.getState()
    };
  },

  /**
   * Retrieves the current CPU and memory state
   */
  getState(sessionId = 'default') {
    const cpu = getCpuInstance(sessionId);
    return {
      success: true,
      cpuState: cpu.getState()
    };
  },

  /**
   * Resets all emulator sessions (useful for test isolation)
   */
  clearAllSessions() {
    defaultCpu = new CpuEngine();
    sessions.clear();
  }
};

export default cpuService;
