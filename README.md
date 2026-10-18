# Kalvium Campus Navigator & Request Processing Simulator

An integrated full-stack educational web application unifying three foundational undergraduate Computer Science disciplines into a cohesive, interactive simulation:

1. **DAA (Design & Analysis of Algorithms)**: Campus landmark topological graph modeling, queue-based Breadth-First Search (BFS) shortest path computation, and recursive Depth-First Search (DFS) reachability traversal.
2. **COA (Computer Organization & Architecture)**: Conceptual von Neumann functional-unit pipeline simulation (Input Unit $\to$ Memory Unit $\to$ CPU $\to$ Output Unit) with active tri-bus signal monitoring and CPU register tracing.
3. **FLAT (Formal Languages & Automata Theory)**: Deterministic Finite Automaton (DFA) formalizing student administrative request workflows with strict transition validation, accepting states, and trap state denial.

---

## Table of Contents

- [Educational Objectives](#educational-objectives)
- [Discipline Concepts Breakdown](#discipline-concepts-breakdown)
  - [1. DAA: Graph Algorithms & Navigation](#1-daa-graph-algorithms--navigation)
  - [2. COA: Functional Units & System Bus Simulation](#2-coa-functional-units--system-bus-simulation)
  - [3. FLAT: Deterministic Finite Automaton Workflow](#3-flat-deterministic-finite-automaton-workflow)
- [Campus Topological Graph](#campus-topological-graph)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Prerequisites](#prerequisites)
- [Installation & Environment Setup](#installation--environment-setup)
- [Running the Application](#running-the-application)
- [Backend REST API Reference](#backend-rest-api-reference)
- [Sample Test Cases & Verified Outputs](#sample-test-cases--verified-outputs)
- [Limitations of In-Memory Storage](#limitations-of-in-memory-storage)
- [User Interface Screenshots](#user-interface-screenshots)

---

## Educational Objectives

- **Bridge Theory and Practice**: Connect abstract mathematical definitions (graphs, state machines, computer organization) to a realistic university campus request tracking application.
- **Algorithmic Guarantees**: Demonstrate why Breadth-First Search mathematically guarantees the shortest hop count in an unweighted graph, whereas Depth-First Search explores reachability and spanning trees.
- **Architectural Decomposition**: Visualize how data flows across physical hardware units and system buses in a von Neumann architecture without overwhelming students with low-level silicon microcode.
- **Automata Determinism**: Enforce administrative approvals using formal automata theory ($M = (Q, \Sigma, \delta, q_0, F)$), rejecting non-deterministic or illegal transitions before requests can reach an accepting state.

---

## Discipline Concepts Breakdown

### 1. DAA: Graph Algorithms & Navigation

The campus grounds are modeled as an undirected, unweighted graph $G = (V, E)$ consisting of 6 landmark vertices ($V$) and 9 bidirectional pathways ($E$).

```
        [LIBRARY] ------------- [LAB]
        /       \             /   |   \
    [GATE]       \           /    |   [HOSTEL]
        \         \         /     |   /
         \       [BLOCK_A]       /   /
          \     /         \     /   /
           \   /           \   /   /
            \ /             \ /   /
             X           [CAFETERIA]
```

- **Breadth-First Search (BFS)**:
  - **Shortest Path Guarantee**: In an unweighted graph, BFS explores vertices layer by layer (level-order) using a FIFO queue. The first time the destination landmark is dequeued, the path traversed is guaranteed to have the minimal number of edges (minimum topological hops).
  - **Time Complexity**: $\mathcal{O}(V + E)$
  - **Auxiliary Space**: $\mathcal{O}(V)$ for the visited set and FIFO frontier queue.
- **Depth-First Search (DFS)**:
  - **Reachability & Backtracking**: Explores as far along each branch as possible before backtracking. While DFS does not guarantee the shortest path, it reveals graph reachability, discovery order, cycle formations, and spanning tree edges.
  - **Time Complexity**: $\mathcal{O}(V + E)$
  - **Auxiliary Space**: $\mathcal{O}(V)$ recursion call stack and visited registry.

### 2. COA: Functional Units & System Bus Simulation

> [!NOTE]
> **Educational Disclaimer**: This module models a conceptual functional-unit workflow for pedagogical demonstrations. It does **not** execute binary machine opcodes (x86/ARM/RISC-V) or emulate physical silicon microarchitecture.

The simulation steps student campus requests through the 4 core functional units of a von Neumann machine:

$$\text{Input Unit} \longrightarrow \text{Memory Unit (RAM)} \longrightarrow \text{CPU (CU + ALU)} \longrightarrow \text{Output Unit}$$

1. **Input Unit**: Captures external student request parameters, translates them into internal representation, and alerts the system via an input strobe.
2. **Memory Unit**: Decodes the base RAM address (`0x00A0`) and latches request operands into addressable RAM memory cells.
3. **Central Processing Unit (CPU)**:
   - **Control Unit (CU)**: Directs timing strobes, decodes operation codes, and coordinates bus transactions.
   - **Arithmetic Logic Unit (ALU)**: Executes rule validation comparisons (e.g., verifying student credit enrollment $\le 24$).
   - **Registers**: Tracks Program Counter (`PC`), Memory Address Register (`MAR`), Memory Data Register (`MDR`), Instruction Register (`IR`), and Accumulator (`ACC`).
4. **Output Unit**: Reads the finalized approval resolution from writeback memory (`0x00B0`) and formats it for student terminal display.

#### The Tri-Bus Subsystem
- **Data Bus (Bidirectional)**: Carries payload packets, credit operands, and verification outcomes between units.
- **Address Bus (Unidirectional)**: Carries memory pointers (e.g., `0x00A0`, `0x00B0`) driven by the CPU to address decoders.
- **Control Bus (Bidirectional Lines)**: Carries clock synchronizations, read/write strobes (`MEM_READ`, `MEM_WRITE`), and I/O interrupt acknowledgments.

### 3. FLAT: Deterministic Finite Automaton Workflow

Campus administrative requests follow a formal 5-tuple Deterministic Finite Automaton (DFA):

$$M = (Q, \Sigma, \delta, q_0, F)$$

- **Finite Set of States ($Q$)**:
  $$\{\text{CREATED}, \text{VALIDATED}, \text{PROCESSING}, \text{COMPLETED}, \text{REJECTED}\}$$
- **Input Alphabet ($\Sigma$)**:
  $$\{\text{VALIDATE}, \text{PROCESS}, \text{COMPLETE}, \text{REJECT}, \text{RESUBMIT}\}$$
- **Initial State ($q_0$)**: `CREATED` (marked by an incoming start arrow).
- **Accepting States ($F$)**: $\{\text{COMPLETED}\}$ (represented by a double circle in the state transition diagram).
- **Non-Accepting Trap State**: `REJECTED` (dead-end state for denied submissions, recoverable only via `RESUBMIT`).

#### Transition Function ($\delta: Q \times \Sigma \to Q$)

| Current State ($q$) | Input Symbol ($\sigma$) | Next State ($\delta(q, \sigma)$) | Description |
| :--- | :--- | :--- | :--- |
| **CREATED** | `VALIDATE` | **VALIDATED** | Credentials and prerequisites vetted |
| **CREATED** | `REJECT` | **REJECTED** | Immediate submission denial (Trap) |
| **VALIDATED** | `PROCESS` | **PROCESSING** | Departmental review and processing |
| **VALIDATED** | `REJECT` | **REJECTED** | Advisor denial (Trap) |
| **PROCESSING** | `COMPLETE` | **COMPLETED** | **Accepting Final State** (Request Sealed) |
| **PROCESSING** | `REJECT` | **REJECTED** | Administrative denial (Trap) |
| **REJECTED** | `RESUBMIT` | **CREATED** | Re-opens denied request to start state |

#### Strict Determinism Rule
Any transition symbol not defined in $\delta(q, \sigma)$ (such as attempting `COMPLETE` from `CREATED`) is **strictly rejected with HTTP 400**. The request's state in the store remains strictly unchanged. The server **never** trusts client-supplied states; it always evaluates transitions against the record's true state loaded from memory.

---

## Campus Topological Graph

The campus graph contains 6 landmarks with consistent identifiers used across backend algorithms and frontend SVG rendering:

| Identifier | Landmark Display Name | Category | Coordinates $(X, Y)$ | Adjacency List (Neighbors) |
| :--- | :--- | :--- | :--- | :--- |
| `GATE` | Main Campus Gate | Entry / Security | $(70, 240)$ | `["BLOCK_A", "LIBRARY"]` |
| `BLOCK_A` | Academic Block A | Instructional | $(190, 150)$ | `["GATE", "LIBRARY", "CAFETERIA", "LAB"]` |
| `LIBRARY` | Central Knowledge Library | Academic Support | $(330, 90)$ | `["GATE", "BLOCK_A", "LAB"]` |
| `CAFETERIA` | Student Cafeteria & Lounge | Amenities | $(210, 390)$ | `["BLOCK_A", "LAB", "HOSTEL"]` |
| `LAB` | Computing & Innovation Lab | Computing | $(420, 220)$ | `["BLOCK_A", "LIBRARY", "CAFETERIA", "HOSTEL"]` |
| `HOSTEL` | Student Residential Hostel | Residential | $(540, 300)$ | `["CAFETERIA", "LAB"]` |

---

## Technology Stack

- **Backend**:
  - **Runtime**: Node.js (v18+ or v20+)
  - **Framework**: Express (v4.21+) using native ES modules (`"type": "module"`)
  - **CORS**: `cors` configured for Vite development origin
  - **Environment**: `dotenv` for configuration loading
  - **Architecture**: Clean MVC separation (Controllers $\to$ Services $\to$ Algorithms $\to$ Data Store)
- **Frontend**:
  - **UI Library**: React (v18.3+)
  - **Build Tool**: Vite (v6.0+) with `@vitejs/plugin-react`
  - **Routing**: React Router DOM (v6.28+)
  - **Styling**: Pure CSS custom properties (variables, global, layout, components, pages) — **zero Tailwind CSS**, **zero external UI component libraries**
- **Monorepo Automation**:
  - `concurrently` (v9.1+) for simultaneous cross-platform frontend and backend development execution.

---

## Project Directory Structure

```text
kalvium-campus-simulator/
├── package.json                    # Root package with dev, build, and concurrently scripts
├── README.md                       # Comprehensive documentation and curriculum guide
├── .gitignore                      # Git exclusion rules (.env, node_modules, dist)
├── backend/
│   ├── package.json                # Express backend configuration ("type": "module")
│   ├── server.js                   # Server entry proxy delegating to src/server.js
│   ├── .env.example                # Backend environment variables template
│   └── src/
│       ├── app.js                  # Express app setup, CORS, JSON parsing, routes mounting
│       ├── server.js               # Network port binding, logging, and error handling
│       ├── algorithms/
│       │   ├── bfs.js              # Pure Breadth-First Search implementation
│       │   ├── dfs.js              # Pure Depth-First Search implementation
│       │   ├── graphAlgorithms.js  # Unified graph algorithm exporter
│       │   ├── architectureSimulator.js # Von Neumann cycle simulation
│       │   └── dfaValidator.js     # DFA formal sequence validation
│       ├── config/
│       │   ├── campusConfig.js     # Single source of truth for 6 campus landmarks
│       │   └── env.js              # Validated environment configuration
│       ├── controllers/
│       │   ├── navigationController.js  # Controller for /api/navigation
│       │   ├── processingController.js  # Controller for /api/processing
│       │   ├── requestController.js     # Controller for /api/requests
│       │   ├── workflowController.js    # Controller for /api/workflow
│       │   └── architectureController.js # Controller for /api/architecture
│       ├── data/
│       │   ├── campusGraph.js      # Undirected 6-landmark adjacency list & symmetry checks
│       │   └── requestsStore.js    # Encapsulated in-memory storage with deep cloning
│       ├── middlewares/
│       │   └── errorHandler.js     # 4-argument error handler & 404 handler
│       ├── routes/
│       │   ├── navigationRoutes.js # /api/navigation routes (locations, bfs, dfs)
│       │   ├── processingRoutes.js # /api/processing routes (start, advance, reset)
│       │   ├── requestRoutes.js    # /api/requests routes (CRUD & action execution)
│       │   ├── workflowRoutes.js   # /api/workflow routes (DFA spec & validation)
│       │   └── architectureRoutes.js # /api/architecture routes
│       └── services/
│           ├── navigationService.js # Graph coordinates, BFS shortest route, DFS
│           ├── processingService.js # 4 functional units, tri-bus, session registry
│           ├── workflowService.js   # DFA state transitions & determinism enforcement
│           └── architectureService.js
└── frontend/
    ├── package.json                # Frontend client dependencies (React, Vite)
    ├── vite.config.js              # Vite React configuration (Port 5173)
    ├── index.html                  # HTML entry point
    ├── .env.example                # Frontend environment template (VITE_API_BASE_URL)
    └── src/
        ├── App.jsx                 # Client routing table
        ├── main.jsx                # React root mount
        ├── components/
        │   ├── CampusGraph.jsx     # Interactive SVG campus map visualizer
        │   ├── ProcessingPipeline.jsx # 4-unit pipeline & bus activity indicators
        │   ├── StateDiagram.jsx    # SVG DFA state diagram with accepting double circle
        │   ├── LocationSelector.jsx# Landmark start/destination dropdown selector
        │   ├── PageHeader.jsx      # Accessible header with discipline badges
        │   ├── StatCard.jsx        # Telemetry metrics display card
        │   ├── StatusBadge.jsx     # Semantic status pill
        │   ├── ResultMessage.jsx   # Success/error/warning alert banner
        │   └── Footer.jsx
        ├── layouts/
        │   └── DashboardLayout.jsx # App shell: sticky top nav & sidebar drawer
        ├── pages/
        │   ├── Home.jsx            # Project landing & discipline overview
        │   ├── Dashboard.jsx       # Real-time request telemetry & module launcher
        │   ├── CampusNavigator.jsx # DAA visualizer: BFS shortest path & DFS
        │   ├── ArchitectureSimulator.jsx # COA visualizer: 4 functional units & tri-bus
        │   ├── WorkflowValidator.jsx # FLAT visualizer: interactive DFA transitions
        │   ├── RequestHistory.jsx  # Audit log, live status filters, search & modals
        │   └── NotFound.jsx        # 404 route linking back to dashboard
        ├── services/
        │   ├── api.js              # Centralized fetch wrapper with error handling
        │   ├── navigationService.js# Client API calls for DAA
        │   ├── processingService.js# Client API calls for COA
        │   └── workflowService.js  # Client API calls for FLAT
        ├── styles/
        │   ├── variables.css       # CSS custom properties (palette, spacing, shadows)
        │   ├── global.css          # Reset, accessible focus outlines, typography
        │   ├── layout.css          # App grid, sidebar rail, navigation header
        │   ├── components.css      # Cards, tables, forms, buttons, status pills
        │   └── pages.css           # Page-specific grids and visualizers
        └── utils/
            └── formatters.js       # Safe string formatting, distances, timestamps
```

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (`v20+` or `v24+` recommended)
- **npm**: `v9.0.0` or higher

Check your installation:
```bash
node --version
npm --version
```

---

## Installation & Environment Setup

### 1. Install All Dependencies
From the repository root directory, install all root, backend, and frontend packages with a single cross-platform command:
```bash
npm run install:all
```

*Or install each directory individually:*
```bash
# Root development dependencies (concurrently)
npm install

# Backend dependencies (Express, CORS, dotenv)
npm --prefix backend install

# Frontend dependencies (React, React Router, Vite)
npm --prefix frontend install
```

### 2. Configure Environment Files
Copy the provided environment templates:

**Backend (`backend/.env`):**
```bash
# On Linux/macOS:
cp backend/.env.example backend/.env

# On Windows PowerShell:
Copy-Item backend/.env.example backend/.env
```
Ensure `backend/.env` contains:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```bash
# On Linux/macOS:
cp frontend/.env.example frontend/.env

# On Windows PowerShell:
Copy-Item frontend/.env.example frontend/.env
```
Ensure `frontend/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Running the Application

### Option A: Run Both Concurrently (Recommended)
From the repository root, start both the Express backend API and Vite frontend dev server with one command:
```bash
npm run dev
```

- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`
- **Health Check**: `http://localhost:5000/api/health`

### Option B: Run Servers in Separate Terminals

**Terminal 1 (Backend):**
```bash
npm run dev:backend
# Starts Express with native Node.js automatic restart on port 5000
```

**Terminal 2 (Frontend):**
```bash
npm run dev:frontend
# Starts Vite local development server on port 5173
```

### Option C: Production Frontend Build
```bash
npm run build
# Compiles Vite production bundle into frontend/dist/
```

---

## Backend REST API Reference

All API routes are served under the `/api` prefix.

### 1. System Health
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns service status (`ONLINE`), timestamp, and covered academic disciplines |

### 2. DAA: Campus Navigation
| Method | Endpoint | Parameters / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/navigation/locations` | — | Retrieves all 6 campus landmarks and graph adjacency matrix |
| `GET` | `/api/navigation/locations/:id`| Path param `:id` | Retrieves single landmark metadata (e.g. `LIBRARY`) |
| `GET` / `POST` | `/api/navigation/bfs` | `start` / `startNode`, `destination` / `targetNode` | Calculates unweighted BFS shortest route, hop count, and distance |
| `GET` / `POST` | `/api/navigation/dfs` | `start` / `startNode`, optional `destination` | Executes recursive DFS exploration returning visited discovery order |

### 3. COA: Computer Processing Simulation
| Method | Endpoint | Parameters / Body | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/processing/start` | `{ title, studentId, priority, creditUnits }` | Initializes simulation session at Stage 0 (Input Unit); returns `simulationId` |
| `POST` | `/api/processing/advance` | `{ simulationId }` (or `:id` path param) | Advances simulation forward by one functional unit stage |
| `POST` | `/api/processing/reset` | `{ simulationId }` (or `:id` path param) | Resets active simulation session back to Stage 0 (Input Unit) |
| `GET` | `/api/processing/:id` | Path param `:id` | Retrieves current functional unit stage and register states |
| `GET` | `/api/processing/overview`| — | Returns specifications for the 4 functional units and tri-bus system |

### 4. FLAT: Academic Requests & DFA Actions
| Method | Endpoint | Parameters / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/requests` | Query `?status=APPROVED \| IN_REVIEW \| REJECTED` | Lists all stored student requests with optional status filtering |
| `POST` | `/api/requests` | `{ title, category, studentName, studentId }` | Creates request strictly initialized in `CREATED` state |
| `GET` | `/api/requests/:id` | Path param `:id` | Retrieves specific request record, workflow history, and status |
| `POST` | `/api/requests/:id/action` | `{ action: "VALIDATE" \| "PROCESS" \| "COMPLETE" \| "REJECT" \| "RESUBMIT" }` | Validates and executes formal DFA transition; rejects undefined transitions with HTTP 400 |
| `GET` | `/api/workflow/dfa-spec` | — | Returns formal 5-tuple DFA specification $M = (Q, \Sigma, \delta, q_0, F)$ |
| `POST` | `/api/workflow/validate` | `{ sequence: ["VALIDATE", "PROCESS", "COMPLETE"] }` | Validates a sequence of symbols against the DFA transition table |

---

## Sample Test Cases & Verified Outputs

The following tests were executed and verified against the running application:

### Test Case 1: DAA BFS Shortest Path
- **Input**: `start = "GATE"`, `destination = "HOSTEL"`
- **HTTP Request**: `GET /api/navigation/bfs?start=GATE&destination=HOSTEL`
- **Observed Output**:
  ```json
  {
    "success": true,
    "data": {
      "algorithm": "Breadth-First Search (BFS)",
      "startNode": "GATE",
      "targetNode": "HOSTEL",
      "found": true,
      "hopCount": 3,
      "path": ["GATE", "BLOCK_A", "CAFETERIA", "HOSTEL"],
      "totalDistanceMeters": 733,
      "visitedCount": 6
    }
  }
  ```
- **Verification Verdict**: Path mathematically proven minimal edge hops ($3$ hops).

### Test Case 2: DAA DFS Reachability Traversal
- **Input**: `start = "GATE"`
- **HTTP Request**: `GET /api/navigation/dfs?start=GATE`
- **Observed Output**:
  ```json
  {
    "success": true,
    "data": {
      "algorithm": "Depth-First Search (DFS)",
      "startNode": "GATE",
      "visitedCount": 6,
      "traversalOrder": ["GATE", "BLOCK_A", "LIBRARY", "LAB", "CAFETERIA", "HOSTEL"]
    }
  }
  ```
- **Verification Verdict**: Traversed all 6 connected vertices via recursive depth exploration.

### Test Case 3: COA Hardware Pipeline Progression
- **Execution Flow**:
  1. `POST /api/processing/start` $\to$ Initialized at `Input Unit` (Stage 0).
  2. `POST /api/processing/advance` $\to$ Reached `Memory Unit` (Stage 1).
  3. `POST /api/processing/advance` $\to$ Reached `CPU (Control Unit + ALU)` (Stage 2).
  4. `POST /api/processing/advance` $\to$ Reached `Output Unit` (Stage 3, `isComplete: true`, `canAdvance: false`).
- **Verification Verdict**: Verified sequential von Neumann flow with active bus state updates at every stage.

### Test Case 4: FLAT DFA Acceptance & State Spoofing Rejection
- **Scenario A (Valid Transition Path)**:
  1. Request created with title *"Lab Pass"* $\to$ Initialized in `CREATED` state.
  2. Action `VALIDATE` $\to$ Transitions $\delta(\text{CREATED}, \text{VALIDATE}) \to \text{VALIDATED}$ (`IN_REVIEW`).
  3. Action `PROCESS` $\to$ Transitions $\delta(\text{VALIDATED}, \text{PROCESS}) \to \text{PROCESSING}$ (`IN_REVIEW`).
  4. Action `COMPLETE` $\to$ Transitions $\delta(\text{PROCESSING}, \text{COMPLETE}) \to \text{COMPLETED}$ (`APPROVED` — Accepted state $q \in F$).
- **Scenario B (Illegal Transition Rejection)**:
  - From `CREATED`, client dispatches `COMPLETE`.
  - **HTTP Response**: `400 Bad Request`
  ```json
  {
    "success": false,
    "error": "Undefined transition rejected: Input symbol 'COMPLETE' is not allowed from state 'CREATED'. State remains 'CREATED'.",
    "statusCode": 400
  }
  ```
  - **Verification Verdict**: Transition was blocked without mutating the stored request.

---

## Limitations of In-Memory Storage

> [!WARNING]
> **Volatile Runtime Storage**:
> 1. **Server Restart Data Loss**: All created student requests, updated workflow states, and simulation histories reside in Node.js heap memory (`requestsStore.js` and `processingService.js`). Restarting or crashing the Node process resets the store back to the mock baseline seed records.
> 2. **Single Instance Memory**: State is not shared across multi-process clusters or serverless instances.
> 3. **Non-Durable**: This architecture is intentionally designed for rapid local academic labs and educational pairing. For production deployments, replace `requestsStore.js` with an ACID-compliant SQL database (e.g., PostgreSQL) or document store.

---

## User Interface Screenshots

### 1. Unified Academic Dashboard
*Telemetry overview, live request status metrics, and quick-launch links for all three modules.*

```
+---------------------------------------------------------------------------------------+
|  KALVIUM CAMPUS SIMULATOR                                          [ Engine: Online ] |
+---------------------------------------------------------------------------------------+
|  Total Requests: 4   |   Approved: 2   |   In Review: 1   |   Rejected (Trap): 1      |
+---------------------------------------------------------------------------------------+
|  [ DAA: Campus Navigator ]    [ COA: Architecture Sim ]    [ FLAT: Workflow Validator ]|
|  BFS Shortest Path & DFS     4 Functional Units Pipeline   5-Tuple DFA State Automaton|
+---------------------------------------------------------------------------------------+
|  RECENT CAMPUS REQUESTS                                                               |
|  REQ-1004 | Robotics Access      | Research   | CREATED   | [ In Review ]             |
|  REQ-1001 | Lab Access Pass      | Computer Sc| COMPLETED | [ Approved  ]             |
+---------------------------------------------------------------------------------------+
```

### 2. DAA: Campus Navigator
*Interactive SVG campus map highlighting BFS shortest routes (blue edges), landmark coordinates, and hop count cards.*

```
+---------------------------------------------------------------------------------------+
|  Start: [ Main Gate (GATE)        v ]   Destination: [ Hostel (HOSTEL)            v ] |
|  [ Compute BFS Shortest Path ]  [ Run DFS Traversal ]  [ Clear Highlights ]           |
+---------------------------------------------------------------------------------------+
|  Campus Map Visualization (SVG):                                                      |
|           (LIBRARY) ----------- (LAB)                                                 |
|           /       \           /  |   \                                                |
|       (GATE) ===== (BLOCK_A) =   |   (HOSTEL)  <-- Target                             |
|                           \      |   //                                               |
|                            (CAFETERIA)                                                |
|                                                                                       |
|  Computed Path: GATE -> BLOCK_A -> CAFETERIA -> HOSTEL (3 Hops, 733m walking route)   |
+---------------------------------------------------------------------------------------+
```

### 3. COA: Computer Architecture Simulator
*Step-by-step pipeline stepper advancing requests across Input Unit $\to$ Memory $\to$ CPU $\to$ Output Unit with active bus indicators.*

```
+---------------------------------------------------------------------------------------+
|  [ 1. Input Unit ] ===> [ 2. Memory Unit ] ---> [ 3. CPU (ALU) ] ---> [ 4. Output ]   |
+---------------------------------------------------------------------------------------+
|  ACTIVE UNIT: Memory Unit (RAM Addressing & Storage)                                  |
|  Address Bus: 0x00A0  |  Data Bus: PAYLOAD -> [0x00A0]  |  Control Bus: MEM_WRITE     |
|                                                                                       |
|  CPU REGISTERS:                                                                       |
|  PC: 0x00A1 | MAR: 0x00A0 | MDR: OP_COURSE_REG | IR: OP_COURSE_REG | ACC: 1           |
|                                                                                       |
|  [ << Previous Stage ]                  [ Advance to Stage 3 (CPU) >> ]               |
+---------------------------------------------------------------------------------------+
```

### 4. FLAT: Request Workflow Validator
*Interactive SVG state transition diagram displaying formal transitions, accepting state double-circles, and action trigger buttons.*

```
+---------------------------------------------------------------------------------------+
|  START -> (( CREATED )) ---VALIDATE---> (( VALIDATED )) ---PROCESS---> (( PROCESSING ))|
|               |                             |                                |        |
|             REJECT                        REJECT                          COMPLETE    |
|               v                             v                                v        |
|        [[ REJECTED ]] <---------------------+------------------------ ((( COMPLETED )))|
|         (Trap State)                                                     (ACCEPTING)  |
|                                                                                       |
|  ACTIONS FROM CURRENT STATE [ VALIDATED ]:                                            |
|  [ PROCESS (Permitted) ]   [ REJECT (Deny Submission) ]   [ COMPLETE (Undefined X) ]  |
+---------------------------------------------------------------------------------------+
```

---

## License

This project is licensed under the MIT License for educational and academic use.
