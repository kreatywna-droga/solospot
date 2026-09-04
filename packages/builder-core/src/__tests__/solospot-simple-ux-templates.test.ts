import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createBuilderNode,
  createSectionNode,
  BuilderNode,
  SectionNode,
} from '../index';
import { SECTION_TEMPLATES, CATEGORIES } from '../../../../src/components/builder/library/SectionLibraryModal';
import { WEBSITE_TEMPLATES } from '../../../../src/components/builder/templates/WebsiteTemplatePickerModal';

describe('SoloSpot Builder — Simple-First / Canvas-First UX Transformation', () => {
  describe('Visual Section Library (11 Categories)', () => {
    it('should have templates defined across key categories', () => {
      expect(SECTION_TEMPLATES.length).toBeGreaterThanOrEqual(7);
      const categories = new Set(SECTION_TEMPLATES.map((t) => t.category));
      expect(categories.has('hero')).toBe(true);
      expect(categories.has('about')).toBe(true);
      expect(categories.has('features')).toBe(true);
      expect(categories.has('testimonials')).toBe(true);
      expect(categories.has('cta')).toBe(true);
      expect(categories.has('contact')).toBe(true);
      expect(categories.has('footer')).toBe(true);
    });

    it('each section template should generate a valid canonical SectionNode with children and styles', () => {
      SECTION_TEMPLATES.forEach((tmpl) => {
        const node = tmpl.createNode();
        expect(node.id).toBeTruthy();
        expect(node.type).toBe('section');
        expect(node.label).toBeTruthy();
        expect(node.styles).toBeDefined();
        expect(Array.isArray(node.children)).toBe(true);
        expect(node.children.length).toBeGreaterThan(0);

        // Verify that children are real BuilderNodes
        node.children.forEach((child) => {
          expect(child.id).toBeTruthy();
          expect(child.type).toBeTruthy();
        });
      });
    });

    it('should correctly support hero video ambient background in template', () => {
      const videoTmpl = SECTION_TEMPLATES.find((t) => t.id === 'hero-video-ambient')!;
      expect(videoTmpl).toBeDefined();
      const node = videoTmpl.createNode();
      expect(node.styles?.videoSrc).toContain('.mp4');
      expect(node.styles?.videoAutoplay).toBe(true);
      expect(node.styles?.overlayOpacity).toBeGreaterThan(0);
    });
  });

  describe('Website Template Starters (8 Presets)', () => {
    it('should have exactly 8 complete website templates defined', () => {
      expect(WEBSITE_TEMPLATES).toHaveLength(8);
    });

    it('each template has valid metadata, name, tagline, description, and icon', () => {
      WEBSITE_TEMPLATES.forEach((tmpl) => {
        expect(tmpl.id).toBeTruthy();
        expect(tmpl.name).toBeTruthy();
        expect(tmpl.tagline).toBeTruthy();
        expect(tmpl.description).toBeTruthy();
        expect(tmpl.icon).toBeDefined();
      });
    });

    it('templates reference existing section templates from the library', () => {
      const allSectionIds = new Set(SECTION_TEMPLATES.map((s) => s.id));
      WEBSITE_TEMPLATES.forEach((tmpl) => {
        if (tmpl.id !== 'blank') {
          expect(tmpl.sectionTemplateIds.length).toBeGreaterThan(0);
          tmpl.sectionTemplateIds.forEach((secId) => {
            expect(allSectionIds.has(secId)).toBe(true);
          });
        }
      });
    });

    it('should construct a complete multi-section landing page from template', () => {
      const landingTmpl = WEBSITE_TEMPLATES.find((t) => t.id === 'landing-page')!;
      const sections: SectionNode[] = landingTmpl.sectionTemplateIds.map((secId) => {
        const found = SECTION_TEMPLATES.find((s) => s.id === secId)!;
        return found.createNode() as SectionNode;
      });

      const doc = createBuilderDocument({
        id: 'doc-landing',
        pages: [
          createBuilderPage({
            id: 'page_home',
            slug: '/',
            name: 'Home',
            sections,
          }),
        ],
      });

      expect(doc.pages[0].sections).toHaveLength(landingTmpl.sectionTemplateIds.length);
      expect(doc.pages[0].sections[0].label).toContain('Hero');
      expect(doc.pages[0].sections[doc.pages[0].sections.length - 1].label).toContain('Stopka');
    });
  });

  describe('Exact-Index Section Insertion', () => {
    it('should insert a new section at the exact targeted position between existing sections', () => {
      const heroTmpl = SECTION_TEMPLATES.find((t) => t.id === 'hero-centered')!;
      const aboutTmpl = SECTION_TEMPLATES.find((t) => t.id === 'about-story')!;
      const ctaTmpl = SECTION_TEMPLATES.find((t) => t.id === 'cta-banner')!;
      const featuresTmpl = SECTION_TEMPLATES.find((t) => t.id === 'features-3-cards')!;

      const initialSections = [
        heroTmpl.createNode() as SectionNode,
        aboutTmpl.createNode() as SectionNode,
        ctaTmpl.createNode() as SectionNode,
      ];

      const page = createBuilderPage({
        id: 'page_order',
        slug: '/',
        name: 'Home',
        sections: [...initialSections],
      });

      // Insert Features right between Hero (idx 0) and About (idx 1), so at index 1
      const featuresNode = featuresTmpl.createNode() as SectionNode;
      const targetIndex = 1;
      page.sections.splice(targetIndex, 0, featuresNode);

      expect(page.sections).toHaveLength(4);
      expect(page.sections[0].id).toBe(initialSections[0].id); // Hero
      expect(page.sections[1].id).toBe(featuresNode.id);        // Features inserted at #1
      expect(page.sections[2].id).toBe(initialSections[1].id); // About moved to #2
      expect(page.sections[3].id).toBe(initialSections[2].id); // CTA moved to #3
    });
  });
});
