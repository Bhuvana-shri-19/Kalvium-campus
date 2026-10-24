/**
 * 16-Bit Educational CPU Architecture Specifications
 * Discipline: Computer Organization and Architecture (COA)
 * Syllabus Mapping:
 *   - Module 1: Introduction to Computer Organization and Architecture
 *   - Module 2: Central Processing Unit Design and Instruction Execution
 * 
 * Hardware Specifications:
 *   - Word Size: 16-bit unsigned (0x0000 - 0xFFFF) / two's complement (-32768 to +32767)
 *   - Address Space: 256 words (0x0000 - 0x00FF), 16 bits per word
 *   - General Purpose Registers: R0, R1, R2, R3 (16-bit)
 *   - Special Registers:
 *       - PC  (Program Counter): Address of next instruction
 *       - IR  (Instruction Register): Current 16-bit instruction word
 *       - MAR (Memory Address Register): Address placed on Address Bus
 *       - MDR (Memory Data Register): Data buffer for Memory Read/Write
 *       - ACC (Accumulator): Primary ALU target, alias to R0
 *       - SP  (Stack Pointer): Top of stack, initial 0x00FF, grows downwards
 *   - Status Flags (Flag Register):
 *       - Z (Zero Flag): Set when ALU output is 0
 *       - N (Negative Flag): Set when MSB (bit 15) is 1
 *       - C (Carry Flag): Set when unsigned arithmetic overflows bit 15 / borrow
 *       - V (Overflow Flag): Set when signed two's complement overflow occurs
 */

export const MEMORY_SIZE = 256; // 256 words (16-bit)
export const WORD_MASK = 0xFFFF;
export const SIGN_BIT_MASK = 0x8000;
export const STACK_INIT = 0x00FF;
export const CODE_START_ADDR = 0x0000;
export const DATA_START_ADDR = 0x0080;

/**
 * Register Identifiers & Binary Codes (2-bit ID for R0-R3)
 */
export const REGISTERS = Object.freeze({
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3
});

export const REGISTER_NAMES = ['R0', 'R1', 'R2', 'R3'];

/**
 * CPU Execution Micro-Stages (Classic 5-Stage Architecture)
 */
export const CPU_STAGES = Object.freeze({
  FETCH: 'FETCH',
  DECODE: 'DECODE',
  EXECUTE: 'EXECUTE',
  MEMORY: 'MEMORY',
  WRITEBACK: 'WRITEBACK'
});

export const CPU_STAGE_LIST = [
  CPU_STAGES.FETCH,
  CPU_STAGES.DECODE,
  CPU_STAGES.EXECUTE,
  CPU_STAGES.MEMORY,
  CPU_STAGES.WRITEBACK
];

/**
 * Instruction Set Architecture (ISA) - 6-Bit Opcodes (0x00 - 0x3F)
 */
export const OPCODES = Object.freeze({
  NOP:   0x00, // No Operation
  HALT:  0x01, // Stop CPU Execution
  LDI:   0x02, // Load Immediate: Rd <- imm8 (or imm16)
  LOAD:  0x03, // Load from Memory: Rd <- Memory[addr]
  STORE: 0x04, // Store to Memory: Memory[addr] <- Rs
  MOV:   0x05, // Copy Register: Rd <- Rs
  ADD:   0x06, // Addition: Rd <- Rs1 + Rs2 (or Rd <- Rd + Rs)
  SUB:   0x07, // Subtraction: Rd <- Rs1 - Rs2
  AND:   0x08, // Bitwise AND: Rd <- Rs1 & Rs2
  OR:    0x09, // Bitwise OR: Rd <- Rs1 | Rs2
  XOR:   0x0A, // Bitwise XOR: Rd <- Rs1 ^ Rs2
  NOT:   0x0B, // Bitwise NOT: Rd <- ~Rs
  CMP:   0x0C, // Compare: Rs1 - Rs2 -> updates Z, N, C, V flags
  JMP:   0x0D, // Unconditional Jump: PC <- addr
  JZ:    0x0E, // Jump if Zero (Z == 1): PC <- addr
  JNZ:   0x0F, // Jump if Not Zero (Z == 0): PC <- addr
  PUSH:  0x10, // Stack Push: SP <- SP - 1, Memory[SP] <- Rs
  POP:   0x11, // Stack Pop: Rd <- Memory[SP], SP <- SP + 1
  OUT:   0x12, // Output Port: Output <- Rs
  IN:    0x13  // Input Port: Rd <- Input
});

export const OPCODE_NAMES = Object.entries(OPCODES).reduce((acc, [name, code]) => {
  acc[code] = name;
  return acc;
}, {});

/**
 * Converts unsigned 16-bit word to signed 16-bit integer (-32768 to 32767)
 */
export function toSigned16(value) {
  const masked = value & WORD_MASK;
  return masked >= SIGN_BIT_MASK ? masked - 0x10000 : masked;
}

/**
 * Converts signed or unsigned number into clean unsigned 16-bit word (0 to 65535)
 */
export function toUnsigned16(value) {
  return ((value % 0x10000) + 0x10000) % 0x10000;
}

/**
 * Formats a 16-bit value as a 4-digit hexadecimal string (e.g. 0x00A0)
 */
export function formatHex16(value) {
  const u16 = toUnsigned16(value);
  return '0x' + u16.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats an 8-bit value as a 2-digit hexadecimal string (e.g. 0x80)
 */
export function formatHex8(value) {
  const u8 = (value & 0xFF) >>> 0;
  return '0x' + u8.toString(16).toUpperCase().padStart(2, '0');
}
