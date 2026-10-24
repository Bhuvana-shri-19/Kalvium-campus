/**
 * Educational Sample Assembly Programs for 16-Bit COA CPU Emulator
 * Discipline: Computer Organization and Architecture (COA)
 */

export const SAMPLE_PROGRAMS = [
  {
    id: 'arithmetic',
    name: '1. Basic Arithmetic & Register Transfer',
    category: 'ALU Operations',
    description: 'Demonstrates immediate loading, register-to-register addition, subtraction, and console output. Computes (7 + 5) - 3 = 9.',
    expectedOutput: '9',
    code: `; ===============================================
; Program 1: Basic Arithmetic & Register Transfer
; Computes: R2 = (R0 + R1) - R3 = (7 + 5) - 3 = 9
; ===============================================

LDI R0, 7        ; Load immediate 7 into R0
LDI R1, 5        ; Load immediate 5 into R1
ADD R2, R0, R1   ; R2 <- R0 + R1 (7 + 5 = 12)
LDI R3, 3        ; Load immediate 3 into R3
SUB R2, R2, R3   ; R2 <- R2 - R3 (12 - 3 = 9)
OUT R2           ; Output result (9) to console port
HALT             ; Stop CPU execution
`
  },
  {
    id: 'memory_io',
    name: '2. Memory Read / Write & Data Storage',
    category: 'Memory Subsystem',
    description: 'Demonstrates writing values from registers into RAM addresses (0x0080, 0x0081), reading them back into registers, summing them, and writing the final sum to 0x0082.',
    expectedOutput: '24',
    code: `; ===============================================
; Program 2: Memory Read & Write Operations
; Stores student credit units into RAM and sums them
; ===============================================

LDI R0, 18         ; Lecture credits (18)
STORE [0x80], R0   ; Store R0 into RAM address 0x80
LDI R1, 6          ; Lab credits (6)
STORE [0x81], R1   ; Store R1 into RAM address 0x81

; Clear working registers
LDI R2, 0
LDI R3, 0

; Load values back from RAM into registers
LOAD R2, [0x80]    ; Read RAM[0x80] into R2 (18)
LOAD R3, [0x81]    ; Read RAM[0x81] into R3 (6)

; Compute total credits
ADD R0, R2, R3     ; R0 <- 18 + 6 = 24
STORE [0x82], R0   ; Save total into RAM[0x82]
OUT R0             ; Output total credits (24)
HALT               ; Halt CPU
`
  },
  {
    id: 'conditional_loop',
    name: '3. Conditional Branching & Loops (Sum 1 to N)',
    category: 'Control & Branching',
    description: 'Calculates the sum of numbers from 5 down to 1 (5 + 4 + 3 + 2 + 1 = 15) using a loop controlled by SUB and JNZ (Jump if Not Zero).',
    expectedOutput: '15',
    code: `; ===============================================
; Program 3: Loop & Conditional Branching
; Calculates: 5 + 4 + 3 + 2 + 1 = 15
; Uses Zero flag (Z) to terminate the loop
; ===============================================

LDI R0, 5        ; Counter N = 5
LDI R1, 0        ; Accumulator Sum = 0
LDI R2, 1        ; Decrement step = 1

LOOP:
ADD R1, R1, R0   ; Sum <- Sum + N
SUB R0, R0, R2   ; N <- N - 1 (updates Zero flag!)
JNZ LOOP         ; If N != 0 (Z=0), jump back to LOOP

OUT R1           ; Output accumulated sum (15)
HALT             ; Stop CPU execution
`
  },
  {
    id: 'credit_validation',
    name: '4. Campus Request Processing Validation',
    category: 'Application Integration',
    description: 'Validates student course credit request against a campus maximum threshold of 24 credits using CMP and flags.',
    expectedOutput: '18',
    code: `; ===============================================
; Program 4: Campus Credit Limit Validation
; Validates: Requested Credits (18) <= Max Limit (24)
; ===============================================

LDI R0, 18       ; Requested student credits
LDI R1, 24       ; Campus maximum credit ceiling
CMP R0, R1       ; Compare R0 with R1 (updates Z, N, C, V)

; Store verification status in memory
STORE [0x90], R0 ; Record approved credits in audit memory
OUT R0           ; Output validated registration credits
HALT             ; Complete request processing
`
  },
  {
    id: 'stack_ops',
    name: '5. Stack Operations (LIFO PUSH & POP)',
    category: 'Stack Architecture',
    description: 'Demonstrates hardware Stack Pointer (SP) behavior using LIFO PUSH and POP instructions to reverse two values.',
    expectedOutput: '42',
    code: `; ===============================================
; Program 5: Hardware Stack Subsystem (LIFO)
; Pushes 42 and 99 onto stack, pops them in reverse
; ===============================================

LDI R0, 42       ; Value A
LDI R1, 99       ; Value B
PUSH R0          ; Push 42 onto stack (SP decreases)
PUSH R1          ; Push 99 onto stack

; Pop in reverse order
POP R2           ; R2 receives 99 (top of stack)
POP R3           ; R3 receives 42
OUT R3           ; Output 42 to console
HALT             ; Finish execution
`
  }
];

export function getSampleProgramById(id) {
  return SAMPLE_PROGRAMS.find(p => p.id === id) || null;
}

export default SAMPLE_PROGRAMS;
