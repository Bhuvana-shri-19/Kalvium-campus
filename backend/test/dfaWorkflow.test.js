/**
 * Formal Languages & Automata Theory (FLAT Module)
 * DFA Academic Request Workflow Backend Test Suite
 * 
 * Verifies:
 *   1. Canonical DFA transitions:
 *      - CREATED + VALIDATE -> VALIDATED
 *      - VALIDATED + PROCESS -> PROCESSING
 *      - PROCESSING + COMPLETE -> COMPLETED
 *      - CREATED + REJECT -> REJECTED
 *   2. COMPLETED is strictly marked as the accepting / final state
 *   3. Invalid transitions do NOT change the current state (strict determinism)
 *   4. Backend rejects invalid transitions with HTTP 400 when called directly via API
 *   5. Zero-trust security: Client state spoofing is ignored and rejected
 *   6. Multi-symbol sequence validation (formal language word acceptance)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  transition,
  validateSequence,
  DFA_DEFINITION,
  normalizeState
} from '../src/services/workflowService.js';
import {
  DFA_SPECIFICATION,
  validateDFASequence
} from '../src/algorithms/dfaValidator.js';
import {
  createRequest as createRequestStore,
  getRequestById as getRequestByIdStore
} from '../src/data/requestsStore.js';
import { app } from '../src/app.js';

describe('FLAT DFA Academic Request Workflow Service & API', () => {

  // ============================================================================
  // 1. Canonical State Transitions
  // ============================================================================
  describe('1. Canonical DFA Transitions Verification', () => {
    it('should transition CREATED + VALIDATE -> VALIDATED', () => {
      const result = transition('CREATED', 'VALIDATE');

      assert.strictEqual(result.isValid, true, 'Transition must be valid');
      assert.strictEqual(result.state, 'VALIDATED', 'Next state must be VALIDATED');
      assert.strictEqual(result.currentState, 'VALIDATED');
      assert.strictEqual(result.isAccepted, false, 'VALIDATED is not an accepting state');
      assert.ok(result.message.includes('delta(CREATED, VALIDATE) -> VALIDATED'));
    });

    it('should transition VALIDATED + PROCESS -> PROCESSING', () => {
      const result = transition('VALIDATED', 'PROCESS');

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.state, 'PROCESSING', 'Next state must be PROCESSING');
      assert.strictEqual(result.currentState, 'PROCESSING');
      assert.strictEqual(result.isAccepted, false, 'PROCESSING is not an accepting state');
      assert.ok(result.message.includes('delta(VALIDATED, PROCESS) -> PROCESSING'));
    });

    it('should transition PROCESSING + COMPLETE -> COMPLETED (Accepting State)', () => {
      const result = transition('PROCESSING', 'COMPLETE');

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.state, 'COMPLETED', 'Next state must be COMPLETED');
      assert.strictEqual(result.currentState, 'COMPLETED');
      assert.strictEqual(result.isAccepted, true, 'COMPLETED must be marked as accepting state');
      assert.ok(result.message.includes('Request reached accepting state'));
    });

    it('should transition CREATED + REJECT -> REJECTED (Trap State)', () => {
      const result = transition('CREATED', 'REJECT');

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.state, 'REJECTED', 'Next state must be REJECTED');
      assert.strictEqual(result.currentState, 'REJECTED');
      assert.strictEqual(result.isAccepted, false, 'REJECTED is a non-accepting trap state');
      assert.ok(result.message.includes('delta(CREATED, REJECT) -> REJECTED'));
    });

    it('should transition REJECTED + RESUBMIT -> CREATED (Re-opening from trap)', () => {
      const result = transition('REJECTED', 'RESUBMIT');

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.state, 'CREATED', 'Next state must be CREATED');
      assert.strictEqual(result.isAccepted, false);
    });
  });

  // ============================================================================
  // 2. Accepting State Verification
  // ============================================================================
  describe('2. Formal DFA Acceptance Verification', () => {
    it('should verify that COMPLETED is the unique primary accepting state in DFA definition', () => {
      assert.strictEqual(DFA_DEFINITION.acceptingState, 'COMPLETED');
      assert.ok(DFA_DEFINITION.acceptingStates.includes('COMPLETED'));

      // Check state metadata in DFA_SPECIFICATION
      const completedMeta = DFA_SPECIFICATION.states.find(s => s.id === 'COMPLETED');
      assert.ok(completedMeta, 'COMPLETED state metadata must exist');
      assert.strictEqual(completedMeta.isAccepting, true, 'isAccepting must be true for COMPLETED');

      // Verify that non-final states are NOT accepting
      for (const nonFinal of ['CREATED', 'VALIDATED', 'PROCESSING', 'REJECTED']) {
        const meta = DFA_SPECIFICATION.states.find(s => s.id === nonFinal);
        assert.strictEqual(meta.isAccepting, false, `${nonFinal} must NOT be an accepting state`);
      }
    });

    it('should accept word ["VALIDATE", "PROCESS", "COMPLETE"] in formal language verification', () => {
      const evaluation = validateSequence(['VALIDATE', 'PROCESS', 'COMPLETE']);

      assert.strictEqual(evaluation.isAccepted, true, 'Complete valid lifecycle word must be accepted');
      assert.strictEqual(evaluation.finalState, 'COMPLETED');
      assert.strictEqual(evaluation.isHalted, false);
      assert.strictEqual(evaluation.trace.length, 4); // Step 0 (Init) + 3 steps
    });

    it('should reject incomplete word ["VALIDATE", "PROCESS"] as non-accepting', () => {
      const evaluation = validateSequence(['VALIDATE', 'PROCESS']);

      assert.strictEqual(evaluation.isAccepted, false, 'Incomplete sequence cannot be in accepting state');
      assert.strictEqual(evaluation.finalState, 'PROCESSING');
    });
  });

  // ============================================================================
  // 3. Strict Determinism: Invalid Transitions Do NOT Mutate Current State
  // ============================================================================
  describe('3. Strict Determinism (Invalid Transitions Do NOT Change State)', () => {
    it('should not change state when invalid symbol is applied to CREATED', () => {
      const result = transition('CREATED', 'COMPLETE'); // Skipping to complete is illegal

      assert.strictEqual(result.isValid, false, 'Must be marked invalid');
      assert.strictEqual(result.currentState, 'CREATED', 'Current state must remain CREATED');
      assert.strictEqual(result.state, 'CREATED', 'Resulting state must remain CREATED');
      assert.strictEqual(result.isAccepted, false);
      assert.ok(result.message.includes('Undefined transition rejected'));
    });

    it('should not change state when PROCESS is applied to CREATED', () => {
      const result = transition('CREATED', 'PROCESS');

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.currentState, 'CREATED');
      assert.strictEqual(result.state, 'CREATED');
    });

    it('should not change state when COMPLETE is applied to VALIDATED', () => {
      const result = transition('VALIDATED', 'COMPLETE');

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.currentState, 'VALIDATED');
      assert.strictEqual(result.state, 'VALIDATED');
    });

    it('should not change state when VALIDATE is applied to PROCESSING', () => {
      const result = transition('PROCESSING', 'VALIDATE');

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.currentState, 'PROCESSING');
      assert.strictEqual(result.state, 'PROCESSING');
    });

    it('should not change state when any action is applied to COMPLETED (final state)', () => {
      const result = transition('COMPLETED', 'VALIDATE');

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.currentState, 'COMPLETED');
      assert.strictEqual(result.state, 'COMPLETED');
      assert.strictEqual(result.isAccepted, true, 'Accepting status remains intact');
    });

    it('should not change state when VALIDATE is applied to REJECTED (trap state)', () => {
      const result = transition('REJECTED', 'VALIDATE');

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.currentState, 'REJECTED');
      assert.strictEqual(result.state, 'REJECTED');
    });
  });

  // ============================================================================
  // 4. Direct API Rejection of Invalid Transitions
  // ============================================================================
  describe('4. Direct API Rejection of Invalid Transitions', () => {
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

    it('should reject invalid transition directly via API and preserve state in store', async () => {
      // 1. Create request
      const createRes = await fetch(`${baseUrl}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'DFA Test Request', category: 'Scholarship' })
      });
      assert.strictEqual(createRes.status, 201);
      const createData = await createRes.json();
      const requestId = createData.data.id;
      assert.strictEqual(createData.data.currentState, 'CREATED');

      // 2. Send invalid direct action (COMPLETE from CREATED state)
      const invalidRes = await fetch(`${baseUrl}/api/requests/${requestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'COMPLETE' })
      });

      assert.strictEqual(invalidRes.status, 400, 'Direct API invalid action must return HTTP 400');
      const errorJson = await invalidRes.json();
      assert.strictEqual(errorJson.success, false);
      assert.ok(
        errorJson.error.includes('Undefined transition rejected') || errorJson.error.includes('Invalid DFA transition'),
        'Error message must state transition is rejected'
      );

      // 3. Verify in store that state was strictly NOT mutated
      const verifyRes = await fetch(`${baseUrl}/api/requests/${requestId}`);
      assert.strictEqual(verifyRes.status, 200);
      const verifyJson = await verifyRes.json();
      assert.strictEqual(
        verifyJson.data.currentState,
        'CREATED',
        'Request state in store MUST remain CREATED after invalid transition attempt'
      );
    });

    it('should ignore client-supplied spoofed state and validate against true store state', async () => {
      // Create fresh request
      const createRes = await fetch(`${baseUrl}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Spoofing Test', category: 'Academics' })
      });
      const createJson = await createRes.json();
      const requestId = createJson.data.id;

      // Client claims it is already VALIDATED and tries to trigger PROCESS
      const spoofRes = await fetch(`${baseUrl}/api/requests/${requestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PROCESS', currentState: 'VALIDATED' })
      });

      // Must be rejected because server knows actual state is CREATED
      assert.strictEqual(spoofRes.status, 400);
      const spoofJson = await spoofRes.json();
      assert.strictEqual(spoofJson.success, false);

      // Verify store state is still CREATED
      const checkRes = await fetch(`${baseUrl}/api/requests/${requestId}`);
      const checkJson = await checkRes.json();
      assert.strictEqual(checkJson.data.currentState, 'CREATED');
    });

    it('should successfully execute the full lifecycle via API: CREATED -> VALIDATED -> PROCESSING -> COMPLETED', async () => {
      // 1. Create request
      const createRes = await fetch(`${baseUrl}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Full Lifecycle Pass', category: 'Library' })
      });
      const reqId = (await createRes.json()).data.id;

      // 2. VALIDATE -> VALIDATED
      const step1Res = await fetch(`${baseUrl}/api/requests/${reqId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VALIDATE' })
      });
      assert.strictEqual(step1Res.status, 200);
      const step1 = await step1Res.json();
      assert.strictEqual(step1.data.currentState, 'VALIDATED');
      assert.strictEqual(step1.transition.isAccepted, false);

      // 3. PROCESS -> PROCESSING
      const step2Res = await fetch(`${baseUrl}/api/requests/${reqId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PROCESS' })
      });
      assert.strictEqual(step2Res.status, 200);
      const step2 = await step2Res.json();
      assert.strictEqual(step2.data.currentState, 'PROCESSING');
      assert.strictEqual(step2.transition.isAccepted, false);

      // 4. COMPLETE -> COMPLETED (Accepting State)
      const step3Res = await fetch(`${baseUrl}/api/requests/${reqId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'COMPLETE' })
      });
      assert.strictEqual(step3Res.status, 200);
      const step3 = await step3Res.json();
      assert.strictEqual(step3.data.currentState, 'COMPLETED');
      assert.strictEqual(step3.data.status, 'APPROVED');
      assert.strictEqual(step3.transition.isAccepted, true);
      assert.strictEqual(step3.data.isAccepted, true);

      // 5. Attempting further transition from COMPLETED is rejected
      const postCompleteRes = await fetch(`${baseUrl}/api/requests/${reqId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VALIDATE' })
      });
      assert.strictEqual(postCompleteRes.status, 400);

      // State remains COMPLETED in store
      const finalCheck = await (await fetch(`${baseUrl}/api/requests/${reqId}`)).json();
      assert.strictEqual(finalCheck.data.currentState, 'COMPLETED');
    });

    it('should successfully execute rejection via API: CREATED -> REJECTED', async () => {
      // 1. Create request
      const createRes = await fetch(`${baseUrl}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Reject Me', category: 'Hostel' })
      });
      const reqId = (await createRes.json()).data.id;

      // 2. REJECT -> REJECTED
      const rejectRes = await fetch(`${baseUrl}/api/requests/${reqId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' })
      });
      assert.strictEqual(rejectRes.status, 200);
      const rejectData = await rejectRes.json();
      assert.strictEqual(rejectData.data.currentState, 'REJECTED');
      assert.strictEqual(rejectData.data.status, 'REJECTED');
      assert.strictEqual(rejectData.transition.isAccepted, false);

      // 3. Attempting VALIDATE from REJECTED is rejected with 400
      const invalidRes = await fetch(`${baseUrl}/api/requests/${reqId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VALIDATE' })
      });
      assert.strictEqual(invalidRes.status, 400);

      // State remains REJECTED
      const checkRes = await (await fetch(`${baseUrl}/api/requests/${reqId}`)).json();
      assert.strictEqual(checkRes.data.currentState, 'REJECTED');
    });
  });
});
