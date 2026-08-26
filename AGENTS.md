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

