import { describe, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DesignSystem } from '../packages/design-system/src/index';

describe('dataset truths', () => {
  it('counts + duplicate keys', () => {
    const lines: string[] = [];
    const log = (s: string) => { lines.push(s); console.log(s); };
    const fonts: any[] = DesignSystem.fonts as any[];
    const ids = fonts.map((f) => f.id);
    const seen = new Map<string, number>();
    for (const id of ids) seen.set(id, (seen.get(id) || 0) + 1);
    const dupes = [...seen.entries()].filter(([, c]) => c > 1);
    log('fonts total: ' + fonts.length + ' unique: ' + seen.size + ' dupes: ' + JSON.stringify(dupes));
    log('colors total: ' + (DesignSystem.colorPalettes as any[]).length);
    log('industry total: ' + (DesignSystem.industryPresets as any[]).length);
    log('stylePacks total: ' + (DesignSystem.stylePacks as any[]).length);
    log('typography total: ' + (DesignSystem.typographySystems as any[]).length);
    log('buttons total: ' + (DesignSystem.buttonSystems as any[]).length);
    log('cards total: ' + (DesignSystem.cardSystems as any[]).length);
    log('backgrounds total: ' + (DesignSystem.backgroundStyles as any[]).length);
    for (const [name, list] of Object.entries({
      fonts,
      colors: DesignSystem.colorPalettes as any[],
      industries: DesignSystem.industryPresets as any[],
      packs: DesignSystem.stylePacks as any[],
      typo: DesignSystem.typographySystems as any[],
      buttons: DesignSystem.buttonSystems as any[],
      cards: DesignSystem.cardSystems as any[],
      backgrounds: DesignSystem.backgroundStyles as any[],
    })) {
      const s = new Set<string>();
      const d: string[] = [];
      for (const it of list) {
        if (s.has(it.id)) d.push(it.id);
        s.add(it.id);
      }
      log(`${name}: len=${list.length} unique=${s.size} dupIds=[${d.join(',')}]`);
    }
    fs.writeFileSync(path.join(__dirname, 'ds-counts.json'), lines.join('\n'));
  });
});
