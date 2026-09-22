/**
 * AIProviderTypes.ts — SoloSpot AI Provider & Copilot Contracts
 *
 * Core interfaces for real LLM integration, function/tool calling,
 * Live Builder Context propagation, and honest execution statuses.
 */

import type { HacpBuilderContext, HacpVisualMetrics } from '../hacp/HacpTypes';

export type AIProviderStatus = 'CONFIGURED' | 'NOT_CONFIGURED' | 'ERROR';

export type ChatMessageAttachmentType = 'image' | 'document' | 'file';

export interface ChatMessageAttachment {
  type: ChatMessageAttachmentType;
  name: string;
  mimeType: string;
  /** Base64 data URL for images/binaries, or raw text content for text documents. */
  content: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  attachments?: ChatMessageAttachment[];
}

export interface HacpToolParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: string[];
  items?: { type: string };
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface HacpToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, HacpToolParameterProperty>;
    required?: string[];
  };
}

export interface HacpToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AICopilotRequest {
  prompt: string;
  messages: ChatMessage[];
  builderContext: HacpBuilderContext;
  visualMetrics?: HacpVisualMetrics;
  tools?: HacpToolDefinition[];
  routerMode?: 'AUTO' | 'FREE' | 'PAID' | 'MANUAL';
  modelId?: string;
}

export interface AICopilotResponse {
  status: 'SUCCESS' | 'NOT_CONFIGURED' | 'ERROR';
  provider: string;
  model: string;
  message: string;
  toolCalls?: HacpToolCall[];
  missingKeys?: string[];
  error?: string;
  isFreeModel?: boolean;
  finishReason?: string;
  routerMode?: string;
  durationMs?: number;
  rawUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  getMissingKeys(): string[];
  generateWithTools(request: AICopilotRequest): Promise<AICopilotResponse>;
}
