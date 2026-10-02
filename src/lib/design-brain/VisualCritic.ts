/**
 * VisualCritic.ts — Visual QA Critic & Safe Autonomous Self-Repair Engine
 *
 * Part of SoloSpot Design Brain + Creative Experience Engine Integration.
 *
 * Evaluates document composition, visual rhythm, Experience harmony, contrast,
 * typography hierarchy, and responsive constraints. Generates explicit, bounded
 * repair proposals and executes them via SSOT BuilderCommands.
 *
 * Invariant: Never mutates BuilderDocument directly. Proposals are explicit,
 * reversible through Undo, and must be verified by post-repair re-analysis.
 */

import type {
  BuilderDocument,
  BuilderPage,
  SectionNode,
  BuilderNode,
  NodeStyles,
} from '../../../packages/builder-core/src/BuilderDocument';
import type { BuilderCommand } from '../../../packages/builder-core/src/BuilderCommands';
import { applyCommandToDocument } from '../../../packages/builder-core/src/BuilderCommands';
import type { SectionRole } from '../ai/SitePlanTypes';

// ── Types ────────────────────────────────────────────────────────────

export type VisualCriticCategory =
  | 'hierarchy'
  | 'contrast'
  | 'typography'
  | 'composition'
  | 'motion'
  | 'experience'
  | 'responsive'
  | 'accessibility';

export type VisualCriticSeverity = 'info' | 'warning' | 'error' | 'critical';

export type EvidenceSource =
  | 'document_structure'
  | 'render_metadata'
  | 'canvas_screenshot'
  | 'experience_config';

export interface VisualCriticEvidence {
  source: EvidenceSource;
  description: string;
  observedValue?: unknown;
  expectedValue?: unknown;
  screenshotUrl?: string;
}

export interface VisualCriticTarget {
  pageId: string;
  sectionId?: string;
  nodeId?: string;
  label?: string;
  role?: SectionRole | string;
}

export interface VisualCriticRepairProposal {
  id: string;
  description: string;
  command: BuilderCommand;
  fieldDiff: Record<string, { before: unknown; after: unknown }>;
  confidence: number;
  requiresHumanApproval: boolean;
}

export interface VisualCriticFinding {
  id: string;
  ruleId: string;
  category: VisualCriticCategory;
  severity: VisualCriticSeverity;
  title: string;
  message: string;
  impact: string;
  target: VisualCriticTarget;
  evidence: VisualCriticEvidence;
  proposal?: VisualCriticRepairProposal;
  status: 'detected' | 'proposed' | 'applied' | 'rejected' | 'resolved';
}

export interface RenderObservation {
  nodeId: string;
  measuredWidth?: number;
  measuredHeight?: number;
  renderedTextColor?: string;
  renderedBgColor?: string;
  hasClipping?: boolean;
  computedContrastRatio?: number;
  screenshotUrl?: string;
}

export interface VisualCriticOptions {
  pageId?: string;
  viewport?: 'desktop' | 'tablet' | 'mobile';
  renderObservations?: RenderObservation[];
  prefersReducedMotion?: boolean;
}

export interface VisualCriticReport {
  timestamp: string;
  pageId: string;
  findings: VisualCriticFinding[];
  summary: {
    total: number;
    critical: number;
    error: number;
    warning: number;
    info: number;
    repairableCount: number;
  };
  evidenceSourcesUsed: EvidenceSource[];
  viewport: 'desktop' | 'tablet' | 'mobile';
}

// ── Rule Definitions & Evaluators ────────────────────────────────────

/**
 * High-value rules evaluation
 */
export function analyzeDocumentVisualQuality(
  document: BuilderDocument,
  options: VisualCriticOptions = {}
): VisualCriticReport {
  const targetPageId = options.pageId || document.pages[0]?.id || 'page-home';
  const page = document.pages.find((p) => p.id === targetPageId) || document.pages[0];
  const viewport = options.viewport || 'desktop';
  const findings: VisualCriticFinding[] = [];
  const evidenceSources: Set<EvidenceSource> = new Set(['document_structure']);

  if (options.renderObservations && options.renderObservations.length > 0) {
    evidenceSources.add('render_metadata');
  }

  if (!page) {
    return {
      timestamp: new Date().toISOString(),
      pageId: targetPageId,
      findings: [],
      summary: { total: 0, critical: 0, error: 0, warning: 0, info: 0, repairableCount: 0 },
      evidenceSourcesUsed: Array.from(evidenceSources),
      viewport,
    };
  }

  const sections = page.sections || [];

  // Track WebGL scene count on page
  let webGlCount = 0;

  // Track consecutive layout types for rhythm
  let consecutiveDarkSections = 0;

  sections.forEach((section, index) => {
    const secType = (section.type || '').toLowerCase();
    const secLabel = section.label || `Section ${index + 1}`;
    const props = section.props || {};
    const styles = section.styles || {};
    const expConfig = (props.experienceConfig as Record<string, unknown>) || undefined;

    if (expConfig) evidenceSources.add('experience_config');

    const is3D =
      secType.includes('3d') ||
      Boolean((expConfig as any)?.scene3d) ||
      Boolean((expConfig as any)?.experienceId?.toString().includes('3d'));
    if (is3D) webGlCount++;

    // ── Rule 1: HERO_MISSING_HEADLINE ────────────────────────────────
    if (index === 0 || secType === 'hero' || secLabel.toLowerCase().includes('hero')) {
      const hasHeadingProp = Boolean(props.title || props.heading || props.headline);
      const hasHeadingChild = section.children?.some(
        (c) => c.type === 'heading' && Boolean(c.props?.text || c.props?.title)
      );

      if (!hasHeadingProp && !hasHeadingChild) {
        const findingId = `critique-hero-missing-headline-${page.id}-${section.id}`;
        findings.push({
          id: findingId,
          ruleId: 'HERO_MISSING_HEADLINE',
          category: 'hierarchy',
          severity: 'critical',
          title: 'Brak głównego nagłówka w sekcji Hero',
          message: `Sekcja Hero (${secLabel}) nie posiada głównego nagłówka, co zaburza hierarchię i SEO strony.`,
          impact: 'Odwiedzający nie widzą natychmiast głównej wartości ani nazwy marki.',
          target: { pageId: page.id, sectionId: section.id, label: secLabel, role: 'hero' },
          evidence: {
            source: 'document_structure',
            description: 'Brak właściwości title/heading oraz brak węzła heading w dzieciach sekcji',
            observedValue: { props: Object.keys(props), childrenCount: section.children?.length || 0 },
            expectedValue: 'title !== "" || heading node present',
          },
          proposal: {
            id: `repair-${findingId}`,
            description: 'Ustaw reprezentatywny nagłówek Hero na podstawie profilu marki',
            command: {
              type: 'UPDATE_PROPS',
              pageId: page.id,
              sectionId: section.id,
              props: {
                ...props,
                title: document.metadata?.storeName ? `Odkryj ${document.metadata.storeName}` : 'Nowoczesne Rozwiązania',
              },
            },
            fieldDiff: {
              title: {
                before: props.title || props.heading || null,
                after: document.metadata?.storeName ? `Odkryj ${document.metadata.storeName}` : 'Nowoczesne Rozwiązania',
              },
            },
            confidence: 0.95,
            requiresHumanApproval: false,
          },
          status: 'detected',
        });
      }

      // ── Rule 2: HERO_MISSING_CTA ───────────────────────────────────
      const hasCtaProp = Boolean(props.cta || props.ctaText || props.buttonText || props.primaryCta);
      const hasButtonChild = section.children?.some(
        (c) => c.type === 'button' || c.type === 'cta'
      );

      if (!hasCtaProp && !hasButtonChild) {
        const findingId = `critique-hero-missing-cta-${page.id}-${section.id}`;
        findings.push({
          id: findingId,
          ruleId: 'HERO_MISSING_CTA',
          category: 'hierarchy',
          severity: 'error',
          title: 'Brak przycisku CTA w sekcji Hero',
          message: `W sekcji Hero (${secLabel}) brak głównego przycisku wezwania do działania (Call-To-Action).`,
          impact: 'Spadek współczynnika konwersji — użytkownik nie ma bezpośredniej ścieżki przejścia.',
          target: { pageId: page.id, sectionId: section.id, label: secLabel, role: 'hero' },
          evidence: {
            source: 'document_structure',
            description: 'Brak pola cta/buttonText i brak węzła button',
            observedValue: null,
            expectedValue: 'cta !== ""',
          },
          proposal: {
            id: `repair-${findingId}`,
            description: 'Dodaj standardowy przycisk CTA „Rozpocznij teraz”',
            command: {
              type: 'UPDATE_PROPS',
              pageId: page.id,
              sectionId: section.id,
              props: {
                ...props,
                cta: 'Rozpocznij teraz',
                ctaHref: '#contact',
              },
            },
            fieldDiff: {
              cta: { before: null, after: 'Rozpocznij teraz' },
              ctaHref: { before: null, after: '#contact' },
            },
            confidence: 0.92,
            requiresHumanApproval: false,
          },
          status: 'detected',
        });
      }
    }

    // ── Rule 3: SHADER_TEXT_CONTRAST_LOW ─────────────────────────────
    const isDynamicShader =
      Boolean(expConfig?.background) ||
      Boolean((expConfig?.background as any)?.type) ||
      styles.backgroundImage?.toString().includes('gradient') ||
      styles.backgroundColor === 'transparent';

    const overlayOpacity = typeof styles.overlayOpacity === 'number' ? styles.overlayOpacity : 0;
    const textColor = styles.color || (styles as any).textColor || (props as any).textColor || '#ffffff';
    const isDarkText = textColor === '#000000' || textColor === '#0F172A' || textColor === '#111827';

    if (isDynamicShader && overlayOpacity < 0.25 && isDarkText) {
      const findingId = `critique-shader-contrast-low-${page.id}-${section.id}`;
      findings.push({
        id: findingId,
        ruleId: 'SHADER_TEXT_CONTRAST_LOW',
        category: 'contrast',
        severity: 'error',
        title: 'Niski kontrast tekstu na dynamicznym tle shader/gradient',
        message: `Sekcja ${secLabel} używa dynamicznego tła bez wystarczającej warstwy przyciemniającej overlay, co utrudnia czytelność ciemnego tekstu.`,
        impact: 'Tekst może zlewać się z animowanym tłem na jasnych lub nasyconych fragmentach shaderów.',
        target: { pageId: page.id, sectionId: section.id, label: secLabel },
        evidence: {
          source: 'experience_config',
          description: `overlayOpacity=${overlayOpacity} < 0.25 z ciemnym kolorem tekstu (${textColor})`,
          observedValue: { overlayOpacity, textColor },
          expectedValue: 'overlayOpacity >= 0.4 lub jasny kolor tekstu (#FFFFFF)',
        },
        proposal: {
          id: `repair-${findingId}`,
          description: 'Zwiększ krycie warstwy ochronnej overlay do 0.55 i ustaw biały kolor tekstu',
          command: {
            type: 'UPDATE_PROPS',
            pageId: page.id,
            sectionId: section.id,
            props: {
              ...props,
              styles: {
                ...styles,
                overlayOpacity: 0.55,
                color: '#FFFFFF',
              },
            },
          },
          fieldDiff: {
            'styles.overlayOpacity': { before: overlayOpacity, after: 0.55 },
            'styles.color': { before: textColor, after: '#FFFFFF' },
          },
          confidence: 0.96,
          requiresHumanApproval: false,
        },
        status: 'detected',
      });
    }

    // ── Rule 4: EXPERIENCE_ROLE_MISMATCH ─────────────────────────────
    const expId = (expConfig?.experienceId as string) || (props.experienceId as string) || '';
    const isTestimonialOrFaq = secType.includes('testimonial') || secType.includes('faq') || secLabel.toLowerCase().includes('opinie');
    const isHero3dExperience = expId.includes('cinematic-product-hero') || expId.includes('interactive-3d');

    if (isTestimonialOrFaq && isHero3dExperience) {
      const findingId = `critique-exp-mismatch-${page.id}-${section.id}`;
      findings.push({
        id: findingId,
        ruleId: 'EXPERIENCE_ROLE_MISMATCH',
        category: 'experience',
        severity: 'warning',
        title: 'Niedopasowany typ Experience do roli sekcji',
        message: `Sekcja opinii/FAQ (${secLabel}) ma przypisany ciężki Experience 3D Hero (${expId}), co zaburza hierarchię i obciąża renderowanie.`,
        impact: 'Niewłaściwa narracja sekcji oraz niepotrzebne zużycie zasobów GPU w sekcji informacyjnej.',
        target: { pageId: page.id, sectionId: section.id, label: secLabel, role: isTestimonialOrFaq ? 'testimonials' : 'faq' },
        evidence: {
          source: 'experience_config',
          description: `Sekcja ${secType} używa Experience ${expId}`,
          observedValue: { sectionType: secType, experienceId: expId },
          expectedValue: 'flagship-floating-cards || flagship-minimal-quotes',
        },
        proposal: {
          id: `repair-${findingId}`,
          description: 'Zmień konfigurację na dopasowany Experience „Floating Testimonial Cards”',
          command: {
            type: 'UPDATE_PROPS',
            pageId: page.id,
            sectionId: section.id,
            props: {
              ...props,
              experienceId: 'flagship-floating-cards',
              experienceName: 'Floating Testimonial Cards',
              experienceConfig: {
                background: { type: 'mesh-gradient', colors: ['#0A0A0E', '#161622'] },
                motion: { type: 'subtle', speed: 0.5 },
              },
            },
          },
          fieldDiff: {
            experienceId: { before: expId, after: 'flagship-floating-cards' },
          },
          confidence: 0.9,
          requiresHumanApproval: true,
        },
        status: 'detected',
      });
    }

    // ── Rule 5: REDUCED_MOTION_VIOLATION ─────────────────────────────
    if (options.prefersReducedMotion) {
      const motionLevel = (expConfig?.motionLevel as string) || (props.motionLevel as string) || '';
      const motionSpeed = typeof (expConfig?.motion as any)?.speed === 'number' ? (expConfig?.motion as any).speed : 1;

      if (motionLevel === 'cinematic' || motionLevel === 'interactive' || motionSpeed > 0.8) {
        const findingId = `critique-reduced-motion-${page.id}-${section.id}`;
        findings.push({
          id: findingId,
          ruleId: 'REDUCED_MOTION_VIOLATION',
          category: 'motion',
          severity: 'warning',
          title: 'Niezgodność z preferencją ograniczonego ruchu (prefers-reduced-motion)',
          message: `Sekcja ${secLabel} ma aktywny intensywny ruch (${motionLevel || 'speed=' + motionSpeed}), co narusza dostępność użytkowników z preferencją reduced-motion.`,
          impact: 'Potencjalny dyskomfort wizualny u użytkowników z zaburzeniami błędnika.',
          target: { pageId: page.id, sectionId: section.id, label: secLabel },
          evidence: {
            source: 'experience_config',
            description: `motionLevel=${motionLevel}, speed=${motionSpeed} przy prefersReducedMotion=true`,
            observedValue: { motionLevel, motionSpeed },
            expectedValue: 'motionLevel=subtle || static',
          },
          proposal: {
            id: `repair-${findingId}`,
            description: 'Ustaw bezpieczny poziom ruchu „subtle” z prędkością 0.2',
            command: {
              type: 'UPDATE_PROPS',
              pageId: page.id,
              sectionId: section.id,
              props: {
                ...props,
                experienceConfig: {
                  ...(expConfig || {}),
                  motionLevel: 'subtle',
                  motion: {
                    ...((expConfig?.motion as Record<string, unknown>) || {}),
                    speed: 0.2,
                  },
                },
              },
            },
            fieldDiff: {
              'experienceConfig.motionLevel': { before: motionLevel, after: 'subtle' },
              'experienceConfig.motion.speed': { before: motionSpeed, after: 0.2 },
            },
            confidence: 0.98,
            requiresHumanApproval: false,
          },
          status: 'detected',
        });
      }
    }

    // ── Rule 6: Monotonous Dark Sections Rhythm ───────────────────────
    const isDarkBg =
      styles.backgroundColor === '#000000' ||
      styles.backgroundColor === '#0A0A0E' ||
      styles.backgroundColor === '#0F172A' ||
      !styles.backgroundColor;

    if (isDarkBg) {
      consecutiveDarkSections++;
    } else {
      consecutiveDarkSections = 0;
    }

    if (consecutiveDarkSections >= 4 && index >= 3) {
      const findingId = `critique-monotonous-rhythm-${page.id}-${section.id}`;
      findings.push({
        id: findingId,
        ruleId: 'MONOTONOUS_SECTION_RHYTHM',
        category: 'composition',
        severity: 'info',
        title: 'Monotonny rytm wizualny (4 kolejne ciemne sekcje)',
        message: `4 kolejne sekcje mają identyczne ciemne tło bez akcentu powierzchniowego, co zlewa zawartość w jeden blok.`,
        impact: 'Mniejsze zaangażowanie i słabsze rozróżnienie bloków tematycznych.',
        target: { pageId: page.id, sectionId: section.id, label: secLabel },
        evidence: {
          source: 'document_structure',
          description: `consecutiveDarkSections=${consecutiveDarkSections}`,
          observedValue: consecutiveDarkSections,
          expectedValue: 'Różnicowanie tła / akcenty co 2-3 sekcje',
        },
        proposal: {
          id: `repair-${findingId}`,
          description: 'Zastosuj subtelny kontrast powierzchniowy `#12121A` z zaokrągleniem kontenera',
          command: {
            type: 'UPDATE_PROPS',
            pageId: page.id,
            sectionId: section.id,
            props: {
              ...props,
              styles: {
                ...styles,
                backgroundColor: '#12121A',
                borderRadius: '16px',
              },
            },
          },
          fieldDiff: {
            'styles.backgroundColor': { before: styles.backgroundColor || '#0A0A0E', after: '#12121A' },
            'styles.borderRadius': { before: styles.borderRadius || '0px', after: '16px' },
          },
          confidence: 0.85,
          requiresHumanApproval: true,
        },
        status: 'detected',
      });
    }

    // ── Rule 7: OVERFLOW_LONG_HEADLINE_MOBILE ────────────────────────
    if (viewport === 'mobile') {
      const headingText = (props.title as string) || (props.heading as string) || '';
      if (headingText.length > 55) {
        const findingId = `critique-mobile-headline-overflow-${page.id}-${section.id}`;
        findings.push({
          id: findingId,
          ruleId: 'OVERFLOW_LONG_HEADLINE_MOBILE',
          category: 'responsive',
          severity: 'warning',
          title: 'Bardzo długi nagłówek na widoku mobilnym',
          message: `Nagłówek sekcji ${secLabel} zawiera ${headingText.length} znaków i może powodować overflow lub zająć cały pierwszy ekran mobilny.`,
          impact: 'Utrudnione czytanie na ekranach smartfonów.',
          target: { pageId: page.id, sectionId: section.id, label: secLabel },
          evidence: {
            source: 'document_structure',
            description: `Długość nagłówka ${headingText.length} > 55 na widoku mobile`,
            observedValue: headingText.length,
            expectedValue: '<= 50 znaków lub skalowanie responsywne',
          },
          proposal: {
            id: `repair-${findingId}`,
            description: 'Ustaw responsywne skalowanie fontu mobilnego 0.8em',
            command: {
              type: 'UPDATE_PROPS',
              pageId: page.id,
              sectionId: section.id,
              props: {
                ...props,
                responsive: {
                  ...((props.responsive as Record<string, unknown>) || {}),
                  mobile: {
                    fontSize: '1.75rem',
                    lineHeight: '1.2',
                  },
                },
              },
            },
            fieldDiff: {
              'responsive.mobile.fontSize': { before: null, after: '1.75rem' },
            },
            confidence: 0.9,
            requiresHumanApproval: false,
          },
          status: 'detected',
        });
      }
    }
  });

  // ── Rule 8: EXCESSIVE_WEBGL_CONCURRENCY ───────────────────────────
  if (webGlCount > 2) {
    const findingId = `critique-excessive-webgl-${page.id}`;
    findings.push({
      id: findingId,
      ruleId: 'EXCESSIVE_WEBGL_CONCURRENCY',
      category: 'motion',
      severity: 'warning',
      title: 'Zbyt duża liczba równoczesnych scen WebGL 3D na stronie',
      message: `Strona zawiera ${webGlCount} scen 3D WebGL (rekomendowany limit: max 2). Może to powodować spadki FPS na urządzeniach mobilnych.`,
      impact: 'Obniżona płynność przewijania na słabszych urządzeniach.',
      target: { pageId: page.id },
      evidence: {
        source: 'experience_config',
        description: `webGlCount=${webGlCount} > 2`,
        observedValue: webGlCount,
        expectedValue: '<= 2',
      },
      status: 'detected',
    });
  }

  const summary = {
    total: findings.length,
    critical: findings.filter((f) => f.severity === 'critical').length,
    error: findings.filter((f) => f.severity === 'error').length,
    warning: findings.filter((f) => f.severity === 'warning').length,
    info: findings.filter((f) => f.severity === 'info').length,
    repairableCount: findings.filter((f) => Boolean(f.proposal)).length,
  };

  return {
    timestamp: new Date().toISOString(),
    pageId: targetPageId,
    findings,
    summary,
    evidenceSourcesUsed: Array.from(evidenceSources),
    viewport,
  };
}

// ── Autonomous Self-Repair Execution Flow ────────────────────────────

export interface ApplyRepairResult {
  nextDoc: BuilderDocument;
  resolved: boolean;
  appliedFinding: VisualCriticFinding;
  commandDispatched?: BuilderCommand;
  error?: string;
}

/**
 * Applies a verified repair proposal to the document and immediately re-validates.
 * Follows SSOT: executes only through standard applyCommandToDocument.
 */
export function applyVisualCriticRepair(
  document: BuilderDocument,
  finding: VisualCriticFinding,
  options: { revalidate?: boolean; viewport?: 'desktop' | 'tablet' | 'mobile' } = {}
): ApplyRepairResult {
  if (!finding.proposal) {
    return {
      nextDoc: document,
      resolved: false,
      appliedFinding: { ...finding, status: 'unresolved' as any },
      error: 'Finding does not contain an automated repair proposal',
    };
  }

  const proposal = finding.proposal;
  const pageId = finding.target.pageId || document.pages[0]?.id;
  const targetPage = document.pages.find((p) => p.id === pageId);

  if (!targetPage) {
    return {
      nextDoc: document,
      resolved: false,
      appliedFinding: { ...finding, status: 'unresolved' as any },
      error: `Target page "${pageId}" not found in BuilderDocument`,
    };
  }

  // Validate section existence if section targeted
  if (finding.target.sectionId) {
    const sectionExists = targetPage.sections.some((s) => s.id === finding.target.sectionId);
    if (!sectionExists) {
      return {
        nextDoc: document,
        resolved: false,
        appliedFinding: { ...finding, status: 'unresolved' as any },
        error: `Target section "${finding.target.sectionId}" no longer exists (stale finding)`,
      };
    }
  }

  // Apply mutation cleanly via standard reducer
  let nextDoc: BuilderDocument;
  try {
    nextDoc = applyCommandToDocument(document, proposal.command);
  } catch (err: any) {
    return {
      nextDoc: document,
      resolved: false,
      appliedFinding: { ...finding, status: 'unresolved' as any },
      error: `Mutation failed during dispatch: ${err?.message || 'Unknown error'}`,
    };
  }

  // If no mutation occurred (e.g. invalid target), fail safely
  if (JSON.stringify(document) === JSON.stringify(nextDoc)) {
    return {
      nextDoc: document,
      resolved: false,
      appliedFinding: { ...finding, status: 'unresolved' as any },
      error: 'Command dispatch resulted in zero document mutation',
    };
  }

  // Re-run critique to verify whether finding was resolved
  const shouldRevalidate = options.revalidate !== false;
  let isResolved = true;

  if (shouldRevalidate) {
    const postReport = analyzeDocumentVisualQuality(nextDoc, {
      pageId,
      viewport: options.viewport || 'desktop',
    });
    isResolved = !postReport.findings.some((f) => f.id === finding.id);
  }

  const updatedFinding: VisualCriticFinding = {
    ...finding,
    status: isResolved ? 'resolved' : 'applied',
  };

  return {
    nextDoc,
    resolved: isResolved,
    appliedFinding: updatedFinding,
    commandDispatched: proposal.command,
  };
}
