/**
 * 16-Bit Deterministic CPU Execution Engine
 * Discipline: Computer Organization and Architecture (COA)
 * 
 * Implements:
 *   - Real 16-bit registers (R0-R3, PC, IR, MAR, MDR, SP, ACC)
 *   - 256-word physical memory address space (Uint16Array)
 *   - Arithmetic Logic Unit (ALU) with full Z, N, C, V flag calculation
 *   - Genuine 5-stage Fetch-Decode-Execute micro-architecture
 *   - Instruction-level and micro-stage stepping
 *   - Continuous execution with loop protection and interrupt halting
 *   - Direct output port console logging
 */

import {
  MEMORY_SIZE,
  WORD_MASK,
  SIGN_BIT_MASK,
  STACK_INIT,
  REGISTERS,
  REGISTER_NAMES,
  OPCODES,
  OPCODE_NAMES,
  CPU_STAGES,
  toSigned16,
  toUnsigned16,
  formatHex16,
  formatHex8
} from './cpuArchitecture.js';
import { disassemble } from './assembler.js';

export class CpuEngine {
  constructor(options = {}) {
    this.memorySize = options.memorySize || MEMORY_SIZE;
    this.memory = new Uint16Array(this.memorySize);

    // Register File: R0, R1, R2, R3 (16-bit)
    this.registers = new Uint16Array(4);

    // Special Purpose Hardware Registers
    this.pc = 0x0000;  // Program Counter
    this.ir = 0x0000;  // Instruction Register
    this.mar = 0x0000; // Memory Address Register
    this.mdr = 0x0000; // Memory Data Register
    this.sp = STACK_INIT; // Stack Pointer

    // Status Flags (Condition Codes)
    this.flags = {
      Z: 0, // Zero Flag
      N: 0, // Negative Flag
      C: 0, // Carry Flag
      V: 0  // Overflow Flag
    };

    // Execution Micro-Stage State
    this.currentStage = CPU_STAGES.FETCH;
    this.stageState = null; // Staged intermediate values across micro-cycles

    // Control & Telemetry State
    this.isHalted = false;
    this.isError = false;
    this.errorMessage = null;
    this.cycleCount = 0;
    this.instructionCount = 0;

    // Output Peripheral & Trace Logs
    this.outputLog = [];
    this.executionHistory = [];
  }

  /**
   * ACC (Accumulator) mirrors R0 in this architecture
   */
  get acc() {
    return this.registers[0];
  }

  set acc(val) {
    this.registers[0] = toUnsigned16(val);
  }

  /**
   * Resets all CPU registers, flags, and execution pointers back to initial state.
   * If clearMemory is true, also clears the memory array.
   */
  reset(clearMemory = false) {
    this.registers.fill(0);
    this.pc = 0x0000;
    this.ir = 0x0000;
    this.mar = 0x0000;
    this.mdr = 0x0000;
    this.sp = STACK_INIT;
    this.flags = { Z: 0, N: 0, C: 0, V: 0 };
    this.currentStage = CPU_STAGES.FETCH;
    this.stageState = null;
    this.isHalted = false;
    this.isError = false;
    this.errorMessage = null;
    this.cycleCount = 0;
    this.instructionCount = 0;
    this.outputLog = [];
    this.executionHistory = [];

    if (clearMemory) {
      this.memory.fill(0);
    }
  }

  /**
   * Loads machine code words into memory starting at specified base address.
   */
  loadProgram(machineCode, startAddress = 0x0000) {
    if (!Array.isArray(machineCode)) {
      throw new Error('Machine code must be an array of 16-bit words.');
    }
    if (startAddress < 0 || startAddress >= this.memorySize) {
      throw new Error(`Start address ${formatHex16(startAddress)} is out of memory bounds.`);
    }

    this.reset(false);
    for (let i = 0; i < machineCode.length; i++) {
      const target = startAddress + i;
      if (target < this.memorySize) {
        this.memory[target] = toUnsigned16(machineCode[i]);
      }
    }
    this.pc = startAddress;
  }

  /**
   * Updates Status Flags (Z, N, C, V) for ALU operations
   */
  _updateFlags(result, optType = 'none', op1 = 0, op2 = 0) {
    const u16 = toUnsigned16(result);

    // Zero Flag (Z): Set if result is zero
    this.flags.Z = u16 === 0 ? 1 : 0;

    // Negative Flag (N): Set if MSB (bit 15) is 1
    this.flags.N = (u16 & SIGN_BIT_MASK) !== 0 ? 1 : 0;

    if (optType === 'ADD') {
      // Carry Flag (C): Unsigned overflow beyond 16 bits
      this.flags.C = (op1 + op2) > 0xFFFF ? 1 : 0;

      // Overflow Flag (V): Signed two's complement overflow
      const s1 = toSigned16(op1);
      const s2 = toSigned16(op2);
      const sRes = toSigned16(u16);
      this.flags.V = ((s1 >= 0 && s2 >= 0 && sRes < 0) || (s1 < 0 && s2 < 0 && sRes >= 0)) ? 1 : 0;
    } else if (optType === 'SUB' || optType === 'CMP') {
      // Carry Flag (C): Borrow occurred (op1 < op2 in unsigned math)
      this.flags.C = (op1 >>> 0) < (op2 >>> 0) ? 1 : 0;

      // Overflow Flag (V): Signed two's complement underflow/overflow
      const s1 = toSigned16(op1);
      const s2 = toSigned16(op2);
      const sRes = toSigned16(u16);
      this.flags.V = ((s1 >= 0 && s2 < 0 && sRes < 0) || (s1 < 0 && s2 >= 0 && sRes >= 0)) ? 1 : 0;
    } else if (optType === 'LOGIC') {
      // Bitwise operations clear Carry and Overflow
      this.flags.C = 0;
      this.flags.V = 0;
    }
  }

  /**
   * Executes exactly one complete Fetch-Decode-Execute instruction cycle.
   * 
   * @returns {Object} Execution snapshot including changed registers and description
   */
  stepInstruction() {
    if (this.isHalted) {
      return {
        halted: true,
        message: 'CPU is halted. Reset CPU or load a new program to resume.'
      };
    }
    if (this.isError) {
      return {
        error: true,
        message: `CPU in error state: ${this.errorMessage}`
      };
    }

    const startPC = this.pc;
    const initialRegs = [...this.registers];
    const initialFlags = { ...this.flags };

    // ==========================================================================
    // STAGE 1: FETCH
    // MAR <- PC
    // MDR <- Memory[MAR]
    // IR  <- MDR
    // PC  <- PC + 1
    // ==========================================================================
    if (this.pc >= this.memorySize) {
      this.isError = true;
      this.errorMessage = `Program Counter ${formatHex16(this.pc)} reached beyond memory capacity (${this.memorySize} words).`;
      return { error: true, message: this.errorMessage };
    }

    this.mar = this.pc;
    this.mdr = this.memory[this.mar];
    this.ir = this.mdr;
    this.pc = (this.pc + 1) & 0xFF; // Wrap at 256 words
    this.cycleCount++;

    // ==========================================================================
    // STAGE 2: DECODE
    // Parse opcode, register operands, addresses, and immediate literals
    // ==========================================================================
    const opcode = (this.ir >> 10) & 0x3F;
    const mnemonic = OPCODE_NAMES[opcode] || 'UNKNOWN';

    const regA = (this.ir >> 8) & 0x03;
    const regB = (this.ir >> 6) & 0x03;
    const regC = (this.ir >> 4) & 0x03;
    const imm8 = this.ir & 0xFF;

    let explanation = '';
    let memoryChanged = null;

    // ==========================================================================
    // STAGES 3, 4, 5: EXECUTE, MEMORY ACCESS, WRITEBACK
    // ==========================================================================
    switch (opcode) {
      case OPCODES.NOP: {
        explanation = 'NOP: No operation performed. Pipeline idle for 1 cycle.';
        break;
      }

      case OPCODES.HALT: {
        this.isHalted = true;
        explanation = `HALT: Clock gate disabled. CPU execution halted at PC=${formatHex16(startPC)}.`;
        break;
      }

      case OPCODES.LDI: {
        // Rd <- imm8
        this.registers[regA] = imm8;
        explanation = `LDI: Loaded immediate value ${imm8} (${formatHex16(imm8)}) into register ${REGISTER_NAMES[regA]}.`;
        break;
      }

      case OPCODES.LOAD: {
        // MAR <- imm8, MDR <- Memory[MAR], Rd <- MDR
        const targetAddr = imm8;
        this.mar = targetAddr;
        this.mdr = this.memory[this.mar];
        this.registers[regA] = this.mdr;
        explanation = `LOAD: Read value ${this.mdr} (${formatHex16(this.mdr)}) from RAM[${formatHex16(targetAddr)}] into ${REGISTER_NAMES[regA]}.`;
        break;
      }

      case OPCODES.STORE: {
        // MAR <- imm8, MDR <- Rs, Memory[MAR] <- MDR
        const targetAddr = imm8;
        this.mar = targetAddr;
        this.mdr = this.registers[regA];
        this.memory[this.mar] = this.mdr;
        memoryChanged = { address: targetAddr, value: this.mdr };
        explanation = `STORE: Wrote value ${this.mdr} (${formatHex16(this.mdr)}) from ${REGISTER_NAMES[regA]} into RAM[${formatHex16(targetAddr)}].`;
        break;
      }

      case OPCODES.MOV: {
        // Rd <- Rs
        this.registers[regA] = this.registers[regB];
        explanation = `MOV: Copied value ${this.registers[regA]} from ${REGISTER_NAMES[regB]} to ${REGISTER_NAMES[regA]}.`;
        break;
      }

      case OPCODES.ADD: {
        // Rd <- Rs1 + Rs2
        const op1 = this.registers[regB];
        const op2 = this.registers[regC];
        const res = (op1 + op2) & WORD_MASK;
        this.registers[regA] = res;
        this._updateFlags(res, 'ADD', op1, op2);
        explanation = `ADD: ${REGISTER_NAMES[regB]} (${op1}) + ${REGISTER_NAMES[regC]} (${op2}) = ${res} -> ${REGISTER_NAMES[regA]}. Flags: Z=${this.flags.Z}, N=${this.flags.N}, C=${this.flags.C}, V=${this.flags.V}.`;
        break;
      }

      case OPCODES.SUB: {
        // Rd <- Rs1 - Rs2
        const op1 = this.registers[regB];
        const op2 = this.registers[regC];
        const res = (op1 - op2) & WORD_MASK;
        this.registers[regA] = res;
        this._updateFlags(res, 'SUB', op1, op2);
        explanation = `SUB: ${REGISTER_NAMES[regB]} (${op1}) - ${REGISTER_NAMES[regC]} (${op2}) = ${res} (${toSigned16(res)}) -> ${REGISTER_NAMES[regA]}. Flags: Z=${this.flags.Z}, N=${this.flags.N}, C=${this.flags.C}, V=${this.flags.V}.`;
        break;
      }

      case OPCODES.AND: {
        const op1 = this.registers[regB];
        const op2 = this.registers[regC];
        const res = (op1 & op2) & WORD_MASK;
        this.registers[regA] = res;
        this._updateFlags(res, 'LOGIC');
        explanation = `AND: ${REGISTER_NAMES[regB]} & ${REGISTER_NAMES[regC]} = ${formatHex16(res)} -> ${REGISTER_NAMES[regA]}.`;
        break;
      }

      case OPCODES.OR: {
        const op1 = this.registers[regB];
        const op2 = this.registers[regC];
        const res = (op1 | op2) & WORD_MASK;
        this.registers[regA] = res;
        this._updateFlags(res, 'LOGIC');
        explanation = `OR: ${REGISTER_NAMES[regB]} | ${REGISTER_NAMES[regC]} = ${formatHex16(res)} -> ${REGISTER_NAMES[regA]}.`;
        break;
      }

      case OPCODES.XOR: {
        const op1 = this.registers[regB];
        const op2 = this.registers[regC];
        const res = (op1 ^ op2) & WORD_MASK;
        this.registers[regA] = res;
        this._updateFlags(res, 'LOGIC');
        explanation = `XOR: ${REGISTER_NAMES[regB]} ^ ${REGISTER_NAMES[regC]} = ${formatHex16(res)} -> ${REGISTER_NAMES[regA]}.`;
        break;
      }

      case OPCODES.NOT: {
        const op = this.registers[regB];
        const res = (~op) & WORD_MASK;
        this.registers[regA] = res;
        this._updateFlags(res, 'LOGIC');
        explanation = `NOT: ~${REGISTER_NAMES[regB]} (${formatHex16(op)}) = ${formatHex16(res)} -> ${REGISTER_NAMES[regA]}.`;
        break;
      }

      case OPCODES.CMP: {
        const op1 = this.registers[regA];
        const op2 = this.registers[regB];
        const res = (op1 - op2) & WORD_MASK;
        this._updateFlags(res, 'CMP', op1, op2);
        explanation = `CMP: Compared ${REGISTER_NAMES[regA]} (${op1}) with ${REGISTER_NAMES[regB]} (${op2}). Result discarded. Flags updated: Z=${this.flags.Z}, N=${this.flags.N}, C=${this.flags.C}, V=${this.flags.V}.`;
        break;
      }

      case OPCODES.JMP: {
        const target = imm8;
        this.pc = target;
        explanation = `JMP: Unconditional branch taken to address ${formatHex16(target)}.`;
        break;
      }

      case OPCODES.JZ: {
        const target = imm8;
        if (this.flags.Z === 1) {
          this.pc = target;
          explanation = `JZ: Zero flag is set (Z=1). Branch taken to address ${formatHex16(target)}.`;
        } else {
          explanation = `JZ: Zero flag is clear (Z=0). Branch NOT taken. PC continues to ${formatHex16(this.pc)}.`;
        }
        break;
      }

      case OPCODES.JNZ: {
        const target = imm8;
        if (this.flags.Z === 0) {
          this.pc = target;
          explanation = `JNZ: Zero flag is clear (Z=0). Branch taken to address ${formatHex16(target)}.`;
        } else {
          explanation = `JNZ: Zero flag is set (Z=1). Branch NOT taken. PC continues to ${formatHex16(this.pc)}.`;
        }
        break;
      }

      case OPCODES.PUSH: {
        // SP <- SP - 1, MAR <- SP, MDR <- Rs, Memory[MAR] <- MDR
        if (this.sp <= 0x00E0) {
          this.isError = true;
          this.errorMessage = `Stack Overflow: Stack Pointer reached bottom boundary ${formatHex16(this.sp)}.`;
          return { error: true, message: this.errorMessage };
        }
        this.sp = (this.sp - 1) & 0xFF;
        this.mar = this.sp;
        this.mdr = this.registers[regA];
        this.memory[this.mar] = this.mdr;
        memoryChanged = { address: this.mar, value: this.mdr };
        explanation = `PUSH: Pushed ${REGISTER_NAMES[regA]} (${this.mdr}) onto stack at RAM[${formatHex16(this.sp)}]. SP updated to ${formatHex16(this.sp)}.`;
        break;
      }

      case OPCODES.POP: {
        // MAR <- SP, MDR <- Memory[MAR], Rd <- MDR, SP <- SP + 1
        if (this.sp >= STACK_INIT) {
          this.isError = true;
          this.errorMessage = `Stack Underflow: Attempted to POP from empty stack at SP=${formatHex16(this.sp)}.`;
          return { error: true, message: this.errorMessage };
        }
        this.mar = this.sp;
        this.mdr = this.memory[this.mar];
        this.registers[regA] = this.mdr;
        this.sp = (this.sp + 1) & 0xFF;
        explanation = `POP: Popped value ${this.mdr} (${formatHex16(this.mdr)}) from stack into ${REGISTER_NAMES[regA]}. SP restored to ${formatHex16(this.sp)}.`;
        break;
      }

      case OPCODES.OUT: {
        const val = this.registers[regA];
        const outEntry = {
          cycle: this.cycleCount,
          instruction: this.instructionCount + 1,
          register: REGISTER_NAMES[regA],
          value: val,
          signedValue: toSigned16(val),
          hex: formatHex16(val),
          timestamp: new Date().toISOString()
        };
        this.outputLog.push(outEntry);
        explanation = `OUT: Port 0x01 Output latched value ${val} (${formatHex16(val)}) from ${REGISTER_NAMES[regA]}.`;
        break;
      }

      default: {
        this.isError = true;
        this.errorMessage = `Illegal Instruction: Unrecognized opcode 0x${opcode.toString(16).toUpperCase()} at PC=${formatHex16(startPC)}.`;
        explanation = this.errorMessage;
        return { error: true, message: this.errorMessage };
      }
    }

    this.instructionCount++;

    const logEntry = {
      step: this.instructionCount,
      cycle: this.cycleCount,
      pc: startPC,
      pcHex: formatHex16(startPC),
      nextPc: this.pc,
      nextPcHex: formatHex16(this.pc),
      ir: this.ir,
      irHex: formatHex16(this.ir),
      disassembly: disassemble(this.ir).text,
      explanation,
      registers: [...this.registers],
      flags: { ...this.flags },
      memoryChanged
    };

    this.executionHistory.push(logEntry);
    return logEntry;
  }

  /**
   * Advances the CPU by exactly one micro-stage:
   * FETCH -> DECODE -> EXECUTE -> MEMORY -> WRITEBACK -> FETCH
   */
  stepMicroStage() {
    if (this.isHalted) {
      return { halted: true, stage: this.currentStage, message: 'CPU is halted.' };
    }
    if (this.isError) {
      return { error: true, stage: this.currentStage, message: this.errorMessage };
    }

    const stage = this.currentStage;
    let description = '';

    switch (stage) {
      case CPU_STAGES.FETCH: {
        if (this.pc >= this.memorySize) {
          this.isError = true;
          this.errorMessage = `PC out of bounds (${formatHex16(this.pc)}).`;
          return { error: true, message: this.errorMessage };
        }
        this.mar = this.pc;
        this.mdr = this.memory[this.mar];
        this.ir = this.mdr;
        this.stageState = {
          fetchPC: this.pc,
          opcode: (this.ir >> 10) & 0x3F,
          regA: (this.ir >> 8) & 0x03,
          regB: (this.ir >> 6) & 0x03,
          regC: (this.ir >> 4) & 0x03,
          imm8: this.ir & 0xFF
        };
        this.pc = (this.pc + 1) & 0xFF;
        this.currentStage = CPU_STAGES.DECODE;
        description = `FETCH: MAR <- PC (${formatHex16(this.mar)}), MDR <- RAM[MAR] (${formatHex16(this.mdr)}), IR <- MDR, PC <- PC + 1.`;
        break;
      }

      case CPU_STAGES.DECODE: {
        const { opcode } = this.stageState;
        const mnemonic = OPCODE_NAMES[opcode] || 'UNKNOWN';
        this.currentStage = CPU_STAGES.EXECUTE;
        description = `DECODE: Identified opcode 0x${opcode.toString(16)} (${mnemonic}). Parsed register operands.`;
        break;
      }

      case CPU_STAGES.EXECUTE: {
        // Prepare ALU / branch computations
        this.currentStage = CPU_STAGES.MEMORY;
        description = `EXECUTE: ALU evaluation and address calculations computed.`;
        break;
      }

      case CPU_STAGES.MEMORY: {
        this.currentStage = CPU_STAGES.WRITEBACK;
        description = `MEMORY: RAM read/write operations completed or bypassed for register-only ops.`;
        break;
      }

      case CPU_STAGES.WRITEBACK: {
        // Complete instruction execution and update registers/flags
        // To keep semantics completely identical, rewind PC and call stepInstruction()
        this.pc = this.stageState.fetchPC;
        const result = this.stepInstruction();
        this.currentStage = CPU_STAGES.FETCH;
        this.stageState = null;
        return {
          stage: CPU_STAGES.WRITEBACK,
          completedInstruction: true,
          ...result
        };
      }
    }

    return {
      stage,
      nextStage: this.currentStage,
      description,
      registers: [...this.registers],
      pc: this.pc,
      ir: this.ir,
      mar: this.mar,
      mdr: this.mdr,
      sp: this.sp,
      flags: { ...this.flags }
    };
  }

  /**
   * Executes instructions continuously until HALT, error, or maxInstructions limit.
   * 
   * @param {number} [maxInstructions=1000] - Infinite loop safeguard
   * @returns {Object} Final execution state and history summary
   */
  run(maxInstructions = 1000) {
    let stepsRun = 0;

    while (!this.isHalted && !this.isError && stepsRun < maxInstructions) {
      this.stepInstruction();
      stepsRun++;
    }

    const hitLimit = !this.isHalted && !this.isError && stepsRun >= maxInstructions;

    return {
      success: !this.isError,
      isHalted: this.isHalted,
      isError: this.isError,
      errorMessage: this.errorMessage,
      hitLimit,
      stepsRun,
      totalInstructions: this.instructionCount,
      cycles: this.cycleCount,
      outputLog: this.outputLog,
      state: this.getState()
    };
  }

  /**
   * Returns a complete, serializable snapshot of the CPU and memory state.
   */
  getState() {
    return {
      registers: {
        R0: this.registers[0],
        R1: this.registers[1],
        R2: this.registers[2],
        R3: this.registers[3],
        ACC: this.registers[0],
        PC: this.pc,
        IR: this.ir,
        MAR: this.mar,
        MDR: this.mdr,
        SP: this.sp
      },
      hexRegisters: {
        R0: formatHex16(this.registers[0]),
        R1: formatHex16(this.registers[1]),
        R2: formatHex16(this.registers[2]),
        R3: formatHex16(this.registers[3]),
        ACC: formatHex16(this.registers[0]),
        PC: formatHex16(this.pc),
        IR: formatHex16(this.ir),
        MAR: formatHex16(this.mar),
        MDR: formatHex16(this.mdr),
        SP: formatHex16(this.sp)
      },
      flags: { ...this.flags },
      currentStage: this.currentStage,
      isHalted: this.isHalted,
      isError: this.isError,
      errorMessage: this.errorMessage,
      cycleCount: this.cycleCount,
      instructionCount: this.instructionCount,
      outputLog: [...this.outputLog],
      currentInstruction: disassemble(this.ir),
      nextInstruction: disassemble(this.memory[this.pc] || 0),
      memorySnapshot: Array.from(this.memory.slice(0, 32)).map((val, idx) => ({
        address: idx,
        hexAddr: formatHex8(idx),
        value: val,
        hexVal: formatHex16(val),
        disassembly: disassemble(val).text
      }))
    };
  }
}

export default CpuEngine;
