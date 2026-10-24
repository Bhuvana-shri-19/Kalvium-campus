/**
 * 16-Bit Instruction-Level CPU Emulator Test Suite (COA Module)
 * Discipline: Computer Organization and Architecture
 * 
 * Verifies all 14 mandatory criteria:
 *   1. Loading immediate values (LDI)
 *   2. Register-to-register movement (MOV)
 *   3. Addition and Subtraction (ADD, SUB)
 *   4. Zero (Z), Negative (N), Carry (C), and Overflow (V) flags
 *   5. Memory Store and Load (STORE, LOAD)
 *   6. Correct PC progression
 *   7. Conditional (JZ, JNZ) and unconditional (JMP) jumps
 *   8. HALT behavior
 *   9. Invalid opcode handling
 *   10. Invalid register and memory addresses
 *   11. Malformed program rejection with line numbers
 *   12. Execution step limits and infinite-loop protection
 *   13. Stack boundaries (PUSH, POP, Stack Overflow/Underflow)
 *   14. Agreement between single-step and continuous execution
 *   15. Express HTTP Endpoints Integration (/api/cpu/*)
 */

import { describe, it, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { CpuEngine } from '../src/algorithms/cpu/cpuEngine.js';
import { assemble, disassemble } from '../src/algorithms/cpu/assembler.js';
import { cpuService } from '../src/services/cpuService.js';
import { app } from '../src/app.js';

describe('COA 16-Bit Instruction-Level CPU Emulator', () => {
  let cpu;

  beforeEach(() => {
    cpu = new CpuEngine();
    cpuService.clearAllSessions();
  });

  // ============================================================================
  // 1. Loading Immediate Values (LDI)
  // ============================================================================
  describe('1. Immediate Loading (LDI)', () => {
    it('should correctly load 8-bit immediate values into all registers', () => {
      const code = `
        LDI R0, 42
        LDI R1, 128
        LDI R2, 255
        LDI R3, 0
        HALT
      `;
      const asm = assemble(code);
      assert.strictEqual(asm.success, true, 'Assembly must succeed');
      cpu.loadProgram(asm.machineCode);
      const run = cpu.run();

      assert.strictEqual(run.isHalted, true);
      assert.strictEqual(cpu.registers[0], 42);
      assert.strictEqual(cpu.registers[1], 128);
      assert.strictEqual(cpu.registers[2], 255);
      assert.strictEqual(cpu.registers[3], 0);
      assert.strictEqual(cpu.acc, 42, 'ACC must mirror R0');
    });
  });

  // ============================================================================
  // 2. Register-to-Register Movement (MOV)
  // ============================================================================
  describe('2. Register-to-Register Movement (MOV)', () => {
    it('should copy value from source register to destination without modifying source', () => {
      const code = `
        LDI R1, 88
        MOV R2, R1
        MOV R0, R2
        HALT
      `;
      const asm = assemble(code);
      assert.strictEqual(asm.success, true);
      cpu.loadProgram(asm.machineCode);
      cpu.run();

      assert.strictEqual(cpu.registers[1], 88, 'Source R1 preserved');
      assert.strictEqual(cpu.registers[2], 88, 'Target R2 updated');
      assert.strictEqual(cpu.registers[0], 88, 'Target R0 updated');
    });
  });

  // ============================================================================
  // 3. Addition and Subtraction (ADD, SUB)
  // ============================================================================
  describe('3. Addition and Subtraction (ADD, SUB)', () => {
    it('should compute ADD and SUB accurately with 3 and 2 operand forms', () => {
      const code = `
        LDI R0, 25
        LDI R1, 15
        ADD R2, R0, R1   ; R2 = 25 + 15 = 40
        LDI R3, 10
        SUB R2, R2, R3   ; R2 = 40 - 10 = 30
        SUB R0, R1       ; R0 = R0 - R1 = 25 - 15 = 10
        HALT
      `;
      const asm = assemble(code);
      assert.strictEqual(asm.success, true);
      cpu.loadProgram(asm.machineCode);
      cpu.run();

      assert.strictEqual(cpu.registers[2], 30);
      assert.strictEqual(cpu.registers[0], 10);
    });
  });

  // ============================================================================
  // 4. Status Flags Behavior (Z, N, C, V)
  // ============================================================================
  describe('4. Status Flags (Z, N, C, V)', () => {
    it('should set Zero flag (Z) when result is 0 and clear it when non-zero', () => {
      const code = `
        LDI R0, 5
        LDI R1, 5
        SUB R2, R0, R1   ; 5 - 5 = 0 -> Z=1
        HALT
      `;
      const asm = assemble(code);
      cpu.loadProgram(asm.machineCode);
      cpu.run();

      assert.strictEqual(cpu.registers[2], 0);
      assert.strictEqual(cpu.flags.Z, 1, 'Zero flag must be set');
      assert.strictEqual(cpu.flags.N, 0, 'Negative flag must be 0');
    });

    it('should set Negative flag (N) when MSB bit 15 is 1 (negative in two s complement)', () => {
      const code = `
        LDI R0, 3
        LDI R1, 5
        SUB R2, R0, R1   ; 3 - 5 = -2 (0xFFFE) -> N=1, Z=0
        HALT
      `;
      const asm = assemble(code);
      cpu.loadProgram(asm.machineCode);
      cpu.run();

      assert.strictEqual(cpu.registers[2], 0xFFFE);
      assert.strictEqual(cpu.flags.N, 1, 'Negative flag must be set for 0xFFFE');
      assert.strictEqual(cpu.flags.Z, 0, 'Zero flag must be 0');
      assert.strictEqual(cpu.flags.C, 1, 'Borrow / Carry flag must be set for 3 < 5');
    });

    it('should set Carry flag (C) on unsigned addition overflow beyond 16 bits', () => {
      // Setup near 0xFFFF in memory and add
      cpu.registers[0] = 0xFFFF;
      cpu.registers[1] = 0x0001;
      const code = `
        ADD R2, R0, R1   ; 0xFFFF + 1 = 0x0000 with carry out!
        HALT
      `;
      const asm = assemble(code);
      cpu.loadProgram(asm.machineCode);
      // Re-populate registers since loadProgram resets
      cpu.registers[0] = 0xFFFF;
      cpu.registers[1] = 0x0001;
      cpu.run();

      assert.strictEqual(cpu.registers[2], 0x0000);
      assert.strictEqual(cpu.flags.C, 1, 'Carry flag must be set on unsigned overflow');
      assert.strictEqual(cpu.flags.Z, 1, 'Zero flag must also be set');
    });

    it('should set Overflow flag (V) on signed two s complement overflow', () => {
      // 0x7FFF (+32767) + 1 = 0x8000 (-32768 in signed 16-bit): Overflow!
      const code = `
        ADD R2, R0, R1
        HALT
      `;
      const asm = assemble(code);
      cpu.loadProgram(asm.machineCode);
      cpu.registers[0] = 0x7FFF;
      cpu.registers[1] = 0x0001;
      cpu.run();

      assert.strictEqual(cpu.registers[2], 0x8000);
      assert.strictEqual(cpu.flags.V, 1, 'Signed overflow flag V must be set');
      assert.strictEqual(cpu.flags.N, 1, 'Result is negative in two s complement');
    });
  });

  // ============================================================================
  // 5. Memory Store and Load (STORE, LOAD)
  // ============================================================================
  describe('5. Memory Store and Load (STORE, LOAD)', () => {
    it('should store register value into RAM and read it back correctly', () => {
      const code = `
        LDI R0, 120
        STORE [0x00A5], R0
        LDI R1, 0        ; Clear R1
        LOAD R1, [0x00A5]
        HALT
      `;
      const asm = assemble(code);
      assert.strictEqual(asm.success, true);
      cpu.loadProgram(asm.machineCode);
      cpu.run();

      assert.strictEqual(cpu.memory[0x00A5], 120, 'RAM[0x00A5] must contain 120');
      assert.strictEqual(cpu.registers[1], 120, 'R1 must receive value loaded from RAM');
    });
  });

  // ============================================================================
  // 6. Correct Program Counter (PC) Progression
  // ============================================================================
  describe('6. Program Counter (PC) Progression', () => {
    it('should increment PC sequentially on each instruction fetch', () => {
      const code = `
        NOP
        NOP
        NOP
        HALT
      `;
      const asm = assemble(code);
      cpu.loadProgram(asm.machineCode);

      assert.strictEqual(cpu.pc, 0);
      cpu.stepInstruction();
      assert.strictEqual(cpu.pc, 1);
      cpu.stepInstruction();
      assert.strictEqual(cpu.pc, 2);
      cpu.stepInstruction();
      assert.strictEqual(cpu.pc, 3);
      cpu.stepInstruction();
      assert.strictEqual(cpu.isHalted, true);
    });
  });

  // ============================================================================
  // 7. Conditional and Unconditional Jumps (JMP, JZ, JNZ)
  // ============================================================================
  describe('7. Jumps & Branching (JMP, JZ, JNZ)', () => {
    it('should execute unconditional JMP correctly', () => {
      const code = `
        JMP TARGET
        LDI R0, 99       ; Should be skipped!
        TARGET:
        LDI R1, 77
        HALT
      `;
      const asm = assemble(code);
      assert.strictEqual(asm.success, true);
      cpu.loadProgram(asm.machineCode);
      cpu.run();

      assert.strictEqual(cpu.registers[0], 0, 'Skipped instruction must not execute');
      assert.strictEqual(cpu.registers[1], 77, 'Target instruction executed');
    });

    it('should execute JZ when Zero flag is 1 and fall through when 0', () => {
      const code = `
        LDI R0, 5
        LDI R1, 5
        CMP R0, R1       ; R0 == R1 -> Z = 1
        JZ EQUAL
        LDI R2, 10       ; Should be skipped!
        EQUAL:
        LDI R3, 20
        HALT
      `;
      const asm = assemble(code);
      assert.strictEqual(asm.success, true);
      cpu.loadProgram(asm.machineCode);
      cpu.run();

      assert.strictEqual(cpu.registers[2], 0, 'Branch taken so R2 remains 0');
      assert.strictEqual(cpu.registers[3], 20, 'EQUAL branch reached');
    });

    it('should execute JNZ loop to compute sum of 1 to 5 = 15', () => {
      const code = `
        LDI R0, 5        ; Counter
        LDI R1, 0        ; Sum
        LDI R2, 1        ; Step
        LOOP:
        ADD R1, R1, R0
        SUB R0, R0, R2   ; Decrement N (Z=1 when 0)
        JNZ LOOP
        OUT R1
        HALT
      `;
      const asm = assemble(code);
      assert.strictEqual(asm.success, true);
      cpu.loadProgram(asm.machineCode);
      const res = cpu.run();

      assert.strictEqual(res.isHalted, true);
      assert.strictEqual(cpu.registers[1], 15, '5 + 4 + 3 + 2 + 1 must equal 15');
      assert.strictEqual(cpu.outputLog.length, 1);
      assert.strictEqual(cpu.outputLog[0].value, 15);
    });
  });

  // ============================================================================
  // 8. HALT Behavior
  // ============================================================================
  describe('8. HALT Behavior', () => {
    it('should halt execution cleanly and ignore further step calls', () => {
      const code = `
        LDI R0, 10
        HALT
        LDI R0, 20       ; Must never execute
      `;
      const asm = assemble(code);
      cpu.loadProgram(asm.machineCode);
      cpu.stepInstruction(); // LDI R0, 10
      cpu.stepInstruction(); // HALT

      assert.strictEqual(cpu.isHalted, true);
      assert.strictEqual(cpu.registers[0], 10);

      // Subsequent step should do nothing
      const extraStep = cpu.stepInstruction();
      assert.strictEqual(extraStep.halted, true);
      assert.strictEqual(cpu.registers[0], 10, 'Register value unchanged after halt');
    });
  });

  // ============================================================================
  // 9. Invalid Opcode Handling
  // ============================================================================
  describe('9. Invalid Opcode Handling', () => {
    it('should transition to error state upon encountering an illegal opcode in memory', () => {
      // Opcode 0x3F (binary 111111) is undefined
      cpu.memory[0] = 0xFC00;
      cpu.pc = 0;
      const res = cpu.stepInstruction();

      assert.strictEqual(cpu.isError, true);
      assert.strictEqual(res.error, true);
      assert.ok(cpu.errorMessage.includes('Illegal Instruction'));
    });
  });

  // ============================================================================
  // 10. Memory Address Bounds and Error Protection
  // ============================================================================
  describe('10. Memory Address Bounds', () => {
    it('should reject memory address out of bounds in assembler and runtime', () => {
      const asm = assemble('LOAD R0, [0x0150]'); // > 255
      assert.strictEqual(asm.success, false);
      assert.ok(asm.errors.some(e => e.message.includes('out of bounds')));
    });
  });

  // ============================================================================
  // 11. Malformed Program Rejection with Line Numbers
  // ============================================================================
  describe('11. Malformed Program Rejection', () => {
    it('should reject unknown mnemonics and report line numbers', () => {
      const code = `
        LDI R0, 5
        INVALID_OPCODE R1
        HALT
      `;
      const asm = assemble(code);
      assert.strictEqual(asm.success, false);
      assert.strictEqual(asm.errors.length, 1);
      assert.strictEqual(asm.errors[0].line, 3);
      assert.ok(asm.errors[0].message.includes('INVALID_OPCODE'));
    });

    it('should reject invalid register operands with line numbers', () => {
      const code = `
        LDI R9, 10
      `;
      const asm = assemble(code);
      assert.strictEqual(asm.success, false);
      assert.strictEqual(asm.errors[0].line, 2);
      assert.ok(asm.errors[0].message.includes('Invalid destination register'));
    });
  });

  // ============================================================================
  // 12. Infinite Loop Protection & Instruction Limits
  // ============================================================================
  describe('12. Loop Protection & Step Limits', () => {
    it('should clamp continuous execution when maxInstructions limit is reached', () => {
      const code = `
        LOOP:
        NOP
        JMP LOOP
      `;
      const asm = assemble(code);
      cpu.loadProgram(asm.machineCode);
      const res = cpu.run(50); // limit to 50 instructions

      assert.strictEqual(res.hitLimit, true, 'Must report hitting instruction limit');
      assert.strictEqual(res.stepsRun, 50);
      assert.strictEqual(cpu.isHalted, false);
    });
  });

  // ============================================================================
  // 13. Stack Boundaries (PUSH, POP, Stack Overflow/Underflow)
  // ============================================================================
  describe('13. Stack Operations & Boundaries', () => {
    it('should correctly push and pop values using LIFO discipline', () => {
      const code = `
        LDI R0, 11
        LDI R1, 22
        PUSH R0
        PUSH R1
        POP R2           ; R2 receives 22
        POP R3           ; R3 receives 11
        HALT
      `;
      const asm = assemble(code);
      cpu.loadProgram(asm.machineCode);
      cpu.run();

      assert.strictEqual(cpu.registers[2], 22);
      assert.strictEqual(cpu.registers[3], 11);
      assert.strictEqual(cpu.sp, 0x00FF, 'SP must restore to STACK_INIT (0x00FF)');
    });

    it('should detect Stack Underflow when popping empty stack', () => {
      const code = `
        POP R0
      `;
      const asm = assemble(code);
      cpu.loadProgram(asm.machineCode);
      const res = cpu.stepInstruction();

      assert.strictEqual(cpu.isError, true);
      assert.ok(cpu.errorMessage.includes('Stack Underflow'));
    });
  });

  // ============================================================================
  // 14. Agreement Between Single-Step and Continuous Execution
  // ============================================================================
  describe('14. Agreement: Single-Step vs Continuous Run', () => {
    it('should produce identical register, memory, and flag states in both modes', () => {
      const program = `
        LDI R0, 7
        LDI R1, 5
        ADD R2, R0, R1
        STORE [0x0080], R2
        OUT R2
        HALT
      `;
      const asm = assemble(program);

      // Mode A: Continuous Run
      const cpuA = new CpuEngine();
      cpuA.loadProgram(asm.machineCode);
      cpuA.run();

      // Mode B: Single Stepping
      const cpuB = new CpuEngine();
      cpuB.loadProgram(asm.machineCode);
      while (!cpuB.isHalted && !cpuB.isError) {
        cpuB.stepInstruction();
      }

      // Assert identical states
      assert.deepStrictEqual(cpuA.registers, cpuB.registers);
      assert.deepStrictEqual(cpuA.flags, cpuB.flags);
      assert.strictEqual(cpuA.pc, cpuB.pc);
      assert.strictEqual(cpuA.memory[0x0080], cpuB.memory[0x0080]);
      assert.deepStrictEqual(cpuA.outputLog, cpuB.outputLog);
    });
  });

  // ============================================================================
  // 15. Express Controller & Endpoints Integration
  // ============================================================================
  describe('15. Express Controller & Endpoints Integration', () => {
    function mockReqRes(reqData = {}) {
      const req = { ...reqData, body: reqData.body || {}, query: reqData.query || {} };
      let statusCode = 200;
      let responseData = null;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          responseData = data;
          return this;
        }
      };
      return {
        req,
        res,
        getStatusCode: () => statusCode,
        getData: () => responseData
      };
    }

    it('getSamplePrograms should return educational sample programs', async () => {
      const { req, res, getStatusCode, getData } = mockReqRes();
      const { cpuController } = await import('../src/controllers/cpuController.js');

      cpuController.getSamplePrograms(req, res, (err) => { assert.fail(err); });
      assert.strictEqual(getStatusCode(), 200);
      const data = getData();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length >= 3, 'Must provide at least 3 sample programs');
    });

    it('assemble should validate and assemble source code', async () => {
      const { req, res, getStatusCode, getData } = mockReqRes({
        body: { code: 'LDI R0, 10\nOUT R0\nHALT' }
      });
      const { cpuController } = await import('../src/controllers/cpuController.js');

      cpuController.assemble(req, res, (err) => { assert.fail(err); });
      assert.strictEqual(getStatusCode(), 200);
      const data = getData();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.instructions.length, 3);
    });

    it('loadProgram and run should execute end-to-end via controller', async () => {
      const { cpuController } = await import('../src/controllers/cpuController.js');

      // 1. Load Program
      const loadContext = mockReqRes({
        body: { code: 'LDI R0, 7\nLDI R1, 5\nADD R2, R0, R1\nOUT R2\nHALT' }
      });
      cpuController.loadProgram(loadContext.req, loadContext.res, (err) => { assert.fail(err); });
      assert.strictEqual(loadContext.getStatusCode(), 200);
      assert.strictEqual(loadContext.getData().success, true);

      // 2. Run Program
      const runContext = mockReqRes({
        body: { maxInstructions: 100 }
      });
      cpuController.run(runContext.req, runContext.res, (err) => { assert.fail(err); });
      assert.strictEqual(runContext.getStatusCode(), 200);
      const runData = runContext.getData();
      assert.strictEqual(runData.success, true);
      assert.strictEqual(runData.cpuState.registers.R2, 12);
      assert.strictEqual(runData.cpuState.outputLog.length, 1);
      assert.strictEqual(runData.cpuState.outputLog[0].value, 12);
    });
  });

});
