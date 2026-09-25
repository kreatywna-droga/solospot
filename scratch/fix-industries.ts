import { readFileSync, writeFileSync } from 'fs';

const path = 'packages/design-system/src/industries/index.ts';
let src = readFileSync(path, 'utf8');
const refs = JSON.parse(readFileSync('scratch/generated/industry-refs.json', 'utf8'));
let changed = 0;
for (const r of refs) {
  const escaped = r.industry.replace(/[-/]/g, '\\$&');
  // Match industry: 'key' ... stylePackIds: [...]
  const re = new RegExp(
    `(industry: '${escaped}',[\\s\\S]*?stylePackIds: )\\[[^\\]]*\\]`
  );
  const next = src.replace(re, `$1${JSON.stringify(r.stylePackIds)}`);
  if (next !== src) {
    changed++;
    src = next;
  }
}
writeFileSync(path, src);
console.log('industry refs updated', changed, 'of', refs.length);

// Fix any fontRef ids that don't exist by regenerating pairings list is hard;
// instead strip fontRef lines whose fonts are missing — do a runtime check later.
