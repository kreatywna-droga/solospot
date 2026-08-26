# Test Utilities & Infrastructure — TECH-003 / TECH-004 Standard

Centralized test utilities, mock data factories, and testing conventions for WEB FACTOR.

## 📁 Directory Structure
- `factories.ts`: Type-safe mock data generators (`createMockPropSchema`, `createMockInspectorGroup`, `createMockSectionNode`, `createMockPageNode`).
- `helpers.ts`: Shared rendering (`renderToHtml`), assertions (`expectHtmlToContain`), timers (`waitMs`), and callbacks (`noop`).
- `index.ts`: Barrel export file.

## 🚀 Usage Example

```typescript
import { createMockPropSchema, createMockInspectorGroup, renderToHtml, noop } from '../../../../src/test-utils';

describe('DynamicPropertyPanel', () => {
  it('should render property field label correctly', () => {
    const schema = createMockPropSchema({ label: 'Custom Label' });
    const group = createMockInspectorGroup('layout', 'Layout', [schema]);
    const html = renderToHtml(
      <DynamicPropertyPanel group={group} currentProps={{}} onPropChange={noop} breakpoint="desktop" />
    );
    expect(html).toContain('Custom Label');
  });
});
```

## 📐 Test Naming Standard
To maintain uniformity across unit and integration tests:
1. **`should [expected behavior] when [condition]`** — Primary convention for unit test cases.
   - Example: `it('should dispatch UPDATE_PROPS when input value changes', ...)`
2. **`renders [component state] correctly`** — Rendering / layout validation cases.
   - Example: `it('renders EmptyInspectorState correctly when sectionId is null', ...)`
3. **`returns [value] for [input]`** — Pure function / utility assertion cases.
   - Example: `it('returns default fallback value for unregistered widget type', ...)`

## 🔄 Migrated Tests
The following test suites have been zmigrowane do `src/test-utils`:
- `packages/authoring-studio/src/inspector/__tests__/StateConsistency.test.ts`
- `packages/authoring-studio/src/inspector/panels/__tests__/DynamicPropertyPanel.test.ts`
