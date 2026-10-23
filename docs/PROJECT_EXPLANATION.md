# Kalvium Campus Navigator & Request Processing Simulator
## Academic Project Presentation & Technical Reference Guide

**Project Title:** Kalvium Campus Navigator & Request Processing Simulator  
**Repository:** [https://github.com/Bhuvana-shri-19/Kalvium-campus](https://github.com/Bhuvana-shri-19/Kalvium-campus)  
**Academic Disciplines:** Design & Analysis of Algorithms (DAA), Computer Organization & Architecture (COA), Formal Languages & Automata Theory (FLAT)  
**Stack:** React 18, Vite, Node.js, Express, ES Modules, native `node --test`  

---

## 1. Executive Summary & Purpose

In university computer science curricula, theoretical subjects such as graph traversal algorithms, hardware processor cycles, and finite automata are often taught in isolation through purely mathematical problem sets.

The **Kalvium Campus Simulator** unites these three disciplines into one coherent, observable full-stack software application:
- **DAA Module**: Models campus navigation as an undirected graph, finding optimal shortest paths via Breadth-First Search (BFS) and reachability via Depth-First Search (DFS).
- **COA Module**: Simulates the execution of student requests through the 4 von Neumann functional units (Input Unit $\to$ Memory $\to$ CPU $\to$ Output Unit) with active tri-bus signaling and register tracing.
- **FLAT Module**: Regulates the academic request approval lifecycle as a formal 5-tuple Deterministic Finite Automaton (DFA) $M = (Q, \Sigma, \delta, q_0, F)$, proving strict determinism and error rejection.

---

## 2. System Architecture

```
                    +------------------------------------+
                    |       REACT 18 + VITE FRONTEND     |
                    | (SPA with React Router v6 & Hooks) |
                    +------------------------------------+
                                      |
                     RESTful JSON APIs (HTTP on port 5000)
                                      |
                    +------------------------------------+
                    |       NODE.JS + EXPRESS BACKEND    |
                    | (Modular controllers, services,    |
                    |  algorithms, and in-memory store)  |
                    +------------------------------------+
                     /                 |                \
                    /                  |                 \
       +-----------------+   +------------------+   +-----------------+
       |   DAA SERVICE   |   |   COA SERVICE    |   |  FLAT SERVICE   |
       |  (bfs.js,       |   |  (processing-    |   | (workflow-      |
       |   dfs.js,       |   |   Service.js,    |   |  Service.js,    |
       |   campusGraph)  |   |   tri-bus latch) |   |  requestsStore) |
       +-----------------+   +------------------+   +-----------------+
```

---

## 3. Module Deep-Dive

### Module 1: Design & Analysis of Algorithms (DAA)

#### Campus Graph Specification
The campus is represented as an undirected graph $G = (V, E)$ with 6 landmark vertices:
- `GATE`: Main entrance & security turnaround
- `BLOCK_A`: Core lecture halls & department offices
- `LIBRARY`: Knowledge library & digital reading commons
- `CAFETERIA`: Student dining & amenity lounge
- `LAB`: Computing & Innovation Laboratory
- `HOSTEL`: Student residential towers

#### BFS (Breadth-First Search)
- **Data Structure**: First-In, First-Out (FIFO) queue.
- **Theoretical Guarantee**: In an unweighted graph, BFS guarantees the minimum hop shortest path because vertices are discovered level-by-level in non-decreasing order of distance from the source.
- **Complexity**: Time $\mathcal{O}(V + E)$, Space $\mathcal{O}(V)$.
- **Example Trace**: `GATE &rarr; HOSTEL` traverses `GATE &rarr; BLOCK_A &rarr; LAB &rarr; HOSTEL` in exactly **3 hops** (optimal).

#### DFS (Depth-First Search)
- **Data Structure**: LIFO recursion stack.
- **Theoretical Property**: Exhaustively traverses deep branches before backtracking. Demonstrates connectivity and spanning tree edge discovery.
- **Complexity**: Time $\mathcal{O}(V + E)$, Space $\mathcal{O}(V)$.

---

### Module 2: Computer Organization & Architecture (COA)

#### The 4-Stage von Neumann Processing Pipeline
```
[ Input Unit ] ----> [ Memory Unit ] ----> [ CPU (CU + ALU) ] ----> [ Output Unit ]
 (Stage 0)             (Stage 1)              (Stage 2)               (Stage 3)
```

1. **Stage 0 (Input Unit)**: Captures incoming student request parameters into peripheral latch buffer. Sets Program Counter $PC = 0x00A0$.
2. **Stage 1 (Memory Unit)**: Address Bus routes to RAM base address (`0x00A0`). Loads Memory Address Register (MAR) and latches contents into Memory Data Register (MDR).
3. **Stage 2 (CPU)**: Instruction Register (IR) decodes opcode. The Arithmetic Logic Unit (ALU) validates boundary rules (e.g. verifying credit units $\le 24$). Updates Accumulator (ACC).
4. **Stage 3 (Output Unit)**: Writes finalized status into terminal latch. Control bus emits `EXECUTION_COMPLETE`. Pipeline clamps at Stage 3 preventing illegal out-of-bounds advancement.

#### The Tri-Bus Subsystem
- **Data Bus**: Bidirectional lines carrying request payload and credit units.
- **Address Bus**: Unidirectional lines carrying RAM memory pointers (`0x00A0`..`0x00B0`).
- **Control Bus**: Bidirectional coordination strobes (`MEM_READ`, `MEM_WRITE`, `ALU_EXEC`, `STANDBY`).

---

### Module 3: Formal Languages & Automata Theory (FLAT)

#### The Formal 5-Tuple DFA: $M = (Q, \Sigma, \delta, q_0, F)$

1. **$Q$ (States)**: `{ CREATED, VALIDATED, PROCESSING, COMPLETED, REJECTED }`
2. **$\Sigma$ (Alphabet)**: `{ VALIDATE, PROCESS, COMPLETE, REJECT, RESUBMIT }`
3. **$q_0$ (Initial State)**: `CREATED`
4. **$F$ (Accepting States)**: `{ COMPLETED }`
5. **$\delta$ (Transition Function)**:

| Current State $q$ | Input Symbol $\sigma$ | Next State $\delta(q, \sigma)$ | Academic Classification |
| :--- | :--- | :--- | :--- |
| `CREATED` | `VALIDATE` | `VALIDATED` | Intermediate |
| `CREATED` | `REJECT` | `REJECTED` | Trap State |
| `VALIDATED` | `PROCESS` | `PROCESSING` | Intermediate |
| `VALIDATED` | `REJECT` | `REJECTED` | Trap State |
| `PROCESSING` | `COMPLETE` | `COMPLETED` | **Accepting State ($F$)** |
| `PROCESSING` | `REJECT` | `REJECTED` | Trap State |
| `REJECTED` | `RESUBMIT` | `CREATED` | Re-open action |
| `COMPLETED` | *(any)* | $\emptyset$ | Terminal accepting state |

#### Invariant: Strict Determinism
If an action symbol is submitted that is undefined from the current state (e.g. `COMPLETE` while in `CREATED`), the backend Express controller immediately rejects the action with **HTTP 400 Bad Request**. The request state in memory remains strictly unmodified, ensuring the automata cannot enter undefined states.

---

## 4. Guided Request Workflow (5 Steps)

The application provides an intuitive 5-step wizard in `WorkflowValidator.jsx`:

1. **Step 1: Create Request**: Enter title, student name, student ID, type, priority, and description. Form validates inputs and initialises request in state $q_0 = \text{CREATED}$.
2. **Step 2: Validate Request**: Explains academic prerequisite validation. Only `VALIDATE` or `REJECT` are enabled.
3. **Step 3: Process Request**: Explains departmental queue review. Enabled when state is `VALIDATED`.
4. **Step 4: Complete or Reject**: Sealed into accepting state `COMPLETED` (celebration banner) or trap state `REJECTED`.
5. **Step 5: View History**: Step-by-step audit log showing timestamped state transitions and direct button to full Request History.

---

## 5. Storage & Volatility Semantics

- **Storage Type**: In-memory JavaScript store (`_store` array in `backend/src/data/requestsStore.js`).
- **Initial State**: Seeded with 3 baseline records (`REQ-1001`, `REQ-1002`, `REQ-1003`).
- **Persistence Rule**: Requests created or updated during the session persist in memory for the active uptime of the backend process. If the server is restarted, the store resets to default seed records.
- **Architectural Rationale**: Eliminates external database setup (MongoDB/PostgreSQL) so the simulator runs immediately out-of-the-box on any student laptop.

---

## 6. 3-Minute Presentation Demo Script (For Viva / Evaluation)

1. **Slide / Screen 1: Dashboard (30s)**
   - Open `http://localhost:5173/dashboard`.
   - Point out the project intro banner and real summary cards computed from loaded requests.
2. **Slide / Screen 2: DAA Campus Navigator (45s)**
   - Open `Campus Navigator`. Select `GATE` $\to$ `HOSTEL`. Click **Find Shortest Route (BFS)**.
   - Explain why BFS guarantees 3 hops (`GATE &rarr; BLOCK_A &rarr; LAB &rarr; HOSTEL`) due to level-order exploration.
3. **Slide / Screen 3: COA Computer Architecture (45s)**
   - Open `Computer Architecture`. Advance through the 4 stages: Input $\to$ Memory $\to$ CPU $\to$ Output.
   - Point out how MAR loads `0x00A0`, how the ALU evaluates credit caps, and how tri-bus strobes coordinate execution.
4. **Slide / Screen 4: FLAT Request Workflow (60s)**
   - Open `Request Workflow`. Create a request (`CREATED`).
   - Click **Validate** $\to$ `VALIDATED`.
   - Click **Process** $\to$ `PROCESSING`.
   - Click **Complete** $\to$ `COMPLETED` (Accepting State).
   - Expand the **Automata Theory Inspector** and dispatch an invalid symbol (e.g. `PROCESS`) to demonstrate the live HTTP 400 rejection proving strict determinism!
