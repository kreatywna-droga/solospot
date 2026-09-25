/**
 * CompositionIntelligence.ts — Visual Language → Composition Decisions
 *
 * Translates a Visual Language into concrete layout/composition changes
 * on an existing BuilderDocument. This is the missing layer that turns
 * abstract Visual DNA into real canvas transformation.
 *
 * Does NOT mutate BuilderDocument directly.
 * Produces BuilderCommand[] for execution by BuilderContext.
 */

import type { VisualLanguage, VisualDNA } from './types';
import type { BuilderDocument, SectionNode, BuilderCommand, BuilderPage } from '../../../packages/builder-core/src';

export interface CompositionInput {
  document: BuilderDocument;
  visualLanguage: VisualLanguage;
  targetPageId?: string;
}

export interface CompositionDecision {
  category: string;
  target: string;
  property: string;
  value: unknown;
  reason: string;
}

export function buildCompositionDecisions(input: CompositionInput): CompositionDecision[] {
  const { document, visualLanguage, targetPageId } = input;
  const decisions: CompositionDecision[] = [];
  const dna = visualLanguage.visualDNA;

  const page = targetPageId
    ? document.pages.find((p) => p.id === targetPageId) || document.pages[0]
    : document.pages[0];

  if (!page) return decisions;

  const hero = page.sections.find((s) => s.label.toLowerCase().includes('hero') || s.type === 'hero');
  const sections = page.sections.filter((s) => s.type === 'section' || s.type === 'container');
  const cards = page.sections.filter((s) => s.label.toLowerCase().includes('card'));
  const ctaNodes = page.sections.filter((s) => s.label.toLowerCase().includes('cta') || s.label.toLowerCase().includes('button'));

  // Hero composition
  if (hero) {
    decisions.push(...heroDecisions(hero, dna, visualLanguage));
  }

  // Section composition
  for (const section of sections) {
    decisions.push(...sectionDecisions(section, dna, visualLanguage));
  }

  // Card composition
  for (const card of cards) {
    decisions.push(...cardDecisions(card, dna, visualLanguage));
  }

  // CTA composition
  for (const cta of ctaNodes) {
    decisions.push(...ctaDecisions(cta, dna, visualLanguage));
  }

  // Global spacing/rhythm
  decisions.push(...globalSpacingDecisions(page, dna, visualLanguage));

  // Typography hierarchy
  decisions.push(...typographyDecisions(page, dna, visualLanguage));

  return decisions;
}

function heroDecisions(hero: SectionNode, dna: VisualDNA, lang: VisualLanguage): CompositionDecision[] {
  const decisions: CompositionDecision[] = [];
  const label = hero.label.toLowerCase();

  if (label.includes('hero')) {
    if (dna.layoutCharacter === 'full-bleed') {
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'minHeight',
        value: '100vh',
        reason: `${lang.name}: full-bleed hero requires full viewport height`,
      });
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'paddingTop',
        value: '80px',
        reason: `${lang.name}: full-bleed hero needs breathing room`,
      });
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'paddingBottom',
        value: '80px',
        reason: `${lang.name}: full-bleed hero needs breathing room`,
      });
    } else if (dna.layoutCharacter === 'asymmetric') {
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'minHeight',
        value: '80vh',
        reason: `${lang.name}: asymmetric hero uses large but not full viewport height`,
      });
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'paddingTop',
        value: '120px',
        reason: `${lang.name}: asymmetric hero has generous top padding`,
      });
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'paddingBottom',
        value: '120px',
        reason: `${lang.name}: asymmetric hero has generous bottom padding`,
      });
    } else if (dna.layoutCharacter === 'grid' || dna.layoutCharacter === 'modular') {
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'minHeight',
        value: '60vh',
        reason: `${lang.name}: grid/modular hero uses controlled height`,
      });
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'paddingTop',
        value: '80px',
        reason: `${lang.name}: grid/modular hero has structured padding`,
      });
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'paddingBottom',
        value: '80px',
        reason: `${lang.name}: grid/modular hero has structured padding`,
      });
    } else if (dna.layoutCharacter === 'centered') {
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'minHeight',
        value: '70vh',
        reason: `${lang.name}: centered hero uses balanced height`,
      });
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'paddingTop',
        value: '100px',
        reason: `${lang.name}: centered hero has balanced padding`,
      });
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'paddingBottom',
        value: '100px',
        reason: `${lang.name}: centered hero has balanced padding`,
      });
    }

    // Image treatment
    if (dna.imageCharacter === 'cinematic' || dna.imageCharacter === 'editorial') {
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'backgroundSize',
        value: 'cover',
        reason: `${lang.name}: ${dna.imageCharacter} imagery uses cover`,
      });
      decisions.push({
        category: 'hero',
        target: hero.id,
        property: 'backgroundPosition',
        value: 'center',
        reason: `${lang.name}: ${dna.imageCharacter} imagery centers focus`,
      });
    }
  }

  return decisions;
}

function sectionDecisions(section: SectionNode, dna: VisualDNA, lang: VisualLanguage): CompositionDecision[] {
  const decisions: CompositionDecision[] = [];

  if (dna.density === 'sparse') {
    decisions.push({
      category: 'section',
      target: section.id,
      property: 'paddingTop',
      value: '120px',
      reason: `${lang.name}: sparse density requires generous section padding`,
    });
    decisions.push({
      category: 'section',
      target: section.id,
      property: 'paddingBottom',
      value: '120px',
      reason: `${lang.name}: sparse density requires generous section padding`,
    });
  } else if (dna.density === 'balanced') {
    decisions.push({
      category: 'section',
      target: section.id,
      property: 'paddingTop',
      value: '80px',
      reason: `${lang.name}: balanced density uses standard section padding`,
    });
    decisions.push({
      category: 'section',
      target: section.id,
      property: 'paddingBottom',
      value: '80px',
      reason: `${lang.name}: balanced density uses standard section padding`,
    });
  } else if (dna.density === 'dense') {
    decisions.push({
      category: 'section',
      target: section.id,
      property: 'paddingTop',
      value: '48px',
      reason: `${lang.name}: dense density uses tight section padding`,
    });
    decisions.push({
      category: 'section',
      target: section.id,
      property: 'paddingBottom',
      value: '48px',
      reason: `${lang.name}: dense density uses tight section padding`,
    });
  }

  if (dna.layoutCharacter === 'asymmetric' || dna.layoutCharacter === 'editorial') {
    decisions.push({
      category: 'section',
      target: section.id,
      property: 'maxWidth',
      value: '1400px',
      reason: `${lang.name}: ${dna.layoutCharacter} layout uses wide content`,
    });
  } else if (dna.layoutCharacter === 'grid' || dna.layoutCharacter === 'modular') {
    decisions.push({
      category: 'section',
      target: section.id,
      property: 'maxWidth',
      value: '1200px',
      reason: `${lang.name}: ${dna.layoutCharacter} layout uses controlled width`,
    });
  }

  return decisions;
}

function cardDecisions(card: SectionNode, dna: VisualDNA, lang: VisualLanguage): CompositionDecision[] {
  const decisions: CompositionDecision[] = [];

  if (dna.density === 'sparse') {
    decisions.push({
      category: 'card',
      target: card.id,
      property: 'padding',
      value: '32px',
      reason: `${lang.name}: sparse density uses generous card padding`,
    });
    decisions.push({
      category: 'card',
      target: card.id,
      property: 'marginBottom',
      value: '32px',
      reason: `${lang.name}: sparse density uses generous card spacing`,
    });
  } else if (dna.density === 'dense') {
    decisions.push({
      category: 'card',
      target: card.id,
      property: 'padding',
      value: '16px',
      reason: `${lang.name}: dense density uses tight card padding`,
    });
    decisions.push({
      category: 'card',
      target: card.id,
      property: 'marginBottom',
      value: '16px',
      reason: `${lang.name}: dense density uses tight card spacing`,
    });
  }

  if (dna.geometry === 'sharp') {
    decisions.push({
      category: 'card',
      target: card.id,
      property: 'borderRadius',
      value: '4px',
      reason: `${lang.name}: sharp geometry uses minimal radius`,
    });
  } else if (dna.geometry === 'soft') {
    decisions.push({
      category: 'card',
      target: card.id,
      property: 'borderRadius',
      value: '12px',
      reason: `${lang.name}: soft geometry uses generous radius`,
    });
  } else if (dna.geometry === 'rounded') {
    decisions.push({
      category: 'card',
      target: card.id,
      property: 'borderRadius',
      value: '24px',
      reason: `${lang.name}: rounded geometry uses large radius`,
    });
  }

  return decisions;
}

function ctaDecisions(cta: SectionNode, dna: VisualDNA, lang: VisualLanguage): CompositionDecision[] {
  const decisions: CompositionDecision[] = [];

  if (dna.layoutCharacter === 'asymmetric' || dna.layoutCharacter === 'full-bleed') {
    decisions.push({
      category: 'cta',
      target: cta.id,
      property: 'textAlign',
      value: 'left',
      reason: `${lang.name}: ${dna.layoutCharacter} layout aligns CTA to start`,
    });
  } else if (dna.layoutCharacter === 'centered') {
    decisions.push({
      category: 'cta',
      target: cta.id,
      property: 'textAlign',
      value: 'center',
      reason: `${lang.name}: centered layout aligns CTA to center`,
    });
  }

  if (dna.decorationLevel === 'minimal') {
    decisions.push({
      category: 'cta',
      target: cta.id,
      property: 'padding',
      value: '12px 24px',
      reason: `${lang.name}: minimal decoration uses restrained CTA padding`,
    });
  } else if (dna.decorationLevel === 'expressive') {
    decisions.push({
      category: 'cta',
      target: cta.id,
      property: 'padding',
      value: '16px 32px',
      reason: `${lang.name}: expressive decoration uses generous CTA padding`,
    });
  }

  return decisions;
}

function globalSpacingDecisions(page: BuilderPage, dna: VisualDNA, lang: VisualLanguage): CompositionDecision[] {
  const decisions: CompositionDecision[] = [];
  const root = page.sections[0];

  if (!root) return decisions;

  if (dna.density === 'sparse') {
    decisions.push({
      category: 'global',
      target: root.id,
      property: 'gap',
      value: '48px',
      reason: `${lang.name}: sparse density uses large gaps between sections`,
    });
  } else if (dna.density === 'dense') {
    decisions.push({
      category: 'global',
      target: root.id,
      property: 'gap',
      value: '16px',
      reason: `${lang.name}: dense density uses tight gaps between sections`,
    });
  } else {
    decisions.push({
      category: 'global',
      target: root.id,
      property: 'gap',
      value: '32px',
      reason: `${lang.name}: balanced density uses standard gaps between sections`,
    });
  }

  return decisions;
}

function typographyDecisions(page: BuilderPage, dna: VisualDNA, lang: VisualLanguage): CompositionDecision[] {
  const decisions: CompositionDecision[] = [];

  for (const section of page.sections) {
    for (const child of section.children) {
      if (child.type === 'heading' || child.label.toLowerCase().includes('heading') || child.label.toLowerCase().includes('h1') || child.label.toLowerCase().includes('h2')) {
        if (dna.typographyCharacter === 'editorial' || dna.typographyCharacter === 'expressive') {
          decisions.push({
            category: 'typography',
            target: child.id,
            property: 'fontSize',
            value: '3.5rem',
            reason: `${lang.name}: ${dna.typographyCharacter} typography uses large display size`,
          });
          decisions.push({
            category: 'typography',
            target: child.id,
            property: 'lineHeight',
            value: '1.1',
            reason: `${lang.name}: ${dna.typographyCharacter} typography uses tight line height`,
          });
          decisions.push({
            category: 'typography',
            target: child.id,
            property: 'letterSpacing',
            value: '-0.02em',
            reason: `${lang.name}: ${dna.typographyCharacter} typography uses tight tracking`,
          });
        } else if (dna.typographyCharacter === 'technical' || dna.typographyCharacter === 'geometric') {
          decisions.push({
            category: 'typography',
            target: child.id,
            property: 'fontSize',
            value: '2.5rem',
            reason: `${lang.name}: ${dna.typographyCharacter} typography uses controlled display size`,
          });
          decisions.push({
            category: 'typography',
            target: child.id,
            property: 'lineHeight',
            value: '1.2',
            reason: `${lang.name}: ${dna.typographyCharacter} typography uses precise line height`,
          });
          decisions.push({
            category: 'typography',
            target: child.id,
            property: 'letterSpacing',
            value: '-0.01em',
            reason: `${lang.name}: ${dna.typographyCharacter} typography uses tight tracking`,
          });
        } else if (dna.typographyCharacter === 'grotesk' || dna.typographyCharacter === 'humanist') {
          decisions.push({
            category: 'typography',
            target: child.id,
            property: 'fontSize',
            value: '2.25rem',
            reason: `${lang.name}: ${dna.typographyCharacter} typography uses clean display size`,
          });
          decisions.push({
            category: 'typography',
            target: child.id,
            property: 'lineHeight',
            value: '1.3',
            reason: `${lang.name}: ${dna.typographyCharacter} typography uses comfortable line height`,
          });
          decisions.push({
            category: 'typography',
            target: child.id,
            property: 'letterSpacing',
            value: '-0.01em',
            reason: `${lang.name}: ${dna.typographyCharacter} typography uses standard tracking`,
          });
        }
      }
    }
  }

  return decisions;
}

export function compositionDecisionsToCommands(
  decisions: CompositionDecision[],
  pageId?: string,
): BuilderCommand[] {
  const commands: BuilderCommand[] = [];

  for (const decision of decisions) {
    if (decision.property === 'gap') {
      commands.push({
        type: 'SET_NODE_STYLES',
        nodeId: decision.target,
        styles: { [decision.property]: decision.value } as any,
        pageId,
      });
    } else if (decision.property === 'maxWidth') {
      commands.push({
        type: 'SET_NODE_STYLES',
        nodeId: decision.target,
        styles: { [decision.property]: decision.value } as any,
        pageId,
      });
    } else if (decision.property === 'textAlign') {
      commands.push({
        type: 'SET_NODE_STYLES',
        nodeId: decision.target,
        styles: { [decision.property]: decision.value } as any,
        pageId,
      });
    } else {
      commands.push({
        type: 'SET_NODE_STYLES',
        nodeId: decision.target,
        styles: { [decision.property]: decision.value } as any,
        pageId,
      });
    }
  }

  return commands;
}
