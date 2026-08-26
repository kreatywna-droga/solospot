/**
 * RuntimeSync — Sprint 7 Recovery (P1) tests
 *
 * Node environment — no jsdom.
 *
 * Verifies the ONE-WAY command path contract from Inspector to Runtime
 * Preview is preserved by the adapter/registry wiring:
 *
 *   UPDATE_PROPS → Builder Command → RuntimePreviewChannel → Preview iframe
 *
 * Constraints verified (no source-level DOM manipulation):
 *   - inspector/registry + inspector/panels never import RuntimePreviewChannel
 *     directly (they only emit commands via onPropChange).
 *   - No `querySelector` / `document.` usage in the inspector presentation layer.
 *   - The adapter preserves the single dispatch path (onPropChange → dispatch).
 *
 * @agent Agent 1 — Inspector Core Engineer (Sprint 7 Recovery)
 * @status IN PROGRESS — READY FOR PM26 REVIEW
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const inspectorRoot = path.resolve(__dirname, '..');

function readFilesUnder(dir: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...readFilesUnder(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('RuntimeSync — one-way command path (no content/DOM coupling)', () => {
  const tsFiles = readFilesUnder(inspectorRoot).filter(
    (f) => !f.includes('__tests__') && !f.includes('__snapshots__'),
  );

it('inspector presentation layer does not import RuntimePreviewChannel directly', () => {
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      // Only match actual import/require statements — the InspectorShellAdapter
      // doc comment legitimately *describes* the RuntimePreviewChannel as the
      // downstream target of the command bus, but never imports it.
      const importMatches =
        content.match(/from\s+['"][^'"]*RuntimePreviewChannel['"]/) !== null ||
        /\bimport\s*\(\s*['"][^'"]*RuntimePreviewChannel['"]\s*\)/.test(content);
      expect(
        importMatches,
        `${file} must not import RuntimePreviewChannel directly`,
      ).toBe(false);
    }
  });

  it('inspector presentation layer never manipulates the DOM (no querySelector / document)', () => {
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(
        content.match(/querySelector|getElementById|document\./),
        `${file} must not directly manipulate the DOM`,
      ).toBeNull();
    }
  });

  it('DynamicPropertyPanel resolves widgets only via propertyFieldRegistry', () => {
    const panelFile = path.join(inspectorRoot, 'panels/DynamicPropertyPanel.tsx');
    const content = fs.readFileSync(panelFile, 'utf8');
    expect(content).toContain('propertyFieldRegistry');
    expect(content).not.toMatch(/switch\s*\(/);
  });

  it('InspectorShellAdapter delegates to InspectorSync + onPropChange (single dispatch path)', () => {
    const adapterFile = path.join(inspectorRoot, 'InspectorShellAdapter.tsx');
    const content = fs.readFileSync(adapterFile, 'utf8');
    expect(content).toContain('InspectorSync');
    expect(content).toContain('onPropChange');
  });
});
