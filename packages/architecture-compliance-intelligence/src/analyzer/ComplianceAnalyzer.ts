import type {
  ArchitectureLayer,
  ArchitectureRule,
  ArchitectureViolation,
  ComplianceSeverity,
  ModuleDescriptor,
  ViolationType,
} from '../model/ComplianceModel';

// ---------------------------------------------------------------------------
// Built-in reference architecture rules for the @web-factor monorepo
// Includes core platform rules + Sprint 6B/6C/6D/7 subsystem rules & PM1/PM3/PM4/PM5/PM12/PM13 rules
// ---------------------------------------------------------------------------
export const DEFAULT_ARCHITECTURE_RULES: ArchitectureRule[] = [
  // UI layer rules
  {
    ruleId: 'RULE-001',
    name: 'UI must not directly access infrastructure',
    fromLayer: 'ui',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'UI components must interact with infrastructure only through the application layer.',
  },
  {
    ruleId: 'RULE-002',
    name: 'UI must not import domain internals directly',
    fromLayer: 'ui',
    toLayer: 'domain',
    allowed: false,
    violationSeverity: 'error',
    rationale: 'UI components should consume domain logic via the application layer, not directly.',
  },
  {
    ruleId: 'RULE-003',
    name: 'UI may import shared utilities',
    fromLayer: 'ui',
    toLayer: 'shared',
    allowed: true,
    violationSeverity: 'info',
  },
  // Application layer rules
  {
    ruleId: 'RULE-004',
    name: 'Application must not import from UI',
    fromLayer: 'application',
    toLayer: 'ui',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Application layer must be UI-agnostic to support multiple front-ends.',
  },
  {
    ruleId: 'RULE-005',
    name: 'Application may access infrastructure through abstractions only',
    fromLayer: 'application',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'error',
    adrId: 'ADR-003',
    rationale: 'ADR-003: All infrastructure access must go through domain-defined interfaces.',
  },
  // Domain layer rules
  {
    ruleId: 'RULE-006',
    name: 'Domain must not depend on application layer',
    fromLayer: 'domain',
    toLayer: 'application',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Domain must remain pure business logic, independent of orchestration concerns.',
  },
  {
    ruleId: 'RULE-007',
    name: 'Domain must not depend on infrastructure',
    fromLayer: 'domain',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'critical',
    adrId: 'ADR-001',
    rationale: 'ADR-001: Domain layer must be free of all infrastructure concerns (Ports & Adapters).',
  },
  {
    ruleId: 'RULE-008',
    name: 'Domain must not depend on UI',
    fromLayer: 'domain',
    toLayer: 'ui',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Domain must have zero knowledge of presentation.',
  },
  // Infrastructure layer rules
  {
    ruleId: 'RULE-009',
    name: 'Infrastructure must not import from application layer',
    fromLayer: 'infrastructure',
    toLayer: 'application',
    allowed: false,
    violationSeverity: 'error',
    rationale: 'Infrastructure adapters must implement domain interfaces, not orchestration logic.',
  },
  {
    ruleId: 'RULE-010',
    name: 'Infrastructure must not import from UI layer',
    fromLayer: 'infrastructure',
    toLayer: 'ui',
    allowed: false,
    violationSeverity: 'critical',
  },
  // Platform layer rules
  {
    ruleId: 'RULE-011',
    name: 'Platform layer must not depend on UI or application',
    fromLayer: 'platform',
    toLayer: 'ui',
    allowed: false,
    violationSeverity: 'error',
    rationale: 'Platform packages are infrastructure-level and must remain UI-agnostic.',
  },
  // Shared layer rules
  {
    ruleId: 'RULE-012',
    name: 'Shared must not import from any business layer',
    fromLayer: 'shared',
    toLayer: 'domain',
    allowed: false,
    violationSeverity: 'error',
    rationale: 'Shared utilities must be stateless and domain-agnostic.',
  },
  {
    ruleId: 'RULE-013',
    name: 'Shared must not import from infrastructure',
    fromLayer: 'shared',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'error',
  },

  // -------------------------------------------------------------------------
  // Sprint 6B / PM1 — Smart Guides Architecture Rules
  // -------------------------------------------------------------------------
  {
    ruleId: 'RULE-SG-001',
    name: 'Smart Guides Overlay must not contain domain business logic',
    fromLayer: 'ui',
    toLayer: 'domain',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Smart Guides Overlay is a presentation-only component. All snapping and distance calculations must be pure functions in application/domain layer.',
  },
  {
    ruleId: 'RULE-SG-002',
    name: 'Smart Guides must communicate with Runtime Preview exclusively via PreviewChannel',
    fromLayer: 'application',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'error',
    adrId: 'ADR-002',
    rationale: 'Smart Guide events (GUIDE_ALIGN, SNAP_TRIGGER) must pass through PreviewChannel contracts without direct DOM manipulation.',
  },
  {
    ruleId: 'RULE-SG-003',
    name: 'Alignment calculations must remain pure functions',
    fromLayer: 'domain',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Alignment and distance calculations must be stateless pure functions without DOM or side-effect dependencies.',
  },
  {
    ruleId: 'RULE-SG-004',
    name: 'Guides Overlay may not mutate Builder State',
    fromLayer: 'ui',
    toLayer: 'domain',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'The presentation overlay layer must be strictly read-only and must never mutate state directly.',
  },
  {
    ruleId: 'RULE-SG-005',
    name: 'Snap Engine cannot communicate directly with Runtime',
    fromLayer: 'domain',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'error',
    rationale: 'Snap Engine operates in the domain layer; all communication with Runtime Preview must be mediated by PreviewChannel.',
  },
  {
    ruleId: 'RULE-SG-006',
    name: 'Canvas Overlay cannot contain business logic',
    fromLayer: 'ui',
    toLayer: 'domain',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Canvas presentation overlays must contain zero business or calculation logic.',
  },
  {
    ruleId: 'RULE-SG-007',
    name: 'Smart Guides must depend only on DragContext contracts',
    fromLayer: 'ui',
    toLayer: 'application',
    allowed: true,
    violationSeverity: 'info',
    rationale: 'Smart Guides must interact with session state solely through DragContext contracts.',
  },

  // -------------------------------------------------------------------------
  // Sprint 6C / PM3 — Constraint Engine Subsystem Rules
  // -------------------------------------------------------------------------
  {
    ruleId: 'RULE-CE-001',
    name: 'Constraint Engine must be pure domain calculation logic',
    fromLayer: 'domain',
    toLayer: 'ui',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Constraint Engine calculations (pinning, stretch, anchors) must operate on pure geometry abstractions without DOM dependencies.',
  },
  {
    ruleId: 'RULE-CE-002',
    name: 'Constraint CSS Mapping must output standard CSS variables only',
    fromLayer: 'application',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'error',
    rationale: 'Constraint Engine CSS mapping must produce pure CSS style objects for Runtime Preview channel propagation.',
  },
  {
    ruleId: 'RULE-CE-003',
    name: 'Constraint calculations must remain pure functions',
    fromLayer: 'domain',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Constraint solving algorithms must be stateless pure functions operating on bounding rect inputs.',
  },
  {
    ruleId: 'RULE-CE-004',
    name: 'Constraint Engine may not mutate Canvas state',
    fromLayer: 'domain',
    toLayer: 'ui',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Constraint Engine calculates layout bounds but must dispatch commands via Command Bus rather than mutating canvas state directly.',
  },
  {
    ruleId: 'RULE-CE-005',
    name: 'Constraint CSS mapping must be deterministic',
    fromLayer: 'application',
    toLayer: 'shared',
    allowed: true,
    violationSeverity: 'info',
    rationale: 'CSS mapping must produce identical CSS variable declarations given identical constraint models.',
  },
  {
    ruleId: 'RULE-CE-006',
    name: 'Constraint Engine cannot access DOM APIs',
    fromLayer: 'domain',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Constraint Engine must operate purely on virtual geometry models without window, document, or getBoundingClientRect calls.',
  },
  {
    ruleId: 'RULE-CE-007',
    name: 'Constraint Engine communicates only through Builder Commands',
    fromLayer: 'application',
    toLayer: 'domain',
    allowed: true,
    violationSeverity: 'info',
    rationale: 'Constraint updates must be packaged as standard Command Bus payloads (e.g. UPDATE_CONSTRAINTS).',
  },

  // -------------------------------------------------------------------------
  // Sprint 6D / PM4 — Responsive Engine Subsystem Rules
  // -------------------------------------------------------------------------
  {
    ruleId: 'RULE-RE-001',
    name: 'Responsive Engine Breakpoints must not mutate global state',
    fromLayer: 'domain',
    toLayer: 'platform',
    allowed: false,
    violationSeverity: 'error',
    rationale: 'Breakpoint state resolution must be deterministic and pure per canvas viewport context.',
  },
  {
    ruleId: 'RULE-RE-003',
    name: 'Breakpoint resolution must be deterministic',
    fromLayer: 'domain',
    toLayer: 'shared',
    allowed: true,
    violationSeverity: 'info',
    rationale: 'Resolving viewport widths (mobile, tablet, desktop) must produce deterministic, identical breakpoint states.',
  },
  {
    ruleId: 'RULE-RE-004',
    name: 'Responsive Engine may not mutate document state',
    fromLayer: 'domain',
    toLayer: 'ui',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Responsive Engine resolves viewport media rules without mutating global document state directly.',
  },
  {
    ruleId: 'RULE-RE-005',
    name: 'Responsive CSS generation must be pure',
    fromLayer: 'application',
    toLayer: 'shared',
    allowed: true,
    violationSeverity: 'info',
    rationale: 'Generating media query styles must be a pure, stateless function.',
  },
  {
    ruleId: 'RULE-RE-006',
    name: 'Responsive Engine cannot access DOM APIs',
    fromLayer: 'domain',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Responsive Engine operates on virtual viewport definitions without window.matchMedia or DOM queries.',
  },
  {
    ruleId: 'RULE-RE-007',
    name: 'Responsive updates must flow only through Builder Commands',
    fromLayer: 'application',
    toLayer: 'domain',
    allowed: true,
    violationSeverity: 'info',
    rationale: 'Viewport and breakpoint changes must dispatch standard commands (e.g. SET_VIEWPORT_BREAKPOINT).',
  },
  {
    ruleId: 'RULE-RE-008',
    name: 'Canvas preview cannot contain responsive logic',
    fromLayer: 'ui',
    toLayer: 'domain',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Canvas preview wrapper must remain a pure presentation container without breakpoint calculations.',
  },

  // -------------------------------------------------------------------------
  // Sprint 7 / PM5 — Inspector 2.0 Subsystem Rules
  // -------------------------------------------------------------------------
  {
    ruleId: 'RULE-INSP-001',
    name: 'Inspector must remain presentation-only',
    fromLayer: 'ui',
    toLayer: 'domain',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Inspector UI accordion panels must contain zero domain business logic.',
  },
  {
    ruleId: 'RULE-INSP-002',
    name: 'Property panels cannot contain domain logic',
    fromLayer: 'ui',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Property input controls render schema forms without executing domain rules directly.',
  },
  {
    ruleId: 'RULE-INSP-003',
    name: 'Inspector communicates exclusively through Builder Commands',
    fromLayer: 'ui',
    toLayer: 'application',
    allowed: true,
    violationSeverity: 'info',
    rationale: 'Inspector UI property field edits must dispatch UPDATE_PROPS commands via Command Bus.',
  },
  {
    ruleId: 'RULE-INSP-004',
    name: 'Inspector cannot mutate Runtime directly',
    fromLayer: 'ui',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Inspector property changes must flow through Command Bus and PreviewChannel, never via direct iframe DOM manipulation.',
  },
  {
    ruleId: 'RULE-INSP-005',
    name: 'Property rendering must remain Registry-based',
    fromLayer: 'ui',
    toLayer: 'platform',
    allowed: true,
    violationSeverity: 'info',
    rationale: 'Inspector property form controls must be dynamically constructed from Component Registry schemas.',
  },
  {
    ruleId: 'RULE-INSP-006',
    name: 'Inspector sections must be independently extensible',
    fromLayer: 'ui',
    toLayer: 'shared',
    allowed: true,
    violationSeverity: 'info',
    rationale: 'Accordion sections (Layout, Grid, Typography, Constraints) must be decoupled modular components.',
  },
  {
    ruleId: 'RULE-INSP-007',
    name: 'No circular dependency: Inspector <-> Canvas <-> Runtime',
    fromLayer: 'ui',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Inspector, Canvas, and Runtime Preview must maintain strict unidirectional data flow via Command Bus.',
  },

  // -------------------------------------------------------------------------
  // Sprint PM12 / PM13 — Runtime Pipeline & Performance Rules
  // -------------------------------------------------------------------------
  {
    ruleId: 'RULE-RT-001',
    name: 'RuntimePipeline remains deterministic',
    fromLayer: 'application',
    toLayer: 'shared',
    allowed: true,
    violationSeverity: 'info',
    adrId: 'ADR-001',
    rationale: 'Executing RuntimePipeline with identical document inputs must produce identical output ASTs and section trees.',
  },
  {
    ruleId: 'RULE-RT-002',
    name: 'RuntimeCompositionEngine contains zero UI logic',
    fromLayer: 'domain',
    toLayer: 'ui',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'RuntimeCompositionEngine operates purely on section structures and component registries without React or DOM dependencies.',
  },
  {
    ruleId: 'RULE-RT-003',
    name: 'Builder Preview communicates exclusively via PreviewChannel',
    fromLayer: 'ui',
    toLayer: 'infrastructure',
    allowed: false,
    violationSeverity: 'error',
    adrId: 'ADR-002',
    rationale: 'Builder Canvas and Runtime Preview must exchange events strictly over postMessage PreviewChannel contracts.',
  },
  {
    ruleId: 'RULE-RT-004',
    name: 'renderStore() is the single public entry point for Runtime',
    fromLayer: 'application',
    toLayer: 'infrastructure',
    allowed: true,
    violationSeverity: 'info',
    adrId: 'ADR-001',
    rationale: 'All store page renders (LIVE, PREVIEW, EXPORT) must enter through the unified renderStore() pipeline entry point.',
  },
  {
    ruleId: 'RULE-RT-005',
    name: 'RuntimeCache does not mutate domain data',
    fromLayer: 'infrastructure',
    toLayer: 'domain',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'RuntimeCache is a read-only performance acceleration layer and must never mutate underlying document models.',
  },
  {
    ruleId: 'RULE-RT-006',
    name: 'RuntimePreview renders zero custom business logic',
    fromLayer: 'ui',
    toLayer: 'domain',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'RuntimePreview wrapper must remain a pure presentation renderer without business logic or calculations.',
  },
  {
    ruleId: 'RULE-RT-007',
    name: 'renderStoreSection does not mutate Runtime state',
    fromLayer: 'application',
    toLayer: 'domain',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Partial section rendering must produce pure HTML/AST output without altering active Runtime Engine state.',
  },
  {
    ruleId: 'RULE-RT-008',
    name: 'renderStorePartial is deterministic',
    fromLayer: 'application',
    toLayer: 'shared',
    allowed: true,
    violationSeverity: 'info',
    rationale: 'Partial incremental rendering must produce identical HTML fragments given identical section props.',
  },
  {
    ruleId: 'RULE-RT-009',
    name: 'Pipeline Stage Order strictly preserved',
    fromLayer: 'application',
    toLayer: 'infrastructure',
    allowed: true,
    violationSeverity: 'error',
    adrId: 'ADR-001',
    rationale: 'Pipeline stage execution order (cache-check -> validate-access -> legacy-fallback -> cache-write) must be preserved.',
  },
  {
    ruleId: 'RULE-RT-010',
    name: 'Cache Layer does not bypass validation',
    fromLayer: 'infrastructure',
    toLayer: 'application',
    allowed: false,
    violationSeverity: 'critical',
    rationale: 'Cache hits must pass access control and tenant isolation checks prior to returning cached HTML payloads.',
  },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function violation(
  prefix: string,
  ruleId: string,
  violationType: ViolationType,
  severity: ComplianceSeverity,
  message: string,
  sourceModule: string,
  targetModule: string,
  sourceLayer: ArchitectureLayer,
  targetLayer: ArchitectureLayer,
  opts: {
    dependencyPath?: string;
    adrId?: string;
    recommendation?: string;
  } = {}
): ArchitectureViolation {
  return {
    id: makeId(prefix),
    ruleId,
    violationType,
    severity,
    message,
    sourceModule,
    targetModule,
    sourceLayer,
    targetLayer,
    ...opts,
  };
}

// ---------------------------------------------------------------------------
// ComplianceAnalyzer — static, read-only architectural compliance analysis
// ---------------------------------------------------------------------------
export class ComplianceAnalyzer {

  public static parseModules(
    rawModules: Array<{
      modulePath: string;
      layer: ArchitectureLayer;
      dependencies?: string[];
      dependencyLayers?: Record<string, ArchitectureLayer>;
      declaredAdrIds?: string[];
    }>
  ): ModuleDescriptor[] {
    return rawModules.map((m) => ({
      modulePath: m.modulePath,
      layer: m.layer,
      dependencies: m.dependencies ?? [],
      dependencyLayers: m.dependencyLayers ?? {},
      declaredAdrIds: m.declaredAdrIds ?? [],
    }));
  }

  public static parseRules(
    rawRules?: Partial<ArchitectureRule>[]
  ): ArchitectureRule[] {
    if (!rawRules || rawRules.length === 0) return DEFAULT_ARCHITECTURE_RULES;
    return rawRules.map((r) => ({
      ruleId:             r.ruleId             ?? 'RULE-UNKNOWN',
      name:               r.name               ?? 'Unnamed rule',
      fromLayer:          r.fromLayer          ?? 'shared',
      toLayer:            r.toLayer            ?? 'shared',
      allowed:            r.allowed            ?? true,
      violationSeverity:  r.violationSeverity  ?? 'warning',
      adrId:              r.adrId,
      rationale:          r.rationale,
    }));
  }

  public static analyzeAll(
    modules: ModuleDescriptor[],
    rules: ArchitectureRule[]
  ): ArchitectureViolation[] {
    return [
      ...ComplianceAnalyzer.detectLayerViolations(modules, rules),
      ...ComplianceAnalyzer.detectForbiddenDependencies(modules, rules),
      ...ComplianceAnalyzer.detectModuleBoundaryBreaches(modules),
      ...ComplianceAnalyzer.detectADRViolations(modules, rules),
      ...ComplianceAnalyzer.detectSeparationOfConcernsViolations(modules),
      ...ComplianceAnalyzer.detectDirectInfrastructureAccess(modules),
    ];
  }

  public static detectLayerViolations(
    modules: ModuleDescriptor[],
    rules: ArchitectureRule[]
  ): ArchitectureViolation[] {
    const violations: ArchitectureViolation[] = [];
    const forbiddenRules = rules.filter((r) => !r.allowed);

    for (const mod of modules) {
      for (const [depPath, depLayer] of Object.entries(mod.dependencyLayers)) {
        const matchedRule = forbiddenRules.find(
          (r) => r.fromLayer === mod.layer && r.toLayer === depLayer
        );
        if (matchedRule) {
          violations.push(
            violation(
              'arch_lyr',
              matchedRule.ruleId,
              'layer_violation',
              matchedRule.violationSeverity,
              `[${matchedRule.ruleId}] Module '${mod.modulePath}' (layer: ${mod.layer}) imports '${depPath}' (layer: ${depLayer}), violating rule: "${matchedRule.name}".`,
              mod.modulePath,
              depPath,
              mod.layer,
              depLayer,
              {
                dependencyPath: depPath,
                adrId: matchedRule.adrId,
                recommendation: matchedRule.rationale
                  ? `Rationale: ${matchedRule.rationale}`
                  : `Remove or re-route dependency from '${mod.modulePath}' to '${depPath}'.`,
              }
            )
          );
        }
      }
    }

    return violations;
  }

  public static detectForbiddenDependencies(
    modules: ModuleDescriptor[],
    rules: ArchitectureRule[]
  ): ArchitectureViolation[] {
    const violations: ArchitectureViolation[] = [];
    const forbiddenPairs = new Set(
      rules
        .filter((r) => !r.allowed)
        .map((r) => `${r.fromLayer}→${r.toLayer}`)
    );

    for (const mod of modules) {
      for (const dep of mod.dependencies) {
        const depLayer = mod.dependencyLayers[dep];
        if (depLayer) {
          const pairKey = `${mod.layer}→${depLayer}`;
          if (forbiddenPairs.has(pairKey)) continue;
        } else {
          const isInfraPattern = /\/(db|database|cache|redis|prisma|supabase|s3|storage|queue|email|smtp)/i.test(dep);
          if (mod.layer === 'ui' && isInfraPattern) {
            violations.push(
              violation(
                'arch_dep',
                'RULE-001',
                'forbidden_dependency',
                'critical',
                `Module '${mod.modulePath}' (UI layer) directly imports infrastructure package '${dep}'.`,
                mod.modulePath,
                dep,
                'ui',
                'infrastructure',
                {
                  dependencyPath: dep,
                  recommendation: `Replace direct import of '${dep}' with application layer abstraction.`,
                }
              )
            );
          }
          if (mod.layer === 'domain' && isInfraPattern) {
            violations.push(
              violation(
                'arch_dep',
                'RULE-007',
                'forbidden_dependency',
                'critical',
                `Module '${mod.modulePath}' (domain layer) directly imports infrastructure package '${dep}', violating ADR-001.`,
                mod.modulePath,
                dep,
                'domain',
                'infrastructure',
                {
                  dependencyPath: dep,
                  adrId: 'ADR-001',
                  recommendation: `Define a port interface in domain layer and implement in infrastructure layer.`,
                }
              )
            );
          }
        }
      }
    }

    return violations;
  }

  public static detectModuleBoundaryBreaches(
    modules: ModuleDescriptor[]
  ): ArchitectureViolation[] {
    const violations: ArchitectureViolation[] = [];
    const INTERNAL_PATH_PATTERNS = [/\/src\//, /\/internal\//, /\/private\//, /\/__internal\//];

    for (const mod of modules) {
      for (const dep of mod.dependencies) {
        const isInternal = INTERNAL_PATH_PATTERNS.some((re) => re.test(dep));
        if (isInternal) {
          violations.push(
            violation(
              'arch_bnd',
              'RULE-BOUNDARY',
              'module_boundary_breach',
              'error',
              `Module '${mod.modulePath}' imports internal path '${dep}', breaching target package boundary.`,
              mod.modulePath,
              dep,
              mod.layer,
              mod.dependencyLayers[dep] ?? mod.layer,
              {
                dependencyPath: dep,
                recommendation: `Import only from target package public barrel (index.ts).`,
              }
            )
          );
        }
      }
    }

    return violations;
  }

  public static detectADRViolations(
    modules: ModuleDescriptor[],
    rules: ArchitectureRule[]
  ): ArchitectureViolation[] {
    const violations: ArchitectureViolation[] = [];
    const adrRules = rules.filter((r) => r.adrId && !r.allowed);

    for (const mod of modules) {
      for (const [depPath, depLayer] of Object.entries(mod.dependencyLayers)) {
        for (const rule of adrRules) {
          if (rule.fromLayer === mod.layer && rule.toLayer === depLayer) {
            violations.push(
              violation(
                'arch_adr',
                rule.ruleId,
                'adr_violation',
                rule.violationSeverity,
                `[${rule.adrId}] Module '${mod.modulePath}' violates ${rule.adrId}: ${rule.name}.`,
                mod.modulePath,
                depPath,
                mod.layer,
                depLayer,
                {
                  dependencyPath: depPath,
                  adrId: rule.adrId,
                  recommendation: `Review ${rule.adrId} and re-design dependency from '${mod.modulePath}' to '${depPath}'.`,
                }
              )
            );
          }
        }
      }
    }

    return violations;
  }

  public static detectSeparationOfConcernsViolations(
    modules: ModuleDescriptor[]
  ): ArchitectureViolation[] {
    const violations: ArchitectureViolation[] = [];

    for (const mod of modules) {
      const depLayers = new Set(Object.values(mod.dependencyLayers));
      const hasUI   = depLayers.has('ui');
      const hasInfra = depLayers.has('infrastructure');

      if (hasUI && hasInfra) {
        violations.push(
          violation(
            'arch_soc',
            'RULE-SOC',
            'separation_of_concerns',
            'error',
            `Module '${mod.modulePath}' imports from both UI and infrastructure layers simultaneously.`,
            mod.modulePath,
            mod.modulePath,
            mod.layer,
            mod.layer,
            {
              recommendation: `Split '${mod.modulePath}' into separate modules for UI orchestration and infrastructure coordination.`,
            }
          )
        );
      }
    }

    return violations;
  }

  public static detectDirectInfrastructureAccess(
    modules: ModuleDescriptor[]
  ): ArchitectureViolation[] {
    const violations: ArchitectureViolation[] = [];
    const NON_INFRA_LAYERS: ArchitectureLayer[] = ['ui', 'domain', 'shared'];

    for (const mod of modules) {
      if (!NON_INFRA_LAYERS.includes(mod.layer)) continue;

      for (const [depPath, depLayer] of Object.entries(mod.dependencyLayers)) {
        if (depLayer === 'infrastructure') {
          violations.push(
            violation(
              'arch_inf',
              'RULE-007',
              'direct_infrastructure_access',
              'critical',
              `Module '${mod.modulePath}' (layer: ${mod.layer}) directly accesses infrastructure module '${depPath}'.`,
              mod.modulePath,
              depPath,
              mod.layer,
              'infrastructure',
              {
                dependencyPath: depPath,
                recommendation: `Define port interface in domain layer and inject infrastructure adapter through dependency inversion.`,
              }
            )
          );
        }
      }
    }

    return violations;
  }

  public static violatedRuleIds(violations: ArchitectureViolation[]): Set<string> {
    return new Set(violations.map((v) => v.ruleId));
  }

  public static passingRuleCount(
    rules: ArchitectureRule[],
    violations: ArchitectureViolation[]
  ): number {
    const violated = ComplianceAnalyzer.violatedRuleIds(violations);
    return rules.filter((r) => !violated.has(r.ruleId)).length;
  }
}
