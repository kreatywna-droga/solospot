/**
 * MultiPageDocumentGenerator.ts — Generates real BuilderDocuments from MultiPage Website Blueprints
 *
 * Implements the atomic pipeline converting MultiPageWebsiteBlueprint into
 * fully populated BuilderDocument trees with real nodes, navigation links,
 * experiences, and responsive properties through standard BuilderCommands.
 *
 * ARCHITECTURAL INVARIANTS:
 * - BuilderDocument is the Single Source of Truth (SSOT).
 * - All mutations execute via applyCommandToDocument (atomic & undoable).
 * - Rollback on error: if any page/section generation fails, the initial state is preserved.
 * - Multi-page navigation items are mapped with valid slug targets.
 */

import {
  applyCommandToDocument,
  type BuilderDocument,
  type BuilderNode,
  type BuilderPage,
  type BuilderCommand,
} from '../../../packages/builder-core/src';
import type {
  MultiPageWebsiteBlueprint,
  BlueprintPagePlan,
  BlueprintSectionPlan,
} from './MultiPageBlueprintEngine';

export interface GenerationResult {
  success: boolean;
  document: BuilderDocument;
  pagesCreated: number;
  sectionsCreated: number;
  commandsExecuted: number;
  error?: string;
}

export interface DocumentGeneratorOptions {
  allowOverwrite?: boolean;
}

/**
 * Transforms a MultiPageWebsiteBlueprint into a populated BuilderDocument.
 */
export function generateMultiPageDocument(
  blueprint: MultiPageWebsiteBlueprint,
  initialDocument?: BuilderDocument,
  options: DocumentGeneratorOptions = {}
): GenerationResult {
  // 1. Validate Blueprint first
  if (!blueprint || !blueprint.pages || blueprint.pages.length === 0) {
    return {
      success: false,
      document: initialDocument || createEmptyDocument(blueprint),
      pagesCreated: 0,
      sectionsCreated: 0,
      commandsExecuted: 0,
      error: 'Nieprawidłowy lub pusty Blueprint.',
    };
  }

  // 2. Prepare baseline document
  let currentDoc: BuilderDocument = initialDocument
    ? JSON.parse(JSON.stringify(initialDocument))
    : createEmptyDocument(blueprint);

  // Check overwrite protection if initial document has existing content
  const existingSectionCount = currentDoc.pages.reduce((acc, p) => acc + (p.sections?.length || 0), 0);
  if (existingSectionCount > 0 && !options.allowOverwrite) {
    return {
      success: false,
      document: currentDoc,
      pagesCreated: 0,
      sectionsCreated: 0,
      commandsExecuted: 0,
      error: 'Dokument zawiera istniejące sekcje. Wymagana jest jawna zgoda na nadpisanie (allowOverwrite: true).',
    };
  }

  // Backup for rollback
  const initialBackup = JSON.parse(JSON.stringify(currentDoc));
  let commandsCount = 0;
  let totalSectionsCount = 0;

  try {
    // Phase 1: Update Theme & Design Tokens
    const themeCommand: BuilderCommand = {
      type: 'UPDATE_THEME',
      theme: {
        primaryColor: blueprint.designSystem.primaryColor,
        secondaryColor: blueprint.designSystem.secondaryColor,
        font: blueprint.designSystem.headingFont,
        backgroundColor: blueprint.designSystem.backgroundColor,
        borderRadius: blueprint.designSystem.borderRadius,
      },
    };
    currentDoc = applyCommandToDocument(currentDoc, themeCommand);
    commandsCount++;

    // Phase 2: Create Pages and Sections
    const homeBlueprintPage = blueprint.pages.find((p) => p.isHome) || blueprint.pages[0];
    const subpages = blueprint.pages.filter((p) => p.id !== homeBlueprintPage.id);

    // Update or create Home Page
    const homePageId = currentDoc.pages[0]?.id || homeBlueprintPage.id;
    if (currentDoc.pages.length === 0) {
      const addHomeCmd: BuilderCommand = {
        type: 'ADD_PAGE',
        page: {
          id: homePageId,
          slug: '',
          name: homeBlueprintPage.name,
          isHome: true,
          seo: {
            title: homeBlueprintPage.title,
            description: homeBlueprintPage.description,
          },
        },
      };
      currentDoc = applyCommandToDocument(currentDoc, addHomeCmd);
      commandsCount++;
    } else {
      const updateHomeMetaCmd: BuilderCommand = {
        type: 'UPDATE_PAGE_META',
        pageId: homePageId,
        name: homeBlueprintPage.name,
        slug: '',
        isHome: true,
      };
      currentDoc = applyCommandToDocument(currentDoc, updateHomeMetaCmd);
      commandsCount++;
    }

    // Add subpages
    for (const sub of subpages) {
      const existingSub = currentDoc.pages.find((p) => p.id === sub.id || p.slug === sub.slug);
      if (!existingSub) {
        const addPageCmd: BuilderCommand = {
          type: 'ADD_PAGE',
          page: {
            id: sub.id,
            slug: sub.slug,
            name: sub.name,
            isHome: false,
            seo: {
              title: sub.title,
              description: sub.description,
            },
          },
        };
        currentDoc = applyCommandToDocument(currentDoc, addPageCmd);
        commandsCount++;
      }
    }

    // Phase 3: Populate sections for each page
    for (const bpPage of blueprint.pages) {
      const targetPageId = bpPage.isHome ? homePageId : bpPage.id;

      for (let secIdx = 0; secIdx < bpPage.sections.length; secIdx++) {
        const secPlan = bpPage.sections[secIdx];
        const childrenNodes = buildSectionChildNodes(secPlan, bpPage, blueprint);

        const addSecCmd: BuilderCommand = {
          type: 'ADD_SECTION',
          pageId: targetPageId,
          sectionType: secPlan.templateType,
          sectionId: secPlan.id,
          label: secPlan.label,
          atIndex: secIdx,
          children: childrenNodes,
          defaultProps: {
            title: secPlan.headline,
            subtitle: secPlan.subheadline,
            ctaText: secPlan.ctaText || '',
            ...(secPlan.experienceConfig ? { experienceConfig: secPlan.experienceConfig } : {}),
            ...(secPlan.experienceId ? { experienceId: secPlan.experienceId } : {}),
          },
          styles: {
            paddingTop: secPlan.visualWeight === 'heavy' ? '100px' : '60px',
            paddingBottom: secPlan.visualWeight === 'heavy' ? '100px' : '60px',
            backgroundColor:
              secPlan.visualWeight === 'accent'
                ? blueprint.designSystem.surfaceColor
                : 'transparent',
          },
        };

        currentDoc = applyCommandToDocument(currentDoc, addSecCmd);
        commandsCount++;
        totalSectionsCount++;
      }
    }

    return {
      success: true,
      document: currentDoc,
      pagesCreated: blueprint.pages.length,
      sectionsCreated: totalSectionsCount,
      commandsExecuted: commandsCount,
    };
  } catch (error) {
    // Atomic rollback on failure
    return {
      success: false,
      document: initialBackup,
      pagesCreated: 0,
      sectionsCreated: 0,
      commandsExecuted: 0,
      error: `Błąd podczas generowania dokumentu: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Creates an initial baseline empty document matching the blueprint metadata.
 */
function createEmptyDocument(blueprint: MultiPageWebsiteBlueprint): BuilderDocument {
  const homePage: BuilderPage = {
    id: 'page-home',
    slug: '',
    name: 'Strona Główna',
    sections: [],
    seo: {
      title: `${blueprint.brandName} | Oficjalna strona`,
      description: `Witaj na stronie ${blueprint.brandName}`,
    },
    isHome: true,
  };

  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tenantId: 'default-tenant',
    name: blueprint.brandName,
    version: 1,
    metadata: {
      storeName: blueprint.brandName,
      storeSlug: blueprint.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      locale: 'pl',
      currency: 'PLN',
    },
    pages: [homePage],
    theme: {
      primaryColor: blueprint.designSystem.primaryColor,
      secondaryColor: blueprint.designSystem.secondaryColor,
      font: blueprint.designSystem.headingFont,
      backgroundColor: blueprint.designSystem.backgroundColor,
      borderRadius: blueprint.designSystem.borderRadius,
    },
    isDirty: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Constructs hierarchical child elements for a given blueprint section.
 */
function buildSectionChildNodes(
  sec: BlueprintSectionPlan,
  page: BlueprintPagePlan,
  blueprint: MultiPageWebsiteBlueprint
): BuilderNode[] {
  const children: BuilderNode[] = [];

  // 1. Heading Node
  children.push({
    id: `${sec.id}_heading`,
    type: 'heading',
    label: 'Headline',
    parentId: sec.id,
    props: {
      text: sec.headline,
      level: sec.role === 'hero' ? 'h1' : 'h2',
    },
    styles: {
      fontSize: sec.role === 'hero' ? '48px' : '32px',
      fontWeight: '700',
      color: blueprint.designSystem.textColor,
      marginBottom: '16px',
    },
    children: [],
    visible: true,
    locked: false,
    order: 0,
  });

  // 2. Subheading / Paragraph Node
  if (sec.subheadline) {
    children.push({
      id: `${sec.id}_subheadline`,
      type: 'text',
      label: 'Subheading',
      parentId: sec.id,
      props: {
        text: sec.subheadline,
      },
      styles: {
        fontSize: '18px',
        color: blueprint.designSystem.textColor,
        opacity: 0.85,
        marginBottom: '24px',
      },
      children: [],
      visible: true,
      locked: false,
      order: 1,
    });
  }

  // 3. CTA Button Node (for hero/cta sections)
  if (sec.ctaText || sec.role === 'hero' || sec.role === 'cta') {
    const contactSlug = blueprint.pages.find((p) => p.purpose === 'contact')?.slug || 'kontakt';
    children.push({
      id: `${sec.id}_cta_btn`,
      type: 'button',
      label: 'Primary CTA Button',
      parentId: sec.id,
      props: {
        text: sec.ctaText || 'Skontaktuj się z nami',
        href: `/${contactSlug}`,
        variant: 'primary',
      },
      styles: {
        backgroundColor: blueprint.designSystem.primaryColor,
        color: '#FFFFFF',
        padding: '14px 28px',
        borderRadius: blueprint.designSystem.borderRadius,
        fontWeight: '600',
        display: 'inline-block',
      },
      children: [],
      visible: true,
      locked: false,
      order: 2,
    });
  }

  // 4. Experience Node if configured
  if (sec.experienceId) {
    children.push({
      id: `${sec.id}_experience_canvas`,
      type: 'container',
      label: `Experience: ${sec.experienceId}`,
      parentId: sec.id,
      props: {
        experienceId: sec.experienceId,
        experienceConfig: sec.experienceConfig || {},
        fallbackMode: sec.fallbackMode,
      },
      styles: {
        width: '100%',
        minHeight: '300px',
        position: 'relative',
        marginTop: '24px',
      },
      children: [],
      visible: true,
      locked: false,
      order: 3,
    });
  }

  return children;
}
