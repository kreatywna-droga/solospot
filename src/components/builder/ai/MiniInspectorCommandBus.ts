'use client'

/**
 * MiniInspectorCommandBus — Mini Inspector command channel + status source.
 *
 * Architecture (GATE v6 — INDEPENDENT EXECUTION FIX):
 *   MiniInspectorAI ──submitCommand()──→ MiniInspectorCommandBus
 *                                              │
 *                                              ▼
 *                              SharedExecutionService.execute()
 *                              (runs HacpBridge.executePlan ALWAYS —
 *                               independent of any UI subscriber / Main Chat state)
 *                                              │
 *                           ┌──────────────────┴──────────────────┐
 *                           ▼                                     ▼
 *                  service history entry              statusSubscribers (observers)
 *                  (Main Chat history shows it)       (Mini Inspector status UI)
 *
 * Subscribers are OBSERVERS ONLY — execution never depends on them
 * (PHASE 1 ROOT CAUSE: previously Promise.allSettled([]) with Main Chat closed
 *  returned null → FAILED with zero mutations).
 * The bus NEVER dispatches; MiniInspectorAI dispatches commands once itself.
 */

import type { HacpBuilderContext, HacpExecutionResult } from '@/lib/hacp/HacpTypes'
import { SharedExecutionService } from '@/lib/ai/SharedExecutionService'
import type { BuilderDocument } from '../../../../packages/builder-core/src'
import type { InspectorAITargetLock } from './InspectorAIContext'

export type MiniInspectorCommandStatus = 'IDLE' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'BLOCKED' | 'CLARIFY'

export interface MiniInspectorCommand {
  source: 'mini-inspector'
  targetNodeId: string
  targetNodeType: string
  targetPageId: string
  targetSectionId: string
  targetLabel: string
  prompt: string
  context: HacpBuilderContext
  document: BuilderDocument
  timestamp: number
}

export interface MiniInspectorCommandResult {
  command: MiniInspectorCommand
  result: HacpExecutionResult | null
  error: string | null
  status: MiniInspectorCommandStatus
  timestamp: number
}

type CommandSubscriber = (command: MiniInspectorCommand) => Promise<HacpExecutionResult | null>
type StatusSubscriber = (status: MiniInspectorCommandStatus, targetNodeId: string | null) => void

class MiniInspectorCommandBusClass {
  private static instance: MiniInspectorCommandBusClass | null = null
  private subscribers: Set<CommandSubscriber> = new Set()
  private statusSubscribers: Set<StatusSubscriber> = new Set()
  private currentStatus: MiniInspectorCommandStatus = 'IDLE'
  private currentTargetNodeId: string | null = null
  private executingCommand: MiniInspectorCommand | null = null

  private constructor() {}

  static getInstance(): MiniInspectorCommandBusClass {
    if (!MiniInspectorCommandBusClass.instance) {
      MiniInspectorCommandBusClass.instance = new MiniInspectorCommandBusClass()
    }
    return MiniInspectorCommandBusClass.instance
  }

  /**
   * Submit a command from Mini Inspector.
   * Delegates to SharedExecutionService — executes even with 0 subscribers
   * (Main Chat closed). Returns the execution result or null on failure.
   */
  async submitCommand(command: MiniInspectorCommand): Promise<HacpExecutionResult | null> {
    this.setStatus('EXECUTING', command.targetNodeId)
    this.executingCommand = command

    try {
      const result = await SharedExecutionService.execute({
        source: 'mini-inspector',
        prompt: command.prompt,
        context: command.context,
        document: command.document,
        selectedModelId:
          (typeof window !== 'undefined' && window.sessionStorage?.getItem('solospot_ai_model')) ||
          undefined,
      })

      if (!result) {
        this.setStatus('FAILED', command.targetNodeId)
        return null
      }

      const status = this.mapExecutionStatus(result)
      this.setStatus(status, command.targetNodeId)
      this.notifyObservers(command, result)
      return result
    } catch (err: any) {
      this.setStatus('FAILED', command.targetNodeId)
      return null
    } finally {
      this.executingCommand = null
    }
  }

  /** Observers only — their return values are ignored (execution is done). */
  private notifyObservers(command: MiniInspectorCommand, result: HacpExecutionResult): void {
    this.subscribers.forEach((sub) => {
      try {
        void Promise.resolve(sub(command)).catch(() => undefined)
      } catch (err) {
        console.error('[MiniInspectorCommandBus] Observer error:', err)
      }
    })
    void result
  }

  /**
   * Subscribe to receive Mini Inspector commands.
   * Returns unsubscribe function.
   */
  subscribe(subscriber: CommandSubscriber): () => void {
    this.subscribers.add(subscriber)
    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  /**
   * Subscribe to status changes.
   * Returns unsubscribe function.
   */
  subscribeToStatus(subscriber: StatusSubscriber): () => void {
    this.statusSubscribers.add(subscriber)
    return () => {
      this.statusSubscribers.delete(subscriber)
    }
  }

  /**
   * Get current execution status.
   */
  getStatus(): MiniInspectorCommandStatus {
    return this.currentStatus
  }

  /**
   * Get the currently executing command's target node ID.
   */
  getCurrentTargetNodeId(): string | null {
    return this.currentTargetNodeId
  }

  /**
   * Check if a command is currently executing.
   */
  isExecuting(): boolean {
    return this.currentStatus === 'EXECUTING'
  }

  /**
   * Get the currently executing command.
   */
  getExecutingCommand(): MiniInspectorCommand | null {
    return this.executingCommand
  }

  /**
   * Reset status to IDLE.
   */
  reset(): void {
    this.setStatus('IDLE', null)
    this.executingCommand = null
  }

  private setStatus(status: MiniInspectorCommandStatus, targetNodeId: string | null): void {
    this.currentStatus = status
    this.currentTargetNodeId = targetNodeId
    this.statusSubscribers.forEach((sub) => {
      try {
        sub(status, targetNodeId)
      } catch (err) {
        console.error('[MiniInspectorCommandBus] Status subscriber error:', err)
      }
    })
  }

  private mapExecutionStatus(result: HacpExecutionResult): MiniInspectorCommandStatus {
    const hasCommands = result.commandsToDispatch.length > 0
    const status = result.executionStatus

    if (/timeout|przekrocz|czas odpowiedzi/i.test(result.errorReason || '')) return 'TIMEOUT'
    if (status === 'CLARIFY') return 'CLARIFY'
    if (status === 'FAILED' || status === 'ERROR' || status === 'BLOCKED') return 'FAILED'
    if (status === 'EXECUTED' && hasCommands) return 'SUCCESS'
    if (result.intent === 'EXECUTE' && hasCommands) return 'SUCCESS'
    if (result.intent === 'EXECUTE' && !hasCommands) return 'FAILED'
    if (result.intent === 'CLARIFY') return 'CLARIFY'
    if (result.success && hasCommands) return 'SUCCESS'
    if (result.success && !hasCommands) return 'FAILED'
    return hasCommands ? 'SUCCESS' : 'FAILED'
  }
}

export const MiniInspectorCommandBus = MiniInspectorCommandBusClass.getInstance()
