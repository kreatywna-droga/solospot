'use client'

/**
 * MiniInspectorAI — shared AI window for every Mini Inspector
 *
 * Visible, openable, target-locked AI panel. ONE implementation for
 * Text, Button, Image, Card, Section, Hero, and all other node types.
 *
 * Pipeline (gate §4 / §15):
 *   prompt / quick action
 *     → InspectorAIContext (Target Lock)
 *     → HacpBridge.executePlan
 *     → BuilderCommand[] → dispatch → BuilderDocument → Canvas
 *     → honest status (SUCCESS | PARTIAL | FAILED | CLARIFY)
 *
 * NEVER claims SUCCESS when commandsToDispatch === 0 or verification failed.
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, X, Send, Loader2, Undo2, Redo2,
  CheckCircle2, AlertTriangle, MessageCircle, Zap,
} from 'lucide-react'
import { useBuilder, useBuilderHistory } from '../state/BuilderProvider'
import { HacpBridge } from '@/lib/hacp/HacpBridge'
import type {
  HacpBuilderContext,
  HacpConversationContext,
  HacpExecutionResult,
} from '@/lib/hacp/HacpTypes'
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

export interface MiniInspectorAIProps {
  sectionId: string
  pageId: string
  onClose?: () => void
  /** Force-open on mount (QuickToolbar → AI) */
  defaultOpen?: boolean
  /**
   * Viewport-space rect of the selected node (from SelectionOverlay).
   * Used as fallback when live DOM measurement fails. Live measure by
   * `[data-node-id]` / `[data-section-id]` is preferred so the window
   * follows scroll/zoom even when this snapshot is stale.
   */
  elementRect?: ElementRect | null
}

type AiStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'CLARIFY'

interface AiTurn {
  id: string
  role: 'user' | 'ai' | 'system'
  text: string
  status?: AiStatus
  toolNames?: string[]
}

function mapResultStatus(result: HacpExecutionResult): AiStatus {
  const hasCommands = result.commandsToDispatch.length > 0
  const status = result.executionStatus
  if (status === 'CLARIFY') return 'CLARIFY'
  if (status === 'FAILED' || status === 'ERROR' || status === 'BLOCKED') return 'FAILED'
  if (status === 'EXECUTED' && hasCommands) return 'SUCCESS'
  if (result.intent === 'EXECUTE' && hasCommands) return 'SUCCESS'
  if (result.intent === 'EXECUTE' && !hasCommands) return 'FAILED'
  if (result.intent === 'CLARIFY') return 'CLARIFY'
  if (result.success && hasCommands) return 'SUCCESS'
  if (result.success && !hasCommands) return 'PARTIAL'
  return hasCommands ? 'PARTIAL' : 'CLARIFY'
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
  const [running, setRunning] = React.useState(false)
  const [status, setStatus] = React.useState<AiStatus>('IDLE')
  const [turns, setTurns] = React.useState<AiTurn[]>([])
  const [mountEl, setMountEl] = React.useState<HTMLElement | null>(null)
  const [anchorRect, setAnchorRect] = React.useState<ElementRect | null>(
    elementRect ?? null
  )
  const [conversation, setConversation] = React.useState<HacpConversationContext>({
    history: [],
  })
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const turnsEndRef = React.useRef<HTMLDivElement>(null)

  const bridge = React.useMemo(() => HacpBridge.getInstance(), [])

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

  // ANCHOR — live viewport rect of the selected node (§2 reuse geometry model)
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

  // Re-measure on open, selection change, zoom (canvas.zoom dep), element move
  React.useLayoutEffect(() => {
    if (!open) return
    measureAnchor()
  }, [open, measureAnchor, canvas.zoom, canvas.selectedSectionId])

  // Follow window / workspace scroll + resize while open
  // (scroll does not bubble — capture catches inner canvas scroll containers)
  React.useEffect(() => {
    if (!open) return
    const onViewportChange = () => measureAnchor()
    window.addEventListener('scroll', onViewportChange, { passive: true, capture: true })
    window.addEventListener('resize', onViewportChange, { passive: true })
    return () => {
      window.removeEventListener('scroll', onViewportChange, { capture: true } as EventListenerOptions)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [open, measureAnchor])

  // Collision placement — same engine as ContextualSettingsPanel (§2 REUSE)
  // avoidOverlap: sit NEXT TO the selected node, never on top of it (gate)
  const position = usePanelPosition(anchorRect, open, {
    panelWidth: 360,
    panelMinHeight: 220,
    gap: 12,
    viewportMargin: 16,
    avoidOverlap: true,
  })

  // Selection change: keep panel bound to the LIVE selected node (gate §14)
  const liveSelectedId = canvas.selectedSectionId
  React.useEffect(() => {
    // sectionId prop is authoritative from SelectionOverlay; when it changes
    // we already re-resolve via useMemo. Reset status so stale SUCCESS is not
    // shown against the new target.
    setStatus((prev) => (prev === 'SUCCESS' || prev === 'PARTIAL' ? 'IDLE' : prev))
  }, [sectionId, liveSelectedId])

  React.useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ block: 'end' })
  }, [turns, running])

  const quickActions = React.useMemo(
    () => getQuickActionsForNodeType(target?.nodeType),
    [target?.nodeType]
  )

  const executePrompt = React.useCallback(
    async (text: string) => {
      const clean = text.trim()
      if (!clean || running) return
      if (!target) {
        setTurns((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'system',
            text: 'Brak zaznaczonego elementu. Zaznacz element na Canvasie, aby użyć AI.',
            status: 'FAILED',
          },
        ])
        setStatus('FAILED')
        return
      }

      const userTurn: AiTurn = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: clean,
      }
      setTurns((prev) => [...prev, userTurn])
      setPrompt('')
      setRunning(true)
      setStatus('RUNNING')

      try {
        const context: HacpBuilderContext = buildHacpContextForTarget(
          builderDoc,
          target,
          {
            viewport:
              (canvas.viewport?.label as HacpBuilderContext['viewport']) ||
              'DESKTOP',
            availableCapabilitiesCount: bridge.getCapabilities().filter((c) => c.available).length,
            breakpoint:
              (canvas.viewport?.label || 'DESKTOP').includes('MOBILE')
                ? 'mobile'
                : (canvas.viewport?.label || 'DESKTOP').includes('TABLET')
                  ? 'tablet'
                  : 'desktop',
            recentMutation: turns.length
              ? turns[turns.length - 1].text.slice(0, 80)
              : undefined,
          } as Partial<HacpBuilderContext>
        )

        const result = await bridge.executePlan(
          clean,
          context,
          builderDoc,
          conversation
        )

        const nextStatus = mapResultStatus(result)
        setStatus(nextStatus)

        // Honest dispatch gate — same as AiCopilotWorkspace (gate §12)
        if (result.intent === 'EXECUTE' && result.commandsToDispatch.length > 0) {
          for (const cmd of result.commandsToDispatch) {
            dispatch(cmd)
          }
        }

        if (result.updatedConversationContext) {
          setConversation((prev) => ({
            ...prev,
            ...result.updatedConversationContext,
            history: [
              ...prev.history,
              { role: 'user' as const, text: clean, timestamp: new Date().toISOString() },
              {
                role: 'ai' as const,
                text: result.message,
                intent: result.intent,
                timestamp: new Date().toISOString(),
              },
            ].slice(-25),
          }))
        }

        if (result.shouldTriggerUndo || result.intent === 'UNDO') {
          if (canUndo) undo()
        }
        if (result.shouldTriggerRedo || result.intent === 'REDO') {
          if (canRedo) redo()
        }

        const toolNames = (result.executionCard?.steps || [])
          .map((s) => s.name.replace(/^AI Tool Call:\s*/i, '').trim())
          .filter(Boolean)

        const messageText =
          result.message && result.message.trim().length > 0
            ? result.message.trim()
            : 'Model nie zwrócił odpowiedzi. Spróbuj ponownie.'

        setTurns((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: messageText,
            status: nextStatus,
            toolNames: toolNames.length ? toolNames : undefined,
          },
        ])
      } catch (err: any) {
        setStatus('FAILED')
        setTurns((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'system',
            text: `Nie udało się wykonać operacji: ${err?.message || 'błąd HACP'}`,
            status: 'FAILED',
          },
        ])
      } finally {
        setRunning(false)
      }
    },
    [
      bridge,
      builderDoc,
      canvas.viewport,
      canRedo,
      canUndo,
      conversation,
      dispatch,
      redo,
      running,
      target,
      turns,
      undo,
    ]
  )

  const handleSend = React.useCallback(() => {
    void executePrompt(prompt)
  }, [executePrompt, prompt])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!mountEl || !sectionId) return null

  const statusLabel: Record<AiStatus, string> = {
    IDLE: 'GOTOWY',
    RUNNING: 'PRACUJE…',
    SUCCESS: 'SUCCESS',
    PARTIAL: 'PARTIAL',
    FAILED: 'FAILED',
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
              : // Fallback only when the selected node cannot be measured
                // (removed from DOM) — never the default resting place.
                { right: 24, bottom: 24 }
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
                : { maxHeight: 'min(520px, 70vh)' }
            }
          >
            {/* Header — always visible AI access */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#202024] border-b border-[#3A3A40] flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-md bg-gradient-to-br from-[#D9A86C] to-[#F2C27F] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#18181B]" />
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
                        : status === 'PARTIAL'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : status === 'CLARIFY'
                            ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                            : status === 'RUNNING'
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse'
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
                  title="Zwiń AI"
                  data-testid="mini-inspector-ai-collapse"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Target lock strip (gate §6) */}
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

            {/* Body */}
            <InspectorAIProvider target={target}>
              <div className="flex-1 overflow-y-auto builder-canvas-scrollbar px-3 py-2 space-y-2 min-h-[80px]">
                {turns.length === 0 && (
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Zapytaj AI o zmianę tego elementu lub wybierz akcję poniżej.
                    Operacje przechodzą przez HACP → BuilderDocument → Canvas.
                  </p>
                )}
                {turns.map((t) => (
                  <div
                    key={t.id}
                    data-testid={`mini-inspector-ai-turn-${t.role}`}
                    className={`text-[11px] leading-snug rounded-lg px-2.5 py-2 ${
                      t.role === 'user'
                        ? 'bg-[#D9A86C]/15 border border-[#D9A86C]/25 text-[#F5F1EA] ml-6'
                        : t.role === 'ai'
                          ? 'bg-[#202024] border border-[#3A3A40] text-zinc-200'
                          : 'bg-red-500/10 border border-red-500/25 text-red-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{t.text}</div>
                    {t.status && (
                      <div
                        data-testid="mini-inspector-ai-turn-status"
                        className="mt-1 text-[9px] font-mono font-bold uppercase"
                      >
                        {t.status === 'SUCCESS' && (
                          <span className="text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> SUCCESS
                          </span>
                        )}
                        {t.status === 'FAILED' && (
                          <span className="text-red-400 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> FAILED
                          </span>
                        )}
                        {t.status === 'PARTIAL' && (
                          <span className="text-amber-300 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> PARTIAL
                          </span>
                        )}
                        {t.status === 'CLARIFY' && (
                          <span className="text-sky-300 inline-flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> CLARIFY
                          </span>
                        )}
                      </div>
                    )}
                    {t.toolNames && t.toolNames.length > 0 && (
                      <div className="mt-1 text-[9px] font-mono text-zinc-500">
                        tools: {t.toolNames.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
                {running && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-300">
                    <Loader2 className="w-3 h-3 animate-spin" /> HACP pracuje nad targetem…
                  </div>
                )}
                <div ref={turnsEndRef} />
              </div>

              {/* Quick actions (gate §9) — real HACP prompts */}
              <div
                data-testid="mini-inspector-ai-quick-actions"
                className="px-3 py-2 border-t border-[#2A2A30] flex flex-wrap gap-1 flex-shrink-0"
              >
                {quickActions.map((a) => (
                  <button
                    key={a.id}
                    disabled={running || !target}
                    onClick={() => void executePrompt(a.prompt)}
                    data-testid={`mini-qa-${a.id}`}
                    className="px-2 py-1 rounded-md bg-white/[0.04] hover:bg-[#D9A86C]/25 hover:text-[#F2C27F] border border-white/5 text-[10px] text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={a.prompt}
                  >
                    <Zap className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Composer */}
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
                        ? `Np. „Zrób ten ${target.nodeType} bardziej premium…”`
                        : 'Zaznacz element…'
                    }
                    data-testid="mini-inspector-ai-input"
                    disabled={running || !target}
                    className="flex-1 resize-none rounded-lg bg-[#18181B] border border-[#3A3A40] px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D9A86C] disabled:opacity-50"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={handleSend}
                      disabled={running || !target || !prompt.trim()}
                      data-testid="mini-inspector-ai-send"
                      className="p-2 rounded-lg bg-[#D9A86C] hover:bg-[#B8893A] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Wyślij do AI (HACP)"
                    >
                      {running ? (
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
 * Always visible — not hidden behind gestures (gate §5).
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
