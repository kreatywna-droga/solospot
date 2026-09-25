'use client'

/**
 * MiniInspectorAI — Contextual AI Command Bar
 *
 * NOT a chat. NOT a second AI conversation.
 *
 * This is a small, contextual command bar attached to the selected element.
 * It sends commands to the MAIN AI CHAT (AiCopilotWorkspace) via
 * MiniInspectorCommandBus. The main chat is the source of truth for
 * conversation history. Mini Inspector has NO own conversation state.
 *
 * Pipeline:
 *   prompt / quick action
 *     → MiniInspectorCommandBus.submitCommand()
 *     → AiCopilotWorkspace (main chat)
 *     → HacpBridge.executePlan()
 *     → BuilderCommand[] → dispatch → BuilderDocument → Canvas
 *     → honest status (SUCCESS | FAILED | CLARIFY | TIMEOUT)
 *     → recorded in MAIN CHAT
 *
 * Mini Inspector shows ONLY:
 *   - target lock strip
 *   - single text input
 *   - execute button
 *   - minimal status badge
 *   - quick actions
 *   - undo/redo
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, X, Send, Loader2, Undo2, Redo2,
  CheckCircle2, AlertTriangle, Clock,
} from 'lucide-react'
import { useBuilder, useBuilderHistory } from '../state/BuilderProvider'
import { HacpBridge } from '@/lib/hacp/HacpBridge'
import type { HacpBuilderContext, HacpExecutionResult } from '@/lib/hacp/HacpTypes'
import {
  InspectorAIProvider,
  resolveInspectorAITarget,
  buildHacpContextForTarget,
  type InspectorAITargetLock,
} from './InspectorAIContext'
import { getQuickActionsForNodeType } from './miniInspectorQuickActions'
import {
  usePanelPosition,
  type ElementRect,
} from '../contextual/usePanelPosition'
import { MiniInspectorCommandBus, type MiniInspectorCommandStatus } from './MiniInspectorCommandBus'
import { beginLatencyTrace, finishTraceWithCanvas } from '@/lib/ai/LatencyTrace'

export interface MiniInspectorAIProps {
  sectionId: string
  pageId: string
  onClose?: () => void
  defaultOpen?: boolean
  elementRect?: ElementRect | null
}

type MiniInspectorStatus = 'IDLE' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CLARIFY'

function mapResultStatus(result: HacpExecutionResult): MiniInspectorStatus {
  const hasCommands = result.commandsToDispatch.length > 0
  const status = result.executionStatus
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

export function MiniInspectorAI({
  sectionId,
  pageId,
  onClose,
  defaultOpen = true,
  elementRect,
}: MiniInspectorAIProps) {
  const { document: builderDoc, dispatch, canvas } = useBuilder()
  const { canUndo, canRedo, undo, redo } = useBuilderHistory()

  const [open, setOpen] = React.useState(defaultOpen)
  const [prompt, setPrompt] = React.useState('')
  const [status, setStatus] = React.useState<MiniInspectorStatus>('IDLE')
  // Honest CLARIFY detail — verbatim bridge reason (never a generic string),
  // e.g. "…nie zmienia tekstu…" for TEXT_VALUE_REJECTED.
  const [clarifyDetail, setClarifyDetail] = React.useState('')
  const [mountEl, setMountEl] = React.useState<HTMLElement | null>(null)
  const [anchorRect, setAnchorRect] = React.useState<ElementRect | null>(
    elementRect ?? null
  )
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const bridge = React.useMemo(() => HacpBridge.getInstance(), [])

  // Mount into builder workspace portal
  React.useEffect(() => {
    setMountEl(
      document.querySelector<HTMLElement>('[data-builder-workspace]') ??
        document.body
    )
  }, [])

  // TARGET LOCK — re-resolve whenever selection / document / ids change
  const target: InspectorAITargetLock | null = React.useMemo(
    () => resolveInspectorAITarget(builderDoc, sectionId, pageId),
    [builderDoc, sectionId, pageId]
  )

  // Subscribe to command bus status
  React.useEffect(() => {
    const unsub = MiniInspectorCommandBus.subscribeToStatus((newStatus, targetNodeId) => {
      if (targetNodeId === sectionId || !targetNodeId) {
        const mapped = newStatus === 'EXECUTING' ? 'EXECUTING' :
          newStatus === 'SUCCESS' ? 'SUCCESS' :
          newStatus === 'FAILED' ? 'FAILED' :
          newStatus === 'CLARIFY' ? 'CLARIFY' :
          newStatus === 'TIMEOUT' ? 'TIMEOUT' : 'IDLE'
        setStatus(mapped)
      }
    })
    return unsub
  }, [sectionId])

  // ANCHOR — live viewport rect of the selected node
  const measureAnchor = React.useCallback(() => {
    if (typeof document === 'undefined') return
    const el =
      document.querySelector<HTMLElement>(
        `[data-node-id="${sectionId.replace(/"/g, '\\"')}"]`
      ) ||
      document.querySelector<HTMLElement>(
        `[data-section-id="${sectionId.replace(/"/g, '\\"')}"]`
      )
    if (el) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) {
        setAnchorRect({ x: r.left, y: r.top, width: r.width, height: r.height })
        return
      }
    }
    if (elementRect) setAnchorRect(elementRect)
  }, [sectionId, elementRect])

  React.useLayoutEffect(() => {
    if (!open) return
    measureAnchor()
  }, [open, measureAnchor, canvas.zoom, canvas.selectedSectionId])

  React.useEffect(() => {
    if (!open) return
    const onViewportChange = () => measureAnchor()
    window.addEventListener('scroll', onViewportChange, { passive: true, capture: true })
    window.addEventListener('resize', onViewportChange, { passive: true })
    const tick = window.setInterval(onViewportChange, 200)
    return () => {
      window.removeEventListener('scroll', onViewportChange, { capture: true } as EventListenerOptions)
      window.removeEventListener('resize', onViewportChange)
      window.clearInterval(tick)
    }
  }, [open, measureAnchor])

  const position = usePanelPosition(anchorRect, open, {
    panelWidth: 360,
    panelMinHeight: 220,
    gap: 12,
    viewportMargin: 16,
    avoidOverlap: true,
  })

  // Selection change: reset status so stale SUCCESS is not shown against new target
  const liveSelectedId = canvas.selectedSectionId
  React.useEffect(() => {
    setStatus((prev) => (prev === 'SUCCESS' || prev === 'FAILED' ? 'IDLE' : prev))
    setClarifyDetail('')
  }, [sectionId, liveSelectedId])

  const quickActions = React.useMemo(
    () => getQuickActionsForNodeType(target?.nodeType),
    [target?.nodeType]
  )

  /**
   * Submit command to the main AI chat via the command bus.
   * Mini Inspector does NOT execute directly — it delegates to the main chat.
   */
  const submitCommand = React.useCallback(async (text: string) => {
    const clean = text.trim()
    if (!clean || !target) return

    // GATE v1.0 PHASE 1 — controlled latency instrumentation (no-op when off).
    const trace = beginLatencyTrace({ source: 'mini-inspector', prompt: clean })
    trace.stageStart('UI')

    setPrompt('')
    setStatus('EXECUTING')
    setClarifyDetail('')

    try {
      const context: HacpBuilderContext = buildHacpContextForTarget(
        builderDoc,
        target,
        {
          viewport:
            (canvas.viewport?.label as HacpBuilderContext['viewport']) || 'DESKTOP',
          availableCapabilitiesCount: bridge.getCapabilities().filter((c) => c.available).length,
          breakpoint:
            (canvas.viewport?.label || 'DESKTOP').includes('MOBILE')
              ? 'mobile'
              : (canvas.viewport?.label || 'DESKTOP').includes('TABLET')
                ? 'tablet'
                : 'desktop',
          recentMutation: undefined,
        } as Partial<HacpBuilderContext>
      )

      const command = {
        source: 'mini-inspector' as const,
        targetNodeId: target.nodeId,
        targetNodeType: target.nodeType,
        targetPageId: target.pageId,
        targetSectionId: target.sectionId,
        targetLabel: target.label,
        prompt: clean,
        context,
        document: builderDoc,
        timestamp: Date.now(),
      }

      trace.stageEnd('UI')

      const result = await MiniInspectorCommandBus.submitCommand(command, trace)

      if (result) {
        const nextStatus = mapResultStatus(result)
        setStatus(nextStatus)
        setClarifyDetail(nextStatus === 'CLARIFY' ? result.message || '' : '')

        // Honest dispatch gate — same as AiCopilotWorkspace
        if (result.intent === 'EXECUTE' && result.commandsToDispatch.length > 0) {
          trace.stageStart('DISPATCH')
          for (const cmd of result.commandsToDispatch) {
            dispatch(cmd)
          }
          trace.stageEnd('DISPATCH')
        }

        if (result.shouldTriggerUndo || result.intent === 'UNDO') {
          if (canUndo) undo()
        }
        if (result.shouldTriggerRedo || result.intent === 'REDO') {
          if (canRedo) redo()
        }
        trace.stageStart('RESPONSE')
        trace.stageEnd('RESPONSE')
      } else {
        setStatus('FAILED')
      }
    } catch (err: any) {
      setStatus('FAILED')
      trace.note('exception')
    } finally {
      // CANVAS = dispatch → commit → paint. Measured on the next frames so a
      // disabled trace still returns immediately (finish() is a no-op then).
      finishTraceWithCanvas(trace)
    }
  }, [
    bridge,
    builderDoc,
    canvas.viewport,
    canRedo,
    canUndo,
    dispatch,
    redo,
    target,
    undo,
  ])

  const handleSend = React.useCallback(() => {
    void submitCommand(prompt)
  }, [submitCommand, prompt])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!mountEl || !sectionId) return null

  const statusLabel: Record<MiniInspectorStatus, string> = {
    IDLE: 'GOTOWY',
    EXECUTING: 'PRACUJE…',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    TIMEOUT: 'TIMEOUT',
    CLARIFY: 'CLARIFY',
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="mini-inspector-ai"
          data-ai-target={target?.nodeId || ''}
          data-ai-status={status}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[10000] pointer-events-auto w-[360px] max-w-[calc(100vw-2rem)]"
          style={
            anchorRect
              ? {
                  left: position.x,
                  top: position.y,
                  maxHeight: position.maxHeight,
                }
              : { right: 24, bottom: 24 }
          }
          data-ai-placement={anchorRect ? position.placement : 'fallback'}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className="bg-[#18181B] border border-[#44444B] rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={
              anchorRect
                ? { maxHeight: position.maxHeight }
                : { maxHeight: 'min(400px, 60vh)' }
            }
          >
            {/* Header — minimal */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#202024] border-b border-[#3A3A40] flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#D9A86C] to-[#F2C27F] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-[#18181B]" />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                    AI
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {target
                      ? `${target.profileLabel} · ${target.nodeId}`
                      : 'brak targetu'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span
                  data-testid="mini-inspector-ai-status"
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    status === 'SUCCESS'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : status === 'FAILED'
                        ? 'bg-red-500/15 border-red-500/40 text-red-400'
                        : status === 'EXECUTING'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse'
                          : status === 'CLARIFY'
                            ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                            : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  {statusLabel[status]}
                </span>
                <button
                  onClick={() => {
                    setOpen(false)
                    onClose?.()
                  }}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10"
                  title="Zwiń"
                  data-testid="mini-inspector-ai-collapse"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Target lock strip */}
            <div
              data-testid="mini-inspector-ai-target"
              className="px-3 py-1.5 bg-[#121214] border-b border-[#2A2A30] text-[10px] font-mono text-zinc-500 flex items-center gap-2 flex-shrink-0"
            >
              <span className="text-[#F2C27F]">TARGET:</span>
              <span className="truncate text-zinc-300">
                {target
                  ? `${target.nodeType} ${target.nodeId} (page ${target.pageId})`
                  : '—'}
              </span>
            </div>

            {/* Body — NO chat history, NO turns, NO transcript */}
            <InspectorAIProvider target={target}>
              <div className="flex-1 flex flex-col min-h-[60px]">
                {/* Status indicator during execution */}
                {status === 'EXECUTING' && (
                  <div className="px-3 py-2 flex items-center gap-1.5 text-[10px] text-amber-300 flex-shrink-0">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Wykonuję polecenie na {target?.nodeType}…
                  </div>
                )}

                {/* Success/Failed brief indicator */}
                {status === 'SUCCESS' && (
                  <div className="px-3 py-2 flex items-center gap-1.5 text-[10px] text-emerald-400 flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    Polecenie wykonane pomyślnie
                  </div>
                )}

                {status === 'FAILED' && (
                  <div className="px-3 py-2 flex items-center gap-1.5 text-[10px] text-red-400 flex-shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    Nie udało się wykonać polecenia
                  </div>
                )}

                {status === 'CLARIFY' && (
                  <div
                    data-testid="mini-inspector-ai-clarify"
                    className="px-3 py-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-sky-300 flex-shrink-0"
                  >
                    <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="min-w-0 break-words">
                      {clarifyDetail || 'Potrzebuję więcej informacji'}
                    </span>
                  </div>
                )}

                {/* Quick actions */}
                <div
                  data-testid="mini-inspector-ai-quick-actions"
                  className="px-3 py-2 border-t border-[#2A2A30] flex flex-wrap gap-1 flex-shrink-0"
                >
                  {quickActions.map((a) => (
                    <button
                      key={a.id}
                      disabled={status === 'EXECUTING' || !target}
                      onClick={() => void submitCommand(a.prompt)}
                      data-testid={`mini-qa-${a.id}`}
                      className="px-2 py-1 rounded-md bg-white/[0.04] hover:bg-[#D9A86C]/25 hover:text-[#F2C27F] border border-white/5 text-[10px] text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={a.prompt}
                    >
                      <Sparkles className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />
                      {a.label}
                    </button>
                  ))}
                </div>

                {/* Composer — single input */}
                <div className="px-3 py-2 border-t border-[#3A3A40] bg-[#202024] flex-shrink-0">
                  <div className="flex items-end gap-1.5">
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        target
                          ? `Np. „Zrób ten ${target.nodeType} bardziej premium…"`
                          : 'Zaznacz element…'
                      }
                      data-testid="mini-inspector-ai-input"
                      disabled={status === 'EXECUTING' || !target}
                      className="flex-1 resize-none rounded-lg bg-[#18181B] border border-[#3A3A40] px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D9A86C] disabled:opacity-50"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={handleSend}
                        disabled={status === 'EXECUTING' || !target || !prompt.trim()}
                        data-testid="mini-inspector-ai-send"
                        className="p-2 rounded-lg bg-[#D9A86C] hover:bg-[#B8893A] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Wyślij do AI (HACP)"
                      >
                        {status === 'EXECUTING' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={undo}
                          disabled={!canUndo}
                          data-testid="mini-inspector-ai-undo"
                          className="p-1.5 rounded bg-white/[0.04] hover:bg-white/10 text-zinc-400 disabled:opacity-30"
                          title="Undo"
                        >
                          <Undo2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={redo}
                          disabled={!canRedo}
                          data-testid="mini-inspector-ai-redo"
                          className="p-1.5 rounded bg-white/[0.04] hover:bg-white/10 text-zinc-400 disabled:opacity-30"
                          title="Redo"
                        >
                          <Redo2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </InspectorAIProvider>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    mountEl
  )
}

/**
 * Compact [✨ AI] trigger used inside Mini Inspector headers / QuickToolbar.
 */
export function MiniInspectorAIButton({
  onClick,
  active = false,
  label = 'AI',
}: {
  onClick: () => void
  active?: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      data-testid="mini-inspector-ai-open"
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
        active
          ? 'bg-[#D9A86C] border-[#D9A86C] text-[#18181B]'
          : 'bg-[#D9A86C]/15 border-[#D9A86C]/40 text-[#F2C27F] hover:bg-[#D9A86C]/30'
      }`}
      title="Otwórz AI dla tego elementu"
    >
      <Sparkles className="w-3 h-3" />
      <span>{label}</span>
    </button>
  )
}
