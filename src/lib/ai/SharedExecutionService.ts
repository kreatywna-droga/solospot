'use client'

/**
 * SharedExecutionService — ONE execution pipeline for ALL AI entry points
 * (Main Chat + Mini Inspector + future surfaces).
 *
 * WHY (PHASE 1 root cause): execution used to live inside Main Chat's mount
 * effect via MiniInspectorCommandBus subscribers. Main Chat closed → zero
 * subscribers → Mini Inspector commands silently failed with no mutation.
 *
 * CONTRACT (PHASE 2/3/11):
 * - execute() ALWAYS runs HacpBridge.executePlan regardless of subscribers.
 * - The service NEVER dispatches BuilderCommands. Callers own their own
 *   dispatch exactly once (Main Chat → AiCopilotWorkspace, Mini Inspector →
 *   MiniInspectorAI), preserving the existing double-dispatch fix.
 * - Every command is recorded in shared history (PHASE 11: Main Chat history
 *   must show commands issued from Mini Inspector, and vice versa).
 * - Conversation context is shared (cap 25 entries).
 */

import type {
  HacpBuilderContext,
  HacpConversationContext,
  HacpExecutionCard,
  HacpExecutionResult,
  HacpExecutionStatus,
  HacpIntentType,
  HacpEngineeringScope,
} from '@/lib/hacp/HacpTypes';
import type { HacpBridge } from '@/lib/hacp/HacpBridge';
import type { BuilderDocument } from '../../../packages/builder-core/src';
import type { ChatMessageAttachment } from '@/lib/ai/AIProviderTypes';

export type SharedAiSource = 'main-chat' | 'mini-inspector';

export interface SharedAiHistoryEntry {
  id: string;
  role: 'user' | 'ai' | 'error';
  text: string;
  timestamp: number;
  source: SharedAiSource;
  intent?: HacpIntentType;
  scope?: HacpEngineeringScope;
  executionStatus?: HacpExecutionStatus;
  executionCard?: HacpExecutionCard;
  toolNames?: string[];
  targetNodeId?: string | null;
  attachments?: ChatMessageAttachment[];
}

export interface SharedExecuteOptions {
  source: SharedAiSource;
  prompt: string;
  context: HacpBuilderContext;
  document: BuilderDocument;
  routerMode?: 'AUTO' | 'FREE' | 'PAID' | 'MANUAL';
  selectedModelId?: string;
  onProgress?: Parameters<HacpBridge['executePlan']>[6];
  attachments?: ChatMessageAttachment[];
}

export type SharedHistoryListener = (entries: SharedAiHistoryEntry[]) => void;

const MAX_HISTORY_ENTRIES = 200;
const MAX_CONVERSATION_ENTRIES = 25;
const MAX_CONCURRENT_EXECUTIONS = 3;

let entrySeq = 0;

class SharedExecutionServiceClass {
  private static instance: SharedExecutionServiceClass | null = null;

  private entries: SharedAiHistoryEntry[] = [];
  private listeners: Set<SharedHistoryListener> = new Set();
  private conversationContext: HacpConversationContext = { history: [] };
  private running = 0;
  private waiters: Array<() => void> = [];

  private constructor() {}

  static getInstance(): SharedExecutionServiceClass {
    if (!SharedExecutionServiceClass.instance) {
      SharedExecutionServiceClass.instance = new SharedExecutionServiceClass();
    }
    return SharedExecutionServiceClass.instance;
  }

  /** Execution is independent of UI mount state (PHASE 2). */
  async execute(opts: SharedExecuteOptions): Promise<HacpExecutionResult | null> {
    await this.acquireSlot();

    this.record({
      role: 'user',
      text: opts.prompt,
      source: opts.source,
      attachments: opts.attachments,
    });

    try {
      const { HacpBridge } = await import('@/lib/hacp/HacpBridge');
      const bridge = HacpBridge.getInstance();
      const result = await bridge.executePlan(
        opts.prompt,
        opts.context,
        opts.document,
        this.conversationContext,
        opts.routerMode || 'AUTO',
        opts.selectedModelId,
        opts.onProgress,
        opts.attachments,
        opts.source
      );

      this.mergeConversation(opts.prompt, result);
      this.record({
        role: 'ai',
        text: result.message,
        source: opts.source,
        intent: result.intent,
        scope: result.scope,
        executionStatus: result.executionStatus,
        executionCard: result.executionCard,
        toolNames: (result.commandsToDispatch || []).map((c) => c.type).filter(Boolean),
        targetNodeId: opts.context.selectedNodeId || null,
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.mergeConversation(opts.prompt, null, message);
      this.record({
        role: 'error',
        text: message,
        source: opts.source,
        targetNodeId: opts.context.selectedNodeId || null,
      });
      return null;
    } finally {
      this.releaseSlot();
    }
  }

  getEntries(): SharedAiHistoryEntry[] {
    return [...this.entries];
  }

  subscribeHistory(listener: SharedHistoryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getConversationContext(): HacpConversationContext {
    return this.conversationContext;
  }

  /** Test/diagnostic helper — clears shared state. */
  reset(): void {
    this.entries = [];
    this.conversationContext = { history: [] };
    this.listeners.clear();
  }

  private record(partial: Omit<SharedAiHistoryEntry, 'id' | 'timestamp'>): SharedAiHistoryEntry {
    const entry: SharedAiHistoryEntry = {
      id: `shared-ai-${Date.now()}-${entrySeq++}`,
      timestamp: Date.now(),
      ...partial,
    };
    this.entries.push(entry);
    if (this.entries.length > MAX_HISTORY_ENTRIES) {
      this.entries = this.entries.slice(-MAX_HISTORY_ENTRIES);
    }
    const snapshot = [...this.entries];
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[SharedExecutionService] history listener error:', err);
      }
    });
    return entry;
  }

  private mergeConversation(
    prompt: string,
    result: HacpExecutionResult | null,
    errorMessage?: string
  ): void {
    const next: HacpConversationContext = {
      ...this.conversationContext,
      ...(result?.updatedConversationContext || {}),
      history: [...(this.conversationContext.history || [])],
    };
    next.history.push({
      role: 'user',
      text: prompt,
      intent: result?.intent,
      timestamp: new Date().toISOString(),
    });
    next.history.push({
      role: 'ai',
      text: result?.message || errorMessage || '',
      intent: result?.intent,
      timestamp: new Date().toISOString(),
    });
    if (next.history.length > MAX_CONVERSATION_ENTRIES) {
      next.history = next.history.slice(-MAX_CONVERSATION_ENTRIES);
    }
    this.conversationContext = next;
  }

  private async acquireSlot(): Promise<void> {
    if (this.running < MAX_CONCURRENT_EXECUTIONS) {
      this.running += 1;
      return;
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve));
  }

  private releaseSlot(): void {
    const next = this.waiters.shift();
    if (next) {
      next();
    } else {
      this.running -= 1;
    }
  }
}

export const SharedExecutionService = SharedExecutionServiceClass.getInstance();
export type SharedExecutionService = SharedExecutionServiceClass;
