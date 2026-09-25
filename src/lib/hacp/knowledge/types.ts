// HACP Design Intelligence Knowledge Foundation — verified sources only (P0, scrollbar, DS gates)
// No fabricated cases; no unverified lessons; no second orchestrator
export interface Principle { id: string; statement: string; source: string }
export interface Decision { principleId: string; choice: string; capabilityId: string; toolName: string; commandType: string; verification: string }
export interface Capability { id: string; name: string; tool: string; commands: string[]; verify: string; existsInInventory: boolean }
export interface TrainingCase { context: string; intent: string; designProblem: string; decision: string; tool: string; execution: string; result: string; verificationProof: string; verified: boolean; sourceReport: string }
export interface Lesson { caseId: string; rootCause: string; repair: string; verifiedResult: string; knowledgeId: string; writtenOnlyWhenVerified: boolean }
