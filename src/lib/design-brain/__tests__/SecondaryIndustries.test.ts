/**
 * Design Brain Master Gate — secondary industries + anti-generic/cross-page
 * Vitest entry so TS modules resolve without tsx.
 */
import { describe, expect, it } from 'vitest';
import { runDesignBrain, summarizeDesignBrain } from '../index';

const CASES = [
  { id: 'dental', brief: 'Zbuduj nowoczesną, premium stronę dla kliniki dentystycznej.' },
  { id: 'saas', brief: 'Zbuduj stronę SaaS do zarządzania projektami dla zespołów produkcyjnych.' },
  { id: 'architecture', brief: 'Zbuduj portfolio pracowni architektonicznej z realizacjami.' },
  { id: 'restaurant', brief: 'Zbuduj stronę restauracji fine dining z menu i rezerwacją.' },
  { id: 'hotel', brief: 'Zbuduj stronę hotelu boutique z pokojami i rezerwacją online.' },
  { id: 'agency', brief: 'Zbuduj stronę agencji marketingowej z case studies i leadem.' },
  { id: 'realestate', brief: 'Zbuduj stronę biura nieruchomości z ofertami i kontaktem.' },
  { id: 'professional', brief: 'Zbuduj stronę kancelarii prawnej dla klientów biznesowych.' },
];

describe('DesignBrain secondary industries master gate', () => {
  it('runs 8 industries without FAILED status', async () => {
    const styles = new Set<string>();
    const blueprints = new Set<string>();
    let antiGenericPass = 0;
    let crossPagePass = 0;
    let ok = 0;

    for (const c of CASES) {
      const brain = await runDesignBrain(c.brief, { projectId: `secondary-${c.id}` });
      expect(brain.status).not.toBe('FAILED');
      if (brain.status !== 'FAILED') ok++;
      styles.add(brain.direction.visualStyle);
      blueprints.add(brain.knowledge?.blueprint?.id ?? 'none');
      if (brain.qa.antiGeneric !== 'BLOCKED') antiGenericPass++;
      if (brain.architecture.pages.length >= 1 && brain.sitePlan.sections.length >= 3) crossPagePass++;
      const summary = summarizeDesignBrain(brain);
      expect(summary).toContain('[DesignBrain]');
    }

    console.log('styles', [...styles].join(','), 'blueprints', [...blueprints].join(','));
    expect(ok).toBe(8);
    expect(styles.size).toBeGreaterThanOrEqual(5);
    expect(blueprints.size).toBeGreaterThanOrEqual(5);
    expect(antiGenericPass).toBeGreaterThanOrEqual(7);
    expect(crossPagePass).toBeGreaterThanOrEqual(7);
  }, 120000);
});
