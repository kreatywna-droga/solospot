<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Governance Framework & Architectural Decisions Log (ADR)

- **DECISION-042**: `AnimationTriggerBridge` must NEVER implement custom playback, time-stepping, or scheduler logic. It may ONLY delegate to `AnimationPlaybackController` interface methods (`play()`, `pause()`, `reset()`, `stop()`, `seek()`).
- **DECISION-043**: Inspector edits animation data only. Animation execution remains exclusively inside `builder-core`.
- **DECISION-044**: `BuilderDocument` is the single source of truth (SSOT) for `AnimationTimeline` editing.
- **DECISION-045**: Inspector never invokes `PlaybackController`. It edits configuration only.

## Code Evidence Audit Protocol v2.8

Mandatory Protocol Rules:
1. **Bridge Delegation Verification**: Confirm that any Bridge component solely delegates to underlying domain controllers without implementing custom playback/time logic or state machines.
2. **Editor vs Runtime Separation Verification**: Confirm zero imports of `PlaybackController`, `RuntimeScheduler`, `RuntimeBridge`, `Browser Adapter`, or `requestAnimationFrame` in `packages/authoring-studio`.
3. **Audit Authority Boundary**: Agent 2 issues ONLY `Recommendation: PASS` or `HOLD`. Formal ratification (`FORMALLY RATIFIED 🔒`) belongs strictly and exclusively to the Architect.
4. **Post-HOLD Focused Delta Audit**: Following a `HOLD` decision, Agent 2 executes exclusively a targeted "Focused Delta Audit" covering only the fixed Finding IDs, avoiding full-scope re-audits.

## Mini Inspector Gate v6 (INDEPENDENT EXECUTION + NATURAL LANGUAGE REPAIR)

- **Test**: `npx vitest run src/lib/hacp/__tests__/TargetedEditResolver.test.ts src/components/builder/ai/__tests__/MiniInspectorIndependentExecution.test.ts src/lib/hacp/__tests__/HacpBridge.test.ts src/lib/hacp/__tests__/HacpDebug.test.ts src/lib/hacp/__tests__/HacpIntentEngine.test.ts src/lib/hacp/__tests__/MutationArgumentIntegrity.test.ts src/components/builder/ai/__tests__/MiniInspectorAI.test.ts src/lib/ai/__tests__/ToolInventoryVerification.test.ts src/lib/ai/__tests__/NoFakeSuccess.test.ts --exclude '.kilo/**'`
- **Typecheck**: `npx tsc --noEmit`
- **Build**: `npm run build > scratch\build-v6.log`
- **Lint**: 15 pre-existing errors (authoring-studio/provision-engine/dashboard) — unchanged by v6.
- **Known pre-existing failure**: `HacpIntentEngine.test.ts T37` (offline CLARIFY message in node env).
- **Branch**: `main`. Untracked dirs to ignore: `public/stores/s-new/*`, `scratch/knowledge-gate-proof/*`, `docs/AI_*`, `docs/MINI_*`, `$`, `TODO_SPRINT6_STEP6.progress.md`, scratch files.
- **Deploy**: `npx vercel deploy --prod --yes *> scratch\deployN.log`

