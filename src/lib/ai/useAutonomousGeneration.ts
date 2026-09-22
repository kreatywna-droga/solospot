/**
 * useAutonomousGeneration.ts — React Hook for Autonomous Website Generation
 *
 * Connects LLM SitePlanner + Orchestrator + HacpBridge + BuilderDocument
 * into a single UI-driven flow.
 *
 * Planning is LLM-driven with deterministic fallback.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { BuilderDocument } from '../../../packages/builder-core/src';
import type { HacpToolCall } from './AIProviderTypes';
import type {
  SitePlan,
  GenerationPhase,
  GenerationSession,
} from './SitePlanTypes';
import { generateLLMSitePlan, type LLMPlannerResult } from './LLMSitePlanner';
import {
  SiteGenerationOrchestrator,
  type ToolResult,
} from './SiteGenerationOrchestrator';

interface GenerationState {
  phase: GenerationPhase;
  progress: number;
  message: string;
  session: GenerationSession | null;
  plan: SitePlan | null;
  toolResults: ToolResult[];
  isRunning: boolean;
  error: string | null;
  plannerResult: LLMPlannerResult | null;
}

interface UseAutonomousGenerationReturn {
  state: GenerationState;
  startGeneration: (brief: string) => Promise<void>;
  abortGeneration: () => void;
}

export function useAutonomousGeneration(
  document: BuilderDocument,
  executeToolCall: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>
): UseAutonomousGenerationReturn {
  const [state, setState] = useState<GenerationState>({
    phase: 'idle',
    progress: 0,
    message: '',
    session: null,
    plan: null,
    toolResults: [],
    isRunning: false,
    error: null,
    plannerResult: null,
  });

  const orchestratorRef = useRef<SiteGenerationOrchestrator | null>(null);

  const startGeneration = useCallback(async (brief: string) => {
    // Phase: Planning via LLM
    setState((prev) => ({
      ...prev,
      phase: 'planning',
      progress: 0,
      message: 'Analiza briefu i projektowanie strony...',
      isRunning: true,
      error: null,
      toolResults: [],
      plannerResult: null,
    }));

    let plannerResult: LLMPlannerResult;
    try {
      plannerResult = await generateLLMSitePlan(brief);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isRunning: false,
        phase: 'error',
        error: `Błąd planowania: ${error instanceof Error ? error.message : String(error)}`,
      }));
      return;
    }

    const plan = plannerResult.plan;
    const plannerLabel = plannerResult.plannerType === 'llm'
      ? `LLM (${plannerResult.modelUsed})`
      : 'Deterministyczny';

    setState((prev) => ({
      ...prev,
      phase: 'planning',
      progress: 5,
      message: `Plan wygenerowany (${plannerLabel}): ${plan.sections.length} sekcji, kierunek ${plan.visualDirection}`,
      plan,
      plannerResult,
    }));

    // Create orchestrator
    const orchestrator = new SiteGenerationOrchestrator(brief, {
      onPhaseChange: (phase, message) => {
        setState((prev) => ({ ...prev, phase, message }));
      },
      onProgress: (progress, message) => {
        setState((prev) => ({ ...prev, progress, message }));
      },
      onToolExecuted: (result) => {
        setState((prev) => ({
          ...prev,
          toolResults: [...prev.toolResults, result],
        }));
      },
      onError: (error) => {
        setState((prev) => ({ ...prev, error, isRunning: false }));
      },
    });

    orchestratorRef.current = orchestrator;

    try {
      const session = await orchestrator.execute(plan, executeToolCall, document);
      setState((prev) => ({
        ...prev,
        session,
        isRunning: false,
        phase: session.error ? 'error' : 'complete',
        progress: session.error ? prev.progress : 100,
        message: session.error
          ? `Błąd: ${session.error}`
          : `Generacja zakończona! Wykonano ${session.toolsExecuted} operacji. Plan: ${plannerLabel}.`,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isRunning: false,
        phase: 'error',
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }, [document, executeToolCall]);

  const abortGeneration = useCallback(() => {
    orchestratorRef.current?.abort();
    setState((prev) => ({
      ...prev,
      isRunning: false,
      phase: 'idle',
      message: 'Generacja przerwana.',
    }));
  }, []);

  return { state, startGeneration, abortGeneration };
}
