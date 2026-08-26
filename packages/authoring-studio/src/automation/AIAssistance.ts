/**
 * AIAssistance.ts — PM45 AI Assistance Layer Data Models & Contracts (ETAP 3)
 *
 * DECISION-092: AI Layer udostępnia wyłącznie modele danych i interfejsy integracyjne.
 *
 * Data models for AI commands, prompt templates, suggestions, and AI execution results.
 * ABSOLUTELY NO EXTERNAL CALLS, NO LLM APIS, NO SDK IMPORTS.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface PromptTemplate {
  readonly templateId: string;
  readonly name: string;
  readonly category: 'animation' | 'easing' | 'layout' | 'naming';
  readonly promptPattern: string;
  readonly defaultParameters: Record<string, unknown>;
}

export interface AICommand {
  readonly commandId: string;
  readonly templateId: string;
  readonly userPrompt: string;
  readonly contextPayload: Record<string, unknown>;
}

export interface AISuggestion {
  readonly suggestionId: string;
  readonly title: string;
  readonly description: string;
  readonly confidenceScore: number;
  readonly suggestedActionPayload: Record<string, unknown>;
}

export interface AIResultModel {
  readonly resultId: string;
  readonly commandId: string;
  readonly status: 'success' | 'failed' | 'rejected';
  readonly suggestions: ReadonlyArray<AISuggestion>;
  readonly generatedAt: number;
}

export const STANDARD_PROMPT_TEMPLATES: ReadonlyArray<PromptTemplate> = [
  {
    templateId: 'tmpl-easing-opt',
    name: 'Optimize Easing Curve',
    category: 'easing',
    promptPattern: 'Suggest optimal easing curve for {targetProperty} transition over {durationMs}ms',
    defaultParameters: { durationMs: 400 },
  },
  {
    templateId: 'tmpl-preset-suggest',
    name: 'Suggest Animation Preset',
    category: 'animation',
    promptPattern: 'Recommend entrance animation preset for {elementType} component',
    defaultParameters: { elementType: 'button' },
  },
];

export function createAICommand(templateId: string, userPrompt: string): AICommand {
  return {
    commandId: `aicmd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    templateId,
    userPrompt,
    contextPayload: {},
  };
}
