/**
 * index.ts — SoloSpot Design Brain public API
 *
 * Knowledge + Design Intelligence decisions only.
 * Execution remains in AI/HACP/BuilderDocument layers (DECISION-042–045).
 */

export * from './types';
export {
  onObservability, emitObservability, getObservabilityBuffer, clearObservabilityBuffer,
} from './Observability';

export { createDesignDirection, DESIGN_STYLE_ARCHETYPES } from './DesignDirector';
export {
  buildWebsiteArchitecture, buildPageArchitecturePlans,
} from './WebsiteArchitectureEngine';
export {
  getBlueprints, selectBlueprint, enrichWithBlueprint,
} from './BlueprintEngine';
export type { WebsiteBlueprintDecision } from './BlueprintEngine';
export {
  analyzeComposition, buildConstitution, checkConsistency,
  checkCompatibility, checkCompatibilityBatch, detectAntiGeneric,
  recommendComponentCount, mkIssue, sortIssues,
} from './CompositionEngines';
export type { CompatibilityCheck, CompatibilityRelation, CompositionInput } from './CompositionEngines';
export { planSectionContent, buildContentPlan, coordinateContentLayout } from './ContentIntelligence';
export { planArtDirection, matchAssetToDirection } from './AssetIntelligence';
export type { AssetCandidate, AssetMatchReport } from './AssetIntelligence';
export { buildResponsivePlan, auditResponsive } from './ResponsiveIntelligence';
export type { ResponsivePlanInput, ObservedResponsive } from './ResponsiveIntelligence';
export {
  classifyObservation, classifyObservations, buildVisualAudit, notExecutedQa,
  mergeQaDimensions, auditAccessibility, auditUX, issueCounts, contentQaFromPlan,
} from './VisualQA';
export type { RawObservation, VisualAuditInput, AccessibilityObservations, UXObservations } from './VisualQA';
export {
  CRITIC_QUESTIONS, runDesignCritique, runRepairLoop, checkVisualRegression,
  summarizeCounts, REPAIR_MAX_ITERATIONS_CAP, REPAIR_DEFAULT_ITERATIONS,
} from './CritiqueRepair';
export type { CritiqueInput, RepairLoopOptions } from './CritiqueRepair';
export {
  createProjectDesignMemory, getProjectDesignMemory, resetProjectDesignMemory,
  listDesignMemories, recordDesignDecision, rememberDirection, rememberConstitution,
  rememberStylePack, rejectPattern, approveUserChange, rememberResponsiveRule,
  rememberContentDecision, rememberAssetDecision, readMemoryHints, memoryTraces,
  assertNoFakeMemorySuccess,
} from './DesignMemory';
export type { MemoryHints } from './DesignMemory';
export {
  retrieveStyleCandidates, decideStyle, planStyleApplication, verifyStyleApplication,
  runStylePipeline, STYLE_SYSTEM_CATALOG_SIZES,
} from './StyleSystemIntelligence';
export type {
  StyleRetrievalQuery, StyleRetrievalResult, StyleDecision, StyleApplicationPlan, StyleVerification,
} from './StyleSystemIntelligence';
export { validateBusinessGoal } from './BusinessGoalValidation';
export type { BusinessGoalInput } from './BusinessGoalValidation';
export { resolveRoleForPhase, allRoles, describeRole } from './RoleModel';
export type { RoleAssignment } from './RoleModel';
export { planPage2, toVisualDirection } from './PagePlanner2';
export type { PagePlanner2Input } from './PagePlanner2';
export { runDesignBrain, summarizeDesignBrain } from './DesignBrain';
export type { DesignBrainOptions } from './DesignBrain';
