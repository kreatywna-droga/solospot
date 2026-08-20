# TASK WF-HACP-STUDIO-G1-36 — REWORK

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING

---

## Rework Item #1 (the only rework in this sprint)

### Finding
Adversarial test A#11 ("gradient stops with NaN/empty entries filtered") failed on first run:
the gradient-stop filter in `fillFields` accepted `offset: NaN` because `typeof NaN === 'number'`,
so the filtered stop list length was 2 instead of the expected 1.

### Root Cause
`VectorRenderingBridge.fillFields` filtered stops with
`typeof s.offset === 'number' && typeof s.color === 'string'` — which admits `NaN` offsets and
empty-string colors.

### Fix (applied)
`packages/authoring-studio/src/rendering/VectorRenderingBridge.ts` — filter hardened to
`typeof s.offset === 'number' && Number.isFinite(s.offset) && typeof s.color === 'string' && s.color.length > 0`.
This rejects NaN offsets and empty colors while preserving valid stops.

### Verification
After fix: full G1-36 suite 42/42 PASS (including A#11). Regression re-run: 535 tests, 532 PASS,
3 pre-existing baseline failures only.

## Rollback Path

- The RendererCommand additions are all optional fields; dropping them restores prior behavior.
- The stop-filter hardening is a pure robustness improvement with no API surface change.
- Full post-commit suite re-run confirms green state after commit (see FINAL_REPORT).

## No Other Rework

- No other test failed at any point in the sprint.
- No rework was required for the affine matrix (formulas derived and verified symbolically before
  the first test run; identity and 90° cases confirmed correct on first execution).

— END OF REWORK —