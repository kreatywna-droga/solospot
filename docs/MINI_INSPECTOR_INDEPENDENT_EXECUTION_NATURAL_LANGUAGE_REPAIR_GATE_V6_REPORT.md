# Mini Inspector Independent Execution + Natural Language Repair — GATE v6 REPORT

**Date**: 2026-09-24
**Branch**: `main`
**Gate**: MINI INSPECTOR AI — INDEPENDENT EXECUTION + SIMPLE COMMAND UNDERSTANDING REPAIR & PRODUCTION GATE v6.0
**Status**: COMPLETE (PHASE 0–25)

---

## Executive Summary

Mini Inspector now executes commands **independently of Main Chat state**. Short Polish
commands with semantic qualifiers (luxury / modern / widoczna / granatowy) resolve
deterministically on the selected element. Every command is recorded in Main Chat
history. No response-without-action, no fake SUCCESS.

## Forensic Findings (PHASE 0–1)

- **FIRST BREAK**: `MiniInspectorCommandBus.submitCommand` ran
  `Promise.allSettled(subscribers)`. Zero subscribers (Main Chat closed) → `null` →
  `FAILED`. Execution MUST be independent of UI mount state.
- **Double dispatch**: workspace subscriber AND `MiniInspectorAI` both dispatched
  the same result.
- **Response-without-action**: `HacpBridge.executePlan` returned `intent:'CHAT',
  executionStatus:'CLARIFY'` on zero tool calls without running the deterministic
  `HacpIntentEngine` fallback.
- `HacpIntentEngine` does not handle font/typography, font size, align,
  translate-horizontal, semantic qualifiers, or `COLOR_MAP` missing `granatowy`.
- `IntentClassifier` STYLE surface lacked size/align/qualifier keywords.

## Architecture Changes

| File | Change |
|---|---|
| `src/lib/ai/SharedExecutionService.ts` | **NEW** — module singleton; runs `HacpBridge.executePlan` always; single-flight queue (cap 3); records `SharedAiHistoryEntry`; shared `conversationContext` (cap 25); `subscribeHistory` listeners. |
| `src/lib/ai/SharedExecutionService.ts` | Never dispatches — callers dispatch once each. |
| `src/lib/hacp/TargetedEditResolver.ts` | **NEW** — deterministic targeted edits on selection: COLOR → SIZE → TEXT → TYPOGRAPHY → ALIGN → MOVE → STYLE_MODIFICATION; diacritic-fold matching; Design System font/color resolution; honest null on no-match / ambiguous. |
| `src/lib/hacp/HacpTypes.ts` | `COLOR_MAP` extended: granatowy/navy, bordowy, turkusowy, beżowy, kremowy, morski, śliwkowy. |
| `src/lib/hacp/HacpBridge.ts` | `buildTargetedEditResult` helper + 3 call sites (engine CLARIFY / model CHAT zero-tools / tool batch zero-mutations); optional `source` param; `executePlan` runs resolver ONLY as last resort when zero commands produced. |
| `src/lib/ai/IntentClassifier.ts` | STYLE_KEYWORDS += rozmiar, większy, mniejsz, powiększ, wyśrodkuj, wyrównaj, przesuń, luxury, luksus, premium, elegan, nowoczesn, widoczna. |
| `src/app/api/builder/copilot/route.ts` | Destructures `source`; system prompt adds GATE v6 execution rules (default target = selection; never ask "cała strona?"; execute determinable intents; NO RESPONSE WITHOUT ACTION). |
| `src/components/builder/ai/MiniInspectorCommandBus.ts` | `submitCommand` delegates to `SharedExecutionService`; subscribers become observers-only; TIMEOUT detection via `errorReason`. |
| `src/components/builder/ai/MiniInspectorAI.tsx` | No changes needed (unchanged — bus handles model id via sessionStorage). |
| `src/components/builder/ai/AiCopilotWorkspace.tsx` | Removed execution subscriber effect (L322–429); replaced with shared-history sync + bus status mirror; `handleSendMessage` delegates to `SharedExecutionService.execute({source:'main-chat'})`; local `conversationContext` removed (service owns memory); messages seeded from shared history. |

## New Tests

- `src/lib/hacp/__tests__/TargetedEditResolver.test.ts` — 14 tests (target lock, short commands, qualifiers, honest fall-through).
- `src/components/builder/ai/__tests__/MiniInspectorIndependentExecution.test.ts` — 6 tests (zero subscribers, parity with subscriber, shared history, honest CLARIFY).

## Verification Results

| Check | Result |
|---|---|
| New suites | 231 passed (new + existing affected) |
| Pre-existing (src) | T37 `HacpIntentEngine` — offline CLARIFY message in node env (unchanged) |
| `npx tsc --noEmit` | **exit 0** |
| `npm run build` | **exit 0** (`scratch\build-v6.log`) |
| Lint | 15 pre-existing errors — unchanged |
| Prod E2E script | `scratch/mini-gate-v6.js` written (Chrome CDP, 5 scenarios A–E, screenshots) |

## Deploy

```
npx vercel deploy --prod --yes *> scratch\deployN.log
```

Report: `docs/MINI_INSPECTOR_INDEPENDENT_EXECUTION_NATURAL_LANGUAGE_REPAIR_GATE_V6_REPORT.md`
