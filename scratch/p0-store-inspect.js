/**
 * P0 R2 prod probe D — read-only inspect + optional server-side write of
 * section position styles on the prod store record (service role).
 * env: MODE=inspect (default) | write
 */
const fs = require('fs');
const path = require('path');

const candidates = ['.env.production', '.env.local'];
let env = '';
for (const f of candidates) {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) { env = fs.readFileSync(p, 'utf8'); if (/placeholder/i.test(env)) continue; break; }
}
const get = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim() : ''; };
const URL_ = get('NEXT_PUBLIC_SUPABASE_URL');
const KEY = get('SUPABASE_SERVICE_ROLE_KEY');
const SLUG = process.env.STORE_SLUG || 's-demo';
const MODE = process.env.MODE || 'inspect';

async function main() {
  if (!URL_ || !KEY) { console.log('MISSING_CREDS'); return 1; }
  const headers = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
  const r = await fetch(`${URL_}/rest/v1/stores?select=id,slug,name,config&slug=eq.${SLUG}`, { headers });
  const rows = await r.json();
  if (!Array.isArray(rows)) { console.log('ERR', JSON.stringify(rows).slice(0, 300)); return 1; }
  if (!rows.length) { console.log('NO_ROW', SLUG); return 1; }
  const store = rows[0];
  console.log('store', store.id, store.slug, store.name);
  const pages = (store.config || {}).pages || [];
  console.log('pages=' + pages.length);

  if (MODE === 'inspect') {
    for (const p of pages) {
      const secs = p.sections || [];
      console.log(` page ${p.id} sections=${secs.length}`);
      for (const s of secs) console.log(`  ${s.id} type=${s.type} styles=${JSON.stringify(s.styles)} responsive=${JSON.stringify(s.responsive)}`);
    }
    return 0;
  }

  // MODE=write: add base translate to the first section (idempotent), keep everything else
  const target = process.env.SECTION_ID || 'sec-hero-init';
  let touched = 0;
  for (const p of pages) {
    for (const s of p.sections || []) {
      if (s.id === target) {
        s.styles = { ...(s.styles || {}), translateX: '100px', translateY: '40px' };
        s.responsive = { ...(s.responsive || {}), tablet: { ...((s.responsive || {}).tablet || {}), translateX: '60px', translateY: '0px' } };
        touched++;
      }
    }
  }
  if (!touched) { console.log('SECTION_NOT_FOUND', target); return 1; }
  const patchBody = { config: store.config };
  if (process.env.PUBLISH === '1') {
    store.config.publicationStatus = 'PUBLISHED';
    patchBody.config = store.config;
    console.log('publicationStatus -> PUBLISHED');
  }
  const pr = await fetch(`${URL_}/rest/v1/stores?id=eq.${store.id}`, {
    method: 'PATCH', headers, body: JSON.stringify(patchBody),
  });
  console.log('PATCH status', pr.status, pr.ok ? 'OK' : await pr.text());
  return pr.ok ? 0 : 1;
}

main().then((c) => process.exit(c)).catch((e) => { console.log('FATAL', e.message); process.exit(1); });
