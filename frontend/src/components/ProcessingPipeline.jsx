import React from 'react';

/**
 * Functional Units specification in von Neumann processing order.
 */
const FUNCTIONAL_UNITS = [
  {
    id: 'INPUT_UNIT',
    number: 1,
    title: 'Input Unit',
    subtitle: 'Peripheral Ingestion',
    submodules: ['Request Latch', 'Protocol Buffer'],
    matchUnits: ['INPUT_UNIT']
  },
  {
    id: 'MEMORY_UNIT',
    number: 2,
    title: 'Memory Unit',
    subtitle: 'RAM / Cache Store',
    submodules: ['Address Decoder', 'RAM Cells (0x00A0..0x00B0)'],
    matchUnits: ['MEMORY_UNIT']
  },
  {
    id: 'CPU',
    number: 3,
    title: 'Central Processing Unit',
    subtitle: 'CU, ALU & Registers',
    submodules: ['Control Unit', 'ALU', 'PC', 'MAR', 'MDR', 'IR', 'ACC'],
    matchUnits: ['CPU', 'CPU_CONTROL_UNIT', 'CPU_ALU']
  },
  {
    id: 'OUTPUT_UNIT',
    number: 4,
    title: 'Output Unit',
    subtitle: 'Result Dispatch',
    submodules: ['Status Register', 'Terminal Latch'],
    matchUnits: ['OUTPUT_UNIT']
  }
];

/**
 * Reusable ProcessingPipeline Component (COA Module).
 * 
 * Illustrates the 4 fundamental functional units and 3 system buses.
 * Distinctly separates Data Movement, Address Selection, and Control Signals.
 * 
 * @param {Object} props
 * @param {Array<Object>} [props.steps=[]] - Step traces from the backend COA API
 * @param {number} [props.currentStep=1] - Active step number (1-based index)
 * @param {string} [props.activeUnit] - Optional active unit ID override
 * @param {Object} [props.buses] - Optional current bus signals override
 * @param {Object} [props.registers] - Optional current CPU registers override
 * @param {Function} [props.onNextStep] - Optional callback for advancing to next step
 * @param {Function} [props.onPrevStep] - Optional callback for stepping back
 * @param {Function} [props.onReset] - Optional callback to reset execution to step 1
 * @param {string} [props.className=''] - Optional custom CSS class
 */
export default function ProcessingPipeline({
  steps = [],
  currentStep = 1,
  activeUnit,
  buses,
  registers,
  onNextStep,
  onPrevStep,
  onReset,
  className = ''
}) {
  const totalSteps = steps.length;
  const currentStepIndex = Math.max(0, Math.min(currentStep - 1, totalSteps - 1));
  const stepData = steps[currentStepIndex] || {};

  // Active unit resolution
  const resolvedActiveUnit = activeUnit || stepData.unit || 'INPUT_UNIT';

  // Bus states resolution
  const activeBuses = buses || stepData.buses || {
    addressBus: '0x00A0',
    dataBus: 'IDLE',
    controlBus: 'STANDBY'
  };

  // Registers resolution
  const activeRegisters = registers || stepData.registers || {
    PC: '0x00A0',
    MAR: '0x0000',
    MDR: '0x0000',
    IR: 'NOP',
    ACC: 0
  };

  const hasControls = Boolean(onNextStep || onPrevStep || onReset);

  return (
    <div className={`pipeline-container ${className}`.trim()}>
      {/* Educational Notice */}
      <div className="academic-disclaimer" role="note">
        <span aria-hidden="true">&#9432;</span>
        <span>
          <strong>Academic Conceptual Model:</strong> This simulator illustrates the theoretical von Neumann architecture and bus interactions for instructional purposes. It is an educational abstraction and not a real silicon microprocessor emulator.
        </span>
      </div>

      {/* 4 Functional Units Row */}
      <section className="pipeline-units-wrapper" aria-label="Computer Functional Units Pipeline">
        <div className="pipeline-units-row">
          {FUNCTIONAL_UNITS.map((unit, index) => {
            const isActive = unit.matchUnits.includes(resolvedActiveUnit);

            return (
              <React.Fragment key={unit.id}>
                <div 
                  className={`pipeline-unit-card ${isActive ? 'active' : ''}`}
                  role="region"
                  aria-label={`${unit.title}${isActive ? ' (Currently Active)' : ''}`}
                >
                  <div className="unit-header">
                    <span className="unit-number">{unit.number}</span>
                    <span className="unit-title">{unit.title}</span>
                  </div>
                  <div className="unit-subtitle">{unit.subtitle}</div>
                  
                  <div className="unit-submodules">
                    {unit.submodules.map(mod => (
                      <span key={mod} className="submodule-badge">{mod}</span>
                    ))}
                  </div>

                  {/* Show Register State inside CPU when CPU is active */}
                  {unit.id === 'CPU' && (
                    <div style={{ marginTop: '0.6rem', padding: '0.4rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.7rem' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>Registers: </span>
                      <code>PC: {activeRegisters.PC} | IR: {activeRegisters.IR} | ACC: {activeRegisters.ACC}</code>
                    </div>
                  )}
                </div>

                {/* Arrow Connector between units */}
                {index < FUNCTIONAL_UNITS.length - 1 && (
                  <div className="pipeline-connector" aria-hidden="true">
                    &rarr;
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Short Stage Explanation */}
        {stepData.description && (
          <div className="pipeline-stage-info" aria-live="polite">
            <div className="stage-info-header">
              <span className="stage-info-title">
                Step {stepData.step || currentStep} of {totalSteps || 7}: {stepData.phase || 'CYCLE_EXECUTION'}
              </span>
              {stepData.academicFocus && (
                <span className="academic-badge badge-coa">{stepData.academicFocus}</span>
              )}
            </div>
            <p className="stage-info-text">{stepData.description}</p>
          </div>
        )}

        {/* Optional Interactive Controls */}
        {hasControls && (
          <div className="pipeline-controls">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {onPrevStep && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onPrevStep}
                  disabled={currentStep <= 1}
                >
                  &larr; Previous Step
                </button>
              )}
              {onNextStep && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onNextStep}
                  disabled={totalSteps > 0 && currentStep >= totalSteps}
                >
                  Next Step &rarr;
                </button>
              )}
            </div>

            {onReset && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onReset}
              >
                Reset Execution
              </button>
            )}
          </div>
        )}
      </section>

      {/* Separate Educational Bus System Illustration */}
      <section className="bus-system-wrapper" aria-label="System Tri-Bus Architecture">
        <div className="bus-system-header">
          <div>
            <div className="bus-system-title">System Bus Architecture</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Distinct signal pathways synchronizing CPU, Memory, and Peripherals
            </div>
          </div>
          <span className="academic-badge badge-coa">COA BUS SPEC</span>
        </div>

        <div className="bus-list">
          {/* Data Bus */}
          <div className="bus-card data-bus">
            <div className="bus-card-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="bus-name-badge">Data Bus</span>
                <span className="bus-direction">&harr; Bidirectional</span>
              </div>
              <div className="bus-value-display">
                <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginRight: '0.35rem' }}>VALUE:</span>
                <span>{activeBuses.dataBus || 'IDLE'}</span>
              </div>
            </div>
            <p className="bus-description">
              <strong>Data Movement:</strong> Transfers actual operational payload, instruction opcodes, and student record data between CPU, memory registers, and peripheral latches.
            </p>
          </div>

          {/* Address Bus */}
          <div className="bus-card address-bus">
            <div className="bus-card-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="bus-name-badge">Address Bus</span>
                <span className="bus-direction">&rarr; Unidirectional (CPU &rarr; Memory)</span>
              </div>
              <div className="bus-value-display">
                <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginRight: '0.35rem' }}>ADDR:</span>
                <span>{activeBuses.addressBus || '0x0000'}</span>
              </div>
            </div>
            <p className="bus-description">
              <strong>Address Selection:</strong> Carries physical RAM address locations output by the Memory Address Register (MAR) to designate the targeted memory cell.
            </p>
          </div>

          {/* Control Bus */}
          <div className="bus-card control-bus">
            <div className="bus-card-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="bus-name-badge">Control Bus</span>
                <span className="bus-direction">&harr; Control & Timing Lines</span>
              </div>
              <div className="bus-value-display">
                <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginRight: '0.35rem' }}>SIGNAL:</span>
                <span>{activeBuses.controlBus || 'STANDBY'}</span>
              </div>
            </div>
            <p className="bus-description">
              <strong>Control Signals:</strong> Carries synchronization pulses, MEM_READ, MEM_WRITE, ALU_EXEC, I/O Strobes, and Acknowledgment interrupts issued by the Control Unit.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
