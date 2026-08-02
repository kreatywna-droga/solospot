# Sprint 6B — Smart Guides Foundation: Implementation Checklist

## Faza 1 — Smart Guide Types & Engine (builder-core)
- [ ] Create `packages/builder-core/src/SmartGuideTypes.ts` (extensible: GuideType, GuideOrientation, GuidePriority, GuideSource)
- [ ] Create `packages/builder-core/src/SmartGuideEngine.ts` (modular: AlignmentCalculator, SnapCalculator, DistanceCalculator, SpacingCalculator, GuideAggregator)
- [ ] Update `packages/builder-core/src/index.ts` — export new types and engine
- [ ] Create `packages/builder-core/src/__tests__/smart-guide-engine.test.ts` — unit tests

## Faza 2 — Smart Guide React UI
- [ ] Create `src/components/builder/canvas/guides/SmartGuidesOverlay.tsx` — SVG overlay (pure presentation)
- [ ] Create `src/components/builder/canvas/guides/useSmartGuides.ts` — hook (bridge: DragContext → SmartGuideEngine → state)
- [ ] Create `src/components/builder/canvas/guides/GuidesToggle.tsx` — UI toggle

## Faza 3 — Canvas Integration
- [ ] Integrate SmartGuidesOverlay into BuilderCanvas
- [ ] Wire DragContext → SmartGuideEngine → Guides State → Overlay → Snap → DragEngine → Preview

## Faza 4 — Documentation
- [ ] Create `docs/studio/65_SMART_GUIDES_SPECIFICATION.md`
- [ ] Create `docs/studio/66_SMART_GUIDES_COMMANDS.md`
- [ ] Create `docs/studio/67_SMART_GUIDES_RUNTIME_CONTRACTS.md`
- [ ] Create `docs/studio/68_SPRINT6B_INTEGRATION_REVIEW.md`
- [ ] Create `docs/studio/69_SMART_GUIDES_ARCHITECTURE_FREEZE.md`

## Faza 5 — Final
- [ ] Update `docs/studio/37_STUDIO_SUBSYSTEM_ROADMAP.md`
- [ ] Update `docs/studio/99_IMPLEMENTATION_CHECKLIST.md`
- [ ] Quality Gates verification (including Pure Function & Zero Canvas Logic)
- [ ] Completion report

