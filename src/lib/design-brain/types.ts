/**
 * types.ts — SoloSpot Design Brain Contracts
 *
 * Design Brain = KNOWLEDGE + REASONING + DESIGN SYSTEM + COMPOSITION
 *                + CONTENT + ASSETS + RESPONSIVE + VISUAL QA
 *                + CRITIQUE + REPAIR + MEMORY + EXECUTION glue
 *
 * Knowledge ≠ Execution. Design Brain produces structured decisions;
 * HACP/BuilderDocument remains the only mutation gateway (DECISION-042–045).
 */

import type { DecisionContext, BriefSignals } from '../knowledge/types';
import type { SitePlan, VisualDirection, SectionRole, DesignSystem as PlanDesignSystem } from '../ai/SitePlanTypes';

export type { SitePlan, VisualDirection, SectionRole, PlanDesignSystem };

export const DESIGN_BRAIN_VERSION = '1.0.0';

// ── Design Direction (section 2) ────────────────────────────────────

export interface DesignDirectionInputs {
  industry: string;
  audience: string;
  businessGoal: string;
  brandPersonality: string;
  mood: string;
  visualStyle: string;
  positioning: string;
  premiumLevel: 'entry' | 'standard' | 'premium' | 'luxury';
  contentTone: string;
  conversionIntent: string;
}

export interface DesignDirection {
  visualStyle: string;
  mood: string;
  typographyDirection: string;
  colorDirection: string;
  spacingDirection: string;
  radiusDirection: string;
  shadowDirection: string;
  imageDirection: string;
  iconDirection: string;
  motionDirection: string;
  density: 'lean' | 'moderate' | 'rich';
  compositionRules: string[];
  /** Which knowledge / pattern / blueprint informed this direction. */
  sourceTrace: DecisionTrace[];
}

// ── Decision Traceability (section 31) ──────────────────────────────

export interface DecisionTrace {
  decisionId: string;
  why: string;
  what: string;
  where: string;
  how: string;
  verify: string;
  source: 'knowledge' | 'design-system' | 'blueprint' | 'memory' | 'heuristic';
  knowledgeId?: string;
  domain?: string;
  pattern?: string;
  rule?: string;
  timestamp: string;
}

// ── Website Architecture (section 3) ────────────────────────────────

export type PageType =
  | 'home' | 'about' | 'services' | 'service-detail' | 'products'
  | 'product-detail' | 'portfolio' | 'testimonials' | 'faq'
  | 'contact' | 'blog' | 'blog-post' | 'pricing' | 'team'
  | 'gallery' | 'booking' | 'careers' | 'locations' | 'landing';

export interface WebsitePage {
  id: string;
  type: PageType;
  name: string;
  slug: string;
  purpose: string;
  parent?: string;
  order: number;
}

export interface UserJourney {
  id: string;
  name: string;
  entryPage: string;
  steps: string[];
  conversionGoal: string;
}

export interface WebsiteArchitecture {
  pages: WebsitePage[];
  navigation: { primary: string[]; footer: string[] };
  hierarchy: Record<string, string[]>;
  userJourneys: UserJourney[];
  conversionPaths: string[];
  contentHierarchy: Record<string, string[]>;
  relationships: Array<{ from: string; to: string; reason: string }>;
}

// ── Information Architecture (section 4) ────────────────────────────

export interface PageArchitecturePlan {
  pageId: string;
  primaryGoal: string;
  secondaryGoals: string[];
  primaryCTA: string;
  supportingContent: string[];
  trustSignals: string[];
  objections: string[];
  informationSequence: string[];
}

// ── Visual Composition (section 5) ──────────────────────────────────

export interface CompositionAnalysis {
  hierarchy: 'strong' | 'adequate' | 'weak';
  balance: 'balanced' | 'slight-skew' | 'unbalanced';
  alignment: 'consistent' | 'mostly' | 'inconsistent';
  visualWeight: 'even' | 'top-heavy' | 'bottom-heavy' | 'scattered';
  whitespace: 'generous' | 'adequate' | 'tight' | 'empty';
  density: 'sparse' | 'balanced' | 'dense' | 'overcrowded';
  focalPoint: 'clear' | 'ambiguous' | 'missing';
  rhythm: 'regular' | 'varied' | 'chaotic';
  issues: DesignIssue[];
  recommendations: string[];
}

// ── Design Constitution / Consistency (section 6) ───────────────────

export interface DesignConstitution {
  typography: { headingFont: string; bodyFont: string; scale: string };
  colors: { primary: string; secondary: string; background: string; text: string; cta: string };
  spacing: { sectionPadding: string; gap: string; rhythm: string };
  radius: { button: string; card: string; section: string };
  shadows: { elevation: string; style: string };
  buttons: { style: string; height: string };
  cards: { style: string; elevation: string };
  forms: { style: string; radius: string };
  imagery: { style: string; treatment: string };
  icons: { style: string; weight: string };
  backgrounds: { style: string };
  sections: { layout: string; maxWidth: string };
}

export interface ConsistencyIssue {
  element: string;
  expected: string;
  actual: string;
  severity: DesignIssueSeverity;
  repairHint: string;
}

export interface ConsistencyReport {
  constitution: DesignConstitution;
  issues: ConsistencyIssue[];
  overall: 'PASS' | 'REPAIR_REQUIRED' | 'BLOCKED';
}

// ── Design Issue Classification (section 18) ────────────────────────

export type DesignIssueSeverity = 'BLOCKING' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DesignIssueCategory =
  | 'typography' | 'spacing' | 'hierarchy' | 'composition' | 'alignment'
  | 'color' | 'contrast' | 'imagery' | 'component-consistency'
  | 'responsiveness' | 'visual-density' | 'content' | 'ux'
  | 'accessibility' | 'anti-generic' | 'compatibility' | 'business-goal';

export interface DesignIssue {
  issueId: string;
  severity: DesignIssueSeverity;
  category: DesignIssueCategory;
  target: string;
  evidence: string;
  recommendedRepair: string;
  repairCapability: 'auto' | 'suggest' | 'blocked';
  verificationMethod: string;
  /** Optional structured fix payload for HacpBridge tools. */
  fixTool?: string;
  fixArgs?: Record<string, unknown>;
}

// ── QA Dimensions (section 26 — NOT a single score) ─────────────────

export type QADimensionStatus = 'PASS' | 'REPAIR_REQUIRED' | 'BLOCKED' | 'NOT_EXECUTED';

export interface QADimensions {
  typography: QADimensionStatus;
  composition: QADimensionStatus;
  responsive: QADimensionStatus;
  consistency: QADimensionStatus;
  accessibility: QADimensionStatus;
  content: QADimensionStatus;
  ux: QADimensionStatus;
  businessGoal: QADimensionStatus;
  antiGeneric: QADimensionStatus;
  evidence: Record<string, string[]>;
}

// ── Design Critic (section 19) ──────────────────────────────────────

export interface CritiqueFinding {
  question: string;
  answer: 'PASS' | 'ISSUE' | 'NOT_EXECUTED';
  issues: DesignIssue[];
}

export interface DesignCritique {
  findings: CritiqueFinding[];
  repairable: DesignIssue[];
  blocked: DesignIssue[];
  summary: string;
}

// ── Repair Loop (section 20) ────────────────────────────────────────

export interface RepairIteration {
  iteration: number;
  before: { issueCount: number; qa: QADimensions };
  changes: DesignIssue[];
  after: { issueCount: number; qa: QADimensions };
  verification: 'improved' | 'unchanged' | 'regressed' | 'blocked';
}

export interface RepairLoopResult {
  iterations: RepairIteration[];
  finalIssues: DesignIssue[];
  finalQa: QADimensions;
  stoppedReason: 'clean' | 'max-iterations' | 'no-progress' | 'blocked';
  maxIterations: number;
}

// ── Visual Regression (section 21) ──────────────────────────────────

export interface VisualRegressionReport {
  structureBefore: string[];
  structureAfter: string[];
  structurePreserved: boolean;
  targetImproved: boolean;
  unrelatedChanges: DesignIssue[];
  verdict: 'PASS' | 'REGRESSION';
}

// ── Design Memory (section 22) ──────────────────────────────────────

export interface DesignMemoryEntry {
  key: string;
  value: unknown;
  reason?: string;
  source?: string;
  timestamp: string;
}

export interface ProjectDesignMemory {
  projectId: string;
  visualDirection: string | null;
  typography: { headingFont: string; bodyFont: string } | null;
  palette: Record<string, string> | null;
  stylePackId: string | null;
  acceptedPatterns: string[];
  rejectedPatterns: string[];
  designDecisions: DesignDecisionRecord[];
  componentConventions: Record<string, string>;
  responsiveRules: Record<string, unknown>;
  contentDecisions: Record<string, string>;
  assetDecisions: Record<string, string>;
  userApprovedChanges: string[];
  updatedAt: string;
}

export interface DesignDecisionRecord {
  decisionId: string;
  reason: string;
  source: string;
  affectedElements: string[];
  timestamp: string;
  status: 'active' | 'superseded' | 'rejected';
  knowledgeId?: string;
}

// ── Content Design (section 11) ─────────────────────────────────────

export type ContentFunction =
  | 'value-explanation' | 'context' | 'next-action'
  | 'uncertainty-reduction' | 'proof' | 'navigation'
  | 'objection-handling' | 'information' | 'engagement';

export interface ContentBlock {
  id: string;
  function: ContentFunction;
  text: string;
  maxLength: number;
  sectionRole: SectionRole;
}

export interface ContentPlan {
  blocks: ContentBlock[];
  headlineHierarchy: string[];
  ctaPlacement: string[];
  issues: DesignIssue[];
}

// ── Content ↔ Layout Coordination (section 12) ──────────────────────

export interface ContentLayoutIssue {
  type: 'text-too-long' | 'text-too-short' | 'weak-hierarchy' | 'cta-buried'
    | 'poor-line-length' | 'bad-wrapping' | 'visual-imbalance';
  target: string;
  evidence: string;
  suggestion: string;
}

export interface ContentLayoutReport {
  issues: ContentLayoutIssue[];
  needsReflow: boolean;
}

// ── Image Art Direction (section 13) ────────────────────────────────

export interface ImageRequirement {
  id: string;
  sectionRole: SectionRole;
  imageType: 'hero' | 'feature' | 'team' | 'product' | 'background' | 'icon' | 'gallery';
  subject: string;
  composition: string;
  focalPoint: string;
  aspectRatio: string;
  crop: string;
  placement: string;
  visualTone: string;
  colorRelationship: string;
  backgroundRelationship: string;
  searchQuery: string;
}

export interface ArtDirectionPlan {
  requirements: ImageRequirement[];
  issues: DesignIssue[];
}

// ── Responsive (sections 15–16) ─────────────────────────────────────

export type ResponsiveTarget = 'desktop' | 'tablet' | 'mobile';

export interface ResponsiveRule {
  sectionRole: SectionRole;
  target: ResponsiveTarget;
  typographyScale: number;
  spacingScale: number;
  gridChanges: string;
  stacking: string;
  ordering: string;
  visibility: string;
  crop: string;
  alignment: string;
  ctaBehavior: string;
  navBehavior: string;
}

export interface ResponsivePlan {
  rules: ResponsiveRule[];
}

export interface ResponsiveAuditIssue extends DesignIssue {
  target: ResponsiveTarget;
}

export interface ResponsiveAuditReport {
  desktop: { status: QADimensionStatus; issues: ResponsiveAuditIssue[] };
  tablet: { status: QADimensionStatus; issues: ResponsiveAuditIssue[] };
  mobile: { status: QADimensionStatus; issues: ResponsiveAuditIssue[] };
}

// ── Visual Audit (section 17) ───────────────────────────────────────

export interface VisualAuditReport {
  timestamp: string;
  categories: Record<DesignIssueCategory, DesignIssue[]>;
  allIssues: DesignIssue[];
  qa: QADimensions;
  executed: boolean;
  evidence: string[];
}

// ── Accessibility (section 27) ──────────────────────────────────────

export interface AccessibilityReport {
  contrast: QADimensionStatus;
  readableTypography: QADimensionStatus;
  headingHierarchy: QADimensionStatus;
  buttonClarity: QADimensionStatus;
  imageAlt: QADimensionStatus;
  targetSize: QADimensionStatus;
  keyboard: QADimensionStatus;
  semantic: QADimensionStatus;
  issues: DesignIssue[];
}

// ── UX Audit (section 28) ───────────────────────────────────────────

export interface UXReport {
  navigation: QADimensionStatus;
  hierarchy: QADimensionStatus;
  discoverability: QADimensionStatus;
  ctaClarity: QADimensionStatus;
  friction: QADimensionStatus;
  contentSequence: QADimensionStatus;
  forms: QADimensionStatus;
  trust: QADimensionStatus;
  mobileUsability: QADimensionStatus;
  issues: DesignIssue[];
}

// ── Business Goal Validation (section 29) ───────────────────────────

export interface BusinessGoalReport {
  goal: string;
  realized: QADimensionStatus;
  supportingEvidence: string[];
  gaps: DesignIssue[];
}

// ── Role Model (section 30) ─────────────────────────────────────────

export type DesignBrainRole =
  | 'ARCHITECT' | 'ART_DIRECTOR' | 'UX_DESIGNER' | 'CONTENT_DESIGNER'
  | 'ASSET_DIRECTOR' | 'RESPONSIVE_DESIGNER' | 'DESIGN_CRITIC' | 'QA_AUDITOR';

// ── Master Pipeline Output ──────────────────────────────────────────

export interface DesignBrainOutput {
  version: string;
  brief: string;
  signals: BriefSignals;
  knowledge: DecisionContext | null;
  direction: DesignDirection;
  architecture: WebsiteArchitecture;
  pagePlans: PageArchitecturePlan[];
  constitution: DesignConstitution;
  composition: CompositionAnalysis;
  consistency: ConsistencyReport;
  contentPlan: ContentPlan;
  artDirection: ArtDirectionPlan;
  responsivePlan: ResponsivePlan;
  visualAudit: VisualAuditReport;
  critique: DesignCritique;
  repair: RepairLoopResult;
  accessibility: AccessibilityReport;
  ux: UXReport;
  businessGoal: BusinessGoalReport;
  qa: QADimensions;
  traces: DecisionTrace[];
  /** Merged into SitePlan for the existing orchestrator. */
  sitePlan: SitePlan;
  status: 'COMPLETE' | 'PARTIAL' | 'BLOCKED' | 'CLARIFY' | 'FAILED';
  blockedReasons: string[];
}

// ── Observability (section 48) ──────────────────────────────────────

export type ObservabilityKind =
  | 'decision' | 'retrieval' | 'tool' | 'mutation' | 'verification' | 'repair' | 'phase';

export interface ObservabilityEvent {
  kind: ObservabilityKind;
  phase: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}
