import { describe, it, expect } from 'vitest';
import { createAICommand, STANDARD_PROMPT_TEMPLATES } from '../AIAssistance';

describe('AIAssistance (PM45, ETAP 3 & DECISION-092)', () => {
  it('provides AI command models and prompt templates without external AI APIs (DECISION-092)', () => {
    expect(STANDARD_PROMPT_TEMPLATES.length).toBeGreaterThan(0);
    const cmd = createAICommand('tmpl-easing-opt', 'Optimize fade easing');
    expect(cmd.templateId).toBe('tmpl-easing-opt');
    expect(cmd.userPrompt).toBe('Optimize fade easing');
  });
});
