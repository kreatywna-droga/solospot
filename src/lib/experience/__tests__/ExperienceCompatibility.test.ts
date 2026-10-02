/**
 * ExperienceCompatibility.test.ts — Comprehensive Test Suite for Experience Domain Contract & Validation
 */

import { describe, it, expect } from 'vitest';
import {
  validateExperienceItem,
  validateSerializedExperience,
  hydrateExperienceItem,
  checkExperienceCapabilities,
  normalizeExperienceVersion,
} from '../ExperienceCompatibility';
import { createSectionNode } from '../../../../packages/builder-core/src/BuilderDocument';
import type { ExperienceItem } from '../ExperienceTypes';

describe('Experience Domain Contract & Compatibility (Gate 3)', () => {
  const validNode = createSectionNode({
    id: 'sec-test-1',
    type: 'section',
    label: 'Hero Test Section',
    styles: { backgroundColor: '#111827' },
  });

  const validItem: ExperienceItem = {
    id: 'exp-aurora-test',
    name: 'Aurora Test',
    type: 'background',
    category: 'aurora',
    description: 'A test aurora experience',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'dark',
    motionLevel: 'animated',
    tags: ['aurora', 'shader'],
    createNode: () => validNode,
  };

  it('validates a correct in-memory ExperienceItem', () => {
    expect(validateExperienceItem(validItem)).toBe(true);
  });

  it('validates an in-memory ExperienceItem with serialized nodes array instead of createNode', () => {
    const itemWithoutFactory = {
      id: 'exp-nodes-test',
      name: 'Nodes Test',
      type: 'hero' as const,
      category: 'hero',
      description: 'Hero with nodes',
      source: 'user' as const,
      schemaVersion: '2.0.0',
      contentVersion: '2.0.0',
      tags: ['hero'],
      nodes: [validNode],
    };
    expect(validateExperienceItem(itemWithoutFactory)).toBe(true);
  });

  it('rejects invalid or corrupted in-memory items', () => {
    expect(validateExperienceItem(null)).toBe(false);
    expect(validateExperienceItem({})).toBe(false);
    expect(validateExperienceItem({ id: 123 as any })).toBe(false);
    expect(validateExperienceItem({ id: '123', name: 'Test', type: 'invalid-type', category: 'cat' })).toBe(false);
    expect(validateExperienceItem({ id: '123', name: 'Test', type: 'hero', category: 'cat' })).toBe(false); // no node or factory
    expect(validateExperienceItem({ ...validItem, mood: 12345 as any })).toBe(false);
    expect(validateExperienceItem({ ...validItem, motionLevel: { bad: true } as any })).toBe(false);
  });

  it('validates and sanitizes a valid serialized JSON payload', () => {
    const serialized = {
      id: 'usr-exp-100',
      name: 'My Saved Hero',
      type: 'hero',
      category: 'my-experiences',
      description: 'Custom user hero',
      schemaVersion: '2.0.0',
      contentVersion: '2.0.0',
      mood: 'cinematic',
      motionLevel: 'scroll',
      tags: ['hero', 'custom'],
      savedNode: validNode,
    };

    const res = validateSerializedExperience(serialized);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.sanitized?.id).toBe('usr-exp-100');
    expect(res.sanitized?.mood).toBe('cinematic');
  });

  it('rejects malformed serialized payloads without throwing', () => {
    expect(validateSerializedExperience(null).valid).toBe(false);
    expect(validateSerializedExperience([]).valid).toBe(false);
    expect(validateSerializedExperience({ id: '', name: 'Hero', type: 'hero', category: 'hero' }).valid).toBe(false);
    expect(validateSerializedExperience({ id: '1', name: '', type: 'hero', category: 'hero' }).valid).toBe(false);
    expect(validateSerializedExperience({ id: '1', name: 'H', type: 'unknown_type', category: 'hero' }).valid).toBe(false);
    expect(validateSerializedExperience({ id: '1', name: 'H', type: 'hero', category: '' }).valid).toBe(false);
    // Missing node data
    const res = validateSerializedExperience({ id: '1', name: 'H', type: 'hero', category: 'hero' });
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('node tree');
  });

  it('hydrates a serialized experience safely into an executable in-memory item with cloned unique IDs', () => {
    const serialized = {
      id: 'usr-exp-101',
      name: 'Hydration Test Hero',
      type: 'hero' as const,
      category: 'hero',
      description: 'Hydrated hero',
      schemaVersion: '2.0.0',
      contentVersion: '2.0.0',
      tags: ['hero'],
      savedNode: validNode,
    };

    const hydrated = hydrateExperienceItem(serialized);
    expect(hydrated.id).toBe('usr-exp-101');
    expect(typeof hydrated.createNode).toBe('function');

    const node1 = hydrated.createNode();
    const node2 = hydrated.createNode();
    expect(node1.id).not.toBe(node2.id); // Fresh unique cloned IDs
    expect(node1.label).toContain(validNode.label);
  });

  it('checks experience capabilities and provides graceful degradation warnings', () => {
    const itemWithAdvancedCapabilities: ExperienceItem = {
      ...validItem,
      capabilities: {
        backgroundVideo: true,
        scrollAnimation: true,
        perspective3d: true,
      },
    };

    // All supported
    const check1 = checkExperienceCapabilities(itemWithAdvancedCapabilities, {
      backgroundVideo: true,
      scrollAnimation: true,
      perspective3d: true,
    });
    expect(check1.compatible).toBe(true);
    expect(check1.missingCapabilities).toHaveLength(0);

    // Unsupported platform (e.g. mobile without video or 3d)
    const check2 = checkExperienceCapabilities(itemWithAdvancedCapabilities, {
      backgroundVideo: false,
      scrollAnimation: true,
      perspective3d: false,
    });
    expect(check2.compatible).toBe(false);
    expect(check2.missingCapabilities).toContain('backgroundVideo');
    expect(check2.missingCapabilities).toContain('perspective3d');
    expect(check2.warnings.length).toBe(2);
  });

  it('normalizes experience versions and default fields', () => {
    const raw = {
      ...validItem,
      schemaVersion: undefined as any,
      contentVersion: undefined as any,
      tags: null as any,
      industry: null as any,
    };

    const normalized = normalizeExperienceVersion(raw);
    expect(normalized.schemaVersion).toBe('2.0.0');
    expect(normalized.contentVersion).toBe('2.0.0');
    expect(Array.isArray(normalized.tags)).toBe(true);
    expect(normalized.industry).toEqual(['general']);
  });
});
