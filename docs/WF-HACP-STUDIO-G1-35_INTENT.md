# TASK WF-HACP-STUDIO-G1-35 — INTENT

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING

---

## 1. MISSION STATEMENT

Execute an autonomous candidate-discovery sprint for the Authoring Studio vector subsystem. Evaluate
two next-feature candidates, select one based on physical evidence and architectural value, generate a
binding contract, implement the vertical slice, generate and pass a full test battery (feature, E2E,
adversarial, failure injection), run full regression, audit, and commit — producing all mandatory
governance artifacts.

## 2. CANDIDATES

### Candidate A — Canvas Zoom & Pan
Interactive viewport manipulation (pan/zoom/rotate/fit) applied to the Authoring Studio canvas.

### Candidate B — Document Persistence UI & SVG Exporter
Headless SVG document export + persistence roundtrip for the vector workspace.

## 3. SELECTION PRINCIPLE

Selection is evidence-driven, NOT preference-driven:
- Physical code/tests in the working tree carry more weight than documentation claims (forensic recovery).
- A previously-started implementation in the working tree is strong evidence of prior selection.
- Do NOT invent roadmap items; do NOT treat "GAP-07" as a global gap.

## 4. GOVERNANCE CONSTRAINTS (NON-NEGOTIABLE)

- `RUN_TERMINATION = CONTROLLED_STOP` — do NOT auto-start G1-36.
- PASS_TO_FAIL = 0; REMOVED_TESTS = 0; NEW_UNAUTHORIZED_FAILURES = 0.
- No suppressions: `test.skip`, `it.skip`, `test.only`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` are forbidden.
- Do not change G1-34 files beyond the G1-35 barrel integration (index.ts export additions).
- Do not change G1-33 beyond necessary compatibility (test-runner import fix).
- The 3 pre-existing ShapeGrouping/ShapeTransform failures are BASELINE failures (documented in G1-34
  TEST_INVENTORY_FINAL); they are not G1-35 regressions and are reconciled, not silently altered.

## 5. SUCCESS CRITERIA

- Candidate B (SVG Exporter + Document Persistence) implemented as a pure, headless vertical slice.
- ≥15 feature tests, ≥5 E2E workflows, ≥12 adversarial scenarios, ≥3 failure injection points — all PASS.
- Full regression green apart from documented pre-existing baseline failures.
- 18 mandatory governance artifacts produced.
- Independent audit = APPROVE; B13 = COMMIT; post-commit verification = PASS.

## 6. OUT OF SCOPE (NOT AUTHORIZED)

- Canvas Zoom & Pan implementation (Candidate A).
- Media export (mp4/webm/gif) in `export/` subsystem.
- Modification of G1-34 geometry/engine behavior.
- Auto-starting G1-36.