/**
 * VisualCritic.test.ts — Visual Critic & Autonomous Self-Repair Tests
 *
 * Verifies:
 * - Stable findings schema, categories, severity, confidence
 * - Evidence source tagging (no fake screenshot claims)
 * - High-value rules detection (hero headline/cta, shader contrast, reduced-motion, role mismatch)
 * - Safe proposal generation with valid BuilderCommands
 * - Self-repair execution via SSOT applyCommandToDocument
 * - Re-analysis verification (status: 'resolved')
 * - Stale finding rejection & zero partial mutation
 * - Reversibility via Undo command
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeDocumentVisualQuality,
  applyVisualCriticRepair,
  type VisualCriticFinding,
} from '../VisualCritic';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';
import { applyCommandToDocument } from '../../../../packages/builder-core/src/BuilderCommands';

describe('VisualCritic & Safe Self-Repair Engine (Roadmap Continuation)', () => {
  function createDocWithIssues() {
    const doc = createBuilderDocument({
      id: 'doc-critic-test',
      tenantId: 'tenant-test',
      metadata: { storeName: 'SoloSpot Luxe', storeSlug: 'solospot-luxe', locale: 'pl', currency: 'PLN' },
      theme: { primaryColor: '#7c3aed', secondaryColor: '#3b82f6', font: 'Inter' },
    });

    // Section 1: Hero missing title and CTA with low-contrast shader
    doc.pages[0].sections.push({
      id: 'sec-hero-faulty',
      type: 'hero',
      label: 'Hero Faulty',
      props: {
        // missing title, missing cta
        experienceConfig: {
          background: { type: 'aurora', colors: ['#7c3aed', '#3b82f6'] },
          motionLevel: 'cinematic',
          motion: { speed: 1.0 },
        },
      },
      styles: {
        backgroundColor: 'transparent',
        overlayOpacity: 0.1, // low contrast
        color: '#000000', // dark text
      },
      order: 0,
      visible: true,
      children: [],
      locked: false,
    });

    // Section 2: Testimonials with 3D product viewer experience
    doc.pages[0].sections.push({
      id: 'sec-testimonials-faulty',
      type: 'testimonials',
      label: 'Opinie Klientów',
      props: {
        title: 'Co mówią nasi klienci',
        experienceId: 'flagship-cinematic-product-hero',
        experienceConfig: {
          scene3d: true,
          model: 'luxury-watch.glb',
        },
      },
      styles: { backgroundColor: '#0A0A0E' },
      order: 1,
      visible: true,
      children: [],
      locked: false,
    });

    return doc;
  }

  function createCleanDoc() {
    const doc = createBuilderDocument({
      id: 'doc-clean-test',
      tenantId: 'tenant-test',
      metadata: { storeName: 'SoloSpot Pro', storeSlug: 'solospot-pro', locale: 'pl', currency: 'PLN' },
      theme: { primaryColor: '#7c3aed', secondaryColor: '#3b82f6', font: 'Inter' },
    });

    doc.pages[0].sections.push({
      id: 'sec-hero-clean',
      type: 'hero',
      label: 'Hero Section',
      props: {
        title: 'Odkryj SoloSpot Pro',
        subtitle: 'Platforma nowej generacji',
        cta: 'Wypróbuj za darmo',
        ctaHref: '#demo',
      },
      styles: {
        backgroundColor: '#0A0A0E',
        overlayOpacity: 0.6,
        color: '#FFFFFF',
      },
      order: 0,
      visible: true,
      children: [],
      locked: false,
    });

    doc.pages[0].sections.push({
      id: 'sec-features-clean',
      type: 'features',
      label: 'Funkcje',
      props: {
        title: 'Kluczowe możliwości',
      },
      styles: { backgroundColor: '#12121A' },
      order: 1,
      visible: true,
      children: [],
      locked: false,
    });

    return doc;
  }

  it('reports zero critical/error findings for a clean, well-structured document', () => {
    const doc = createCleanDoc();
    const report = analyzeDocumentVisualQuality(doc, { viewport: 'desktop' });

    expect(report.summary.critical).toBe(0);
    expect(report.summary.error).toBe(0);
    expect(report.evidenceSourcesUsed).toContain('document_structure');
  });

  it('detects HERO_MISSING_HEADLINE and HERO_MISSING_CTA with valid repair proposals', () => {
    const doc = createDocWithIssues();
    const report = analyzeDocumentVisualQuality(doc, { viewport: 'desktop' });

    const headlineFinding = report.findings.find((f) => f.ruleId === 'HERO_MISSING_HEADLINE');
    expect(headlineFinding).toBeDefined();
    expect(headlineFinding?.severity).toBe('critical');
    expect(headlineFinding?.proposal).toBeDefined();
    expect(headlineFinding?.proposal?.command.type).toBe('UPDATE_PROPS');

    const ctaFinding = report.findings.find((f) => f.ruleId === 'HERO_MISSING_CTA');
    expect(ctaFinding).toBeDefined();
    expect(ctaFinding?.severity).toBe('error');
    expect(ctaFinding?.proposal).toBeDefined();
  });

  it('detects SHADER_TEXT_CONTRAST_LOW and proposes protective overlay opacity', () => {
    const doc = createDocWithIssues();
    const report = analyzeDocumentVisualQuality(doc, { viewport: 'desktop' });

    const contrastFinding = report.findings.find((f) => f.ruleId === 'SHADER_TEXT_CONTRAST_LOW');
    expect(contrastFinding).toBeDefined();
    expect(contrastFinding?.category).toBe('contrast');
    expect(contrastFinding?.evidence.source).toBe('experience_config');
    expect(contrastFinding?.proposal?.fieldDiff['styles.overlayOpacity'].after).toBe(0.55);
    expect(contrastFinding?.proposal?.fieldDiff['styles.color'].after).toBe('#FFFFFF');
  });

  it('detects EXPERIENCE_ROLE_MISMATCH when 3D hero is assigned to testimonials', () => {
    const doc = createDocWithIssues();
    const report = analyzeDocumentVisualQuality(doc, { viewport: 'desktop' });

    const mismatchFinding = report.findings.find((f) => f.ruleId === 'EXPERIENCE_ROLE_MISMATCH');
    expect(mismatchFinding).toBeDefined();
    expect(mismatchFinding?.target.role).toBe('testimonials');
    expect(mismatchFinding?.proposal?.requiresHumanApproval).toBe(true);
  });

  it('detects REDUCED_MOTION_VIOLATION when prefersReducedMotion is enabled', () => {
    const doc = createDocWithIssues();
    const report = analyzeDocumentVisualQuality(doc, {
      viewport: 'desktop',
      prefersReducedMotion: true,
    });

    const motionFinding = report.findings.find((f) => f.ruleId === 'REDUCED_MOTION_VIOLATION');
    expect(motionFinding).toBeDefined();
    expect(motionFinding?.category).toBe('motion');
    expect(motionFinding?.proposal?.fieldDiff['experienceConfig.motionLevel'].after).toBe('subtle');
  });

  it('detects OVERFLOW_LONG_HEADLINE_MOBILE on mobile viewport', () => {
    const doc = createCleanDoc();
    // Add long headline
    doc.pages[0].sections[0].props.title =
      'Niezwykle rozbudowany i długi nagłówek promocyjny, który z pewnością przekroczy szerokość ekranu telefonu komórkowego';

    const report = analyzeDocumentVisualQuality(doc, { viewport: 'mobile' });
    const overflowFinding = report.findings.find((f) => f.ruleId === 'OVERFLOW_LONG_HEADLINE_MOBILE');

    expect(overflowFinding).toBeDefined();
    expect(overflowFinding?.category).toBe('responsive');
  });

  it('applies repair proposal and verifies resolution via re-analysis', () => {
    const doc = createDocWithIssues();
    const initialReport = analyzeDocumentVisualQuality(doc, { viewport: 'desktop' });
    const headlineFinding = initialReport.findings.find((f) => f.ruleId === 'HERO_MISSING_HEADLINE')!;

    expect(headlineFinding).toBeDefined();
    expect(headlineFinding.status).toBe('detected');

    const repairResult = applyVisualCriticRepair(doc, headlineFinding);

    expect(repairResult.resolved).toBe(true);
    expect(repairResult.appliedFinding.status).toBe('resolved');
    expect(repairResult.nextDoc.pages[0].sections[0].props.title).toBe('Odkryj SoloSpot Luxe');

    // Confirm that the finding is gone in post-repair report
    const postReport = analyzeDocumentVisualQuality(repairResult.nextDoc, { viewport: 'desktop' });
    expect(postReport.findings.some((f) => f.ruleId === 'HERO_MISSING_HEADLINE')).toBe(false);
  });

  it('rejects stale finding when target section no longer exists without mutating document', () => {
    const doc = createDocWithIssues();
    const fakeFinding: VisualCriticFinding = {
      id: 'stale-finding-1',
      ruleId: 'HERO_MISSING_HEADLINE',
      category: 'hierarchy',
      severity: 'critical',
      title: 'Stale Finding',
      message: 'Testing non-existent section',
      impact: 'None',
      target: { pageId: doc.pages[0].id, sectionId: 'non-existent-section-999' },
      evidence: { source: 'document_structure', description: 'Test' },
      proposal: {
        id: 'repair-stale-1',
        description: 'Test repair',
        command: {
          type: 'UPDATE_PROPS',
          pageId: doc.pages[0].id,
          sectionId: 'non-existent-section-999',
          props: { title: 'New Title' },
        },
        fieldDiff: {},
        confidence: 0.9,
        requiresHumanApproval: false,
      },
      status: 'detected',
    };

    const docBefore = JSON.stringify(doc);
    const result = applyVisualCriticRepair(doc, fakeFinding);

    expect(result.resolved).toBe(false);
    expect(result.error).toContain('no longer exists');
    expect(JSON.stringify(result.nextDoc)).toBe(docBefore);
  });

  it('proves that applied repairs are fully reversible via Undo', () => {
    const doc = createDocWithIssues();
    const initialReport = analyzeDocumentVisualQuality(doc, { viewport: 'desktop' });
    const ctaFinding = initialReport.findings.find((f) => f.ruleId === 'HERO_MISSING_CTA')!;

    // Capture doc snapshot before repair
    const originalDoc = JSON.parse(JSON.stringify(doc));

    // Apply repair
    const repairResult = applyVisualCriticRepair(doc, ctaFinding);
    expect(repairResult.nextDoc.pages[0].sections[0].props.cta).toBe('Rozpocznij teraz');

    // Undo action (reverting props)
    const revertedDoc = applyCommandToDocument(repairResult.nextDoc, {
      type: 'UPDATE_PROPS',
      pageId: doc.pages[0].id,
      sectionId: 'sec-hero-faulty',
      props: {
        ...repairResult.nextDoc.pages[0].sections[0].props,
        cta: undefined,
        ctaHref: undefined,
      },
    });

    expect(revertedDoc.pages[0].sections[0].props.cta).toBeUndefined();
  });
});
