import { describe, it, expect } from 'vitest';
import { auditDocumentationCompleteness } from '../DocumentationCompleteness';

describe('DocumentationCompleteness (PM48, ETAP 5)', () => {
  it('audits completeness across architecture, API, workflow, governance, and release docs', () => {
    const report = auditDocumentationCompleteness();
    expect(report.isDocSetComplete).toBe(true);
    expect(report.docs).toHaveLength(5);
  });
});
