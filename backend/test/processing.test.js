/**
 * Computer Organization & Architecture (COA Module)
 * Processing Simulation Backend Test Suite
 * 
 * Verifies:
 *   1. Simulation starts at Input Unit (Stage 0) with peripheral explanation
 *   2. Advances in strict order: Memory Unit (Stage 1) -> CPU (Stage 2) -> Output Unit (Stage 3)
 *   3. Clamping at final stage: Does not advance beyond Output Unit (Stage 3)
 *   4. Resetting: Accurately resets state back to Input Unit (Stage 0)
 *   5. Error handling: Missing or nonexistent simulation IDs return 400 / 404
 *   6. Express HTTP Endpoints Integration
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  startSimulation,
  advanceStage,
  resetSimulation,
  getSimulationById,
  clearSimulations,
  FUNCTIONAL_UNIT_STAGES
} from '../src/services/processingService.js';
import { app } from '../src/app.js';

describe('COA Computer Architecture Processing Service & API', () => {

  // ============================================================================
  // 1. Initial State Verification (Input Unit)
  // ============================================================================
  describe('1. Initial Simulation State (Input Unit)', () => {
    it('should initialize at Stage 0 (Input Unit) with complete bus and explanation metadata', () => {
      clearSimulations();
      const sim = startSimulation({ title: 'AI Lab Pass', studentId: 'KAL-2026-101', creditUnits: 16 });

      assert.ok(sim.simulationId, 'Must generate a unique simulationId');
      assert.strictEqual(sim.currentStageIndex, 0, 'Initial stage index must be 0');
      assert.strictEqual(sim.activeUnit, 'INPUT_UNIT', 'Active unit must be INPUT_UNIT');
      assert.strictEqual(sim.currentStage.name, 'Input Unit', 'Stage name must be Input Unit');
      assert.strictEqual(sim.isComplete, false, 'isComplete must be false initially');
      assert.strictEqual(sim.canAdvance, true, 'canAdvance must be true initially');
      assert.strictEqual(sim.totalStages, 4, 'Total pipeline stages must be 4');

      // Explanation verification
      assert.ok(
        sim.currentStage.explanation.includes('Input Unit receives the student request packet'),
        'Explanation must accurately describe Input Unit operation'
      );
      assert.strictEqual(sim.history.length, 1, 'Initial history must contain 1 entry');
      assert.strictEqual(sim.history[0].unitId, 'INPUT_UNIT');

      // Bus signals verification
      assert.strictEqual(sim.buses.dataBus.active, true);
      assert.strictEqual(sim.buses.controlBus.value, 'INPUT_READY');
    });
  });

  // ============================================================================
  // 2. Sequential Stage Advancement
  // ============================================================================
  describe('2. Sequential Advancement Through Pipeline Stages', () => {
    it('should advance in strict order: Memory Unit -> CPU -> Output Unit', () => {
      clearSimulations();
      const sim = startSimulation({ studentId: 'KAL-2026-202' });

      // Step 1: Memory Unit
      const step1 = advanceStage(sim.simulationId);
      assert.strictEqual(step1.currentStageIndex, 1, 'Must advance to Stage 1');
      assert.strictEqual(step1.activeUnit, 'MEMORY_UNIT', 'Active unit must be MEMORY_UNIT');
      assert.strictEqual(step1.currentStage.name, 'Memory Unit');
      assert.strictEqual(step1.isComplete, false);
      assert.strictEqual(step1.canAdvance, true);
      assert.ok(
        step1.currentStage.explanation.includes('Memory Unit decodes the designated memory address'),
        'Must explain RAM addressing and storage'
      );
      assert.strictEqual(step1.buses.addressBus.value, '0x00A0 (Base Data Address)');

      // Step 2: CPU
      const step2 = advanceStage(sim.simulationId);
      assert.strictEqual(step2.currentStageIndex, 2, 'Must advance to Stage 2');
      assert.strictEqual(step2.activeUnit, 'CPU', 'Active unit must be CPU');
      assert.strictEqual(step2.currentStage.name, 'Central Processing Unit (CPU)');
      assert.strictEqual(step2.isComplete, false);
      assert.strictEqual(step2.canAdvance, true);
      assert.ok(
        step2.currentStage.explanation.includes('CPU (Control Unit + ALU) fetches the stored request'),
        'Must explain CU and ALU verification'
      );

      // Step 3: Output Unit (Final)
      const step3 = advanceStage(sim.simulationId);
      assert.strictEqual(step3.currentStageIndex, 3, 'Must advance to Stage 3');
      assert.strictEqual(step3.activeUnit, 'OUTPUT_UNIT', 'Active unit must be OUTPUT_UNIT');
      assert.strictEqual(step3.currentStage.name, 'Output Unit');
      assert.strictEqual(step3.isComplete, true, 'isComplete must become true at Output Unit');
      assert.strictEqual(step3.canAdvance, false, 'canAdvance must become false at Output Unit');
      assert.ok(
        step3.currentStage.explanation.includes('Output Unit reads the finalized verification decision'),
        'Must explain output formatting and dispatch'
      );
      assert.strictEqual(step3.history.length, 4, 'History should retain all 4 pipeline stages');
    });
  });

  // ============================================================================
  // 3. Final Stage Clamping (Does Not Advance Beyond Output Unit)
  // ============================================================================
  describe('3. Final Stage Clamping', () => {
    it('should strictly remain at Output Unit (Stage 3) and not advance beyond', () => {
      clearSimulations();
      const sim = startSimulation();

      // Advance to final stage (Output Unit)
      advanceStage(sim.simulationId); // To Stage 1
      advanceStage(sim.simulationId); // To Stage 2
      const finalStage = advanceStage(sim.simulationId); // To Stage 3
      assert.strictEqual(finalStage.currentStageIndex, 3);
      assert.strictEqual(finalStage.activeUnit, 'OUTPUT_UNIT');

      // Attempt to advance beyond final stage multiple times
      const clamped1 = advanceStage(sim.simulationId);
      assert.strictEqual(clamped1.currentStageIndex, 3, 'Stage index must remain 3');
      assert.strictEqual(clamped1.activeUnit, 'OUTPUT_UNIT', 'Active unit must remain OUTPUT_UNIT');
      assert.strictEqual(clamped1.isComplete, true, 'isComplete must remain true');
      assert.strictEqual(clamped1.canAdvance, false, 'canAdvance must remain false');

      const clamped2 = advanceStage(sim.simulationId);
      assert.strictEqual(clamped2.currentStageIndex, 3, 'Stage index must still be 3');
      assert.strictEqual(clamped2.activeUnit, 'OUTPUT_UNIT');
    });
  });

  // ============================================================================
  // 4. Reset Functionality
  // ============================================================================
  describe('4. Reset Functionality', () => {
    it('should reset back to Stage 0 (Input Unit) restoring initial properties', () => {
      clearSimulations();
      const sim = startSimulation({ title: 'Course Add Request' });

      // Advance to CPU
      advanceStage(sim.simulationId);
      advanceStage(sim.simulationId);
      assert.strictEqual(getSimulationById(sim.simulationId).currentStageIndex, 2);

      // Perform reset
      const resetState = resetSimulation(sim.simulationId);

      assert.strictEqual(resetState.simulationId, sim.simulationId, 'Must preserve session ID');
      assert.strictEqual(resetState.currentStageIndex, 0, 'Stage index must reset to 0');
      assert.strictEqual(resetState.activeUnit, 'INPUT_UNIT', 'Active unit must reset to INPUT_UNIT');
      assert.strictEqual(resetState.currentStage.name, 'Input Unit');
      assert.strictEqual(resetState.isComplete, false, 'isComplete must reset to false');
      assert.strictEqual(resetState.canAdvance, true, 'canAdvance must reset to true');
      assert.ok(resetState.currentStage.explanation.includes('Input Unit receives the student request packet'));
    });
  });

  // ============================================================================
  // 5. Error Handling for Missing / Nonexistent Simulation IDs
  // ============================================================================
  describe('5. Error Handling', () => {
    it('should throw 404 when advancing a nonexistent simulation ID', () => {
      assert.throws(
        () => advanceStage('SIM-NONEXISTENT-999'),
        (err) => err.status === 404 && err.message.includes('SIM-NONEXISTENT-999')
      );
    });

    it('should throw 404 when resetting a nonexistent simulation ID', () => {
      assert.throws(
        () => resetSimulation('SIM-NONEXISTENT-999'),
        (err) => err.status === 404 && err.message.includes('SIM-NONEXISTENT-999')
      );
    });

    it('should throw 400 when invalid input is provided to advanceStage', () => {
      assert.throws(
        () => advanceStage(null),
        (err) => err.status === 400
      );
    });
  });

  // ============================================================================
  // 6. Express HTTP Endpoints Integration
  // ============================================================================
  describe('6. Express HTTP Endpoints Integration', () => {
    let server;
    let baseUrl;

    before(async () => {
      await new Promise((resolve) => {
        server = app.listen(0, () => {
          const port = server.address().port;
          baseUrl = `http://localhost:${port}`;
          resolve();
        });
      });
    });

    after(async () => {
      if (server) {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('POST /api/processing/start should return 201 with Stage 0 (Input Unit)', async () => {
      const res = await fetch(`${baseUrl}/api/processing/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'HTTP Test', priority: 1, creditUnits: 20 })
      });

      assert.strictEqual(res.status, 201);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.simulationId);
      assert.strictEqual(json.currentStageIndex, 0);
      assert.strictEqual(json.activeUnit, 'INPUT_UNIT');
      assert.strictEqual(json.currentStage.name, 'Input Unit');
      assert.ok(json.explanation.includes('Input Unit receives'));
      assert.strictEqual(json.isComplete, false);
      assert.strictEqual(json.canAdvance, true);
    });

    it('POST /api/processing/advance should cycle through stages up to Output Unit and clamp', async () => {
      // 1. Start simulation
      const startRes = await fetch(`${baseUrl}/api/processing/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Pipeline Stepper' })
      });
      const startJson = await startRes.json();
      const simId = startJson.simulationId;

      // 2. Step 1 -> Memory Unit
      const step1Res = await fetch(`${baseUrl}/api/processing/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId: simId })
      });
      assert.strictEqual(step1Res.status, 200);
      const step1 = await step1Res.json();
      assert.strictEqual(step1.currentStageIndex, 1);
      assert.strictEqual(step1.activeUnit, 'MEMORY_UNIT');
      assert.strictEqual(step1.currentStage.name, 'Memory Unit');
      assert.ok(step1.explanation.includes('Memory Unit decodes'));

      // 3. Step 2 -> CPU
      const step2Res = await fetch(`${baseUrl}/api/processing/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId: simId })
      });
      assert.strictEqual(step2Res.status, 200);
      const step2 = await step2Res.json();
      assert.strictEqual(step2.currentStageIndex, 2);
      assert.strictEqual(step2.activeUnit, 'CPU');
      assert.strictEqual(step2.currentStage.name, 'Central Processing Unit (CPU)');
      assert.ok(step2.explanation.includes('CPU (Control Unit + ALU)'));

      // 4. Step 3 -> Output Unit (Final)
      const step3Res = await fetch(`${baseUrl}/api/processing/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId: simId })
      });
      assert.strictEqual(step3Res.status, 200);
      const step3 = await step3Res.json();
      assert.strictEqual(step3.currentStageIndex, 3);
      assert.strictEqual(step3.activeUnit, 'OUTPUT_UNIT');
      assert.strictEqual(step3.currentStage.name, 'Output Unit');
      assert.strictEqual(step3.isComplete, true);
      assert.strictEqual(step3.canAdvance, false);
      assert.ok(step3.explanation.includes('Output Unit reads the finalized verification decision'));

      // 5. Attempt step beyond final stage -> Clamped at Output Unit
      const step4Res = await fetch(`${baseUrl}/api/processing/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId: simId })
      });
      assert.strictEqual(step4Res.status, 200);
      const step4 = await step4Res.json();
      assert.strictEqual(step4.currentStageIndex, 3);
      assert.strictEqual(step4.activeUnit, 'OUTPUT_UNIT');
      assert.strictEqual(step4.isComplete, true);
      assert.strictEqual(step4.canAdvance, false);

      // 6. Reset simulation -> Returns to Input Unit
      const resetRes = await fetch(`${baseUrl}/api/processing/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId: simId })
      });
      assert.strictEqual(resetRes.status, 200);
      const resetJson = await resetRes.json();
      assert.strictEqual(resetJson.currentStageIndex, 0);
      assert.strictEqual(resetJson.activeUnit, 'INPUT_UNIT');
      assert.strictEqual(resetJson.currentStage.name, 'Input Unit');
      assert.strictEqual(resetJson.isComplete, false);
      assert.strictEqual(resetJson.canAdvance, true);
      assert.ok(resetJson.explanation.includes('Input Unit receives'));
    });

    it('POST /api/processing/advance missing simulationId should return 400', async () => {
      const res = await fetch(`${baseUrl}/api/processing/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('simulationId'));
    });

    it('POST /api/processing/advance nonexistent simulationId should return 404', async () => {
      const res = await fetch(`${baseUrl}/api/processing/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId: 'NONEXISTENT_SIM' })
      });

      assert.strictEqual(res.status, 404);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('NONEXISTENT_SIM'));
    });

    it('GET /api/processing/overview should return educational functional units and bus specs', async () => {
      const res = await fetch(`${baseUrl}/api/processing/overview`);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.stages.length, 4);
      assert.deepStrictEqual(json.data.sequenceOrder, ['Input Unit', 'Memory Unit', 'CPU', 'Output Unit']);
      assert.ok(json.data.busConcepts.DATA_BUS);
      assert.ok(json.data.busConcepts.ADDRESS_BUS);
      assert.ok(json.data.busConcepts.CONTROL_BUS);
    });
  });
});
