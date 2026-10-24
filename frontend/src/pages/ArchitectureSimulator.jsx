import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import ProcessingPipeline from '../components/ProcessingPipeline.jsx';
import CpuLaboratory from '../components/CpuLaboratory.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ResultMessage from '../components/ResultMessage.jsx';
import { architectureService } from '../services/architectureService.js';
import { safeDisplay } from '../utils/formatters.js';
import '../styles/pages.css';

const PRESET_REQUESTS = [
  {
    name: 'Standard Registration (18 Credits)',
    studentId: 'KAL-2026-101',
    requestType: 'COURSE_REGISTRATION',
    creditUnits: 18,
    priority: 1
  },
  {
    name: 'Overload Request (26 Credits > 24 Limit)',
    studentId: 'KAL-2026-204',
    requestType: 'CREDIT_OVERLOAD_EXCEPTION',
    creditUnits: 26,
    priority: 2
  },
  {
    name: 'Research Lab Access Pass',
    studentId: 'KAL-2026-315',
    requestType: 'LAB_ACCESS_PERMISSION',
    creditUnits: 12,
    priority: 1
  }
];

export default function ArchitectureSimulator() {
  const [activeMode, setActiveMode] = useState('laboratory'); // 'laboratory' (Module 2) | 'pipeline' (Module 1)

  const [formData, setFormData] = useState({
    studentId: 'KAL-2026-101',
    requestType: 'COURSE_REGISTRATION',
    creditUnits: 18,
    priority: 1
  });

  const [simulationData, setSimulationData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-load initial pipeline simulation on mount for background readiness
  useEffect(() => {
    executeSimulation(formData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const executeSimulation = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await architectureService.simulateProcess(payload);
      const data = response.data || response;
      setSimulationData(data);
      setCurrentStep(1);
    } catch (err) {
      console.error('[ArchitectureSimulator] Failed to execute simulation:', err);
      setError(
        err.message || 'Unable to communicate with the computer architecture simulation API.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = (e) => {
    if (e) e.preventDefault();
    executeSimulation(formData);
  };

  const handleApplyPreset = (preset) => {
    const updated = {
      studentId: preset.studentId,
      requestType: preset.requestType,
      creditUnits: preset.creditUnits,
      priority: preset.priority
    };
    setFormData(updated);
    executeSimulation(updated);
  };

  const handleNextStep = () => {
    if (!simulationData || !simulationData.steps) return;
    if (currentStep < simulationData.steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
  };

  const steps = simulationData?.steps || [];
  const currentStepData = steps[currentStep - 1] || {};
  const registers = currentStepData.registers || simulationData?.finalRegisters || {
    PC: '0x00A0',
    MAR: '0x0000',
    MDR: '0x0000',
    IR: 'NOP',
    ACC: 0
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="COA: Computer Organization & Architecture"
        description="Functional 16-bit CPU emulator and Von Neumann pipeline laboratory. Demonstrates Module 1 (System Bus & Functional Units) and Module 2 (CPU Design, Registers & Instruction Execution Cycle)."
        badge={<span className="academic-badge badge-coa">COA</span>}
        action={
          <StatusBadge
            status="online"
            label={activeMode === 'laboratory' ? '16-Bit CPU Engine Active' : `Pipeline Stage ${currentStep} of ${steps.length || 7}`}
          />
        }
      />

      {/* Backend API Error Notice */}
      {error && (
        <ResultMessage
          type="error"
          title="Hardware Simulator API Error"
          text={`${error}. Verify that the Express backend is running on http://localhost:5000.`}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Sub-Discipline Mode Navigation Tabs */}
      <div className="coa-mode-tabs" style={{ display: 'flex', gap: '0.75rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${activeMode === 'laboratory' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('laboratory')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}
        >
          <span>🔬 16-Bit CPU Laboratory (Module 2)</span>
          <span className="status-pill online" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
            Real Instruction Cycle &amp; ISA
          </span>
        </button>

        <button
          type="button"
          className={`btn ${activeMode === 'pipeline' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('pipeline')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}
        >
          <span>🚌 Von Neumann Tri-Bus Pipeline (Module 1)</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Functional Units
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: 16-BIT INSTRUCTION-LEVEL CPU LABORATORY (MODULE 2)                */}
      {/* ========================================================================= */}
      {activeMode === 'laboratory' && (
        <CpuLaboratory />
      )}

      {/* ========================================================================= */}
      {/* MODE 2: VON NEUMANN TRI-BUS PIPELINE SIMULATOR (MODULE 1)                 */}
      {/* ========================================================================= */}
      {activeMode === 'pipeline' && (
        <>
          {/* Request Configuration & Controls Card */}
          <section className="coa-config-card" aria-label="Campus Request Configuration">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Campus Request Hardware Ingestion Parameters
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Configure student submission values to trace bus strobes and functional unit latches.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="preset-pills-row">
                <span style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>PRESETS:</span>
                {PRESET_REQUESTS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    className="preset-pill-btn"
                    onClick={() => handleApplyPreset(preset)}
                    disabled={loading}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleStartSimulation}>
              <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="student-id-input" className="form-label">Student ID</label>
                  <input
                    id="student-id-input"
                    type="text"
                    className="form-select"
                    value={formData.studentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="request-type-select" className="form-label">Request Type</label>
                  <select
                    id="request-type-select"
                    className="form-select"
                    value={formData.requestType}
                    onChange={(e) => setFormData(prev => ({ ...prev, requestType: e.target.value }))}
                    disabled={loading}
                  >
                    <option value="COURSE_REGISTRATION">COURSE_REGISTRATION</option>
                    <option value="CREDIT_OVERLOAD_EXCEPTION">CREDIT_OVERLOAD_EXCEPTION</option>
                    <option value="LAB_ACCESS_PERMISSION">LAB_ACCESS_PERMISSION</option>
                    <option value="HALL_TICKET">HALL_TICKET</option>
                    <option value="BONAFIDE_CERTIFICATE">BONAFIDE_CERTIFICATE</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="credits-input" className="form-label">Credit Units (Limit &le; 24)</label>
                  <input
                    id="credits-input"
                    type="number"
                    min="1"
                    max="36"
                    className="form-select"
                    value={formData.creditUnits}
                    onChange={(e) => setFormData(prev => ({ ...prev, creditUnits: Number(e.target.value) }))}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="priority-input" className="form-label">Priority Level (1-5)</label>
                  <input
                    id="priority-input"
                    type="number"
                    min="1"
                    max="5"
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Simulating Pipeline...' : 'Start New Simulation'}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset to Stage 1
                </button>
              </div>
            </form>
          </section>

          {/* Stage Navigation Stepper Bar */}
          {steps.length > 0 && (
            <nav className="step-tracker-bar" aria-label="Pipeline Step Progress">
              {steps.map((st) => {
                const isCurrent = st.step === currentStep;
                const isCompleted = st.step < currentStep;

                return (
                  <button
                    key={`step-btn-${st.step}`}
                    type="button"
                    className={`step-tracker-item ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    onClick={() => setCurrentStep(st.step)}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span>{st.step}.</span>
                    <span>{st.phase}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* 4 Functional Units & Tri-Bus Educational Diagram */}
          <ProcessingPipeline
            steps={steps}
            currentStep={currentStep}
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
            onReset={handleReset}
          />

          {/* CPU Internal Registers Live Dashboard */}
          <section className="card" aria-label="Internal CPU Registers and Memory Snapshot">
            <div className="card-title">
              <span>Pipeline Stage Registers (Current Stage: {currentStep})</span>
              <span className="academic-badge badge-coa">Register File</span>
            </div>
            <p className="card-description">
              Hardware registers capturing intermediate pipeline states across Input Unit, Memory Unit, CPU, and Output Unit.
            </p>

            <div className="register-dashboard-grid">
              <div className="register-card">
                <span className="register-name">PC (Prog Counter)</span>
                <span className="register-val">{safeDisplay(registers.PC)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Instruction Pointer</span>
              </div>

              <div className="register-card">
                <span className="register-name">MAR (Mem Address)</span>
                <span className="register-val">{safeDisplay(registers.MAR)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Address Bus Wire</span>
              </div>

              <div className="register-card">
                <span className="register-name">MDR (Mem Data)</span>
                <span className="register-val">{safeDisplay(registers.MDR)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Data Bus Buffer</span>
              </div>

              <div className="register-card">
                <span className="register-name">IR (Instruction)</span>
                <span className="register-val">{safeDisplay(registers.IR)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Decoded Opcode</span>
              </div>

              <div className="register-card">
                <span className="register-name">ACC (Accumulator)</span>
                <span className="register-val">{safeDisplay(registers.ACC)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ALU Outcome</span>
              </div>
            </div>

            {/* Memory Snapshot Table */}
            {simulationData?.memorySnapshot && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Addressable RAM Memory Map (Base Address: 0x00A0)
                </div>
                <div className="table-wrapper">
                  <table className="data-table" aria-label="Simulated RAM Table">
                    <thead>
                      <tr>
                        <th>Memory Address</th>
                        <th>Designated Label</th>
                        <th>Stored Digital Word / Payload</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(simulationData.memorySnapshot).map(([addr, item]) => (
                        <tr key={addr}>
                          <td><code style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{addr}</code></td>
                          <td><strong>{item.label}</strong></td>
                          <td><code>{safeDisplay(item.value)}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* ========================================================================= */}
      {/* ACADEMIC SYLLABUS REFERENCE: MODULE 1 & MODULE 2                          */}
      {/* ========================================================================= */}
      <section className="daa-explanation-card" aria-label="Theoretical COA Concepts">
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Computer Organization &amp; Architecture Concepts Demonstrated
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Pedagogical mapping to university syllabus: Module 1 (Hardware Organization) and Module 2 (CPU Design &amp; Instruction Execution).
          </p>
        </div>

        <div className="daa-algo-comparison" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          
          {/* Module 1 Box */}
          <div className="algo-box bfs" style={{ borderLeftColor: '#7c3aed' }}>
            <div className="algo-box-title">
              <span>Module 1: Functional Units &amp; System Bus</span>
              <span className="academic-badge badge-coa">Von Neumann</span>
            </div>
            <p className="algo-box-desc">
              <strong>System Bus Architecture:</strong> The computer separates communication into three distinct buses to eliminate contention:
              <br />&bull; <strong>Address Bus:</strong> Unidirectional lines driven by MAR specifying physical RAM coordinates.
              <br />&bull; <strong>Data Bus:</strong> Bidirectional lines carrying instructions and data words between RAM, CPU, and I/O.
              <br />&bull; <strong>Control Bus:</strong> Clock synchronization strobes, MEM_READ/MEM_WRITE enables, and peripheral interrupt acknowledges.
            </p>
          </div>

          {/* Module 2 Box */}
          <div className="algo-box dfs" style={{ borderLeftColor: '#0284c7' }}>
            <div className="algo-box-title">
              <span>Module 2: CPU Design &amp; Instruction Cycle</span>
              <span className="academic-badge badge-coa">Fetch-Decode-Execute</span>
            </div>
            <p className="algo-box-desc">
              <strong>Deterministic Micro-Architecture:</strong> The 16-bit CPU emulator executes instructions across five explicit micro-stages:
              <br />&bull; <strong>1. Fetch:</strong> MAR &larr; PC; MDR &larr; RAM[MAR]; IR &larr; MDR; PC &larr; PC + 1.
              <br />&bull; <strong>2. Decode:</strong> Opcode decoder identifies operation and register operands.
              <br />&bull; <strong>3. Execute:</strong> ALU computes arithmetic/logic and updates condition flags (Z, N, C, V).
              <br />&bull; <strong>4. Memory:</strong> Direct memory access (LOAD/STORE/PUSH/POP) reads/writes addressable RAM cells.
              <br />&bull; <strong>5. Writeback:</strong> Results latched into destination registers (R0-R3) and PC updated on branches.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
