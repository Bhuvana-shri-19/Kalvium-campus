import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge.jsx';
import '../styles/pages.css';

export default function Home() {
  return (
    <div className="page-container">
      {/* Educational Purpose & Hero Section */}
      <section className="home-hero-card" aria-label="Project Overview and Purpose">
        <div className="home-hero-header">
          <div className="home-hero-title-area">
            <h1>Kalvium Campus Navigator & Request Processing Simulator</h1>
            <p className="home-hero-subtitle">
              An educational full-stack simulator bridging theoretical computer science curricula with practical application. The system demonstrates how a student campus request traverses physical network topologies (DAA), executes across digital hardware functional units (COA), and transitions through formal automata states (FLAT).
            </p>
          </div>
          <StatusBadge status="online" label="Simulator Active" />
        </div>

        {/* Academic Discipline Badges */}
        <div className="home-hero-disciplines" aria-label="Covered Academic Subjects">
          <span className="discipline-tag">
            <span className="academic-badge badge-daa">DAA</span>
            <span>Design &amp; Analysis of Algorithms</span>
          </span>
          <span className="discipline-tag">
            <span className="academic-badge badge-coa">COA</span>
            <span>Computer Organization &amp; Architecture</span>
          </span>
          <span className="discipline-tag">
            <span className="academic-badge badge-flat">FLAT</span>
            <span>Formal Languages &amp; Automata Theory</span>
          </span>
        </div>

        {/* Prominent Action Controls */}
        <div className="home-hero-actions">
          <Link to="/dashboard" className="btn-prominent">
            <span>Open Dashboard</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <Link to="/request-history" className="btn btn-secondary">
            View Request History
          </Link>
        </div>
      </section>

      {/* Section Heading */}
      <div className="features-section-header">
        <h2 className="features-section-title">Core Academic Modules</h2>
        <p className="features-section-desc">
          Select an academic simulator to inspect algorithm execution traces, bus signals, or automata state transitions.
        </p>
      </div>

      {/* Three Clear Feature Sections */}
      <div className="card-grid" aria-label="Academic Simulator Modules">
        {/* Module 1: DAA */}
        <section className="academic-feature-card" aria-labelledby="feature-daa-title">
          <div>
            <div className="feature-card-header">
              <span className="academic-badge badge-daa">DAA Module</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Graph Theory</span>
            </div>
            <h3 id="feature-daa-title" className="feature-card-title">Campus Navigation (BFS &amp; DFS)</h3>
            <p className="feature-card-p">
              Models the Kalvium campus layout as an undirected graph with 6 core landmarks and 9 connecting pathways. Demonstrates fundamental graph search strategies:
            </p>

            <ul className="feature-spec-list" style={{ marginTop: '1rem' }}>
              <li>
                <span className="spec-bullet">&bull;</span>
                <span><strong>Breadth-First Search (BFS):</strong> Evaluates level-order frontier queues to guarantee minimum hop counts and shortest walking routes.</span>
              </li>
              <li>
                <span className="spec-bullet">&bull;</span>
                <span><strong>Depth-First Search (DFS):</strong> Executes recursive exploration, tracking discovery paths, backtracking events, and spanning tree edges.</span>
              </li>
              <li>
                <span className="spec-bullet">&bull;</span>
                <span><strong>Interactive Visualizer:</strong> Responsive SVG graph highlighting active paths, distance labels (meters), and visited step numbers.</span>
              </li>
            </ul>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Link to="/navigator" className="btn btn-primary" style={{ width: '100%' }}>
              Open Campus Navigator &rarr;
            </Link>
          </div>
        </section>

        {/* Module 2: COA */}
        <section className="academic-feature-card" aria-labelledby="feature-coa-title">
          <div>
            <div className="feature-card-header">
              <span className="academic-badge badge-coa">COA Module</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Hardware Architecture</span>
            </div>
            <h3 id="feature-coa-title" className="feature-card-title">Computer Architecture Simulator</h3>
            <p className="feature-card-p">
              Simulates von Neumann instruction processing by stepping requests through hardware units and monitoring micro-operations across the tri-bus system:
            </p>

            <ul className="feature-spec-list" style={{ marginTop: '1rem' }}>
              <li>
                <span className="spec-bullet">&bull;</span>
                <span><strong>4 Functional Units:</strong> Sequential flow through Input Unit, Memory Unit (RAM 0x00A0..0x00B0), CPU (CU &amp; ALU), and Output Unit.</span>
              </li>
              <li>
                <span className="spec-bullet">&bull;</span>
                <span><strong>Tri-Bus Subsystem:</strong> Distinguishes Data Bus (payload), Address Bus (memory pointers), and Control Bus (timing &amp; strobes).</span>
              </li>
              <li>
                <span className="spec-bullet">&bull;</span>
                <span><strong>Register Tracing:</strong> Inspects Program Counter (PC), MAR, MDR, Instruction Register (IR), and Accumulator (ACC) at each step.</span>
              </li>
            </ul>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Link to="/architecture" className="btn btn-primary" style={{ width: '100%' }}>
              Open Architecture Simulator &rarr;
            </Link>
          </div>
        </section>

        {/* Module 3: FLAT */}
        <section className="academic-feature-card" aria-labelledby="feature-flat-title">
          <div>
            <div className="feature-card-header">
              <span className="academic-badge badge-flat">FLAT Module</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Automata Theory</span>
            </div>
            <h3 id="feature-flat-title" className="feature-card-title">Request Workflow Validator</h3>
            <p className="feature-card-p">
              Formalizes academic document approvals as a 5-tuple Deterministic Finite Automaton $M = (Q, \Sigma, \delta, q_0, F)$ to strictly prevent unauthorized administrative steps:
            </p>

            <ul className="feature-spec-list" style={{ marginTop: '1rem' }}>
              <li>
                <span className="spec-bullet">&bull;</span>
                <span><strong>Formal State Set ($Q$):</strong> CREATED (start $q_0$), VALIDATED, PROCESSING, COMPLETED (accepting $F$), and REJECTED (trap state).</span>
              </li>
              <li>
                <span className="spec-bullet">&bull;</span>
                <span><strong>Transition Function ($\delta$):</strong> Verifies symbol sequences against the transition table; flags non-deterministic or illegal transitions.</span>
              </li>
              <li>
                <span className="spec-bullet">&bull;</span>
                <span><strong>Visual Automaton Diagram:</strong> SVG state chart displaying initial start pointer, active state glow, and double-circle accepting notation.</span>
              </li>
            </ul>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Link to="/workflow" className="btn btn-primary" style={{ width: '100%' }}>
              Open Workflow Validator &rarr;
            </Link>
          </div>
        </section>
      </div>

      {/* Interdisciplinary Integration Banner */}
      <section className="integration-pipeline-card" aria-label="End-to-End Simulation Lifecycle">
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Interdisciplinary Processing Flow
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Every campus submission travels through the three computer science disciplines in a coordinated sequence:
          </p>
        </div>

        <div className="pipeline-steps-grid">
          <div className="pipeline-step-item">
            <span className="step-item-badge">Phase 1 &bull; DAA</span>
            <div className="step-item-title">Topological Routing</div>
            <p className="step-item-desc">
              Computes shortest physical navigation path between the student's landmark and the department office using BFS/DFS.
            </p>
          </div>

          <div className="pipeline-step-item">
            <span className="step-item-badge">Phase 2 &bull; FLAT</span>
            <div className="step-item-title">Automata Verification</div>
            <p className="step-item-desc">
              Validates whether the approval sequence adheres to the formal DFA transition table from CREATED to COMPLETED.
            </p>
          </div>

          <div className="pipeline-step-item">
            <span className="step-item-badge">Phase 3 &bull; COA</span>
            <div className="step-item-title">Hardware Execution</div>
            <p className="step-item-desc">
              Executes the validated payload through the CPU instruction cycle (Fetch, Decode, ALU verification, Write-back, and Output).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
