/**
 * G1-214: Autonomous Capability Deduplication
 *
 * Fingerprints capabilities and detects duplicates based on interface
 * and implementation hashes. Suggests merges for redundant capabilities.
 */

export interface CapabilityFingerprint {
  readonly capabilityId: string;
  readonly interfaceHash: string;
  readonly implementationHash: string;
  readonly publicApiSignature: string;
}

export interface MergeSuggestion {
  readonly sourceIds: string[];
  readonly targetId: string;
  readonly similarityScore: number;
  readonly reason: string;
}

export interface DeduplicationCandidate {
  readonly groupIds: string[];
  readonly similarityScore: number;
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function tokenize(signature: string): string[] {
  return signature
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export class AutonomousCapabilityDeduplicator {
  private fingerprints: Map<string, CapabilityFingerprint> = new Map();

  fingerprintCapability(capability: {
    capabilityId: string;
    interfaceDefinition: string;
    implementation: string;
    publicApiSignature: string;
  }): CapabilityFingerprint {
    const fp: CapabilityFingerprint = {
      capabilityId: capability.capabilityId,
      interfaceHash: simpleHash(capability.interfaceDefinition),
      implementationHash: simpleHash(capability.implementation),
      publicApiSignature: capability.publicApiSignature,
    };
    this.fingerprints.set(fp.capabilityId, fp);
    return fp;
  }

  getFingerprint(capabilityId: string): CapabilityFingerprint | undefined {
    return this.fingerprints.get(capabilityId);
  }

  detectDuplicates(fingerprints: CapabilityFingerprint[]): CapabilityFingerprint[][] {
    const groups: Map<string, CapabilityFingerprint[]> = new Map();
    for (const fp of fingerprints) {
      const key = fp.interfaceHash;
      const group = groups.get(key) ?? [];
      group.push(fp);
      groups.set(key, group);
    }
    return [...groups.values()].filter((g) => g.length > 1);
  }

  calculateSimilarityScore(fp1: CapabilityFingerprint, fp2: CapabilityFingerprint): number {
    let score = 0;
    let total = 0;

    if (fp1.interfaceHash === fp2.interfaceHash) {
      score += 0.5;
    } else {
      const tokens1 = tokenize(fp1.publicApiSignature);
      const tokens2 = tokenize(fp2.publicApiSignature);
      const set1 = new Set(tokens1);
      const set2 = new Set(tokens2);
      const intersection = [...set1].filter((t) => set2.has(t)).length;
      const union = new Set([...set1, ...set2]).size;
      score += union > 0 ? (intersection / union) * 0.5 : 0;
    }
    total += 0.5;

    if (fp1.implementationHash === fp2.implementationHash) {
      score += 0.3;
    }
    total += 0.3;

    const sigTokens1 = tokenize(fp1.publicApiSignature);
    const sigTokens2 = tokenize(fp2.publicApiSignature);
    const sigSet1 = new Set(sigTokens1);
    const sigSet2 = new Set(sigTokens2);
    const sigIntersection = [...sigSet1].filter((t) => sigSet2.has(t)).length;
    const sigUnion = new Set([...sigSet1, ...sigSet2]).size;
    score += sigUnion > 0 ? (sigIntersection / sigUnion) * 0.2 : 0;
    total += 0.2;

    return total > 0 ? score / total : 0;
  }

  getDeduplicationCandidates(
    fingerprints: CapabilityFingerprint[],
    threshold: number = 0.6,
  ): DeduplicationCandidate[] {
    const candidates: DeduplicationCandidate[] = [];
    for (let i = 0; i < fingerprints.length; i++) {
      for (let j = i + 1; j < fingerprints.length; j++) {
        const sim = this.calculateSimilarityScore(fingerprints[i], fingerprints[j]);
        if (sim >= threshold) {
          candidates.push({
            groupIds: [fingerprints[i].capabilityId, fingerprints[j].capabilityId],
            similarityScore: sim,
          });
        }
      }
    }
    return candidates.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  suggestMerge(capabilities: CapabilityFingerprint[]): MergeSuggestion[] {
    const duplicates = this.detectDuplicates(capabilities);
    const suggestions: MergeSuggestion[] = [];

    for (const group of duplicates) {
      if (group.length < 2) continue;
      const target = group[0];
      const sources = group.slice(1);
      const sim = this.calculateSimilarityScore(target, sources[0]);
      suggestions.push({
        sourceIds: sources.map((s) => s.capabilityId),
        targetId: target.capabilityId,
        similarityScore: sim,
        reason: `Interface hash match: ${target.interfaceHash}`,
      });
    }

    return suggestions;
  }

  generateDeduplicationReport(): {
    totalFingerprints: number;
    duplicateGroups: number;
    candidates: DeduplicationCandidate[];
    suggestions: MergeSuggestion[];
  } {
    const all = [...this.fingerprints.values()];
    const duplicates = this.detectDuplicates(all);
    const candidates = this.getDeduplicationCandidates(all);
    const suggestions = this.suggestMerge(all);

    return {
      totalFingerprints: all.length,
      duplicateGroups: duplicates.length,
      candidates,
      suggestions,
    };
  }
}
