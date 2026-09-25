import { resolveDesignApplication, designApplicationToCommandPayload } from '../packages/design-system/src/builder';
import { DesignSystem } from '../packages/design-system/src/index';

const results: any[] = [];

function run(kind: any, id: string, options?: Record<string, unknown>) {
  const r = resolveDesignApplication({ kind, id, options } as any, DesignSystem);
  const payload = designApplicationToCommandPayload(r);
  results.push({
    kind,
    id,
    ok: r.ok,
    name: r.name,
    themeKeys: Object.keys(r.theme),
    applied: r.applied,
    payloadType: payload?.type ?? null,
    payloadThemeKeys: payload ? Object.keys(payload.theme) : [],
    appliedStylePackId: (payload?.theme as any)?.appliedStylePackId ?? null,
    message: r.message,
  });
}

// style pack (first real pack id)
run('style-pack', (DesignSystem.stylePacks as any)[0].id);
// color palette
run('color-palette', (DesignSystem.colorPalettes as any)[0].id);
// typography
run('typography', (DesignSystem.typographySystems as any)[0].id);
// font
run('font', (DesignSystem.fonts as any)[0].id);
// design combination
run('design-combination', (DesignSystem.designCombinations as any)[0].id);
// failures
run('color-palette', 'does-not-exist');
run('style-pack', '');

console.log(JSON.stringify(results, null, 2));

const allOk = results.slice(0, 5).every((r) => r.ok && r.payloadType === 'UPDATE_THEME');
const failsOk = results[5].ok === false && results[6].ok === false;
console.log('VERIFY:', allOk && failsOk ? 'PASS' : 'FAIL');
