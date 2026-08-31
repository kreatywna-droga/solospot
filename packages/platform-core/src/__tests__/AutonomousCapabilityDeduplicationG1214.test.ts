/**
 * G1-214: Autonomous Capability Deduplication — Test Suite
 *
 * Covers fingerprinting, duplicate detection, similarity scoring,
 * merge suggestions, and reporting.
 */

import { describe, it, expect } from 'vitest';
import {
  AutonomousCapabilityDeduplicator,
  CapabilityFingerprint,
} from '../AutonomousCapabilityDeduplication';

describe('AutonomousCapabilityDeduplicator', () => {
  const makeCap = (id: string, iface: string = 'interface', impl: string = 'impl', api: string = 'api') => ({
    capabilityId: id,
    interfaceDefinition: iface,
    implementation: impl,
    publicApiSignature: api,
  });

  it('1: creates a deduplicator instance', () => {
    const d = new AutonomousCapabilityDeduplicator();
    expect(d).toBeDefined();
  });

  it('2: fingerprintCapability returns a CapabilityFingerprint', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fp = d.fingerprintCapability(makeCap('c1'));
    expect(fp.capabilityId).toBe('c1');
    expect(fp).toHaveProperty('interfaceHash');
    expect(fp).toHaveProperty('implementationHash');
    expect(fp).toHaveProperty('publicApiSignature');
  });

  it('3: fingerprintCapability stores the fingerprint', () => {
    const d = new AutonomousCapabilityDeduplicator();
    d.fingerprintCapability(makeCap('c1'));
    expect(d.getFingerprint('c1')).toBeDefined();
  });

  it('4: getFingerprint returns undefined for unknown id', () => {
    const d = new AutonomousCapabilityDeduplicator();
    expect(d.getFingerprint('unknown')).toBeUndefined();
  });

  it('5: same interface produces same interfaceHash', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fp1 = d.fingerprintCapability(makeCap('c1', 'same'));
    const fp2 = d.fingerprintCapability(makeCap('c2', 'same'));
    expect(fp1.interfaceHash).toBe(fp2.interfaceHash);
  });

  it('6: different interface produces different interfaceHash', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fp1 = d.fingerprintCapability(makeCap('c1', 'ifaceA'));
    const fp2 = d.fingerprintCapability(makeCap('c2', 'ifaceB'));
    expect(fp1.interfaceHash).not.toBe(fp2.interfaceHash);
  });

  it('7: same implementation produces same implementationHash', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fp1 = d.fingerprintCapability(makeCap('c1', 'i', 'same'));
    const fp2 = d.fingerprintCapability(makeCap('c2', 'i', 'same'));
    expect(fp1.implementationHash).toBe(fp2.implementationHash);
  });

  it('8: detectDuplicates finds capabilities with same interfaceHash', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fps = [
      d.fingerprintCapability(makeCap('c1', 'same')),
      d.fingerprintCapability(makeCap('c2', 'same')),
      d.fingerprintCapability(makeCap('c3', 'different')),
    ];
    const groups = d.detectDuplicates(fps);
    expect(groups.length).toBeGreaterThanOrEqual(1);
    const sameGroup = groups.find((g) => g.some((f) => f.capabilityId === 'c1'));
    expect(sameGroup).toBeDefined();
    expect(sameGroup!.length).toBe(2);
  });

  it('9: detectDuplicates returns empty for no duplicates', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fps = [
      d.fingerprintCapability(makeCap('c1', 'a')),
      d.fingerprintCapability(makeCap('c2', 'b')),
      d.fingerprintCapability(makeCap('c3', 'c')),
    ];
    const groups = d.detectDuplicates(fps);
    expect(groups).toHaveLength(0);
  });

  it('10: calculateSimilarityScore returns 1 for identical fingerprints', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fp1 = d.fingerprintCapability(makeCap('c1', 'iface', 'impl', 'api sig'));
    const fp2 = d.fingerprintCapability(makeCap('c2', 'iface', 'impl', 'api sig'));
    const score = d.calculateSimilarityScore(fp1, fp2);
    expect(score).toBeCloseTo(1, 1);
  });

  it('11: calculateSimilarityScore returns 0 for completely different', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fp1 = d.fingerprintCapability(makeCap('c1', 'aaa', 'bbb', 'ccc'));
    const fp2 = d.fingerprintCapability(makeCap('c2', 'xxx', 'yyy', 'zzz'));
    const score = d.calculateSimilarityScore(fp1, fp2);
    expect(score).toBeLessThan(0.5);
  });

  it('12: calculateSimilarityScore returns number between 0 and 1', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fp1 = d.fingerprintCapability(makeCap('c1', 'iface', 'impl', 'api'));
    const fp2 = d.fingerprintCapability(makeCap('c2', 'iface2', 'impl2', 'api2'));
    const score = d.calculateSimilarityScore(fp1, fp2);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('13: getDeduplicationCandidates returns candidates above threshold', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fps = [
      d.fingerprintCapability(makeCap('c1', 'same', 'same', 'same api')),
      d.fingerprintCapability(makeCap('c2', 'same', 'same', 'same api')),
    ];
    const candidates = d.getDeduplicationCandidates(fps, 0.5);
    expect(candidates.length).toBeGreaterThanOrEqual(1);
  });

  it('14: getDeduplicationCandidates filters below threshold', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fps = [
      d.fingerprintCapability(makeCap('c1', 'aaa', 'bbb', 'ccc')),
      d.fingerprintCapability(makeCap('c2', 'xxx', 'yyy', 'zzz')),
    ];
    const candidates = d.getDeduplicationCandidates(fps, 0.9);
    expect(candidates).toHaveLength(0);
  });

  it('15: getDeduplicationCandidates returns sorted by similarity descending', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fps = [
      d.fingerprintCapability(makeCap('c1', 'iface', 'impl', 'api')),
      d.fingerprintCapability(makeCap('c2', 'iface', 'diff', 'api')),
      d.fingerprintCapability(makeCap('c3', 'iface', 'impl', 'api')),
    ];
    const candidates = d.getDeduplicationCandidates(fps, 0);
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i - 1].similarityScore).toBeGreaterThanOrEqual(
        candidates[i].similarityScore,
      );
    }
  });

  it('16: suggestMerge returns suggestions for duplicate groups', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fps = [
      d.fingerprintCapability(makeCap('c1', 'same', 'same', 'api')),
      d.fingerprintCapability(makeCap('c2', 'same', 'same', 'api')),
    ];
    const suggestions = d.suggestMerge(fps);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(suggestions[0].sourceIds).toContain('c2');
    expect(suggestions[0].targetId).toBe('c1');
  });

  it('17: suggestMerge returns empty for no duplicates', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fps = [
      d.fingerprintCapability(makeCap('c1', 'a')),
      d.fingerprintCapability(makeCap('c2', 'b')),
    ];
    const suggestions = d.suggestMerge(fps);
    expect(suggestions).toHaveLength(0);
  });

  it('18: suggestMerge includes reason', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fps = [
      d.fingerprintCapability(makeCap('c1', 'same', 'same', 'api')),
      d.fingerprintCapability(makeCap('c2', 'same', 'same', 'api')),
    ];
    const suggestions = d.suggestMerge(fps);
    expect(suggestions[0].reason).toContain('Interface hash match');
  });

  it('19: generateDeduplicationReport includes total fingerprints', () => {
    const d = new AutonomousCapabilityDeduplicator();
    d.fingerprintCapability(makeCap('c1'));
    d.fingerprintCapability(makeCap('c2'));
    const report = d.generateDeduplicationReport();
    expect(report.totalFingerprints).toBe(2);
  });

  it('20: generateDeduplicationReport includes duplicate groups count', () => {
    const d = new AutonomousCapabilityDeduplicator();
    d.fingerprintCapability(makeCap('c1', 'same'));
    d.fingerprintCapability(makeCap('c2', 'same'));
    const report = d.generateDeduplicationReport();
    expect(report.duplicateGroups).toBeGreaterThanOrEqual(1);
  });

  it('21: generateDeduplicationReport includes candidates', () => {
    const d = new AutonomousCapabilityDeduplicator();
    d.fingerprintCapability(makeCap('c1', 'same', 'same', 'api'));
    d.fingerprintCapability(makeCap('c2', 'same', 'same', 'api'));
    const report = d.generateDeduplicationReport();
    expect(report.candidates.length).toBeGreaterThanOrEqual(1);
  });

  it('22: generateDeduplicationReport includes suggestions', () => {
    const d = new AutonomousCapabilityDeduplicator();
    d.fingerprintCapability(makeCap('c1', 'same', 'same', 'api'));
    d.fingerprintCapability(makeCap('c2', 'same', 'same', 'api'));
    const report = d.generateDeduplicationReport();
    expect(report.suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it('23: generateDeduplicationReport with no duplicates', () => {
    const d = new AutonomousCapabilityDeduplicator();
    d.fingerprintCapability(makeCap('c1', 'a'));
    d.fingerprintCapability(makeCap('c2', 'b'));
    const report = d.generateDeduplicationReport();
    expect(report.duplicateGroups).toBe(0);
    expect(report.suggestions).toHaveLength(0);
  });

  it('24: fingerprintCapability stores publicApiSignature', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fp = d.fingerprintCapability(makeCap('c1', 'i', 'impl', 'myApi'));
    expect(fp.publicApiSignature).toBe('myApi');
  });

  it('25: getDeduplicationCandidates with empty array returns empty', () => {
    const d = new AutonomousCapabilityDeduplicator();
    expect(d.getDeduplicationCandidates([])).toHaveLength(0);
  });

  it('26: detectDuplicates with single fingerprint returns empty', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fps = [d.fingerprintCapability(makeCap('c1'))];
    expect(d.detectDuplicates(fps)).toHaveLength(0);
  });

  it('27: calculateSimilarityScore is symmetric', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fp1 = d.fingerprintCapability(makeCap('c1', 'iface', 'impl', 'api'));
    const fp2 = d.fingerprintCapability(makeCap('c2', 'iface2', 'impl2', 'api2'));
    const s1 = d.calculateSimilarityScore(fp1, fp2);
    const s2 = d.calculateSimilarityScore(fp2, fp1);
    expect(s1).toBeCloseTo(s2, 5);
  });

  it('28: multiple duplicate groups detected', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fps = [
      d.fingerprintCapability(makeCap('c1', 'groupA')),
      d.fingerprintCapability(makeCap('c2', 'groupA')),
      d.fingerprintCapability(makeCap('c3', 'groupB')),
      d.fingerprintCapability(makeCap('c4', 'groupB')),
    ];
    const groups = d.detectDuplicates(fps);
    expect(groups.length).toBe(2);
  });

  it('29: generateDeduplicationReport with empty deduplicator', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const report = d.generateDeduplicationReport();
    expect(report.totalFingerprints).toBe(0);
    expect(report.duplicateGroups).toBe(0);
    expect(report.candidates).toHaveLength(0);
    expect(report.suggestions).toHaveLength(0);
  });

  it('30: similarity score with partial api overlap', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fp1 = d.fingerprintCapability(makeCap('c1', 'iface', 'impl', 'foo bar baz'));
    const fp2 = d.fingerprintCapability(makeCap('c2', 'iface', 'impl', 'foo bar qux'));
    const score = d.calculateSimilarityScore(fp1, fp2);
    expect(score).toBeGreaterThan(0.5);
  });

  it('31: similarity score of fingerprint with itself is 1', () => {
    const d = new AutonomousCapabilityDeduplicator();
    const fp = d.fingerprintCapability(makeCap('c1', 'iface', 'impl', 'api'));
    expect(d.calculateSimilarityScore(fp, fp)).toBeCloseTo(1, 1);
  });
});
