import { describe, it, expect } from 'vitest';
import { generateStudioDocumentation } from '../DocumentationGenerator';

describe('DocumentationGenerator (Sprint S1, ETAP 2)', () => {
  it('generates complete documentation bundle from metadata', () => {
    const docBundle = generateStudioDocumentation();
    expect(docBundle.apiReference).toContain('API Reference');
    expect(docBundle.architectureIndex).toContain('Architecture Index');
    expect(docBundle.moduleIndex).toContain('Module Index');
    expect(docBundle.decisionIndex).toContain('Decision Index');
  });
});
