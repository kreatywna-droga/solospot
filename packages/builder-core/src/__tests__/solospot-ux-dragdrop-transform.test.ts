import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createBuilderNode,
  createSectionNode,
  GOOGLE_FONTS_CATALOG,
  getGoogleFontUrl,
  getFontsByCategory,
  searchFonts,
} from '../index';
import { TYPOGRAPHY_PRESETS } from '../../../../src/components/builder/sidebar/TypographyPresetsPanel';

describe('SoloSpot Builder - UX / Drag & Drop / Media / Typography / Transform System', () => {
  describe('Typography Presets', () => {
    it('should have exactly 10 canonical typography presets defined', () => {
      expect(TYPOGRAPHY_PRESETS).toHaveLength(10);
    });

    it('each typography preset should have valid id, name, type, and standard typography styles', () => {
      TYPOGRAPHY_PRESETS.forEach(preset => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.type).toBeTruthy();
        expect(preset.defaultText).toBeTruthy();
        expect(preset.styles).toBeDefined();
        expect(preset.styles.fontSize).toBeTruthy();
        expect(preset.styles.fontWeight).toBeTruthy();
      });
    });

    it('should correctly create canonical BuilderNode from typography preset in BuilderDocument model', () => {
      const heroPreset = TYPOGRAPHY_PRESETS.find(p => p.id === 'hero-title')!;
      
      const headingNode = createBuilderNode({
        id: 'node_heading_1',
        type: 'heading',
        label: heroPreset.name,
        props: { text: heroPreset.defaultText },
        styles: {
          ...heroPreset.styles,
        },
      });

      const sectionNode = createSectionNode({
        id: 'sec_1',
        type: 'section',
        label: 'Hero Section',
        children: [headingNode],
      });

      const doc = createBuilderDocument({
        id: 'doc-test',
        pages: [
          createBuilderPage({
            id: 'page_home',
            slug: '/',
            name: 'Home',
            sections: [sectionNode],
          }),
        ],
      });

      expect(doc.pages[0].sections[0].children?.[0].id).toBe('node_heading_1');
      const createdHeading = doc.pages[0].sections[0].children?.[0];
      expect(createdHeading?.type).toBe('heading');
      expect(createdHeading?.props.text).toBe(heroPreset.defaultText);
      expect(createdHeading?.styles?.fontSize).toBe(heroPreset.styles.fontSize);
      expect(createdHeading?.styles?.fontWeight).toBe(heroPreset.styles.fontWeight);
    });
  });

  describe('Google Fonts Catalog (100+ Fonts)', () => {
    it('should contain at least 100 fonts in the catalog', () => {
      expect(GOOGLE_FONTS_CATALOG.length).toBeGreaterThanOrEqual(100);
    });

    it('should cover all standard font categories', () => {
      const categories = new Set(GOOGLE_FONTS_CATALOG.map(f => f.category));
      expect(categories.has('sans-serif')).toBe(true);
      expect(categories.has('serif')).toBe(true);
      expect(categories.has('display')).toBe(true);
      expect(categories.has('monospace')).toBe(true);
      expect(categories.has('handwriting')).toBe(true);
    });

    it('should search fonts by name correctly', () => {
      const montserratResults = searchFonts('Montserrat');
      expect(montserratResults.length).toBeGreaterThan(0);
      expect(montserratResults.some(f => f.family === 'Montserrat')).toBe(true);

      const robotoResults = searchFonts('roboto');
      expect(robotoResults.length).toBeGreaterThan(0);
      expect(robotoResults.some(f => f.family === 'Roboto')).toBe(true);
    });

    it('should filter fonts by category correctly', () => {
      const monoFonts = getFontsByCategory('monospace');
      expect(monoFonts.length).toBeGreaterThan(0);
      monoFonts.forEach(f => expect(f.category).toBe('monospace'));
    });

    it('should generate valid Google Fonts CSS import URL with weights', () => {
      const url = getGoogleFontUrl('Montserrat');
      expect(url).toContain('https://fonts.googleapis.com/css2?family=Montserrat:wght@');
      expect(url).toContain('&display=swap');
    });
  });

  describe('Transform & Position System', () => {
    it('should support translateX, translateY, scale, and rotate in NodeStyles', () => {
      const node = createBuilderNode({
        id: 'node_trans',
        type: 'container',
        label: 'Hero Container',
        styles: {
          translateX: 15,
          translateY: -25,
          scale: 105,
          rotate: 3,
        },
      });

      expect(node.styles?.translateX).toBe(15);
      expect(node.styles?.translateY).toBe(-25);
      expect(node.styles?.scale).toBe(105);
      expect(node.styles?.rotate).toBe(3);

      // Verify updating styles
      const updatedStyles = {
        ...node.styles,
        translateX: 30,
        rotate: 45,
      };
      expect(updatedStyles.translateX).toBe(30);
      expect(updatedStyles.translateY).toBe(-25);
      expect(updatedStyles.scale).toBe(105);
      expect(updatedStyles.rotate).toBe(45);
    });
  });

  describe('Section Media & Overlay Controls', () => {
    it('should persist videoSrc, videoAutoplay, videoLoop, videoMuted, overlayColor, and overlayOpacity', () => {
      const section = createSectionNode({
        id: 'sec_media',
        type: 'section',
        label: 'Video Section',
        styles: {
          videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4',
          videoAutoplay: true,
          videoLoop: true,
          videoMuted: true,
          overlayColor: '#000000',
          overlayOpacity: 0.65,
        },
      });

      expect(section.styles?.videoSrc).toContain('mixkit-stars-in-space');
      expect(section.styles?.videoAutoplay).toBe(true);
      expect(section.styles?.videoLoop).toBe(true);
      expect(section.styles?.videoMuted).toBe(true);
      expect(section.styles?.overlayColor).toBe('#000000');
      expect(section.styles?.overlayOpacity).toBe(0.65);
    });
  });
});
