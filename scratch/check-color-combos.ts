import { fullColorPalettes } from '../packages/design-system/src/colors/colorPalettes';
import { fullColorCombinations } from '../packages/design-system/src/color-combinations';

const palettes = new Set(fullColorPalettes.map((p) => p.id));
const bad: string[] = [];
for (const cc of fullColorCombinations as any[]) {
  for (const key of ['backgroundId', 'foregroundId', 'accentId', 'bgId', 'fgId', 'acId'] as const) {
    const v = cc[key];
    if (typeof v === 'string' && !palettes.has(v)) bad.push(`${cc.id}:${key}:${v}`);
  }
}
console.log(JSON.stringify({ palettes: fullColorPalettes.length, combos: fullColorCombinations.length, bad }, null, 2));
