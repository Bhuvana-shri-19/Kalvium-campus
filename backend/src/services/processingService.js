/**
 * Computer Organization & Architecture (COA Module)
 * Processing Service: Simplified Functional-Unit Simulation
 * 
 * ==============================================================================
 * EDUCATIONAL PURPOSE & DISCLAIMER:
 * 
 * This module models a conceptual von Neumann computer architecture demonstrating
 * how four primary functional units interact via the system bus:
 *   Input Unit -> Memory Unit -> CPU -> Output Unit
 * 
 * DISCLAIMER:
 * This simulation is strictly educational and conceptual. It DOES NOT execute
 * binary machine opcodes (x86/ARM/RISC-V), decode silicon microcode, or claim
 * to emulate real microprocessor hardware. It is designed to teach computer
 * organization fundamentals to beginners in an approachable, visual manner.
 * ==============================================================================
 */

/**
 * System Bus Concepts & Specifications
 */
export const BUS_CONCEPTS = Object.freeze({
  DATA_BUS: {
    name: "Data Bus",
    type: "Bidirectional",
    description: "Carries raw data, parameters, instruction payloads, and processed results between units.",
    educationalRole: "Like a two-way courier carrying packages between the CPU, RAM, and I/O units."
  },
  ADDRESS_BUS: {
    name: "Address Bus",
    type: "Unidirectional (driven by CPU)",
    description: "Carries memory pointers (e.g., 0x00A0) identifying which cell or peripheral port is being accessed.",
    educationalRole: "Like a postal address written on an envelope that specifies the exact house to deliver to."
  },
  CONTROL_BUS: {
    name: "Control Bus",
    type: "Unidirectional & Bidirectional control lines",
    description: "Carries synchronization strobes, clock ticks, read/write commands, and completion signals.",
    educationalRole: "Like traffic signals and conductor gestures coordinating when units are permitted to read or write."
  }
});

/**
 * The 4 Functional Units in von Neumann Execution Sequence
 */
export const FUNCTIONAL_UNIT_STAGES = Object.freeze([
  {
    stageIndex: 0,
    unitId: "INPUT_UNIT",
    name: "Input Unit",
    role: "Peripheral Ingestion & Protocol Buffering",
    explanation:
      "The Input Unit receives the student request packet from the campus portal, converts it into internal system format, and latches it into temporary input buffers.",
    buses: {
      dataBus: {
        active: true,
        value: "RAW_REQUEST_PACKET",
        direction: "Input Unit -> Internal Buffer",
        description: "Carries the incoming student request payload into the system."
      },
      addressBus: {
        active: false,
        value: "PORT_0x01 (I/O Latch)",
        direction: "Peripheral Port",
        description: "Identifies the external input channel receiving the transmission."
      },
      controlBus: {
        active: true,
        value: "INPUT_READY",
        direction: "Input -> System Controller",
        description: "Asserts a strobe signal informing the computer that new data has arrived."
      }
    }
  },
  {
    stageIndex: 1,
    unitId: "MEMORY_UNIT",
    name: "Memory Unit",
    role: "RAM Storage & Address Decoding",
    explanation:
      "The Memory Unit decodes the designated memory address (0x00A0) and writes the request packet into RAM cells so the CPU can access it whenever required.",
    buses: {
      dataBus: {
        active: true,
        value: "PAYLOAD -> [0x00A0]",
        direction: "Buffer -> RAM Cell",
        description: "Transfers the buffered request payload into physical RAM storage."
      },
      addressBus: {
        active: true,
        value: "0x00A0 (Base Data Address)",
        direction: "Memory Controller -> Address Decoder",
        description: "Specifies the target RAM memory cell where the request is preserved."
      },
      controlBus: {
        active: true,
        value: "MEM_WRITE (Strobe)",
        direction: "Controller -> RAM Cells",
        description: "Sends the write-enable strobe allowing memory cells to record the payload."
      }
    }
  },
  {
    stageIndex: 2,
    unitId: "CPU",
    name: "Central Processing Unit (CPU)",
    role: "Instruction Decode, Logic Evaluation & ALU Verification",
    explanation:
      "The CPU (Control Unit + ALU) fetches the stored request from memory. The Control Unit directs timing while the ALU validates prerequisite credits, dates, and departmental rules.",
    buses: {
      dataBus: {
        active: true,
        value: "RAM[0x00A0] -> ALU Accumulator",
        direction: "RAM <-> CPU ALU",
        description: "Fetches request fields into CPU internal registers for validation arithmetic."
      },
      addressBus: {
        active: true,
        value: "0x00A0 (Read) / 0x00B0 (Writeback)",
        direction: "CPU (MAR) -> Memory Unit",
        description: "Points to the request address in memory and targets the decision output cell."
      },
      controlBus: {
        active: true,
        value: "ALU_EXECUTE & STATUS_ACK",
        direction: "CPU Control Unit -> Subsystems",
        description: "Commands the ALU to perform comparison arithmetic and updates condition flags."
      }
    }
  },
  {
    stageIndex: 3,
    unitId: "OUTPUT_UNIT",
    name: "Output Unit",
    role: "Result Formatting & Student Notification Dispatch",
    explanation:
      "The Output Unit reads the finalized verification decision from memory and formats it for dispatch to student dashboards, official email notices, and digital seals.",
    buses: {
      dataBus: {
        active: true,
        value: "DECISION_SEALED (Approved)",
        direction: "System -> Output Terminal",
        description: "Transmits the verified request resolution to student notification queues."
      },
      addressBus: {
        active: true,
        value: "PORT_0x02 (Display Buffer)",
        direction: "CPU -> Output Latch",
        description: "Selects the output peripheral display device."
      },
      controlBus: {
        active: true,
        value: "OUTPUT_COMPLETE (Interrupt Ack)",
        direction: "Output Unit -> CPU",
        description: "Signals the completion of dispatch, releasing functional unit locks."
      }
    }
  }
]);

// In-memory registry of active simulation sessions
const _simulations = new Map();

/**
 * Retrieves an active simulation session by its identifier
 * @param {string} simulationId - Simulation identifier
 * @returns {Object|null}
 */
export function getSimulationById(simulationId) {
  if (!simulationId || typeof simulationId !== 'string') return null;
  return _simulations.get(simulationId.trim()) || null;
}

/**
 * Clears in-memory simulation sessions (useful for tests)
 */
export function clearSimulations() {
  _simulations.clear();
}

/**
 * Creates and starts a new simulation session initialized at Stage 0 (Input Unit)
 * 
 * @param {Object} [initialPayload={}] - Request metadata (title, studentId, etc.)
 * @returns {Object} Initial simulation state
 */
export function startSimulation(initialPayload = {}) {
  const requestData = {
    title: initialPayload.title || "AI Lab Access Request",
    studentName: initialPayload.studentName || "Aarav Sharma",
    studentId: initialPayload.studentId || "KAL-2026-101",
    department: initialPayload.department || "Computer Science",
    priority: initialPayload.priority || 1,
    creditUnits: initialPayload.creditUnits || 18,
    ...initialPayload
  };

  const initialStage = FUNCTIONAL_UNIT_STAGES[0];
  const simulationId = initialPayload.simulationId || `SIM-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;

  const simulation = {
    simulationId,
    requestData,
    currentStageIndex: 0,
    currentStage: initialStage,
    activeUnit: initialStage.unitId,
    buses: initialStage.buses,
    isComplete: false,
    canAdvance: true,
    totalStages: FUNCTIONAL_UNIT_STAGES.length,
    history: [
      {
        stageIndex: 0,
        unitId: initialStage.unitId,
        unitName: initialStage.name,
        timestamp: new Date().toISOString(),
        action: "INITIALIZE_SIMULATION",
        explanation: initialStage.explanation
      }
    ],
    disclaimer:
      "Educational functional-unit demonstration. This does not emulate physical silicon hardware or execute raw machine instructions."
  };

  _simulations.set(simulationId, simulation);
  return simulation;
}

/**
 * Advances the simulation by exactly one functional-unit stage
 * 
 * @param {Object|string} currentStateOrId - Existing simulation state or simulation ID
 * @returns {Object} Updated simulation state at the next stage
 */
export function advanceStage(currentStateOrId) {
  let currentState = currentStateOrId;

  if (typeof currentStateOrId === 'string') {
    const found = getSimulationById(currentStateOrId);
    if (!found) {
      const err = new Error(`Simulation with ID '${currentStateOrId}' not found.`);
      err.status = 404;
      throw err;
    }
    currentState = found;
  }

  if (!currentState || typeof currentState !== 'object') {
    const err = new Error('Valid current simulation state or simulation ID must be provided to advanceStage.');
    err.status = 400;
    throw err;
  }

  const nextIndex = (currentState.currentStageIndex ?? 0) + 1;

  // If already at or beyond the final stage, return completed state
  if (nextIndex >= FUNCTIONAL_UNIT_STAGES.length) {
    const finalStage = FUNCTIONAL_UNIT_STAGES[FUNCTIONAL_UNIT_STAGES.length - 1];
    const completed = {
      ...currentState,
      currentStageIndex: FUNCTIONAL_UNIT_STAGES.length - 1,
      currentStage: finalStage,
      activeUnit: finalStage.unitId,
      buses: finalStage.buses,
      isComplete: true,
      canAdvance: false
    };
    if (completed.simulationId) {
      _simulations.set(completed.simulationId, completed);
    }
    return completed;
  }

  const nextStage = FUNCTIONAL_UNIT_STAGES[nextIndex];
  const isFinal = nextIndex === FUNCTIONAL_UNIT_STAGES.length - 1;

  const historyEntry = {
    stageIndex: nextIndex,
    unitId: nextStage.unitId,
    unitName: nextStage.name,
    timestamp: new Date().toISOString(),
    action: "ADVANCE_STAGE",
    explanation: nextStage.explanation
  };

  const updated = {
    ...currentState,
    currentStageIndex: nextIndex,
    currentStage: nextStage,
    activeUnit: nextStage.unitId,
    buses: nextStage.buses,
    isComplete: isFinal,
    canAdvance: !isFinal,
    history: [...(currentState.history || []), historyEntry]
  };

  if (updated.simulationId) {
    _simulations.set(updated.simulationId, updated);
  }

  return updated;
}

/**
 * Resets the simulation back to Stage 0 (Input Unit)
 * 
 * @param {Object|string} [currentStateOrPayloadOrId={}] - Current state, request data, or simulation ID
 * @returns {Object} Fresh simulation state at Stage 0
 */
export function resetSimulation(currentStateOrPayloadOrId = {}) {
  let requestData = currentStateOrPayloadOrId;
  let targetId = null;

  if (typeof currentStateOrPayloadOrId === 'string') {
    const found = getSimulationById(currentStateOrPayloadOrId);
    if (!found) {
      const err = new Error(`Simulation with ID '${currentStateOrPayloadOrId}' not found.`);
      err.status = 404;
      throw err;
    }
    requestData = found.requestData;
    targetId = found.simulationId;
  } else if (currentStateOrPayloadOrId && typeof currentStateOrPayloadOrId === 'object') {
    requestData = currentStateOrPayloadOrId.requestData || currentStateOrPayloadOrId;
    targetId = currentStateOrPayloadOrId.simulationId || null;
  }

  const fresh = startSimulation(requestData);
  if (targetId) {
    fresh.simulationId = targetId;
    _simulations.set(targetId, fresh);
  }
  return fresh;
}

/**
 * Retrieves educational information about a specific functional unit
 * @param {string} unitId - Identifier (e.g. 'INPUT_UNIT', 'MEMORY_UNIT', 'CPU', 'OUTPUT_UNIT')
 * @returns {Object|null}
 */
export function getStageInfo(unitId) {
  if (!unitId) return null;
  const normalized = unitId.trim().toUpperCase();
  return FUNCTIONAL_UNIT_STAGES.find(s => s.unitId === normalized) || null;
}

/**
 * Returns all stages and bus concepts for educational dashboards
 * @returns {Object}
 */
export function getEducationalOverview() {
  return {
    stages: FUNCTIONAL_UNIT_STAGES,
    busConcepts: BUS_CONCEPTS,
    sequenceOrder: ["Input Unit", "Memory Unit", "CPU", "Output Unit"],
    disclaimer:
      "Simplified functional-unit demonstration for educational purposes. Does not emulate physical silicon or binary machine opcodes."
  };
}

export const processingService = {
  startSimulation,
  advanceStage,
  resetSimulation,
  getStageInfo,
  getEducationalOverview,
  getSimulationById,
  clearSimulations,
  FUNCTIONAL_UNIT_STAGES,
  BUS_CONCEPTS
};

export default processingService;
