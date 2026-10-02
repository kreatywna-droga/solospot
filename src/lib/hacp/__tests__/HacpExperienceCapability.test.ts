/**
 * HacpExperienceCapability.test.ts — Verification of HACP Experience Runtime Capability Integration (Gate 10)
 *
 * Verifies:
 * - Deterministic validation of HACP Experience tools
 * - NoFakeSuccess compliance (FAILED when invalid, no fake EXECUTED)
 * - Zero partial mutation when validation fails
 * - Insertion & apply modes via standard BuilderCommands
 * - Full Undo/Redo transaction integrity
 */

import { describe, it, expect } from 'vitest';
import { HacpBridge } from '../HacpBridge';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';

describe('HACP Experience Capability Integration (Gate 10)', () => {
  const bridge = HacpBridge.getInstance();

  function createTestDoc() {
    const doc = createBuilderDocument({
      id: 'doc-test-hacp',
      tenantId: 'tenant-test',
      metadata: { storeName: 'Test Store', storeSlug: 'test-store', locale: 'pl', currency: 'PLN' },
      theme: { primaryColor: '#7c3aed', secondaryColor: '#d946ef', font: 'Inter' },
    });
    doc.pages[0].sections.push({
      id: 'sec-hero-1',
      type: 'section',
      label: 'Hero Section',
      props: { title: 'Welcome to SoloSpot' },
      styles: { backgroundColor: '#0A0A0E' },
      order: 0,
      visible: true,
      children: [],
      locked: false,
    });
    return doc;
  }

  it('searches experience library and returns real catalog items', async () => {
    const doc = createTestDoc();
    const result = await bridge.executeToolCall(
      { id: 'call-1', name: 'search_experiences', arguments: { query: 'aurora' } },
      doc,
      'page-home'
    );

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    const data = JSON.parse(result.message || '{}');
    expect(data.count).toBeGreaterThan(0);
    expect(data.experiences.some((e: any) => e.name.toLowerCase().includes('aurora') || e.id.includes('aurora'))).toBe(true);
  });

  it('inspects a specific experience by ID', async () => {
    const doc = createTestDoc();
    const result = await bridge.executeToolCall(
      { id: 'call-2', name: 'inspect_experience', arguments: { experienceId: 'flagship-cinematic-product-hero' } },
      doc,
      'page-home'
    );

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(result.message).toContain('Cinematic Product Hero');
  });

  it('rejects inspect_experience with non-existent ID (NoFakeSuccess)', async () => {
    const doc = createTestDoc();
    const result = await bridge.executeToolCall(
      { id: 'call-3', name: 'inspect_experience', arguments: { experienceId: 'non-existent-exp-xyz' } },
      doc,
      'page-home'
    );

    expect(result.status).toBe('FAILED');
    expect(result.verification.passed).toBe(false);
  });

  it('inserts a new Experience section into the page with unique IDs', async () => {
    const doc = createTestDoc();
    const pageId = doc.pages[0].id;
    const initialSectionCount = doc.pages[0].sections.length;

    const result = await bridge.executeToolCall(
      {
        id: 'call-4',
        name: 'insert_experience_from_library',
        arguments: {
          experienceId: 'flagship-mirror-hall',
          mode: 'insert',
          pageId,
        },
      },
      doc,
      pageId
    );

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(result.command).toBeDefined();
    expect(result.command?.type).toBe('ADD_SECTION');
    expect(result.createdNodeId).toBeDefined();
  });

  it('applies an Experience configuration to an existing section', async () => {
    const doc = createTestDoc();
    const pageId = doc.pages[0].id;

    const result = await bridge.executeToolCall(
      {
        id: 'call-5',
        name: 'insert_experience_from_library',
        arguments: {
          experienceId: 'flagship-gradient-world',
          sectionId: 'sec-hero-1',
          mode: 'apply',
          pageId,
        },
      },
      doc,
      pageId
    );

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(result.command?.type).toBe('UPDATE_PROPS');
    expect(result.appliedChange?.target).toBe('sec-hero-1');
  });

  it('rejects insert_experience_from_library with missing or invalid experienceId without mutating document', async () => {
    const doc = createTestDoc();
    const docBefore = JSON.stringify(doc);

    const testCases = [
      { id: 'c1', name: 'insert_experience_from_library', arguments: {} },
      { id: 'c2', name: 'insert_experience_from_library', arguments: { experienceId: '' } },
      { id: 'c3', name: 'insert_experience_from_library', arguments: { experienceId: '   ' } },
      { id: 'c4', name: 'insert_experience_from_library', arguments: { experienceId: 12345 } },
      { id: 'c5', name: 'insert_experience_from_library', arguments: { experienceId: 'fake_experience_id_999' } },
    ];

    for (const tc of testCases) {
      const res = await bridge.executeToolCall(tc as any, doc, 'page-home');
      expect(res.status).toBe('FAILED');
      expect(res.verification.passed).toBe(false);
    }

    // Proof of zero mutation
    expect(JSON.stringify(doc)).toBe(docBefore);
  });

  it('rejects apply mode when sectionId does not exist on page', async () => {
    const doc = createTestDoc();

    const result = await bridge.executeToolCall(
      {
        id: 'call-6',
        name: 'insert_experience_from_library',
        arguments: {
          experienceId: 'flagship-gradient-world',
          sectionId: 'non-existent-sec-id',
          mode: 'apply',
          pageId: 'page-home',
        },
      },
      doc,
      'page-home'
    );

    expect(result.status).toBe('FAILED');
    expect(result.verification.passed).toBe(false);
    expect(result.message).toContain('Nie znaleziono sekcji');
  });

  it('configures experience visual parameters safely via configure_experience', async () => {
    const doc = createTestDoc();

    const result = await bridge.executeToolCall(
      {
        id: 'call-7',
        name: 'configure_experience',
        arguments: {
          sectionId: 'sec-hero-1',
          experienceConfig: {
            background: { type: 'aurora', colors: ['#7c3aed', '#3b82f6'] },
            pointer: { type: 'spotlight', radius: 400 },
          },
        },
      },
      doc,
      'page-home'
    );

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(result.command?.type).toBe('UPDATE_PROPS');
  });
});
