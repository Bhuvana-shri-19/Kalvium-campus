/**
 * Two-Pass Assembler & Instruction Disassembler
 * Discipline: Computer Organization and Architecture (COA)
 * 
 * Features:
 *   - Parses assembly language mnemonics and operands
 *   - Resolves symbolic labels (e.g. 'LOOP:', 'START:')
 *   - Generates 16-bit binary machine code words
 *   - Reports syntax errors with exact 1-indexed line numbers
 *   - Provides disassembly of machine code words into readable instructions
 */

import {
  OPCODES,
  OPCODE_NAMES,
  REGISTERS,
  REGISTER_NAMES,
  WORD_MASK,
  formatHex16,
  formatHex8,
  toUnsigned16
} from './cpuArchitecture.js';

/**
 * Parses numeric literal (decimal, hex with 0x, binary with 0b, or hash prefix #12)
 */
export function parseNumberLiteral(token) {
  if (token === undefined || token === null) return null;
  const str = String(token).trim().replace(/^#/, '');

  if (/^0x[0-9a-f]+$/i.test(str)) {
    return parseInt(str, 16);
  }
  if (/^0b[01]+$/i.test(str)) {
    return parseInt(str.slice(2), 2);
  }
  if (/^-?[0-9]+$/.test(str)) {
    return parseInt(str, 10);
  }
  return null;
}

/**
 * Parses a register name (R0, R1, R2, R3 or ACC) into its 2-bit numeric index (0-3).
 * ACC is an alias for R0.
 */
export function parseRegister(token) {
  if (!token) return null;
  const upper = token.trim().toUpperCase().replace(/,$/, '');
  if (upper === 'ACC') return 0;
  if (REGISTERS[upper] !== undefined) {
    return REGISTERS[upper];
  }
  return null;
}

/**
 * Parses a memory operand, e.g. '[0x80]', '[128]', '[MY_LABEL]', or plain '0x80'
 */
export function parseMemoryOperand(token) {
  if (!token) return null;
  const trimmed = token.trim().replace(/,$/, '');
  const bracketMatch = trimmed.match(/^\[(.*)\]$/);
  const inner = bracketMatch ? bracketMatch[1].trim() : trimmed;
  return inner;
}

/**
 * Assembles assembly source code into an array of machine code words and debug metadata.
 * 
 * @param {string} sourceCode - Assembly program text
 * @param {number} [startAddress=0] - Initial memory address for the program
 * @returns {Object} {
 *   success: boolean,
 *   machineCode: number[],
 *   instructions: Array<{ address, line, text, machineCode, hex, mnemonic, operands }>,
 *   symbolTable: Object,
 *   errors: Array<{ line: number, message: string }>
 * }
 */
export function assemble(sourceCode, startAddress = 0) {
  if (typeof sourceCode !== 'string') {
    return {
      success: false,
      machineCode: [],
      instructions: [],
      symbolTable: {},
      errors: [{ line: 1, message: 'Source code must be a string.' }]
    };
  }

  const rawLines = sourceCode.split(/\r?\n/);
  const parsedLines = [];
  const symbolTable = {};
  const errors = [];

  let currentAddress = startAddress;

  // ============================================================================
  // PASS 1: Clean lines, discover labels, validate basic syntax, calculate addresses
  // ============================================================================
  for (let i = 0; i < rawLines.length; i++) {
    const lineNumber = i + 1;
    let line = rawLines[i];

    // Strip comments (; or //)
    const commentIdx = line.search(/;|(\/\/)/);
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx);
    }
    line = line.trim();

    if (!line) continue; // Skip blank lines

    // Extract leading label if present (e.g. "LOOP:" or "START: LDI R0, 5")
    let label = null;
    const labelMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
    if (labelMatch) {
      label = labelMatch[1].toUpperCase();
      if (symbolTable[label] !== undefined) {
        errors.push({ line: lineNumber, message: `Duplicate label '${label}' declared.` });
      } else {
        symbolTable[label] = currentAddress;
      }
      line = labelMatch[2].trim();
    }

    if (!line) {
      // Line only contained a label
      parsedLines.push({
        lineNumber,
        label,
        mnemonic: null,
        rawOperands: [],
        address: currentAddress,
        isOnlyLabel: true
      });
      continue;
    }

    // Split mnemonic and operand tokens
    const parts = line.split(/\s+/);
    const mnemonic = parts[0].toUpperCase();
    const operandStr = line.substring(parts[0].length).trim();

    // Split operands by comma
    const rawOperands = operandStr
      ? operandStr.split(',').map(op => op.trim()).filter(Boolean)
      : [];

    if (OPCODES[mnemonic] === undefined) {
      errors.push({
        line: lineNumber,
        message: `Unknown or unsupported instruction mnemonic '${mnemonic}'.`
      });
      continue;
    }

    parsedLines.push({
      lineNumber,
      label,
      mnemonic,
      rawOperands,
      address: currentAddress,
      originalText: rawLines[i].trim()
    });

    currentAddress += 1;
    if (currentAddress > 255) {
      errors.push({
        line: lineNumber,
        message: `Program size exceeded 256-word memory limit at address 0x${currentAddress.toString(16)}.`
      });
      break;
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      machineCode: [],
      instructions: [],
      symbolTable,
      errors
    };
  }

  // ============================================================================
  // PASS 2: Encode instructions into 16-bit binary words, resolve symbols
  // ============================================================================
  const machineCode = [];
  const instructions = [];

  for (const item of parsedLines) {
    if (item.isOnlyLabel) continue;

    const { lineNumber, mnemonic, rawOperands, address, originalText } = item;
    const opcode = OPCODES[mnemonic];
    let word = 0;

    switch (mnemonic) {
      case 'NOP': {
        if (rawOperands.length > 0) {
          errors.push({ line: lineNumber, message: `NOP expects no operands, received ${rawOperands.length}.` });
        }
        word = (opcode << 10) & WORD_MASK;
        break;
      }

      case 'HALT': {
        if (rawOperands.length > 0) {
          errors.push({ line: lineNumber, message: `HALT expects no operands, received ${rawOperands.length}.` });
        }
        word = (opcode << 10) & WORD_MASK;
        break;
      }

      case 'LDI': {
        // Syntax: LDI Rd, imm
        if (rawOperands.length !== 2) {
          errors.push({ line: lineNumber, message: `LDI expects exactly 2 operands (Rd, immediate), got ${rawOperands.length}.` });
          break;
        }
        const rd = parseRegister(rawOperands[0]);
        if (rd === null) {
          errors.push({ line: lineNumber, message: `Invalid destination register '${rawOperands[0]}'. Allowed: R0, R1, R2, R3, ACC.` });
          break;
        }

        let immVal = parseNumberLiteral(rawOperands[1]);
        if (immVal === null) {
          // Check if symbol
          const sym = rawOperands[1].toUpperCase();
          if (symbolTable[sym] !== undefined) {
            immVal = symbolTable[sym];
          } else {
            errors.push({ line: lineNumber, message: `Invalid immediate value or unresolved symbol '${rawOperands[1]}'.` });
            break;
          }
        }

        // Clamp to 8-bit unsigned
        const imm8 = (immVal & 0xFF) >>> 0;
        word = ((opcode << 10) | (rd << 8) | imm8) & WORD_MASK;
        break;
      }

      case 'LOAD': {
        // Syntax: LOAD Rd, [addr]
        if (rawOperands.length !== 2) {
          errors.push({ line: lineNumber, message: `LOAD expects exactly 2 operands (Rd, [addr]), got ${rawOperands.length}.` });
          break;
        }
        const rd = parseRegister(rawOperands[0]);
        if (rd === null) {
          errors.push({ line: lineNumber, message: `Invalid destination register '${rawOperands[0]}'. Allowed: R0, R1, R2, R3, ACC.` });
          break;
        }
        const addrToken = parseMemoryOperand(rawOperands[1]);
        let addrVal = parseNumberLiteral(addrToken);
        if (addrVal === null) {
          const sym = addrToken.toUpperCase();
          if (symbolTable[sym] !== undefined) {
            addrVal = symbolTable[sym];
          } else {
            errors.push({ line: lineNumber, message: `Invalid memory address or unresolved symbol '${addrToken}'.` });
            break;
          }
        }
        if (addrVal < 0 || addrVal > 255) {
          errors.push({ line: lineNumber, message: `Memory address '${addrVal}' out of bounds (0x00 to 0xFF).` });
          break;
        }
        word = ((opcode << 10) | (rd << 8) | (addrVal & 0xFF)) & WORD_MASK;
        break;
      }

      case 'STORE': {
        // Syntax: STORE [addr], Rs OR STORE Rs, [addr] (supports both for flexibility)
        if (rawOperands.length !== 2) {
          errors.push({ line: lineNumber, message: `STORE expects exactly 2 operands ([addr], Rs), got ${rawOperands.length}.` });
          break;
        }
        let addrToken, rsToken;
        if (rawOperands[0].startsWith('[') || parseRegister(rawOperands[0]) === null) {
          addrToken = parseMemoryOperand(rawOperands[0]);
          rsToken = rawOperands[1];
        } else {
          rsToken = rawOperands[0];
          addrToken = parseMemoryOperand(rawOperands[1]);
        }

        const rs = parseRegister(rsToken);
        if (rs === null) {
          errors.push({ line: lineNumber, message: `Invalid source register '${rsToken}'. Allowed: R0, R1, R2, R3, ACC.` });
          break;
        }
        let addrVal = parseNumberLiteral(addrToken);
        if (addrVal === null) {
          const sym = addrToken.toUpperCase();
          if (symbolTable[sym] !== undefined) {
            addrVal = symbolTable[sym];
          } else {
            errors.push({ line: lineNumber, message: `Invalid memory address or unresolved symbol '${addrToken}'.` });
            break;
          }
        }
        if (addrVal < 0 || addrVal > 255) {
          errors.push({ line: lineNumber, message: `Memory address '${addrVal}' out of bounds (0x00 to 0xFF).` });
          break;
        }
        word = ((opcode << 10) | (rs << 8) | (addrVal & 0xFF)) & WORD_MASK;
        break;
      }

      case 'MOV': {
        // Syntax: MOV Rd, Rs
        if (rawOperands.length !== 2) {
          errors.push({ line: lineNumber, message: `MOV expects exactly 2 operands (Rd, Rs), got ${rawOperands.length}.` });
          break;
        }
        const rd = parseRegister(rawOperands[0]);
        const rs = parseRegister(rawOperands[1]);
        if (rd === null) {
          errors.push({ line: lineNumber, message: `Invalid destination register '${rawOperands[0]}'.` });
          break;
        }
        if (rs === null) {
          errors.push({ line: lineNumber, message: `Invalid source register '${rawOperands[1]}'.` });
          break;
        }
        word = ((opcode << 10) | (rd << 8) | (rs << 6)) & WORD_MASK;
        break;
      }

      case 'ADD':
      case 'SUB':
      case 'AND':
      case 'OR':
      case 'XOR': {
        // Syntax: OP Rd, Rs1, Rs2 OR OP Rd, Rs (Rd = Rd OP Rs)
        let rd, rs1, rs2;
        if (rawOperands.length === 3) {
          rd = parseRegister(rawOperands[0]);
          rs1 = parseRegister(rawOperands[1]);
          rs2 = parseRegister(rawOperands[2]);
        } else if (rawOperands.length === 2) {
          rd = parseRegister(rawOperands[0]);
          rs1 = rd;
          rs2 = parseRegister(rawOperands[1]);
        } else {
          errors.push({ line: lineNumber, message: `${mnemonic} expects 2 or 3 register operands, got ${rawOperands.length}.` });
          break;
        }

        if (rd === null || rs1 === null || rs2 === null) {
          errors.push({ line: lineNumber, message: `Invalid registers in ${mnemonic} instruction.` });
          break;
        }
        word = ((opcode << 10) | (rd << 8) | (rs1 << 6) | (rs2 << 4)) & WORD_MASK;
        break;
      }

      case 'NOT': {
        // Syntax: NOT Rd, Rs OR NOT Rd (Rd = ~Rd)
        let rd, rs;
        if (rawOperands.length === 2) {
          rd = parseRegister(rawOperands[0]);
          rs = parseRegister(rawOperands[1]);
        } else if (rawOperands.length === 1) {
          rd = parseRegister(rawOperands[0]);
          rs = rd;
        } else {
          errors.push({ line: lineNumber, message: `NOT expects 1 or 2 register operands, got ${rawOperands.length}.` });
          break;
        }
        if (rd === null || rs === null) {
          errors.push({ line: lineNumber, message: `Invalid registers in NOT instruction.` });
          break;
        }
        word = ((opcode << 10) | (rd << 8) | (rs << 6)) & WORD_MASK;
        break;
      }

      case 'CMP': {
        // Syntax: CMP Rs1, Rs2
        if (rawOperands.length !== 2) {
          errors.push({ line: lineNumber, message: `CMP expects exactly 2 operands (Rs1, Rs2), got ${rawOperands.length}.` });
          break;
        }
        const rs1 = parseRegister(rawOperands[0]);
        const rs2 = parseRegister(rawOperands[1]);
        if (rs1 === null || rs2 === null) {
          errors.push({ line: lineNumber, message: `Invalid registers in CMP instruction.` });
          break;
        }
        word = ((opcode << 10) | (rs1 << 8) | (rs2 << 6)) & WORD_MASK;
        break;
      }

      case 'JMP':
      case 'JZ':
      case 'JNZ': {
        // Syntax: JMP target (label or numeric address)
        if (rawOperands.length !== 1) {
          errors.push({ line: lineNumber, message: `${mnemonic} expects 1 target address or label operand, got ${rawOperands.length}.` });
          break;
        }
        let targetAddr = parseNumberLiteral(rawOperands[0]);
        if (targetAddr === null) {
          const sym = rawOperands[0].toUpperCase();
          if (symbolTable[sym] !== undefined) {
            targetAddr = symbolTable[sym];
          } else {
            errors.push({ line: lineNumber, message: `Unresolved jump target label '${rawOperands[0]}'.` });
            break;
          }
        }
        if (targetAddr < 0 || targetAddr > 255) {
          errors.push({ line: lineNumber, message: `Jump target address '${targetAddr}' out of bounds (0x00 to 0xFF).` });
          break;
        }
        word = ((opcode << 10) | (targetAddr & 0xFF)) & WORD_MASK;
        break;
      }

      case 'PUSH':
      case 'OUT': {
        // Syntax: PUSH Rs, OUT Rs
        if (rawOperands.length !== 1) {
          errors.push({ line: lineNumber, message: `${mnemonic} expects 1 register operand, got ${rawOperands.length}.` });
          break;
        }
        const rs = parseRegister(rawOperands[0]);
        if (rs === null) {
          errors.push({ line: lineNumber, message: `Invalid register '${rawOperands[0]}' in ${mnemonic}.` });
          break;
        }
        word = ((opcode << 10) | (rs << 8)) & WORD_MASK;
        break;
      }

      case 'POP':
      case 'IN': {
        // Syntax: POP Rd, IN Rd
        if (rawOperands.length !== 1) {
          errors.push({ line: lineNumber, message: `${mnemonic} expects 1 destination register, got ${rawOperands.length}.` });
          break;
        }
        const rd = parseRegister(rawOperands[0]);
        if (rd === null) {
          errors.push({ line: lineNumber, message: `Invalid register '${rawOperands[0]}' in ${mnemonic}.` });
          break;
        }
        word = ((opcode << 10) | (rd << 8)) & WORD_MASK;
        break;
      }

      default: {
        errors.push({ line: lineNumber, message: `Unhandled mnemonic '${mnemonic}'.` });
        break;
      }
    }

    machineCode.push(word);
    instructions.push({
      address,
      line: lineNumber,
      text: originalText,
      machineCode: word,
      hex: formatHex16(word),
      mnemonic,
      operands: rawOperands
    });
  }

  return {
    success: errors.length === 0,
    machineCode: errors.length === 0 ? machineCode : [],
    instructions,
    symbolTable,
    errors
  };
}

/**
 * Disassembles a 16-bit binary machine code word into readable assembly instruction
 * 
 * @param {number} word - 16-bit machine word
 * @returns {Object} { mnemonic, operands, text, opcode, hex }
 */
export function disassemble(word) {
  const u16 = toUnsigned16(word);
  const opcode = (u16 >> 10) & 0x3F;
  const mnemonic = OPCODE_NAMES[opcode] || 'UNKNOWN';

  const regA = REGISTER_NAMES[(u16 >> 8) & 0x03];
  const regB = REGISTER_NAMES[(u16 >> 6) & 0x03];
  const regC = REGISTER_NAMES[(u16 >> 4) & 0x03];
  const imm8 = u16 & 0xFF;

  let operands = [];
  let text = mnemonic;

  switch (mnemonic) {
    case 'NOP':
    case 'HALT':
      break;

    case 'LDI':
      operands = [regA, `${imm8}`];
      text = `LDI ${regA}, ${imm8}`;
      break;

    case 'LOAD':
      operands = [regA, `[0x${imm8.toString(16).toUpperCase().padStart(2, '0')}]`];
      text = `LOAD ${regA}, [0x${imm8.toString(16).toUpperCase().padStart(2, '0')}]`;
      break;

    case 'STORE':
      operands = [`[0x${imm8.toString(16).toUpperCase().padStart(2, '0')}]`, regA];
      text = `STORE [0x${imm8.toString(16).toUpperCase().padStart(2, '0')}], ${regA}`;
      break;

    case 'MOV':
      operands = [regA, regB];
      text = `MOV ${regA}, ${regB}`;
      break;

    case 'ADD':
    case 'SUB':
    case 'AND':
    case 'OR':
    case 'XOR':
      operands = [regA, regB, regC];
      text = `${mnemonic} ${regA}, ${regB}, ${regC}`;
      break;

    case 'NOT':
      operands = [regA, regB];
      text = `NOT ${regA}, ${regB}`;
      break;

    case 'CMP':
      operands = [regA, regB];
      text = `CMP ${regA}, ${regB}`;
      break;

    case 'JMP':
    case 'JZ':
    case 'JNZ':
      operands = [`0x${imm8.toString(16).toUpperCase().padStart(2, '0')}`];
      text = `${mnemonic} 0x${imm8.toString(16).toUpperCase().padStart(2, '0')}`;
      break;

    case 'PUSH':
    case 'OUT':
      operands = [regA];
      text = `${mnemonic} ${regA}`;
      break;

    case 'POP':
    case 'IN':
      operands = [regA];
      text = `${mnemonic} ${regA}`;
      break;

    default:
      text = `DATA 0x${u16.toString(16).toUpperCase().padStart(4, '0')}`;
      break;
  }

  return {
    mnemonic,
    operands,
    text,
    opcode,
    hex: formatHex16(u16)
  };
}
