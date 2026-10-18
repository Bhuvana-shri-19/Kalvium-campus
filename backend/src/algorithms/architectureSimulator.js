/**
 * Computer Organization & Architecture (COA) Simulator
 * Models von Neumann architecture components:
 * - Functional Units: Input Unit, Memory Unit, CPU (CU, ALU, Registers), Output Unit
 * - System Buses: Address Bus, Data Bus, Control Bus
 */

export const ARCHITECTURE_SPECS = {
  units: {
    inputUnit: "Receives raw campus requests, translates external stimuli into digital binary/words.",
    memoryUnit: "Simulated RAM & Cache with distinct addressable memory blocks.",
    cpu: {
      controlUnit: "Decodes instructions, orchestrates synchronization, directs bus traffic.",
      alu: "Executes arithmetic calculations, eligibility comparisons, and logical checks.",
      registers: {
        PC: "Program Counter: holds memory address of next instruction.",
        MAR: "Memory Address Register: holds address currently on the address bus.",
        MDR: "Memory Data Register: buffers data read from or written to memory.",
        IR: "Instruction Register: holds current instruction being decoded.",
        ACC: "Accumulator: stores intermediate and final results of ALU operations."
      }
    },
    outputUnit: "Latches final status and response packets for user consumption."
  },
  buses: {
    addressBus: "Unidirectional bus conveying physical addresses from CPU to Memory.",
    dataBus: "Bidirectional bus transferring instruction and payload words.",
    controlBus: "Multi-line bus carrying timing, strobe, read/write, and interrupt control signals."
  }
};

/**
 * Simulates processing a campus request through the computer architecture pipeline.
 * 
 * @param {Object} requestPacket - Contains studentId, requestType, params
 * @returns {Object} Complete trace of hardware states, buses, and register changes
 */
export function simulateArchitectureExecution(requestPacket) {
  const { studentId = "KAL-2026-901", requestType = "HALL_TICKET", priority = 1, creditUnits = 18 } = requestPacket || {};
  
  const simulationSteps = [];
  const memoryMap = {
    "0x00A0": { label: "INSTRUCTION_HEADER", value: `OP_${requestType}` },
    "0x00A1": { label: "STUDENT_ID", value: studentId },
    "0x00A2": { label: "CREDIT_UNITS", value: creditUnits },
    "0x00A3": { label: "PRIORITY_LEVEL", value: priority },
    "0x00B0": { label: "OUTPUT_STATUS_REGISTER", value: "0x0000" }
  };

  const registers = {
    PC: "0x00A0",
    MAR: "0x0000",
    MDR: "0x0000",
    IR: "NOP",
    ACC: 0
  };

  // Step 1: Input Unit Ingestion
  simulationSteps.push({
    step: 1,
    phase: "INPUT_INGESTION",
    unit: "INPUT_UNIT",
    academicFocus: "COA: Data acquisition and peripheral latching",
    buses: {
      addressBus: "0x00A0",
      dataBus: `PAYLOAD[${studentId}, ${requestType}]`,
      controlBus: "I/O_STROBE | DATA_READY"
    },
    registers: { ...registers },
    description: "Input Unit captures student request, buffers payload, and alerts the CPU via control strobe."
  });

  // Step 2: Memory Buffering
  registers.MAR = "0x00A0";
  registers.MDR = memoryMap["0x00A0"].value;
  simulationSteps.push({
    step: 2,
    phase: "MEMORY_ALLOCATION",
    unit: "MEMORY_UNIT",
    academicFocus: "COA: RAM addressing and memory bus synchronization",
    buses: {
      addressBus: registers.MAR,
      dataBus: registers.MDR,
      controlBus: "MEM_WRITE | WRITE_ENABLE"
    },
    registers: { ...registers },
    description: "Memory Unit maps incoming instruction packet to reserved RAM block starting at 0x00A0."
  });

  // Step 3: Instruction Fetch (IF)
  registers.MAR = registers.PC;
  registers.MDR = memoryMap[registers.MAR].value;
  registers.IR = registers.MDR;
  registers.PC = "0x00A1"; // Increment PC
  simulationSteps.push({
    step: 3,
    phase: "INSTRUCTION_FETCH",
    unit: "CPU_CONTROL_UNIT",
    academicFocus: "COA: Fetch cycle (MAR <- PC, MDR <- M[MAR], IR <- MDR, PC <- PC + 1)",
    buses: {
      addressBus: registers.MAR,
      dataBus: registers.MDR,
      controlBus: "MEM_READ | BUS_GRANT"
    },
    registers: { ...registers },
    description: "Control Unit fetches opcode from memory into Instruction Register (IR) via Address and Data buses."
  });

  // Step 4: Instruction Decode (ID)
  simulationSteps.push({
    step: 4,
    phase: "INSTRUCTION_DECODE",
    unit: "CPU_CONTROL_UNIT",
    academicFocus: "COA: Instruction decoder circuitry & micro-operation generation",
    buses: {
      addressBus: "0x00A1",
      dataBus: "IDLE",
      controlBus: "DECODE_ACTIVE | ALU_CONFIG"
    },
    registers: { ...registers },
    description: `Control Unit decodes opcode '${registers.IR}', generating control micro-signals for arithmetic logic unit.`
  });

  // Step 5: Operand Read & Execute (EX via ALU)
  registers.MAR = "0x00A2";
  registers.MDR = `${creditUnits}`;
  const isApproved = creditUnits <= 24;
  registers.ACC = isApproved ? 1 : 0;
  simulationSteps.push({
    step: 5,
    phase: "ALU_EXECUTE",
    unit: "CPU_ALU",
    academicFocus: "COA: Arithmetic Logic Unit computation & Accumulator update",
    buses: {
      addressBus: registers.MAR,
      dataBus: registers.MDR,
      controlBus: "ALU_OP_CMP | ZERO_FLAG_EVAL"
    },
    registers: { ...registers },
    description: `ALU validates academic criteria (credits: ${creditUnits} <= 24 limit). Result saved in Accumulator (ACC = ${registers.ACC}).`
  });

  // Step 6: Memory Write-Back
  registers.MAR = "0x00B0";
  registers.MDR = registers.ACC === 1 ? "VALIDATED" : "FLAGGED";
  memoryMap["0x00B0"].value = registers.MDR;
  simulationSteps.push({
    step: 6,
    phase: "WRITE_BACK",
    unit: "MEMORY_UNIT",
    academicFocus: "COA: Store cycle to persist output state into system RAM",
    buses: {
      addressBus: registers.MAR,
      dataBus: registers.MDR,
      controlBus: "MEM_WRITE | LATCH_ENABLE"
    },
    registers: { ...registers },
    description: `CPU writes final result '${registers.MDR}' to status memory register at 0x00B0.`
  });

  // Step 7: Output Unit Latching
  simulationSteps.push({
    step: 7,
    phase: "OUTPUT_DISPATCH",
    unit: "OUTPUT_UNIT",
    academicFocus: "COA: Peripheral bus transfer & digital-to-user representation",
    buses: {
      addressBus: "0x00B0",
      dataBus: registers.MDR,
      controlBus: "OUT_STROBE | ACK_RECEIVED"
    },
    registers: { ...registers },
    description: `Output Unit latches result '${registers.MDR}' and dispatches response confirmation to student terminal.`
  });

  return {
    architecture: "Von Neumann Machine Simulation",
    request: { studentId, requestType, priority, creditUnits },
    status: isApproved ? "SUCCESS" : "REJECTED_CREDIT_LIMIT",
    finalRegisters: { ...registers },
    memorySnapshot: memoryMap,
    steps: simulationSteps
  };
}
