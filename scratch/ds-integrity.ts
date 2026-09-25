import { fullColorPalettes } from '../packages/design-system/src/colors/colorPalettes';
import { fullStylePacks } from '../packages/design-system/src/style-packs';
import { fullDesignCombinations } from '../packages/design-system/src/combinations';
import { industryPresets } from '../packages/design-system/src/industries';
import { fullColorCombinations } from '../packages/design-system/src/color-combinations';
import { fullFontCatalog } from '../packages/design-system/src/fonts/fontLibrary';
import { fullFontPairings } from '../packages/design-system/src/font-pairings/fontPairings';
import { typographySystems } from '../packages/design-system/src/typography/typographySystems';
import { buttonSystems } from '../packages/design-system/src/buttons/buttonSystems';
import { cardSystems } from '../packages/design-system/src/cards/cardSystems';
import { radiusStyles } from '../packages/design-system/src/radius';
import { shadowStyles } from '../packages/design-system/src/shadows';
import { backgroundStyles } from '../packages/design-system/src/backgrounds';
import { spacingStyles } from '../packages/design-system/src/spacing';
import { sectionStyles } from '../packages/design-system/src/sections';
import { heroStyles } from '../packages/design-system/src/hero';
import { imageTreatmentStyles } from '../packages/design-system/src/images';
import { iconStyles } from '../packages/design-system/src/icons';
import { effectStyles } from '../packages/design-system/src/effects';

const ids = (a: Array<{ id: string }>) => new Set(a.map((x) => x.id));
const packIds = ids(fullStylePacks);
const combIds = ids(fullDesignCombinations);
const fonts = ids(fullFontCatalog);
const palettes = ids(fullColorPalettes);
const typo = ids(typographySystems);
const btns = ids(buttonSystems);
const cards = ids(cardSystems);
const rad = ids(radiusStyles);
const sh = ids(shadowStyles);
const bg = ids(backgroundStyles);
const sp = ids(spacingStyles);
const sec = ids(sectionStyles);
const hero = ids(heroStyles);
const img = ids(imageTreatmentStyles);
const ic = ids(iconStyles);
const fx = ids(effectStyles);

const missingPacks = new Set<string>();
const missingCombs = new Set<string>();

for (const p of fullStylePacks) {
  const checks: Array<[string, Set<string>, string]> = [
    ['typography', typo, p.typographyId],
    ['palette', palettes, p.colorPaletteId],
    ['btn', btns, p.buttonSystemId],
    ['card', cards, p.cardSystemId],
    ['radius', rad, p.radiusId],
    ['shadow', sh, p.shadowId],
    ['bg', bg, p.backgroundId],
    ['spacing', sp, p.spacingId],
    ['section', sec, p.sectionStyleId],
    ['hero', hero, p.heroStyleId],
    ['image', img, p.imageTreatmentId],
    ['icon', ic, p.iconStyleId],
    ['effect', fx, p.effectId],
  ];
  for (const [k, set, v] of checks) {
    if (!v || !set.has(v)) missingPacks.add(`${p.id}:${k}:${v}`);
  }
}

for (const c of fullDesignCombinations) {
  const checks: Array<[string, Set<string>, string | undefined]> = [
    ['font', fonts, c.fontId],
    ['palette', palettes, c.colorPaletteId],
    ['btn', btns, c.buttonSystemId],
    ['card', cards, c.cardSystemId],
    ['radius', rad, c.radiusId],
    ['shadow', sh, c.shadowId],
    ['bg', bg, c.backgroundId],
    ['spacing', sp, c.spacingId],
    ['image', img, c.imageStyleId],
    ['typography', typo, c.typographyId],
    ['hero', hero, c.heroStyleId],
    ['section', sec, c.sectionStyleId],
    ['icon', ic, c.iconStyleId],
    ['effect', fx, c.effectId],
  ];
  for (const [k, set, v] of checks) {
    if (!v || !set.has(v)) missingCombs.add(`${c.id}:${k}:${v}`);
  }
}

const dangling = new Set<string>();
const missingRec = new Set<string>();
for (const ind of industryPresets) {
  for (const sid of ind.stylePackIds) if (!packIds.has(sid)) dangling.add(`${ind.id}:${sid}`);
  for (const cid of ind.recommendedCombinations || []) if (!combIds.has(cid)) missingRec.add(`${ind.id}:${cid}`);
}

const byInd: Record<string, string[]> = {};
for (const p of fullStylePacks) (byInd[p.industry] ||= []).push(p.id);
const under = industryPresets
  .filter((i) => (byInd[i.industry] || []).length < 3)
  .map((i) => ({ ind: i.industry, packs: (byInd[i.industry] || []).length }));

// color combination palette refs (fields: bgId/fgId/acId → optional resolved palette ids)
const badColorCombos: string[] = [];
for (const cc of fullColorCombinations as any[]) {
  for (const key of ['backgroundId', 'foregroundId', 'accentId', 'bgId', 'fgId', 'acId'] as const) {
    const v = cc[key];
    if (typeof v === 'string' && !palettes.has(v)) badColorCombos.push(`${cc.id}:${key}:${v}`);
  }
}

const out = {
  fonts: fullFontCatalog.length,
  pairings: fullFontPairings.length,
  palettes: fullColorPalettes.length,
  colorCombos: fullColorCombinations.length,
  packs: fullStylePacks.length,
  combos: fullDesignCombinations.length,
  industries: industryPresets.length,
  uniquePackIds: packIds.size === fullStylePacks.length,
  uniqueCombIds: combIds.size === fullDesignCombinations.length,
  missingPacks: [...missingPacks],
  missingCombs: [...missingCombs],
  danglingStylePacks: [...dangling],
  missingRecommendedCombs: [...missingRec],
  badColorCombos,
  under3Industries: under,
  testedFalse: fullDesignCombinations.filter((c) => !c.tested).length,
  avgScore: Math.round(fullDesignCombinations.reduce((s, c) => s + c.compatibilityScore, 0) / fullDesignCombinations.length),
};

console.log(JSON.stringify(out, null, 2));
