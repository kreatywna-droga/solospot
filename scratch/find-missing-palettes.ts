import { fullColorPalettes } from '../packages/design-system/src/colors/colorPalettes';

// Read COMBO_DEFS palette ids by regex from the source file (avoid import throw)
import { readFileSync } from 'node:fs';
const src = readFileSync('packages/design-system/src/color-combinations/index.ts', 'utf8');
const ids = new Set(fullColorPalettes.map((p) => p.id));
const refs = new Set<string>();
for (const m of src.matchAll(/(?:bgId|fgId|acId):\s*'([^']+)'/g)) refs.add(m[1]);
const missing = [...refs].filter((id) => !ids.has(id)).sort();
console.log(JSON.stringify({ palettes: fullColorPalettes.length, refs: refs.size, missing }, null, 2));
