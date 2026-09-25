import { readFileSync, writeFileSync } from 'fs';

function insertBefore(src: string, endMarker: string, insert: string, label: string): string {
  let idx = src.indexOf(endMarker);
  if (idx < 0) {
    const alt = endMarker.replace(/\n/g, '\r\n');
    idx = src.indexOf(alt);
    if (idx < 0) throw new Error(`marker not found: ${label}`);
    return src.slice(0, idx) + insert + src.slice(idx);
  }
  return src.slice(0, idx) + insert + src.slice(idx);
}

// 1) fonts
{
  const append = readFileSync('scratch/generated/fonts-append.ts', 'utf8');
  const path = 'packages/design-system/src/fonts/fontLibrary.ts';
  let src = readFileSync(path, 'utf8');
  if (!src.includes("createFont('Public-Sans'")) {
    src = insertBefore(src, '];\n\n// Final combined catalog', append + '\n', 'fonts end');
    writeFileSync(path, src);
    console.log('fonts applied');
  } else console.log('fonts already present');
}

// 2) palettes (idempotent)
{
  const append = readFileSync('scratch/generated/palettes-append.ts', 'utf8');
  const path = 'packages/design-system/src/colors/colorPalettes.ts';
  let src = readFileSync(path, 'utf8');
  if (!src.includes('editorial-signal')) {
    src = insertBefore(src, '];\n\nexport const fullColorPalettes', '\n' + append, 'palettes end');
    writeFileSync(path, src);
    console.log('palettes applied');
  } else console.log('palettes already present');
}

// 3) style packs
{
  const packs = JSON.parse(readFileSync('scratch/generated/packs.json', 'utf8'));
  const path = 'packages/design-system/src/style-packs/index.ts';
  let src = readFileSync(path, 'utf8');
  if (!src.includes('sp-dental-1')) {
    const lines = packs
      .map((p: any) => JSON.stringify(p, null, 2).split('\n').map((l) => '  ' + l).join('\n'))
      .join(',\n');
    src = insertBefore(src, '];\n\nexport const fullStylePacks', ',\n' + lines, 'style packs end');
    writeFileSync(path, src);
    console.log('style packs applied', packs.length);
  } else console.log('style packs already present');
}

// 4) industry stylePackIds
{
  const refs = JSON.parse(readFileSync('scratch/generated/industry-refs.json', 'utf8'));
  const path = 'packages/design-system/src/industries/index.ts';
  let src = readFileSync(path, 'utf8');
  let changed = 0;
  for (const r of refs) {
    const escaped = r.industry.replace(/[-/]/g, '\\$&');
    const re = new RegExp(`(id: '${escaped}'[\\s\\S]*?stylePackIds: )\\[[^\\]]*\\]`);
    const next = src.replace(re, `$1${JSON.stringify(r.stylePackIds)}`);
    if (next !== src) {
      changed++;
      src = next;
    }
  }
  writeFileSync(path, src);
  console.log('industry refs updated', changed);
}

// 5) pairings
{
  const append = readFileSync('scratch/generated/pairings-append.ts', 'utf8');
  const path = 'packages/design-system/src/font-pairings/fontPairings.ts';
  let src = readFileSync(path, 'utf8');
  if (!src.includes('function fontRef')) {
    src = src.replace(
      "import type { FontItemExtended } from '../fonts/fontLibrary';",
      "import type { FontItemExtended } from '../fonts/fontLibrary';\nimport { fullFontCatalog } from '../fonts/fontLibrary';\n\nfunction fontRef(id: string): FontItemExtended {\n  const f = fullFontCatalog.find((x) => x.id === id);\n  if (!f) throw new Error(`fontRef missing: ${id}`);\n  return f;\n}"
    );
  }
  if (!src.includes("createPairing('pair-inter-space-grotesk'")) {
    // append into additionalPairings before export const fullFontPairings
    src = insertBefore(src, 'export const fullFontPairings', append + '\n', 'pairings');
    // Wait - need to close additionalPairings array. Find "];\n\nexport const fullFontPairings"
    // The above inserts before export which is inside/after array - need the ];
    writeFileSync(path, src);
    // fix: if we inserted before export without closing ], the previous structure may be broken
    // Re-read and ensure additionalPairings is properly closed
    src = readFileSync(path, 'utf8');
    // If append was inserted after ]; of additionalPairings incorrectly, detect:
    // Pattern should be: ...createPairing(...)\n];\nexport const fullFontPairings OR ...createPairing(...)\nexport const fullFontPairings
    if (!/\];\s*export const fullFontPairings/.test(src) && /createPairing\('pair-[\s\S]*export const fullFontPairings/.test(src)) {
      // insert ]; before export if missing
      src = src.replace(/(\n)(export const fullFontPairings)/, '$1];\n$2');
      writeFileSync(path, src);
    }
    console.log('pairings applied');
  } else console.log('pairings already present');
}

// 6) DesignCombination optional fields on interface
{
  const path = 'packages/design-system/src/combinations/index.ts';
  let src = readFileSync(path, 'utf8');
  if (!src.includes('typographyId?:')) {
    src = src.replace(
      `  imageStyleId: string;
  compatibilityScore: number;`,
      `  imageStyleId: string;
  typographyId?: string;
  heroStyleId?: string;
  sectionStyleId?: string;
  iconStyleId?: string;
  effectId?: string;
  compatibilityScore: number;`
    );
    writeFileSync(path, src);
  }
  if (!src.includes('typographyId:')) {
    const ids = JSON.parse(readFileSync('scratch/generated/comb-optional-ids.json', 'utf8'));
    let n = 0;
    src = src.replace(/(imageStyleId: '[^']+',)/g, (_m, g1) => {
      const t = ids.typography[n % ids.typography.length];
      const h = ids.hero[n % ids.hero.length];
      const s = ids.section[n % ids.section.length];
      const i = ids.icon[n % ids.icon.length];
      const e = ids.effect[n % ids.effect.length];
      n++;
      return `${g1}\n    typographyId: '${t}',\n    heroStyleId: '${h}',\n    sectionStyleId: '${s}',\n    iconStyleId: '${i}',\n    effectId: '${e}',`;
    });
    writeFileSync(path, src);
    console.log('comb optional fields filled', n);
  } else console.log('comb optional already present');
}

console.log('done');
