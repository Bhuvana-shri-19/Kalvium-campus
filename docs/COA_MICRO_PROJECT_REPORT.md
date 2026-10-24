# Computer Organization and Architecture (COA) Micro Project Report
## 16-Bit Instruction-Level CPU Emulator & Von Neumann Laboratory

**Institution:** Kalvium University / College Curriculum  
**Project Title:** Kalvium Campus Navigator & Request Processing Simulator  
**Sub-System:** Computer Organization and Architecture (COA) Educational CPU Laboratory  
**Repository:** [https://github.com/Bhuvana-shri-19/Kalvium-campus](https://github.com/Bhuvana-shri-19/Kalvium-campus)  
**Academic Disciplines:**
- **DAA:** Graph Algorithms & Campus Route Navigation (C++ Native Engine)
- **COA:** 16-Bit CPU Micro-Architecture & Von Neumann Tri-Bus Pipeline
- **FLAT:** Formal Languages & 5-Tuple DFA Request Workflow Engine

---

## 1. Executive Summary & Objective

In computer science curricula, Computer Organization and Architecture (COA) is frequently taught using static diagrams and isolated assembly exercises. Students rarely observe how a program counter actually advances through addressable memory, how micro-operations transfer data into the Memory Data Register (MDR), or how ALU status flags trigger conditional branching at the hardware level.

This project delivers a **fully functional, deterministic, instruction-level 16-bit CPU software emulator** integrated directly into the full-stack Kalvium Campus application. It demonstrates the core syllabus topics of:
- **Module 1: Introduction to Computer Organization and Architecture**: Functional units (Input, Memory, CPU, Output), tri-bus system architecture (Address, Data, Control buses), and memory mapping.
- **Module 2: Central Processing Unit Design and Instruction Execution**: 16-bit register file (R0-R3, ACC), special-purpose control registers (PC, IR, MAR, MDR, SP), status flags (Z, N, C, V), two-pass program assembler, and a 5-stage Fetch-Decode-Execute micro-architecture.

---

## 2. Syllabus Mapping & Academic Alignment

| Syllabus Module | Theoretical Concepts Covered | Technical Implementation in Project |
| :--- | :--- | :--- |
| **Module 1: Computer Organization** | Von Neumann Architecture, System Bus, Functional Units, RAM addressing | 4-Stage Processing Pipeline (`ProcessingPipeline.jsx`), Tri-Bus signal latches, 256-word physical memory map (`cpuEngine.js`). |
| **Module 2: CPU Design & Execution** | Register File, Instruction Formats, ALU, Status Flags (Z, N, C, V), Instruction Cycle | 16-bit general registers (R0-R3), dedicated PC/IR/MAR/MDR/SP registers, 20-opcode ISA, two-pass assembler (`assembler.js`), automated micro-step execution. |
| **Assembly & Programming** | Machine code encoding, addressing modes, branching, stack operations | Interactive Code Editor, Disassembler, LIFO Hardware Stack, 5 pre-configured educational programs (`samplePrograms.js`). |

---

## 3. Hardware Architecture & Register Specifications

The emulator implements a 16-bit RISC-like register-memory architecture.

### 3.1 Register File Specifications
All registers hold 16-bit unsigned integers (`0x0000` to `0xFFFF`, $0$ to $65535$) with two's complement interpretation ($-32768$ to $+32767$).

| Register | Name | Width | Functional Role in Micro-Architecture |
| :--- | :--- | :--- | :--- |
| **`R0`** | General Register 0 | 16 bits | General-purpose operand register; also serves as the default Accumulator (`ACC`) alias. |
| **`R1`** | General Register 1 | 16 bits | General-purpose operand register. |
| **`R2`** | General Register 2 | 16 bits | General-purpose operand register (frequently destination for arithmetic outcomes). |
| **`R3`** | General Register 3 | 16 bits | General-purpose operand register. |
| **`ACC`** | Accumulator | 16 bits | Mirrors `R0`; stores intermediate and final results of arithmetic and logic computations. |
| **`PC`** | Program Counter | 16 bits | Holds the memory address of the next instruction to fetch. Initialized to `0x0000`. |
| **`IR`** | Instruction Register | 16 bits | Holds the currently fetched 16-bit instruction word during decoding. |
| **`MAR`** | Memory Address Register | 16 bits | Holds the physical address driven onto the unidirectional Address Bus. |
| **`MDR`** | Memory Data Register | 16 bits | Bidirectional latch buffering data transferred to or from physical RAM. |
| **`SP`** | Stack Pointer | 16 bits | Points to the current top-of-stack memory address. Initialized to `0x00FF` and grows downwards. |

### 3.2 Status Flags (Condition Codes / Flag Register)
The ALU evaluates condition flags following every arithmetic, compare, or logical operation:

- **`Z` (Zero Flag):** Set to `1` if the 16-bit ALU output equals `0x0000`; otherwise `0`.
- **`N` (Negative Flag):** Set to `1` if MSB bit 15 is `1` (negative in two's complement interpretation); otherwise `0`.
- **`C` (Carry / Borrow Flag):**
  - **Addition (`ADD`):** Set to `1` if unsigned addition produces a carry out of bit 15 (`(A + B) > 0xFFFF`).
  - **Subtraction / Compare (`SUB`, `CMP`):** Set to `1` if an unsigned borrow occurs (`A < B`).
  - **Bitwise Logic:** Cleared to `0`.
- **`V` (Overflow Flag):**
  - **Addition (`ADD`):** Set to `1` if adding two operands of the same sign produces a result with the opposite sign.
  - **Subtraction / Compare (`SUB`, `CMP`):** Set to `1` if subtracting operands of opposite signs produces a result with the wrong sign (`(A >= 0 && B < 0 && Res < 0) || (A < 0 && B >= 0 && Res >= 0)`).
  - **Bitwise Logic:** Cleared to `0`.

---

## 4. Physical Memory Architecture & Address Space

The emulator provides an addressable address space of **256 words (16 bits each)**, indexed from `0x0000` to `0x00FF` (0 to 255):

```
+-------------------------------------------------------------+
| Memory Address Range | Segment Name   | Usage & Content    |
+----------------------+----------------+---------------------+
| 0x0000 - 0x007F      | Code Segment   | Assembled Program   |
| (Addresses 0 - 127)  | (128 Words)    | Instructions (PC=0) |
+----------------------+----------------+---------------------+
| 0x0080 - 0x00DF      | Data Segment   | Variables, Buffers, |
| (Addresses 128 - 223)| (96 Words)     | Memory I/O Records  |
+----------------------+----------------+---------------------+
| 0x00E0 - 0x00FF      | Stack Segment  | LIFO Hardware Stack |
| (Addresses 224 - 255)| (32 Words)     | (SP starts 0x00FF)  |
+----------------------+----------------+---------------------+
```

- **Stack Boundary Safeguards:** Attempting to `PUSH` below address `0x00E0` triggers a hardware **Stack Overflow** error. Attempting to `POP` when `SP == 0x00FF` triggers a hardware **Stack Underflow** error.

---

## 5. Instruction Set Architecture (ISA) & Binary Encodings

The architecture defines 20 discrete instructions with 6-bit opcodes (`Bits 15-10`):

| Opcode | Mnemonic | Syntax | Format | Operation Description |
| :---: | :--- | :--- | :---: | :--- |
| `0x00` | `NOP` | `NOP` | Format 0 | No operation. Advances PC and consumes 1 clock cycle. |
| `0x01` | `HALT` | `HALT` | Format 0 | Disables clock gate. Stops CPU execution cleanly. |
| `0x02` | `LDI` | `LDI Rd, imm8` | Format I | Loads 8-bit immediate literal into destination register `Rd <- imm8`. |
| `0x03` | `LOAD` | `LOAD Rd, [addr]` | Format M | Reads 16-bit word from memory: `MAR <- addr, MDR <- M[MAR], Rd <- MDR`. |
| `0x04` | `STORE` | `STORE [addr], Rs` | Format M | Writes register to memory: `MAR <- addr, MDR <- Rs, M[MAR] <- MDR`. |
| `0x05` | `MOV` | `MOV Rd, Rs` | Format R | Copies register value: `Rd <- Rs`. Source register `Rs` is preserved. |
| `0x06` | `ADD` | `ADD Rd, Rs1, Rs2` | Format R | Addition: `Rd <- Rs1 + Rs2`. Updates `Z, N, C, V` flags. |
| `0x07` | `SUB` | `SUB Rd, Rs1, Rs2` | Format R | Subtraction: `Rd <- Rs1 - Rs2`. Updates `Z, N, C, V` flags. |
| `0x08` | `AND` | `AND Rd, Rs1, Rs2` | Format R | Bitwise AND: `Rd <- Rs1 & Rs2`. Clears `C` and `V`. |
| `0x09` | `OR` | `OR Rd, Rs1, Rs2` | Format R | Bitwise OR: `Rd <- Rs1 \| Rs2`. Clears `C` and `V`. |
| `0x0A` | `XOR` | `XOR Rd, Rs1, Rs2` | Format R | Bitwise XOR: `Rd <- Rs1 ^ Rs2`. Clears `C` and `V`. |
| `0x0B` | `NOT` | `NOT Rd, Rs` | Format R | Bitwise complement: `Rd <- ~Rs`. Updates `Z, N`. |
| `0x0C` | `CMP` | `CMP Rs1, Rs2` | Format R | Compares `Rs1 - Rs2`. Updates `Z, N, C, V`; discards difference. |
| `0x0D` | `JMP` | `JMP target` | Format J | Unconditional jump: `PC <- target`. |
| `0x0E` | `JZ` | `JZ target` | Format J | Conditional jump if Zero: if `Z == 1`, `PC <- target`. |
| `0x0F` | `JNZ` | `JNZ target` | Format J | Conditional jump if Not Zero: if `Z == 0`, `PC <- target`. |
| `0x10` | `PUSH` | `PUSH Rs` | Format S | Stack push: `SP <- SP - 1, MAR <- SP, MDR <- Rs, M[MAR] <- MDR`. |
| `0x11` | `POP` | `POP Rd` | Format S | Stack pop: `MAR <- SP, MDR <- M[MAR], Rd <- MDR, SP <- SP + 1`. |
| `0x12` | `OUT` | `OUT Rs` | Format O | Transmits register value to hardware output terminal (Port 0x01). |
| `0x13` | `IN` | `IN Rd` | Format O | Ingests data from external input port into `Rd`. |

---

## 6. The 5-Stage Fetch-Decode-Execute Micro-Architecture

Each instruction cycle is decomposed into five distinct micro-stages:

```
        +---------------------------------------------------+
Stage 1 | 1. FETCH     : MAR <- PC, MDR <- M[MAR],          |
        |                IR <- MDR, PC <- PC + 1            |
        +---------------------------------------------------+
                                  |
                                  v
        +---------------------------------------------------+
Stage 2 | 2. DECODE    : Opcode decoder extracts 6-bit op,  |
        |                register addresses, and literals   |
        +---------------------------------------------------+
                                  |
                                  v
        +---------------------------------------------------+
Stage 3 | 3. EXECUTE   : ALU computes arithmetic/bitwise    |
        |                operations; evaluates branch flags |
        +---------------------------------------------------+
                                  |
                                  v
        +---------------------------------------------------+
Stage 4 | 4. MEMORY    : LOAD, STORE, PUSH, POP interact    |
        |                with RAM over system bus           |
        +---------------------------------------------------+
                                  |
                                  v
        +---------------------------------------------------+
Stage 5 | 5. WRITEBACK : Destination registers (R0-R3) and  |
        |                status flags (Z, N, C, V) latched  |
        +---------------------------------------------------+
```

---

## 7. Sample Educational Programs & Verified Execution

### Program 1: Arithmetic & Register Transfer
```assembly
; Computes: R2 = (R0 + R1) - R3 = (7 + 5) - 3 = 9
LDI R0, 7        ; Load immediate 7 into R0
LDI R1, 5        ; Load immediate 5 into R1
ADD R2, R0, R1   ; R2 <- 7 + 5 = 12
LDI R3, 3        ; Load immediate 3 into R3
SUB R2, R2, R3   ; R2 <- 12 - 3 = 9
OUT R2           ; Output 9 to Port 0x01
HALT             ; Stop CPU
```
- **Observed Result:** `R2 = 9 (0x0009)`, Flags: `Z=0, N=0, C=0, V=0`, Output: `9`.

### Program 2: Memory Read / Write
```assembly
; Writes student credit values to RAM and reads them back
LDI R0, 18         ; Lecture credits (18)
STORE [0x80], R0   ; Write to RAM[0x80]
LDI R1, 6          ; Lab credits (6)
STORE [0x81], R1   ; Write to RAM[0x81]
LOAD R2, [0x80]    ; Read from RAM[0x80] into R2 (18)
LOAD R3, [0x81]    ; Read from RAM[0x81] into R3 (6)
ADD R0, R2, R3     ; Total credits = 24
STORE [0x82], R0   ; Record total in RAM[0x82]
OUT R0             ; Display total credits (24)
HALT
```
- **Observed Result:** `RAM[0x80]=18`, `RAM[0x81]=6`, `RAM[0x82]=24`, Output: `24`.

### Program 3: Conditional Branching & Loops (Sum 1 to N)
```assembly
; Sum of 5 down to 1: 5 + 4 + 3 + 2 + 1 = 15
LDI R0, 5        ; Counter N = 5
LDI R1, 0        ; Accumulator Sum = 0
LDI R2, 1        ; Decrement step = 1
LOOP:
ADD R1, R1, R0   ; Sum <- Sum + N
SUB R0, R0, R2   ; N <- N - 1 (updates Zero flag!)
JNZ LOOP         ; Jump to LOOP if N != 0
OUT R1           ; Output final sum (15)
HALT
```
- **Observed Result:** Loop repeats 5 times. On step 5, `SUB` produces `R0=0`, asserting flag `Z=1`. `JNZ` evaluates `Z=1` as false and falls through to `OUT R1`. Output: `15`.

---

## 8. Automated Test Suite Results

The automated test suite (`backend/test/cpuEmulator.test.js`) verifies all 14 mandatory criteria plus REST API controller integration:

```text
▶ COA 16-Bit Instruction-Level CPU Emulator
  ✔ 1. Immediate Loading (LDI) (2.86ms)
  ✔ 2. Register-to-Register Movement (MOV) (0.57ms)
  ✔ 3. Addition and Subtraction (ADD, SUB) (0.94ms)
  ✔ 4. Status Flags (Z, N, C, V) (1.40ms)
  ✔ 5. Memory Store and Load (STORE, LOAD) (0.34ms)
  ✔ 6. Program Counter (PC) Progression (0.19ms)
  ✔ 7. Jumps & Branching (JMP, JZ, JNZ) (2.79ms)
  ✔ 8. HALT Behavior (0.22ms)
  ✔ 9. Invalid Opcode Handling (0.22ms)
  ✔ 10. Memory Address Bounds (0.23ms)
  ✔ 11. Malformed Program Rejection (0.29ms)
  ✔ 12. Loop Protection & Step Limits (0.21ms)
  ✔ 13. Stack Operations & Boundaries (0.46ms)
  ✔ 14. Agreement: Single-Step vs Continuous Run (0.76ms)
  ✔ 15. Express Controller & Endpoints Integration (1.57ms)
ℹ tests 24 | suites 16 | pass 24 | fail 0 | duration_ms 300.2ms
```

### Complete Full-Project Automated Test Suite
```text
ℹ tests 80 | suites 34 | pass 80 | fail 0 | duration_ms 1204.9ms
```
- **DAA Module (C++ BFS/DFS):** 17 tests passed.
- **FLAT Module (DFA Workflow):** 17 tests passed.
- **COA Module (Processing Pipeline):** 22 tests passed.
- **COA CPU Emulator (16-Bit Architecture):** 24 tests passed.

---

## 9. Known Limitations & Technical Scope

1. **Software Emulation Level:** This is an instruction-level software CPU emulator running in Node.js. It models architectural state, bus lines, and registers accurately, but does not simulate transistor gate propagation delays or silicon thermal throttling.
2. **Memory Size:** The memory address space is fixed at 256 words (16-bit words) to enable comprehensive visualization on screen.
3. **Pipelining Hazard Handling:** Instructions are executed sequentially in 5 micro-stages without speculative branch prediction or out-of-order execution.

---

## 10. Viva Voce Questions & Presentation Reference

**Q1: What is the purpose of the Memory Address Register (MAR) and Memory Data Register (MDR)?**  
*Answer:* The MAR is connected directly to the unidirectional Address Bus and specifies the physical RAM address being accessed. The MDR is connected to the bidirectional Data Bus and buffers data being read from or written to memory before placing it into the Instruction Register or general-purpose registers.

**Q2: How does the CPU distinguish between an instruction and data in memory?**  
*Answer:* According to the von Neumann architecture, both instructions and data reside in shared addressable RAM. The CPU distinguishes them purely by context: any word fetched during the **Fetch stage** at the address in `PC` is treated as an instruction and latched into `IR`. Words referenced during the **Memory stage** are treated as data.

**Q3: How does conditional branching (`JNZ`) work at the micro-architecture level?**  
*Answer:* An arithmetic instruction like `SUB` updates the Status Flag register. When `JNZ` enters the Execute stage, the Control Unit inspects the `Z` flag. If `Z == 0`, the target operand is written into the Program Counter (`PC <- target`), redirecting the next Fetch cycle. If `Z == 1`, `PC` is left unchanged, continuing sequential execution.

**Q4: What is the difference between Single-Step and Run in this emulator?**  
*Answer:* Single-Step executes exactly one complete instruction cycle (Fetch, Decode, Execute, Memory, Writeback) and pauses so students can observe register diffs. Run executes the exact same underlying CPU cycle continuously using a controlled timer or backend loop until a `HALT` instruction or error is encountered.
