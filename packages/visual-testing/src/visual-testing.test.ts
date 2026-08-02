import { describe, it, expect } from 'vitest';
import {
  VisualSnapshotEngine,
  VisualDiffEngine,
  VisualReportGenerator,
  VisualTestCLI,
} from './index';

describe('Visual Testing Package Unit Tests', () => {
  it('should create and serialize/deserialize visual snapshot', () => {
    const snapshot = VisualSnapshotEngine.createSnapshot(
      'HeroButton',
      'Button',
      'hash_dom_123',
      { backgroundColor: '#0070f3', borderRadius: '4px' }
    );

    expect(VisualSnapshotEngine.validate(snapshot)).toBe(true);

    const json = VisualSnapshotEngine.serialize(snapshot);
    const deserialized = VisualSnapshotEngine.deserialize(json);

    expect(deserialized.name).toBe('HeroButton');
    expect(deserialized.domStructureHash).toBe('hash_dom_123');
  });

  it('should detect visual diffs and classify severity correctly', () => {
    const base = VisualSnapshotEngine.createSnapshot(
      'HeroButton',
      'Button',
      'hash_dom_123',
      { backgroundColor: '#0070f3', borderRadius: '4px', width: '120px' }
    );

    const current = VisualSnapshotEngine.createSnapshot(
      'HeroButton',
      'Button',
      'hash_dom_123',
      { backgroundColor: '#0070f3', borderRadius: '8px', width: '150px' }
    );

    const diff = VisualDiffEngine.compare(base, current);

    expect(diff.domMatched).toBe(true);
    expect(diff.changedPropertiesCount).toBe(2);
    expect(diff.overallSeverity).toBe('major'); // due to width change
  });

  it('should generate Markdown and JSON visual reports', () => {
    const base = VisualSnapshotEngine.createSnapshot('Card', 'CardComponent', 'hash_1', { color: '#000' });
    const curr = VisualSnapshotEngine.createSnapshot('Card', 'CardComponent', 'hash_1', { color: '#fff' });

    const diff = VisualDiffEngine.compare(base, curr);
    const md = VisualReportGenerator.toMarkdown([diff]);
    const jsonStr = VisualReportGenerator.toJSON([diff]);

    expect(md).toContain('# Visual Regression Test Report');
    expect(md).toContain('`Card`');

    const jsonObj = JSON.parse(jsonStr);
    expect(jsonObj.totalSnapshotsTested).toBe(1);
    expect(jsonObj.failedCount).toBe(1);
  });

  it('should parse CLI arguments correctly', () => {
    const cliRes = VisualTestCLI.parseArgs(['diff', '--base=base.json', '--current=curr.json']);

    expect(cliRes.command).toBe('diff');
    expect(cliRes.baseSnapshotPath).toBe('base.json');
    expect(cliRes.currentSnapshotPath).toBe('curr.json');

    const helpText = VisualTestCLI.getHelpText();
    expect(helpText).toContain('Usage: visual-test <command>');
  });
});
