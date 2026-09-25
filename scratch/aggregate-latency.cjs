const fs = require('fs');
const path = process.argv[2] || 'scratch/latency-bench-BEFORE.json';
const parsed = JSON.parse(fs.readFileSync(path, 'utf8'));
const rows = Array.isArray(parsed) ? parsed : (parsed.results || parsed.rows || []);
const tag = process.argv[3] || 'BEFORE';

function stats(a) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const n = s.length;
  return {
    n,
    min: s[0],
    max: s[n - 1],
    avg: Math.round((s.reduce((x, y) => x + y, 0) / n) * 10) / 10,
    median: n % 2 ? s[(n - 1) / 2] : Math.round((s[n / 2 - 1] + s[n / 2]) / 2),
  };
}
const round = (v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : v);

const STAGES = [
  'UI', 'QUEUE', 'PROVIDER', 'TOOL_SELECTION', 'INTENT_CLASSIFIER', 'ROUTER',
  'LLM', 'HACP_BRIDGE', 'FAST_PATH', 'RESOLVER', 'BUILDER_COMMAND',
  'VERIFICATION', 'DISPATCH', 'RESPONSE', 'CANVAS',
];

function stageTable(sub) {
  const out = [];
  for (const st of STAGES) {
    const vals = [];
    for (const r of sub) {
      const rec = (r.trace && r.trace.stages) || [];
      const hit = rec.find((s) => s.stage === st);
      if (hit) vals.push(hit.durationMs);
    }
    if (vals.length) out.push({ stage: st, count: vals.length, ...stats(vals) });
  }
  return out;
}

const groups = new Map();
for (const r of rows) {
  const key = `${r.surface}|${r.key}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

const report = { tag, generatedAt: new Date().toISOString(), totalRuns: rows.length, groups: [], overall: {} };

const allWall = [];
const allTotal = [];
const paths = {};
const execStatus = {};
const okCount = { true: 0, false: 0 };

for (const [key, sub] of groups) {
  const [surface, cmd] = key.split('|');
  const wall = sub.map((r) => r.wallMs);
  const total = sub.map((r) => (r.trace ? r.trace.totalMs : null)).filter((v) => typeof v === 'number');
  allWall.push(...wall);
  allTotal.push(...total);
  for (const r of sub) {
    const p = (r.trace && r.trace.path) || 'UNKNOWN';
    paths[p] = (paths[p] || 0) + 1;
    const es = (r.trace && r.trace.executionStatus) || r.execStatus || 'UNKNOWN';
    execStatus[es] = (execStatus[es] || 0) + 1;
    okCount[r.ok ? 'true' : 'false']++;
  }
  const stageTbl = stageTable(sub);
  const rec = {
    surface, cmd,
    prompt: sub[0].text,
    runs: sub.length,
    ok: sub.filter((r) => r.ok).length,
    wallMs: stats(wall),
    totalMs: stats(total),
    paths: sub.reduce((m, r) => {
      const p = (r.trace && r.trace.path) || 'UNKNOWN';
      m[p] = (m[p] || 0) + 1;
      return m;
    }, {}),
    executionStatus: sub.reduce((m, r) => {
      const es = (r.trace && r.trace.executionStatus) || 'UNKNOWN';
      m[es] = (m[es] || 0) + 1;
      return m;
    }, {}),
    stageTable,
  };
  report.groups.push(rec);
}

report.overall = {
  wallMs: stats(allWall),
  totalMs: stats(allTotal),
  paths,
  executionStatus: execStatus,
  ok: okCount,
  stageTable: stageTable(rows),
  bySurface: {},
};

for (const surface of [...new Set(rows.map((r) => r.surface))]) {
  const sub = rows.filter((r) => r.surface === surface);
  report.overall.bySurface[surface] = {
    runs: sub.length,
    wallMs: stats(sub.map((r) => r.wallMs)),
    totalMs: stats(sub.map((r) => (r.trace ? r.trace.totalMs : null)).filter((v) => typeof v === 'number')),
    stageTable: stageTable(sub),
  };
}

const out = `scratch/latency-summary-${tag}.json`;
fs.writeFileSync(out, JSON.stringify(report, null, 2));

// Console report
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
console.log(`=== ${tag}  runs=${rows.length}  ok=${okCount.true}/${rows.length}`);
console.log(`paths=${JSON.stringify(paths)}  execStatus=${JSON.stringify(execStatus)}`);
console.log(`wall  ${JSON.stringify(report.overall.wallMs)}`);
console.log(`trace ${JSON.stringify(report.overall.totalMs)}`);
console.log('--- stage table (ms) ---');
for (const s of report.overall.stageTable) {
  console.log(
    `${s.stage.padEnd(18)} n=${String(s.count).padStart(3)} min=${String(round(s.min)).padStart(7)} med=${String(round(s.median)).padStart(7)} avg=${String(round(s.avg)).padStart(7)} max=${String(round(s.max)).padStart(7)}  share=${pct(s.avg, report.overall.totalMs ? report.overall.totalMs.avg : 0)}%`
  );
}
console.log('--- per command ---');
for (const g of report.groups) {
  console.log(
    `${g.surface.padEnd(14)} ${g.key} ${String(g.prompt).slice(0, 34).padEnd(35)} n=${g.runs} ok=${g.ok} wall(min/med/max)=${round(g.wallMs.min)}/${round(g.wallMs.median)}/${round(g.wallMs.max)} status=${JSON.stringify(g.executionStatus)}`
  );
}
console.log(`WROTE ${out}`);



