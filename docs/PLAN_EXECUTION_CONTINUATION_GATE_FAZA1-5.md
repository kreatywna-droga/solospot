# PLAN → EXECUTION CONTINUATION → TOOL CALL GATE v1.0 — FAZA 1–5 FORENSICS

**Prompt under test:**
```
Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE.
```

**Date:** 2026-09-23  
**Environment:** localhost:3000 (dev), OPENCODE_API_KEY configured

---

## FAZA 1 — LIVE REPRODUCTION (12-point record)

### Channel A — LIVE API (`POST /api/builder/copilot`)

```json
{
  "http": 200,
  "durationMs": 46087,
  "status": "PARTIAL",
  "provider": "AgentOrchestrator",
  "model": "nex-agi/nex-n2.5-mini:free",
  "routerMode": "ORCHESTRATED_FREE",
  "toolCallCount": 0,
  "toolCalls": [],
  "messagePreview": "**STATUS: BLOCKED**\n\nW sekcji **Hero** znalazłem tytuł **MYSHOE**. Nie mam jeszcze możliwości wykonania tej konkretnej operacji w Builderze, więc zmiana nie została zastosowana. Docelowy tytuł: **MARCIN BERNATOWICZ**."
}
```

### Channel B — DIRECT (AgentOrchestrator + OpenCodeProvider, fetch interception)

```json
{
  "1_userRequest": "Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE.",
  "2_selectedModel": "nex-agi/nex-n2.5-mini:free",
  "3_intent": "DELETE",
  "4_capabilitySurface": [
    "inspect_page_structure",
    "resolve_target",
    "remove_node",
    "remove_section",
    "inspect_document_summary"
  ],
  "5_toolsPassedToModel": [
    "inspect_page_structure",
    "remove_section",
    "remove_node",
    "resolve_target",
    "inspect_document_summary"
  ],
  "6_rawModelResponse": "",
  "7_modelReturnedToolCall": true,
  "8_modelReturnedTextPlan": false,
  "9_continuationStarted": true,
  "10_nextModelTurnExecuted": true,
  "11_toolCallExecuted": false,
  "12_finalStatus": "PARTIAL",
  "finalToolCallCount": 0,
  "finalHasMutation": false,
  "planWithoutExecution": false
}
```

### Channel B — Agent loop trace (5 iterations, all read-only)

| Turn | Model | Tool called | Type |
|------|-------|-------------|------|
| 1 | nemotron (timeout) | — | — |
| 2 | nex-pro (timeout) | — | — |
| 3 | nex-mini | `resolve_target({prompt:"Hero"})` | read-only |
| 4 | nex-mini | `inspect_page_structure({pageId})` | read-only |
| 5 | nex-mini | `resolve_target({prompt:"MYSHOE w sekcji Hero"})` | read-only |
| 6 | nex-mini | `inspect_document_summary({})` | read-only |
| 7 | nex-mini | `resolve_target({prompt:"Tytuł…MYSHOE"})` | read-only |
| 8 | nex-mini | **TEXT (stop)** — final plan | — |

**Final model message:**
> Nie wprowadzono zmian. Dostępne narzędzia pozwalają usuwać elementy, ale nie edytować tekstu, więc nie mogę ustawić tytułu na **MARCIN BERNATOWICZ** bez usunięcia obecnego **MYSHOE**.

**LOOP_COMPLETE:** `mutationToolCalls: []`, `finalToolCalls: []`  
**FINAL_RESPONSE:** `status: CHAT` (provider) → orchestrator maps to `PARTIAL`

---

## FAZA 2 — FIRST BREAK IDENTIFICATION

**First break = A: INTENT CLASSIFICATION**

| Step | Expected | Actual | Break? |
|------|----------|--------|--------|
| A. Intent classification | EDIT_NODE (multi-intent: edit + delete content) | **DELETE** (Priority 2, conf 0.9) | **✗ FIRST BREAK** |
| B. Tool surface | include `update_node_props`, `inspect_node`, `find_nodes` | DELETE surface: only inspect/remove | ✗ consequence of A |
| C. Plan creation | plan with EDIT + DELETE steps | plan: DELETE_NODE only | ✗ consequence of A |
| D. Model request | tools include edit capability | tools = DELETE surface only | ✗ consequence of A |
| E. Model response | tool_call to `update_node_props` | read-only tools only, then text | ✗ consequence of A/B |
| F. Continuation | continue toward mutation | continued but stuck on read-only | partial (loop works) |
| G. Tool execution | mutation executed | zero mutations | ✗ |
| H. Status reporting | not SUCCESS (honest) | PARTIAL (honest) | ✓ anti-fake holds |

### Root cause chain

1. **`IntentClassifier` Priority 2:** `containsOnlyAction(normalized, DELETE_KEYWORDS)` matches `"usuń"` and returns `DELETE` **before** Priority 8 `EDIT_NODE` is ever reached.
2. `containsOnlyAction` for DELETE does **not** check for conflicting `EDIT_KEYWORDS` (unlike MOVE which checks `!hasEditAction`).
3. Multi-intent prompt `"Zmień Hero. Tytuł ustaw na … Usuń MYSHOE."` is reduced to DELETE-only.
4. **`ToolSurfaceSelector` DELETE surface** = `[inspect_page_structure, resolve_target, remove_node, remove_section, inspect_document_summary]` — **missing** `update_node_props`, `inspect_node`, `find_nodes`.
5. Model correctly observes: tools can remove but cannot edit text → gives up with text plan.
6. Agent loop continuation **does run** (5 iterations) but every turn is constrained to the wrong surface.
7. `detectPendingMutation` for DELETE returns `null` (no handler) → no controller injection.
8. Final: `toolCalls: []`, `status: PARTIAL` — honest, but **plan never became execution**.

---

## FAZA 3 — RESPONSE FORENSICS

| Question | Answer |
|----------|--------|
| Did model return tool_call on first successful turn? | **YES** (`resolve_target`) |
| Did model return text-only plan? | Final turn: YES (stop, no tool_calls) |
| Were any tool_calls mutations? | **NO** — all `resolve_target` / `inspect_*` |
| Raw first content? | `""` (tool_calls turn) |
| Raw final content? | Polish refusal: cannot edit with remove-only tools |

**Verdict:** Model is **not** refusing to use tools; it uses tools but the **surface forbids the required mutation** (`update_node_props`).

---

## FAZA 4 — CONTINUATION FORENSICS

| Question | Answer |
|----------|--------|
| Continuation started? | **YES** (after first tool_calls response) |
| Next model turn executed? | **YES** (turns 4–8) |
| Continuation model | `activeModelId` = `nex-agi/nex-n2.5-mini:free` (fallback used) |
| Continuation produced mutation? | **NO** |
| Why stopped? | Model `finish_reason: stop` with text; `toolCalls = []` |
| MAX_AGENT_ITERATIONS hit? | No — exited on text-only response (iteration 5) |

**Verdict:** Continuation **mechanism works** for tool_call→next-turn. It cannot invent tools that were never in the request payload. The break is **upstream of continuation** (wrong surface from wrong intent).

---

## FAZA 5 — CAPABILITY CHECK

```
intent: DELETE
tools:  [inspect_page_structure, resolve_target, remove_node, remove_section, inspect_document_summary]
hasInspectNode:        false
hasResolveTarget:      true
hasUpdateNodeProps:    false   ← REQUIRED for "Tytuł ustaw na …"
hasFindNodes:          false   ← REQUIRED to locate MYSHOE text
hasRemoveNode:         true
hasInspectPageStructure: true
requiredTrioPresent:   false   ← inspect_node ∧ resolve_target ∧ update_node_props
```

**EDIT_NODE surface (for comparison):**
```
[inspect_selected_node, inspect_node, find_nodes, resolve_target,
 update_node_props, set_node_styles, inspect_document_summary]
```
→ Would satisfy required trio and enable the edit.

---

## SUMMARY — GATE STATUS

| Phase | Result |
|-------|--------|
| FAZA 1 live repro | **DONE** — both channels captured |
| FAZA 2 first break | **A: Intent Classification** (DELETE wins over EDIT) |
| FAZA 3 response forensics | Model uses tools; surface lacks mutation |
| FAZA 4 continuation forensics | Loop works; stuck on wrong surface |
| FAZA 5 capability check | `requiredTrioPresent: false` on DELETE surface |
| FAZA 6 repair | **PENDING** — fix multi-intent classification + surface |
| FAZA 7–8 TEST 1–4 | PENDING |
| FAZA 9 anti-fake-success | Already holds (PARTIAL ≠ SUCCESS) |
| FAZA 10 regression/tsc/build | PENDING |
| FAZA 11 deploy | PENDING |

---

## REPAIR PLAN (FAZA 6)

### Fix 1 — `IntentClassifier`: multi-intent / EDIT wins over DELETE when both present

When prompt contains both `EDIT_KEYWORDS` and `DELETE_KEYWORDS`:
- Prefer **EDIT_NODE** as primary category if edit action is substantive (`zmień`, `ustaw`, `change`, …).
- Record secondary delete intent in `parameters.secondaryIntents` or similar.
- Alternative: skip Priority 2 DELETE when `hasEditAction` is true (mirror MOVE’s `!hasEditAction` guard).

### Fix 2 — `ToolSurfaceSelector`: merge surfaces for multi-intent (no new capabilities)

When classified as EDIT with secondary DELETE (or vice versa), union the tool lists:
```
EDIT_NODE ∪ DELETE ⊃ [inspect_node, find_nodes, resolve_target,
                      update_node_props, set_node_styles,
                      remove_node, remove_section, inspect_*]
```
Still ≤ reasonable tool count; **no new tool definitions**.

### Fix 3 — Continuation / detectPendingMutation (keep honest)

- Do **not** invent arguments in controller injection for EDIT.
- If model returns text-only after read-only loop on a mutation intent → status stays **PARTIAL** (never SUCCESS).
- Optional: one controller-driven read (`find_nodes`/`inspect_node`) only if arguments resolvable from `nodesIndex` — otherwise CLARIFY.

### Non-goals (per gate)

- No new capabilities/tools.
- No changes to Asset Corridor, Experience Library, Inspector, Canvas geometry.
