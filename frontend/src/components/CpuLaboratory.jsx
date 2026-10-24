import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cpuService } from '../services/cpuService.js';
import StatusBadge from './StatusBadge.jsx';
import ResultMessage from './ResultMessage.jsx';
import { safeDisplay } from '../utils/formatters.js';

export default function CpuLaboratory() {
  const [samplePrograms, setSamplePrograms] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('arithmetic');
  const [sourceCode, setSourceCode] = useState('');
  const [cpuState, setCpuState] = useState(null);
  const [assembledData, setAssembledData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runSpeedMs, setRunSpeedMs] = useState(400); // 400ms Normal, 150ms Fast, 800ms Slow
  const [maxInstructions, setMaxInstructions] = useState(1000);
  const [apiError, setApiError] = useState(null);
  const [lastActionMessage, setLastActionMessage] = useState('CPU ready. Assemble & Load a program to begin.');

  const [activeMemoryTab, setActiveMemoryTab] = useState('code'); // 'code' | 'data' | 'stack'

  // Timer ref for continuous automated stepping
  const runIntervalRef = useRef(null);

  // Fetch sample programs on initial mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await cpuService.getPrograms();
        const programs = res.data || [];
        setSamplePrograms(programs);

        const initialProg = programs.find(p => p.id === 'arithmetic') || programs[0];
        if (initialProg) {
          setSelectedSampleId(initialProg.id);
          setSourceCode(initialProg.code);
          // Auto-assemble and load initial program
          await handleLoadSource(initialProg.code);
        }
      } catch (err) {
        console.error('[CpuLaboratory] Failed to load sample programs:', err);
        setApiError('Failed to connect to CPU emulator API. Verify backend server is running on port 5000.');
      }
    }
    loadInitial();
  }, []);

  // Handle sample selection change
  const handleSelectSample = (sampleId) => {
    setSelectedSampleId(sampleId);
    const prog = samplePrograms.find(p => p.id === sampleId);
    if (prog) {
      setSourceCode(prog.code);
      handleLoadSource(prog.code);
    }
  };

  // Assemble and load code into CPU memory
  const handleLoadSource = async (codeToLoad) => {
    stopRunning();
    setLoading(true);
    setApiError(null);

    try {
      const code = codeToLoad !== undefined ? codeToLoad : sourceCode;
      const res = await cpuService.loadProgram({ code });

      if (res.success) {
        setAssembledData(res.assembled);
        setCpuState(res.cpuState);
        setLastActionMessage('Program assembled successfully into memory. Ready at PC=0x0000.');
      } else {
        const errMsg = res.errors?.map(e => `Line ${e.line}: ${e.message}`).join(' | ') || 'Assembly failed.';
        setApiError(errMsg);
        setLastActionMessage(`Assembly failed: ${errMsg}`);
      }
    } catch (err) {
      console.error('[CpuLaboratory] Load error:', err);
      setApiError(err.message || 'Error loading program into CPU.');
    } finally {
      setLoading(false);
    }
  };

  // Step exactly one instruction cycle
  const handleSingleStep = async () => {
    if (isRunning) stopRunning();
    setLoading(true);
    setApiError(null);

    try {
      const res = await cpuService.step({ micro: false });
      if (res.cpuState) {
        setCpuState(res.cpuState);
      }
      if (res.stepResult) {
        if (res.stepResult.halted) {
          setLastActionMessage('CPU halted: Program execution reached HALT instruction.');
          stopRunning();
        } else if (res.stepResult.error) {
          setApiError(res.stepResult.message);
          setLastActionMessage(`CPU Error: ${res.stepResult.message}`);
          stopRunning();
        } else {
          setLastActionMessage(res.stepResult.explanation || `Executed: ${res.stepResult.disassembly}`);
        }
      }
    } catch (err) {
      console.error('[CpuLaboratory] Step error:', err);
      setApiError(err.message || 'Error stepping instruction.');
      stopRunning();
    } finally {
      setLoading(false);
    }
  };

  // Step exactly one micro-stage (FETCH -> DECODE -> EXECUTE -> MEMORY -> WRITEBACK)
  const handleMicroStep = async () => {
    if (isRunning) stopRunning();
    setLoading(true);
    setApiError(null);

    try {
      const res = await cpuService.step({ micro: true });
      if (res.cpuState) {
        setCpuState(res.cpuState);
      }
      if (res.microResult) {
        if (res.microResult.halted) {
          setLastActionMessage('CPU halted: Cannot advance micro-stage.');
        } else if (res.microResult.error) {
          setApiError(res.microResult.message);
          setLastActionMessage(`Micro-stage error: ${res.microResult.message}`);
        } else {
          setLastActionMessage(res.microResult.description || `Micro-stage: ${res.microResult.stage}`);
        }
      }
    } catch (err) {
      console.error('[CpuLaboratory] Micro step error:', err);
      setApiError(err.message || 'Error stepping micro-stage.');
    } finally {
      setLoading(false);
    }
  };

  // Continuous run toggle
  const toggleRun = () => {
    if (isRunning) {
      stopRunning();
      setLastActionMessage('Execution paused by user.');
    } else {
      startRunning();
    }
  };

  const startRunning = () => {
    if (cpuState?.isHalted) {
      setLastActionMessage('Cannot run: CPU is halted. Reset CPU or load program first.');
      return;
    }
    setIsRunning(true);
    setLastActionMessage('Running program continuously...');
  };

  const stopRunning = useCallback(() => {
    setIsRunning(false);
    if (runIntervalRef.current) {
      clearInterval(runIntervalRef.current);
      runIntervalRef.current = null;
    }
  }, []);

  // Automated stepping interval
  useEffect(() => {
    if (!isRunning) {
      if (runIntervalRef.current) {
        clearInterval(runIntervalRef.current);
        runIntervalRef.current = null;
      }
      return;
    }

    runIntervalRef.current = setInterval(async () => {
      try {
        const res = await cpuService.step({ micro: false });
        if (res.cpuState) {
          setCpuState(res.cpuState);
          if (res.cpuState.isHalted) {
            setLastActionMessage('CPU halted: Execution completed.');
            stopRunning();
          } else if (res.cpuState.isError) {
            setApiError(res.cpuState.errorMessage || 'CPU execution error.');
            setLastActionMessage(`CPU error: ${res.cpuState.errorMessage}`);
            stopRunning();
          } else if (res.stepResult?.explanation) {
            setLastActionMessage(res.stepResult.explanation);
          }
        }
      } catch (err) {
        console.error('[CpuLaboratory] Run interval error:', err);
        setApiError(err.message || 'Execution failed.');
        stopRunning();
      }
    }, runSpeedMs);

    return () => {
      if (runIntervalRef.current) {
        clearInterval(runIntervalRef.current);
        runIntervalRef.current = null;
      }
    };
  }, [isRunning, runSpeedMs, stopRunning]);

  // Reset CPU
  const handleReset = async (clearMemory = false) => {
    stopRunning();
    setLoading(true);
    setApiError(null);

    try {
      const res = await cpuService.reset({ clearMemory });
      if (res.cpuState) {
        setCpuState(res.cpuState);
      }
      setLastActionMessage(clearMemory ? 'CPU registers and RAM completely wiped.' : 'CPU registers reset. Memory preserved at PC=0x0000.');
    } catch (err) {
      console.error('[CpuLaboratory] Reset error:', err);
      setApiError(err.message || 'Error resetting CPU.');
    } finally {
      setLoading(false);
    }
  };

  // Instant full continuous run (backend loop)
  const handleFastRunAll = async () => {
    stopRunning();
    setLoading(true);
    setApiError(null);

    try {
      const res = await cpuService.run({ maxInstructions });
      if (res.cpuState) {
        setCpuState(res.cpuState);
      }
      if (res.runResult) {
        if (res.runResult.hitLimit) {
          setLastActionMessage(`Execution reached safe limit of ${maxInstructions} instructions (infinite-loop protection triggered).`);
        } else if (res.runResult.isHalted) {
          setLastActionMessage(`Program completed: Executed ${res.runResult.stepsRun} instructions in ${res.runResult.cycles} clock cycles.`);
        } else if (res.runResult.isError) {
          setApiError(res.runResult.errorMessage);
          setLastActionMessage(`Execution error: ${res.runResult.errorMessage}`);
        }
      }
    } catch (err) {
      console.error('[CpuLaboratory] Fast run error:', err);
      setApiError(err.message || 'Fast run failed.');
    } finally {
      setLoading(false);
    }
  };

  const registers = cpuState?.registers || { R0: 0, R1: 0, R2: 0, R3: 0, ACC: 0, PC: 0, IR: 0, MAR: 0, MDR: 0, SP: 255 };
  const hexRegs = cpuState?.hexRegisters || { R0: '0x0000', R1: '0x0000', R2: '0x0000', R3: '0x0000', ACC: '0x0000', PC: '0x0000', IR: '0x0000', MAR: '0x0000', MDR: '0x0000', SP: '0x00FF' };
  const flags = cpuState?.flags || { Z: 0, N: 0, C: 0, V: 0 };
  const isHalted = Boolean(cpuState?.isHalted);
  const isError = Boolean(cpuState?.isError);
  const currentStage = cpuState?.currentStage || 'FETCH';

  // Filter memory for segment tabs
  const memoryCells = (cpuState?.memorySnapshot || []).filter(item => {
    if (activeMemoryTab === 'code') return item.address >= 0 && item.address < 32;
    if (activeMemoryTab === 'data') return item.address >= 0x80 && item.address <= 0x9F;
    if (activeMemoryTab === 'stack') return item.address >= 0xE0 && item.address <= 0xFF;
    return true;
  });

  return (
    <div className="cpu-laboratory-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner: Status & Micro-Stage Pipeline */}
      <section className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className="academic-badge badge-coa">16-Bit RISC-Like CPU</span>
              <span className="status-pill online" style={{ fontSize: '0.75rem', fontWeight: '700' }}>
                ⚡ Real Instruction Execution Engine
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Clock Cycles: <strong>{cpuState?.cycleCount || 0}</strong> &bull; Instructions: <strong>{cpuState?.instructionCount || 0}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.35rem' }}>
              Instruction-Level CPU Laboratory
            </h2>
          </div>

          {/* Real-Time CPU State Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isError ? (
              <span className="status-pill offline" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', fontWeight: '700' }}>
                ✖ CPU ERROR
              </span>
            ) : isHalted ? (
              <span className="status-pill warning" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', fontWeight: '700', background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>
                🛑 CPU HALTED
              </span>
            ) : isRunning ? (
              <span className="status-pill online" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', fontWeight: '700' }}>
                ⚡ RUNNING (Auto Step)
              </span>
            ) : (
              <span className="status-pill online" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', fontWeight: '700' }}>
                ● READY / PAUSED
              </span>
            )}
          </div>
        </div>

        {/* 5-Stage Fetch-Decode-Execute Micro-Pipeline */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
            Active Von Neumann Execution Stage (Fetch-Decode-Execute Micro-Cycle):
          </div>
          <div className="cpu-stage-tracker" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
            {[
              { id: 'FETCH', label: '1. FETCH', desc: 'MAR <- PC, IR <- M[MAR]' },
              { id: 'DECODE', label: '2. DECODE', desc: 'Opcode & Register Decode' },
              { id: 'EXECUTE', label: '3. EXECUTE', desc: 'ALU Arithmetic / Branch' },
              { id: 'MEMORY', label: '4. MEMORY', desc: 'RAM Read / Write' },
              { id: 'WRITEBACK', label: '5. WRITEBACK', desc: 'Reg Update & Flags' }
            ].map(st => {
              const isActive = currentStage === st.id;
              return (
                <div
                  key={st.id}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: isActive ? '2px solid #7c3aed' : '1px solid var(--border-color)',
                    background: isActive ? '#f5f3ff' : '#f8fafc',
                    boxShadow: isActive ? '0 2px 8px rgba(124, 58, 237, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: isActive ? '#6d28d9' : 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{st.label}</span>
                    {isActive && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', animation: 'pulse 1s infinite' }} />}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: isActive ? '#7c3aed' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {st.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Global API Notice */}
      {apiError && (
        <ResultMessage
          type="error"
          title="CPU Emulator Notice"
          text={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      {/* Last Instruction Action Banner */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 'var(--radius-lg)', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#38bdf8', color: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            LAST ACTION
          </span>
          <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontFamily: 'var(--font-family-mono)' }}>
            {lastActionMessage}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Next Instruction: <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-family-mono)' }}>{cpuState?.nextInstruction?.text || 'NOP'}</strong> at {hexRegs.PC}
        </div>
      </div>

      {/* Control Toolbar */}
      <section className="card" style={{ padding: '1rem 1.25rem', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Sample Program Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="sample-select" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              Load Sample:
            </label>
            <select
              id="sample-select"
              className="form-select"
              style={{ minWidth: '260px', padding: '0.4rem 0.65rem', fontSize: '0.85rem' }}
              value={selectedSampleId}
              onChange={(e) => handleSelectSample(e.target.value)}
              disabled={loading || isRunning}
            >
              {samplePrograms.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stepper & Playback Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleLoadSource()}
              disabled={loading || isRunning}
              title="Assemble and reload source code into RAM"
            >
              🛠 Assemble &amp; Load
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleMicroStep}
              disabled={loading || isRunning || isHalted}
              title="Step exactly one micro-stage (Fetch, Decode, Execute, Memory, Writeback)"
            >
              Micro-Step ⏩
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSingleStep}
              disabled={loading || isRunning || isHalted}
              title="Execute exactly one instruction cycle"
            >
              Single Step ▶
            </button>

            <button
              type="button"
              className={`btn ${isRunning ? 'btn-warning' : 'btn-primary'} btn-sm`}
              onClick={toggleRun}
              disabled={loading || (isHalted && !isRunning)}
              title={isRunning ? 'Pause execution' : 'Continuously step instructions automatically'}
            >
              {isRunning ? '⏸ Pause' : '▶ Run Auto'}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleFastRunAll}
              disabled={loading || isRunning || isHalted}
              title="Run all instructions immediately in backend until HALT"
            >
              Run to Halt ⏭
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleReset(false)}
              disabled={loading || isRunning}
              title="Reset PC and registers back to zero"
            >
              ↺ Reset
            </button>
          </div>

          {/* Execution Speed Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', padding: '0 0.3rem' }}>Speed:</span>
            {[
              { label: 'Slow (800ms)', val: 800 },
              { label: 'Normal (400ms)', val: 400 },
              { label: 'Fast (150ms)', val: 150 }
            ].map(s => (
              <button
                key={s.val}
                type="button"
                className={`speed-pill ${runSpeedMs === s.val ? 'active' : ''}`}
                onClick={() => setRunSpeedMs(s.val)}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                {s.label.split(' ')[0]}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Main Grid: Code Editor & Machine Code Listing (Left) | Registers, Flags & Memory (Right) */}
      <div className="card-grid" style={{ gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.25fr)', gap: '1.25rem' }}>
        
        {/* Left Column: Assembly Editor & Assembled Program Listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Source Code Editor */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="card-title">
              <span>Assembly Source Program</span>
              <span className="academic-badge badge-coa">16-Bit ISA</span>
            </div>
            <p className="card-description" style={{ marginBottom: '0.25rem' }}>
              Write or customize assembly instructions. Supported mnemonics: <code>LDI, LOAD, STORE, MOV, ADD, SUB, AND, OR, XOR, NOT, CMP, JMP, JZ, JNZ, PUSH, POP, OUT, HALT</code>.
            </p>

            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              disabled={isRunning}
              rows={14}
              style={{
                width: '100%',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: '#0f172a',
                color: '#38bdf8',
                border: '1px solid #1e293b',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Enter assembly instructions..."
              aria-label="Assembly source code editor"
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Tip: Semicolon <code>;</code> denotes comments. Labels end with colon <code>LOOP:</code>.
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleLoadSource()}
                disabled={loading || isRunning}
              >
                Assemble Code
              </button>
            </div>
          </section>

          {/* Assembled Machine Code Listing with Active PC Highlight */}
          <section className="card">
            <div className="card-title">
              <span>Assembled Machine Code Memory Listing</span>
              <span className="academic-badge badge-coa">Hex Words</span>
            </div>
            <p className="card-description" style={{ marginBottom: '0.5rem' }}>
              Instructions assembled into memory at base address <code>0x0000</code>. Arrow highlights instruction at current <code>PC</code>.
            </p>

            <div className="table-wrapper" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="data-table" aria-label="Assembled instruction table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Ptr</th>
                    <th>Addr</th>
                    <th>Hex Word</th>
                    <th>Assembly Disassembly</th>
                    <th>Line</th>
                  </tr>
                </thead>
                <tbody>
                  {assembledData?.instructions?.map(inst => {
                    const isCurrentPC = inst.address === registers.PC;
                    return (
                      <tr
                        key={`inst-${inst.address}`}
                        style={{
                          background: isCurrentPC ? '#f0f9ff' : 'transparent',
                          fontWeight: isCurrentPC ? '700' : 'normal'
                        }}
                      >
                        <td style={{ color: '#0284c7', fontSize: '1rem', textAlign: 'center' }}>
                          {isCurrentPC ? '➔' : ''}
                        </td>
                        <td><code>0x{inst.address.toString(16).toUpperCase().padStart(4, '0')}</code></td>
                        <td><code style={{ color: '#0369a1' }}>{inst.hex}</code></td>
                        <td>
                          <span style={{ color: isCurrentPC ? '#0369a1' : 'var(--text-main)', fontFamily: 'var(--font-family-mono)' }}>
                            {inst.text}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{inst.line}</td>
                      </tr>
                    );
                  })}
                  {(!assembledData?.instructions || assembledData.instructions.length === 0) && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                        No program assembled yet. Click <strong>Assemble &amp; Load</strong> above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Right Column: Registers, Flags, RAM Memory & Output Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* General Purpose Registers & Accumulator */}
          <section className="card">
            <div className="card-title">
              <span>General Purpose Registers (16-Bit)</span>
              <span className="academic-badge badge-coa">Register File</span>
            </div>
            <div className="register-dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {['R0', 'R1', 'R2', 'R3'].map(regKey => {
                const decVal = registers[regKey] || 0;
                const hexVal = hexRegs[regKey] || '0x0000';
                const isAcc = regKey === 'R0';

                return (
                  <div key={regKey} className="register-card">
                    <span className="register-name">
                      {regKey} {isAcc && <strong style={{ color: '#38bdf8' }}>(ACC)</strong>}
                    </span>
                    <span className="register-val">{hexVal}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-family-mono)' }}>
                      Dec: {decVal}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Special Hardware Control Registers */}
            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Dedicated Micro-Architecture Control Registers:
              </div>
              <div className="register-dashboard-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="register-card" style={{ borderColor: '#3b82f6' }}>
                  <span className="register-name" style={{ color: '#60a5fa' }}>PC (Program Counter)</span>
                  <span className="register-val" style={{ color: '#60a5fa' }}>{hexRegs.PC}</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Addr: {registers.PC}</span>
                </div>

                <div className="register-card">
                  <span className="register-name">IR (Instruction)</span>
                  <span className="register-val">{hexRegs.IR}</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cpuState?.currentInstruction?.mnemonic || 'NOP'}
                  </span>
                </div>

                <div className="register-card">
                  <span className="register-name">MAR (Address Bus)</span>
                  <span className="register-val">{hexRegs.MAR}</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Addr: {registers.MAR}</span>
                </div>

                <div className="register-card">
                  <span className="register-name">MDR (Data Buffer)</span>
                  <span className="register-val">{hexRegs.MDR}</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Val: {registers.MDR}</span>
                </div>

                <div className="register-card" style={{ borderColor: '#a855f7' }}>
                  <span className="register-name" style={{ color: '#c084fc' }}>SP (Stack Pointer)</span>
                  <span className="register-val" style={{ color: '#c084fc' }}>{hexRegs.SP}</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Top: {registers.SP}</span>
                </div>
              </div>
            </div>

            {/* ALU Status Flags (Condition Codes) */}
            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  ALU Condition Status Flags (Flag Register):
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Updates on CMP, ADD, SUB &amp; Logic
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[
                  { key: 'Z', name: 'Zero Flag', desc: 'Result == 0', active: flags.Z === 1, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
                  { key: 'N', name: 'Negative Flag', desc: 'MSB Sign == 1', active: flags.N === 1, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                  { key: 'C', name: 'Carry Flag', desc: 'Unsigned Overflow/Borrow', active: flags.C === 1, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                  { key: 'V', name: 'Overflow Flag', desc: 'Signed Overflow', active: flags.V === 1, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
                ].map(fl => (
                  <div
                    key={fl.key}
                    style={{
                      padding: '0.5rem 0.6rem',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      border: fl.active ? `2px solid ${fl.color}` : '1px solid var(--border-color)',
                      background: fl.active ? fl.bg : 'var(--bg-subtle)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <strong style={{ fontSize: '0.9rem', color: fl.active ? fl.color : 'var(--text-muted)' }}>
                        {fl.key}
                      </strong>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: fl.active ? fl.color : 'var(--text-muted)' }}>
                        = {fl.active ? '1' : '0'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {fl.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Output Device & Peripheral Console */}
          <section className="card" style={{ background: '#020617', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.5px' }}>
                🖥 HARDWARE OUTPUT DEVICE (PORT 0x01)
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Latched by <code>OUT Rs</code> instruction
              </span>
            </div>

            <div
              style={{
                minHeight: '80px',
                maxHeight: '120px',
                overflowY: 'auto',
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.8rem',
                color: '#4ade80'
              }}
            >
              {cpuState?.outputLog?.length > 0 ? (
                cpuState.outputLog.map((log, idx) => (
                  <div key={`out-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: '#94a3b8' }}>[{log.timestamp ? log.timestamp.split('T')[1].slice(0, 8) : `C:${log.cycle}`}]</span>
                    <span style={{ color: '#38bdf8' }}>PORT_0x01 &lt;-</span>
                    <strong style={{ color: '#4ade80' }}>{log.value}</strong>
                    <span style={{ color: '#64748b' }}>({log.hex})</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>via {log.register}</span>
                  </div>
                ))
              ) : (
                <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                  No output latched yet. Execute an <code>OUT Rs</code> instruction to view data here.
                </span>
              )}
            </div>
          </section>

          {/* Addressable RAM Memory Viewer */}
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Addressable RAM Memory Viewer (256 Words)
                </span>
              </div>

              {/* Segment Tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-subtle)', padding: '0.2rem', borderRadius: 'var(--radius-md)' }}>
                {[
                  { id: 'code', label: 'Code (0x00-0x1F)' },
                  { id: 'data', label: 'Data (0x80-0x9F)' },
                  { id: 'stack', label: 'Stack (0xE0-0xFF)' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveMemoryTab(tab.id)}
                    className={`speed-pill ${activeMemoryTab === tab.id ? 'active' : ''}`}
                    style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-wrapper" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table className="data-table" aria-label="RAM memory cells table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Hex Value</th>
                    <th>Decimal</th>
                    <th>Disassembly / Payload</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {memoryCells.map(cell => {
                    const isPC = cell.address === registers.PC;
                    const isMAR = cell.address === registers.MAR;
                    const isSP = cell.address === registers.SP;

                    return (
                      <tr
                        key={`cell-${cell.address}`}
                        style={{
                          background: isPC ? '#f0f9ff' : (isMAR ? '#fefce8' : (isSP ? '#faf5ff' : 'transparent'))
                        }}
                      >
                        <td><code style={{ fontWeight: '700', color: '#0f172a' }}>0x{cell.address.toString(16).toUpperCase().padStart(4, '0')}</code></td>
                        <td><code>{cell.hexVal}</code></td>
                        <td>{cell.value}</td>
                        <td><span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.775rem' }}>{cell.disassembly}</span></td>
                        <td>
                          {isPC && <span className="status-pill online" style={{ fontSize: '0.65rem' }}>PC</span>}
                          {isMAR && <span className="status-pill warning" style={{ fontSize: '0.65rem', marginLeft: '0.25rem' }}>MAR</span>}
                          {isSP && <span className="status-pill offline" style={{ fontSize: '0.65rem', marginLeft: '0.25rem' }}>SP</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}
