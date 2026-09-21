'use client'

/**
 * AiCopilotWorkspace.tsx — SoloSpot AI Copilot & HACP Control Center v1.0
 *
 * Professional AI Workspace that serves as the visual control center for HACP Bridge.
 * Directly integrates with:
 * - BuilderDocument (single source of truth)
 * - BuilderCommands & Mutation Engine via dispatch()
 * - HistoryStack via useBuilderHistory() (Undo/Redo)
 * - Live Canvas sync (zero page reloads)
 * - Experience Runtime Compositor
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Bot, Sparkles, Activity, CheckCircle2, AlertCircle, Clock,
  ChevronDown, ChevronUp, RotateCcw, RotateCw, Send, Layers,
  Eye, Zap, X, Shield, Cpu, RefreshCw, Sliders, Info, CornerDownLeft,
  Copy, Check, Square, Wand2
} from 'lucide-react'
import { useBuilder, useBuilderHistory } from '../state/BuilderProvider'
import { HacpBridge } from '@/lib/hacp/HacpBridge'
import type {
  HacpMessage,
  HacpActivityEvent,
  HacpBuilderContext,
  HacpCapability,
  HacpStatus,
  HacpConversationContext,
  HacpVisualMetrics,
} from '@/lib/hacp/HacpTypes'
import { findNode } from '../../../../packages/builder-core/src'
import { useAutonomousGeneration } from '@/lib/ai/useAutonomousGeneration'
import type { GenerationPhase } from '@/lib/ai/SitePlanTypes'

export function AiCopilotWorkspace() {
  const { document: builderDoc, canvas, dispatch } = useBuilder()
  const { canUndo, canRedo, undo, redo } = useBuilderHistory()

  const [messages, setMessages] = useState<HacpMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<
    'IDLE' | 'REQUESTING_MODEL' | 'EXECUTING_TOOL' | 'WAITING_FOR_TOOL_RESULT' | 'GENERATING_FINAL_RESPONSE' | 'COMPLETED' | 'ERROR'
  >('IDLE')
  const [secondsWaiting, setSecondsWaiting] = useState(0)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const [activityEvents, setActivityEvents] = useState<HacpActivityEvent[]>([])
  const [conversationContext, setConversationContext] = useState<HacpConversationContext>({
    history: [],
  })
  const [visualMetrics, setVisualMetrics] = useState<HacpVisualMetrics | undefined>(undefined)
  const [recentMutation, setRecentMutation] = useState<string | undefined>(undefined)
  const [aiProviderStatus, setAiProviderStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE')
  const [aiProviderName, setAiProviderName] = useState<string>('NONE')
  const [missingKeys, setMissingKeys] = useState<string[]>([])

  // Collapsible panels state
  const [contextOpen, setContextOpen] = useState(true)
  const [activityOpen, setActivityOpen] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showCapabilitiesModal, setShowCapabilitiesModal] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const bridge = useMemo(() => HacpBridge.getInstance(), [])
  const hacpStatus: HacpStatus = isExecuting ? 'BUSY' : bridge.getStatus()
  const capabilities = useMemo(() => bridge.getCapabilities(), [bridge])

  // Autonomous Website Generation
  const executeToolCallForGeneration = useCallback(async (call: any) => {
    const result = bridge.executeToolCall(call, builderDoc, builderDoc.pages[0]?.id || 'page-home')
    dispatch(result.command!)
    return { success: result.verification.passed, message: result.message }
  }, [bridge, builderDoc, dispatch])

  const { state: genState, startGeneration, abortGeneration } = useAutonomousGeneration(
    builderDoc,
    executeToolCallForGeneration
  )

  // Model Router & Picker state
  const [routerMode, setRouterMode] = useState<'AUTO' | 'FREE' | 'PAID' | 'MANUAL'>('AUTO')
  const [selectedModelId, setSelectedModelId] = useState<string>('openai/gpt-4o-mini')
  const [currentModelName, setCurrentModelName] = useState<string>('GPT-4o Mini')
  const [isFreeModel, setIsFreeModel] = useState<boolean>(false)
  const [supportsTools, setSupportsTools] = useState<boolean>(true)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [freeModels, setFreeModels] = useState<any[]>([])
  const [paidModels, setPaidModels] = useState<any[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')

  // Check real AI Provider status on mount & discover models
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Restore session preferences
    const savedMode = sessionStorage.getItem('solospot_ai_mode') as any
    const savedModel = sessionStorage.getItem('solospot_ai_model')
    if (savedMode) setRouterMode(savedMode)
    if (savedModel) setSelectedModelId(savedModel)

    fetch('/api/builder/copilot')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ONLINE' || data.configured) {
          setAiProviderStatus('ONLINE')
          setAiProviderName(data.provider || 'OpenCode')
        } else {
          setAiProviderStatus('OFFLINE')
          setAiProviderName('NOT CONFIGURED')
          if (data.missingKeys) setMissingKeys(data.missingKeys)
        }
      })
      .catch(() => {
        setAiProviderStatus('OFFLINE')
        setAiProviderName('NOT CONFIGURED')
      })

    // Discover models dynamically from OpenCode
    fetch('/api/ai/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'SUCCESS') {
          setAvailableModels(data.models || [])
          setFreeModels(data.freeModels || [])
          setPaidModels(data.paidModels || [])
          if (data.currentModel && !savedModel) {
            setSelectedModelId(data.currentModel.id)
            setCurrentModelName(data.currentModel.name)
            setIsFreeModel(data.currentModel.isFree)
            setSupportsTools(data.currentModel.supportsTools)
          } else if (savedModel && data.models) {
            const matched = data.models.find((m: any) => m.id === savedModel)
            if (matched) {
              setCurrentModelName(matched.name)
              setIsFreeModel(matched.isFree)
              setSupportsTools(matched.supportsTools)
            }
          }
        }
      })
      .catch((err) => console.warn('[AiCopilotWorkspace] Models discovery fetch failed:', err))
  }, [])

  // Handle autonomous generation completion
  useEffect(() => {
    if (genState.phase === 'complete' && genState.session) {
      const completeMsg: HacpMessage = {
        id: `msg-gen-complete-${Date.now()}`,
        type: 'system',
        text: `Strona wygenerowana pomyślnie! Wykonano ${genState.session.toolsExecuted} operacji. Strona jest gotowa do podglądu.`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
      }
      setMessages((prev) => [...prev, completeMsg])
    } else if (genState.phase === 'error' && genState.error) {
      const errorMsg: HacpMessage = {
        id: `msg-gen-error-${Date.now()}`,
        type: 'system',
        text: `Błąd generacji: ${genState.error}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
      }
      setMessages((prev) => [...prev, errorMsg])
    }
  }, [genState.phase, genState.session, genState.error])

  // Measure active canvas element geometry for Live Visual Context
  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateMetrics = () => {
      const targetId = canvas.selectedSectionId || builderDoc.pages[0]?.sections[0]?.id
      if (!targetId) {
        setVisualMetrics(undefined)
        return
      }
      const el = document.querySelector(`[data-section-id="${targetId}"]`) as HTMLElement | null
      if (el) {
        const rect = el.getBoundingClientRect()
        setVisualMetrics({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          aspectRatio: parseFloat((rect.width / (rect.height || 1)).toFixed(2)),
          computedStylesSummary: `display: ${getComputedStyle(el).display}`,
        })
      }
    }

    updateMetrics()
    const timer = setTimeout(updateMetrics, 100)
    return () => clearTimeout(timer)
  }, [canvas.selectedSectionId, canvas.viewport, builderDoc])

  // Subscribe to HACP activity stream
  useEffect(() => {
    setActivityEvents(bridge.getRecentEvents())
    const unsubscribe = bridge.subscribe((event) => {
      setActivityEvents((prev) => [...prev, event].slice(-30))
    })
    return () => unsubscribe()
  }, [bridge])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isExecuting])

  // Derive current builder context
  const activePage = useMemo(() => {
    return builderDoc.pages.find((p) => p.id === canvas.selectedPageId) || builderDoc.pages[0]
  }, [builderDoc, canvas.selectedPageId])

  const selectedNodeInfo = useMemo(() => {
    if (!canvas.selectedSectionId) return null
    const found = findNode(builderDoc, canvas.selectedSectionId)
    if (!found) return null
    const sec = found.node
    return {
      id: sec.id,
      label: sec.label || sec.type,
      type: sec.type,
      props: sec.props || {},
      experienceConfig: (sec.props as any)?.experienceConfig,
    }
  }, [builderDoc, canvas.selectedSectionId])

  const currentContext: HacpBuilderContext = useMemo(() => {
    return {
      storeId: builderDoc.metadata?.storeSlug || 'store',
      pageId: activePage?.id || 'page-home',
      pageName: activePage?.name || 'Strona Główna',
      selectedNodeId: selectedNodeInfo?.id,
      selectedNodeType: selectedNodeInfo?.type,
      selectedNodeLabel: selectedNodeInfo?.label,
      selectedNodeProps: selectedNodeInfo?.props,
      experienceConfig: selectedNodeInfo?.experienceConfig,
      viewport: (canvas.viewport?.label as any) || 'DESKTOP',
      documentNodeCount: activePage?.sections?.length || 0,
      sectionsSummary: (activePage?.sections || []).map((s) => ({ id: s.id, type: s.type, label: s.label })),
      availableCapabilitiesCount: capabilities.filter((c) => c.available).length,
      visualMetrics,
      recentMutation,
      activeTool: (canvas as any).activeTool || 'SELECT',
    }
  }, [activePage, selectedNodeInfo, canvas.viewport, builderDoc, capabilities, visualMetrics, recentMutation, canvas])

  // Timer effect for progressive loading feedback
  useEffect(() => {
    let interval: any
    if (isExecuting) {
      setSecondsWaiting(0)
      interval = setInterval(() => {
        setSecondsWaiting((s) => s + 1)
      }, 1000)
    } else {
      setSecondsWaiting(0)
    }
    return () => clearInterval(interval)
  }, [isExecuting])

  // Contextual suggestions when conversation is empty
  const suggestions = useMemo(() => {
    return [
      'Jak poprawiłbyś ten Hero?',
      'Zmień tło Hero na czarne.',
      'Nadaj tej sekcji bardziej premium charakter. Użyj złotego gradientu i delikatnej reakcji na kursor.',
      'Chciałbym, żeby prowadnice w Builderze były bardziej podobne do Wix.',
    ]
  }, [])

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsExecuting(false)
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-stopped-${Date.now()}`,
        type: 'system',
        text: 'Generowanie zostało przerwane na Twoją prośbę.',
        timestamp: new Date().toLocaleTimeString('pl-PL'),
      },
    ])
  }

  const handleCopyText = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedMessageId(id)
      setTimeout(() => setCopiedMessageId(null), 2000)
    }
  }

  const handleRegenerate = () => {
    if (lastUserPrompt && !isExecuting) {
      handleSendMessage(lastUserPrompt)
    }
  }

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputValue).trim()
    if (!text || isExecuting) return

    // ── Autonomous Generation Detection ──
    const lowerText = text.toLowerCase()
    const isGenerationRequest = lowerText.includes('generuj stronę') ||
      lowerText.includes('generate website') ||
      lowerText.includes('stwórz stronę') ||
      lowerText.includes('stwórz stronę internetową') ||
      lowerText.includes('zrób stronę') ||
      lowerText.includes('zbuduj stronę') ||
      lowerText.includes('build website') ||
      lowerText.includes('create website') ||
      (lowerText.includes('stron') && lowerText.includes('internetow'))

    if (isGenerationRequest && !isExecuting) {
      // Trigger autonomous generation
      setLastUserPrompt(text)
      const userMessage: HacpMessage = {
        id: `msg-user-${Date.now()}`,
        type: 'user',
        text,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
      }
      setMessages((prev) => [...prev, userMessage])
      setInputValue('')

      // Add system message about generation starting
      const genMsg: HacpMessage = {
        id: `msg-gen-${Date.now()}`,
        type: 'system',
        text: `Generuję stronę na podstawie briefu...`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
      }
      setMessages((prev) => [...prev, genMsg])

      // Start autonomous generation
      startGeneration(text)
      return
    }

    setLastUserPrompt(text)
    const userMessage: HacpMessage = {
      id: `msg-user-${Date.now()}`,
      type: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pl-PL'),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsExecuting(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // Execute through Conversational Intent Engine & HACP Bridge with active router configuration
      const result = await bridge.executePlan(
        text,
        currentContext,
        builderDoc,
        conversationContext,
        routerMode,
        selectedModelId,
        (phase) => setCurrentPhase(phase)
      )

      if (controller.signal.aborted) return

      // Update AI provider status from result
      if (result.aiProviderStatus) {
        setAiProviderStatus(result.aiProviderStatus)
        if (result.aiProviderName) {
          setAiProviderName(result.aiProviderName)
        }
      }

      if (result.selectedModel) {
        setSelectedModelId(result.selectedModel)
        setIsFreeModel(Boolean(result.isFreeModel))
        const matched = availableModels.find((m) => m.id === result.selectedModel)
        if (matched) {
          setCurrentModelName(matched.name)
          setSupportsTools(matched.supportsTools)
        }
      }

      // Update conversation memory
      if (result.updatedConversationContext) {
        setConversationContext((prev) => ({
          ...prev,
          ...result.updatedConversationContext,
          history: [
            ...prev.history,
            { role: 'user' as const, text, timestamp: new Date().toLocaleTimeString('pl-PL') },
            {
              role: 'ai' as const,
              text: result.message,
              intent: result.intent,
              scope: result.scope,
              timestamp: new Date().toLocaleTimeString('pl-PL'),
            },
          ].slice(-25),
        }))
      }

      // If action requested natural UNDO
      if (result.shouldTriggerUndo || result.intent === 'UNDO') {
        if (canUndo) {
          undo()
          setRecentMutation('Cofnięto poprzednią modyfikację')
        }
      }

      // If action requested natural REDO
      if (result.shouldTriggerRedo || result.intent === 'REDO') {
        if (canRedo) {
          redo()
          setRecentMutation('Przywrócono poprzednią modyfikację')
        }
      }

      // ONLY dispatch mutations if intent is EXECUTE and commands are present
      let mutationSummary: string | undefined = undefined
      if (result.intent === 'EXECUTE' && result.commandsToDispatch.length > 0) {
        result.commandsToDispatch.forEach((cmd) => {
          dispatch(cmd)
        })
        mutationSummary = result.executionCard?.appliedChanges?.[0]?.summary
        if (mutationSummary) {
          setRecentMutation(mutationSummary)
        }
      }

      // Log execution card to dedicated Activity Stream (separate from conversation bubble)
      if (result.executionCard) {
        setActivityEvents((prev) => [
          ...prev,
          {
            id: `evt-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pl-PL'),
            type: 'MUTATE' as const,
            title: `Wykonanie HACP: ${result.selectedModel || 'OpenCode'}`,
            description: mutationSummary || result.message.slice(0, 60),
            status: result.success ? ('SUCCESS' as const) : ('WARN' as const),
          },
        ].slice(-30))
      }

      // Empty response prevention (Section 26)
      const hasContent = result.message && result.message.trim().length > 0
      const finalMsgText = hasContent
        ? result.message.trim()
        : 'Model nie zwrócił odpowiedzi. Spróbuj ponownie lub wybierz inny model.'

      const aiMessage: HacpMessage = {
        id: `msg-ai-${Date.now()}`,
        type: 'ai',
        text: finalMsgText,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        intent: result.intent,
        scope: result.scope,
        appliedChangeSummary: mutationSummary,
        isError: !hasContent,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err: any) {
      if (controller.signal.aborted) return
      setCurrentPhase('ERROR')
      const errorMessage: HacpMessage = {
        id: `msg-err-${Date.now()}`,
        type: 'system',
        text: `Nie udało się zrealizować zapytania: ${err?.message || 'Błąd wykonania w HACP Bridge.'}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      abortControllerRef.current = null
      setIsExecuting(false)
      setCurrentPhase('IDLE')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#080B10] text-[#F5F1EA] select-none font-sans overflow-hidden">
      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0D1118] border-b border-white/[0.08] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D9A86C] to-[#F2C27F] flex items-center justify-center shadow-md shadow-[#D9A86C]/20">
            <Bot className="w-4 h-4 text-[#080B10]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-wide text-white">SOLOSPOT AI</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-zinc-400">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-[#B8B1A7] leading-none mt-0.5">Builder Copilot</p>
          </div>
        </div>

        {/* Real-time Status Badges (Section 17 & Section 38) */}
        <div className="flex items-center gap-1.5">
          {/* AI Provider Status */}
          <button
            onClick={() => setShowStatusModal(true)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold border transition-all cursor-pointer ${
              isExecuting && currentPhase === 'REQUESTING_MODEL'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse'
                : aiProviderStatus === 'ONLINE'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
            title={aiProviderStatus === 'ONLINE' ? `Połączono z modelem AI: ${aiProviderName}` : 'Brak zewnętrznego modelu LLM'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isExecuting && currentPhase === 'REQUESTING_MODEL'
                  ? 'bg-amber-400 animate-ping'
                  : aiProviderStatus === 'ONLINE'
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
            <span>
              {isExecuting && currentPhase === 'REQUESTING_MODEL'
                ? 'AI: THINKING'
                : aiProviderStatus === 'ONLINE'
                ? `AI: READY`
                : 'AI: OFFLINE'}
            </span>
          </button>

          {/* HACP Status */}
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
            title="Kliknij, aby otworzyć stan połączenia HACP"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                currentPhase === 'EXECUTING_TOOL' || currentPhase === 'WAITING_FOR_TOOL_RESULT'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span>
              {currentPhase === 'EXECUTING_TOOL' || currentPhase === 'WAITING_FOR_TOOL_RESULT'
                ? 'HACP: EXECUTING'
                : 'HACP: IDLE'}
            </span>
          </button>

          {/* Execution Status */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isExecuting ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-400'}`} />
            <span>{isExecuting ? 'EXEC: RUNNING' : 'EXEC: READY'}</span>
          </div>

          <button
            onClick={() => setShowCapabilitiesModal(true)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Dostępne możliwości HACP"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 1.5 OPENCODE MODEL PICKER & ROUTER (IN CHAT) ───────────────────── */}
      <div className="px-3 py-2 bg-[#080D14] border-b border-white/[0.08] flex flex-col gap-1.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Router Mode Switcher */}
          <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06]">
            {(['AUTO', 'FREE', 'PAID'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setRouterMode(mode)
                  sessionStorage.setItem('solospot_ai_mode', mode)
                }}
                className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all ${
                  routerMode === mode
                    ? 'bg-[#D9A86C] text-[#080B10] shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
                title={mode === 'AUTO' ? 'Automatyczny wybór najlepszego modelu' : mode === 'FREE' ? 'Używaj tylko modeli darmowych' : 'Używaj modeli płatnych / Pro'}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Model Dropdown Trigger */}
          <div className="relative flex-1">
            <button
              onClick={() => setIsPickerOpen((v) => !v)}
              className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-[10px] font-mono text-zinc-200 transition-all cursor-pointer"
              title="Wybierz model OpenCode"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className={`w-1.5 h-1.5 rounded-full ${isFreeModel ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                <span className="truncate font-semibold">{currentModelName}</span>
                <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${
                  isFreeModel
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                }`}>
                  {isFreeModel ? 'FREE' : 'PAID'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-400 flex-shrink-0 ml-1" />
            </button>

            {/* Model Picker Popup Menu */}
            {isPickerOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0D1118] border border-white/15 rounded-xl shadow-2xl p-2 max-h-72 flex flex-col gap-1.5">
                {/* Search input */}
                <input
                  type="text"
                  placeholder="Filtruj modele..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white placeholder-zinc-500 focus:outline-none"
                />

                <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                  {/* FREE MODELS */}
                  {freeModels.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 px-1 uppercase tracking-wider block">
                        Darmowe (Free) • {freeModels.length}
                      </span>
                      {freeModels
                        .filter((m) => !searchFilter || m.name.toLowerCase().includes(searchFilter.toLowerCase()) || m.id.toLowerCase().includes(searchFilter.toLowerCase()))
                        .map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedModelId(m.id)
                              setCurrentModelName(m.name)
                              setIsFreeModel(true)
                              setSupportsTools(m.supportsTools)
                              setRouterMode('MANUAL')
                              setIsPickerOpen(false)
                              sessionStorage.setItem('solospot_ai_model', m.id)
                              sessionStorage.setItem('solospot_ai_mode', 'MANUAL')
                            }}
                            className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between text-[10px] font-mono transition-colors cursor-pointer ${
                              selectedModelId === m.id
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'hover:bg-white/[0.05] text-zinc-300'
                            }`}
                          >
                            <span className="truncate">{m.name}</span>
                            <div className="flex items-center gap-1 flex-shrink-0 text-[8px]">
                              {m.supportsTools ? (
                                <span className="text-emerald-400">✓ Tools</span>
                              ) : (
                                <span className="text-zinc-500">Chat Only</span>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}

                  {/* PAID MODELS */}
                  {paidModels.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-white/[0.06]">
                      <span className="text-[9px] font-mono font-bold text-cyan-400 px-1 uppercase tracking-wider block">
                        Płatne / Pro • {paidModels.length}
                      </span>
                      {paidModels
                        .filter((m) => !searchFilter || m.name.toLowerCase().includes(searchFilter.toLowerCase()) || m.id.toLowerCase().includes(searchFilter.toLowerCase()))
                        .slice(0, 30)
                        .map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedModelId(m.id)
                              setCurrentModelName(m.name)
                              setIsFreeModel(false)
                              setSupportsTools(m.supportsTools)
                              setRouterMode('MANUAL')
                              setIsPickerOpen(false)
                              sessionStorage.setItem('solospot_ai_model', m.id)
                              sessionStorage.setItem('solospot_ai_mode', 'MANUAL')
                            }}
                            className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between text-[10px] font-mono transition-colors cursor-pointer ${
                              selectedModelId === m.id
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'hover:bg-white/[0.05] text-zinc-300'
                            }`}
                          >
                            <span className="truncate">{m.name}</span>
                            <div className="flex items-center gap-1 flex-shrink-0 text-[8px]">
                              {m.supportsTools ? (
                                <span className="text-cyan-400">✓ Tools</span>
                              ) : (
                                <span className="text-zinc-500">Chat Only</span>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Capability Indicator Bar */}
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 px-1 pt-0.5">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓ Chat</span>
            <span className="text-emerald-400">✓ Multi-turn</span>
            <span className={supportsTools ? 'text-emerald-400' : 'text-amber-400'}>
              {supportsTools ? '✓ Tools' : '✕ No Tools'}
            </span>
            <span className={supportsTools ? 'text-emerald-400' : 'text-zinc-500'}>
              {supportsTools ? '✓ HACP' : '○ HACP'}
            </span>
          </div>
          <span className="text-zinc-500 text-[8px] font-mono uppercase">OpenCode</span>
        </div>
      </div>

      {/* ── 2. LIVE BUILDER OBSERVATION PANEL ──────────────────────────────── */}
      <div className="border-b border-white/[0.06] bg-[#0A0E15] flex-shrink-0">
        <button
          onClick={() => setContextOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-[#D9A86C]" />
            <span>Live Builder Context</span>
            {selectedNodeInfo && (
              <span className="text-[#F2C27F] font-bold">● {selectedNodeInfo.label}</span>
            )}
          </div>
          {contextOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {contextOpen && (
          <div className="px-3.5 pb-2.5 pt-0.5 grid grid-cols-2 gap-1.5 text-[10px] font-mono">
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-1.5">
              <span className="text-zinc-500 block text-[9px]">STRONA</span>
              <span className="text-zinc-200 truncate block font-medium">{currentContext.pageName}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-1.5">
              <span className="text-zinc-500 block text-[9px]">VIEWPORT</span>
              <span className="text-zinc-300 truncate block font-medium">
                {currentContext.viewport} {visualMetrics ? `(${visualMetrics.width}px)` : ''}
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-1.5">
              <span className="text-zinc-500 block text-[9px]">SELEKCJA</span>
              <span className="text-[#F2C27F] truncate block font-medium">
                {selectedNodeInfo?.label || '(Brak zaznaczenia)'}
              </span>
              {visualMetrics && (
                <span className="text-[8px] text-zinc-400 block mt-0.5">
                  {visualMetrics.width} × {visualMetrics.height}px
                </span>
              )}
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-1.5">
              <span className="text-zinc-500 block text-[9px]">EXPERIENCE</span>
              <span className="text-zinc-300 truncate block">
                {selectedNodeInfo?.experienceConfig?.background?.type ? `Exp: ${selectedNodeInfo.experienceConfig.background.type}` : 'Standard'}
              </span>
            </div>
            <div className="col-span-2 bg-white/[0.02] border border-white/[0.05] rounded-lg p-1.5 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-zinc-500 block text-[9px]">OSTATNIA ZMIANA</span>
                <span className="text-emerald-400 truncate block text-[10px] font-medium">
                  {recentMutation || 'Brak aktywnych zmian'}
                </span>
              </div>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                LIVE SYNC
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. COLLAPSIBLE ACTIVITY PANEL ──────────────────────────────────── */}
      <div className="border-b border-white/[0.06] bg-[#0A0E15] flex-shrink-0">
        <button
          onClick={() => setActivityOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[#D9A86C]" />
            <span>Activity Stream</span>
            <span className="text-zinc-500 text-[9px]">({activityEvents.length})</span>
          </div>
          {activityOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {activityOpen && (
          <div className="px-3.5 pb-2.5 max-h-36 overflow-y-auto space-y-1 text-[10px] font-mono">
            {activityEvents.length === 0 ? (
              <p className="text-zinc-500 text-[10px] italic">Brak zarejestrowanych zdarzeń HACP.</p>
            ) : (
              activityEvents.map((evt) => (
                <div key={evt.id} className="flex items-start gap-2 p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-zinc-500 text-[9px] flex-shrink-0">{evt.timestamp}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-zinc-200 font-semibold block truncate">{evt.title}</span>
                    <span className="text-zinc-400 text-[9px] block truncate">{evt.description}</span>
                  </div>
                  <span
                    className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                      evt.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 bg-white/5'
                    }`}
                  >
                    {evt.status || 'OK'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── 4. CONVERSATION AREA ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center space-y-3 p-1">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#D9A86C]/10 via-[#0D1118] to-transparent border border-[#D9A86C]/20 space-y-2">
              <div className="flex items-center gap-2 text-[#F2C27F] font-bold text-xs">
                <Sparkles className="w-4 h-4 text-[#D9A86C]" />
                <span>Twój inteligentny Copilot Buildera</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Opisz, co chcesz zmienić lub zbudować na stronie. SoloSpot AI analizuje bieżący kontekst Canvas, dobiera odpowiednie Experience i natychmiast nanosi modyfikacje.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                Sugerowane zapytania:
              </span>
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug)}
                  disabled={isExecuting}
                  className="w-full p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-[#D9A86C]/40 hover:bg-[#D9A86C]/[0.05] text-left transition-all text-xs text-zinc-300 hover:text-white disabled:opacity-50"
                >
                  „{sug}”
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message author badge */}
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-zinc-500">
                <span>{msg.type === 'user' ? 'Ty' : msg.type === 'ai' ? 'SoloSpot AI' : 'System'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {msg.scope === 'PLATFORM_ENGINEERING' && (
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-[8px]">
                    PLATFORM ENGINEERING
                  </span>
                )}
                {msg.intent === 'AUDIT' && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[8px]">
                    SYSTEM AUDIT
                  </span>
                )}
                {msg.intent === 'UNDO' && (
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-[8px]">
                    HISTORY REVERT
                  </span>
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`max-w-[94%] rounded-2xl p-3.5 text-xs leading-relaxed transition-all shadow-sm ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-r from-[#D9A86C] to-[#F2C27F] text-[#080B10] font-medium shadow-[#D9A86C]/10 ml-auto'
                    : msg.type === 'ai'
                    ? 'bg-[#0D1118] border border-white/10 text-zinc-200'
                    : 'bg-red-950/20 border border-red-500/30 text-red-300'
                }`}
              >
                {/* User-facing conversational text */}
                <div className="whitespace-pre-line text-xs font-sans leading-relaxed selection:bg-[#D9A86C]/30">
                  {msg.text}
                </div>

                {/* Subtle, elegant mutation pill if Canvas was modified */}
                {msg.appliedChangeSummary && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-emerald-400">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">Zastosowano: {msg.appliedChangeSummary}</span>
                    </div>
                    <button
                      onClick={undo}
                      disabled={!canUndo}
                      className="flex items-center gap-1 text-[10px] text-[#D9A86C] hover:text-[#F2C27F] transition-colors flex-shrink-0 cursor-pointer disabled:opacity-40"
                      title="Cofnij tę modyfikację"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Cofnij</span>
                    </button>
                  </div>
                )}

                {/* Error retry button */}
                {msg.isError && lastUserPrompt && (
                  <div className="mt-2.5 pt-2 border-t border-red-500/20 flex items-center justify-end">
                    <button
                      onClick={() => handleSendMessage(lastUserPrompt)}
                      disabled={isExecuting}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Spróbuj ponownie</span>
                    </button>
                  </div>
                )}

                {/* Assistant footer toolbar: copy & regenerate */}
                {msg.type === 'ai' && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="text-[9px] font-mono text-zinc-600">{currentModelName}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="p-1 rounded hover:bg-white/5 hover:text-zinc-300 transition-colors cursor-pointer"
                        title="Kopiuj odpowiedź"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      {msg.id === messages[messages.length - 1]?.id && (
                        <button
                          onClick={handleRegenerate}
                          disabled={isExecuting}
                          className="p-1 rounded hover:bg-white/5 hover:text-zinc-300 transition-colors cursor-pointer disabled:opacity-30"
                          title="Odśwież odpowiedź"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Truthful Real-Time Execution Status UX with STOP button (Section 10, 22, 40) */}
        {isExecuting && (
          <div className="flex flex-col items-start space-y-1.5 max-w-[94%]">
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#D9A86C]">
              <span className="w-2 h-2 rounded-full bg-[#D9A86C] animate-ping" />
              <span className="font-bold tracking-wider">
                {currentPhase === 'REQUESTING_MODEL'
                  ? 'REQUESTING MODEL'
                  : currentPhase === 'EXECUTING_TOOL'
                  ? 'EXECUTING TOOL'
                  : currentPhase === 'WAITING_FOR_TOOL_RESULT'
                  ? 'WAITING FOR TOOL RESULT'
                  : currentPhase === 'GENERATING_FINAL_RESPONSE'
                  ? 'GENERATING FINAL RESPONSE'
                  : 'PROCESSING'}
              </span>
              <span className="text-zinc-500 font-mono text-[9px]">({secondsWaiting}s)</span>
            </div>

            <div className="w-full p-3 rounded-2xl bg-[#0D1118] border border-[#D9A86C]/30 text-xs text-zinc-300 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <RefreshCw className="w-3.5 h-3.5 text-[#D9A86C] animate-spin flex-shrink-0" />
                <span className="text-[11px] truncate">
                  {currentPhase === 'REQUESTING_MODEL'
                    ? `Model analizuje zapytanie i stan strony…`
                    : currentPhase === 'EXECUTING_TOOL'
                    ? 'Wprowadzam zaplanowaną modyfikację na Canvasie…'
                    : currentPhase === 'WAITING_FOR_TOOL_RESULT'
                    ? 'Weryfikuję integralność i rezultat operacji…'
                    : currentPhase === 'GENERATING_FINAL_RESPONSE'
                    ? 'Formułuję naturalną odpowiedź…'
                    : 'Komunikacja z silnikiem SoloSpot AI…'}
                </span>
              </div>

              {/* Real STOP generation button */}
              <button
                onClick={handleStopGeneration}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                title="Zatrzymaj generowanie odpowiedzi"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>Zatrzymaj</span>
              </button>
            </div>
          </div>
        )}

        {/* Autonomous Generation Progress */}
        {genState.isRunning && (
          <div className="flex flex-col items-start space-y-1.5 max-w-[94%]">
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#D9A86C]">
              <span className="w-2 h-2 rounded-full bg-[#D9A86C] animate-ping" />
              <span className="font-bold tracking-wider">AUTONOMIC GENERATION</span>
              <span className="text-zinc-500 font-mono text-[9px]">{genState.progress}%</span>
            </div>

            <div className="w-full p-3 rounded-2xl bg-[#0D1118] border border-[#D9A86C]/30 text-xs text-zinc-300 shadow-lg">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Wand2 className="w-3.5 h-3.5 text-[#D9A86C] animate-pulse flex-shrink-0" />
                  <span className="text-[11px] truncate">{genState.message}</span>
                </div>
                <button
                  onClick={abortGeneration}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>Anuluj</span>
                </button>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D9A86C] to-[#F2C27F] rounded-full transition-all duration-300"
                  style={{ width: `${genState.progress}%` }}
                />
              </div>
              <div className="mt-1.5 text-[9px] text-zinc-500 font-mono">
                {genState.toolResults.length} operacji wykonano • {genState.plan?.sections.length || 0} sekcji w planie
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 5. QUICK ACTIONS ROW ───────────────────────────────────────────── */}
      <div className="px-3 py-1.5 bg-[#0A0E15] border-t border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
        <button
          onClick={() =>
            handleSendMessage(
              'Nadaj tej sekcji bardziej premium charakter. Użyj złotego gradientu i delikatnej reakcji na kursor.'
            )
          }
          disabled={isExecuting}
          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[#D9A86C]/10 border border-[#D9A86C]/30 text-[#F2C27F] hover:bg-[#D9A86C]/20 whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0 disabled:opacity-40"
        >
          <Sparkles className="w-3 h-3 text-[#D9A86C]" />
          <span>+ Złoty Gradient & Kursor</span>
        </button>

        <button
          onClick={() =>
            handleSendMessage('Przeanalizuj aktualną stronę i powiedz mi, jakie sekcje się na niej znajdują.')
          }
          disabled={isExecuting}
          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.03] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.07] whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0 disabled:opacity-40"
        >
          <Eye className="w-3 h-3 text-zinc-400" />
          <span>+ Analiza Strony</span>
        </button>

        <button
          onClick={() => handleSendMessage('Stwórz nowoczesny Hero Banner z wbudowanym gradientem SoloSpot Gold.')}
          disabled={isExecuting}
          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.03] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.07] whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0 disabled:opacity-40"
        >
          <Zap className="w-3 h-3 text-zinc-400" />
          <span>+ Dodaj Hero</span>
        </button>

        <button
          onClick={() => handleSendMessage('Zrób audyt.')}
          disabled={isExecuting}
          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0 disabled:opacity-40"
        >
          <Shield className="w-3 h-3 text-amber-400" />
          <span>+ Zrób Audyt</span>
        </button>

        <button
          onClick={() => handleSendMessage('Chciałbym, żeby prowadnice w Builderze były bardziej podobne do Wix.')}
          disabled={isExecuting}
          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0 disabled:opacity-40"
        >
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>+ Prowadnice Wix (Platform)</span>
        </button>

        <div className="w-px h-4 bg-white/10 flex-shrink-0 mx-0.5" />

        <button
          onClick={() => handleSendMessage('Stwórz stronę internetową dla szkoły językowej')}
          disabled={isExecuting}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-[#D9A86C] to-[#F2C27F] text-[#080B10] hover:shadow-lg hover:shadow-[#D9A86C]/20 whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 disabled:opacity-40"
        >
          <Wand2 className="w-3 h-3" />
          <span>Generuj Stronę</span>
        </button>
      </div>

      {/* ── 6. INPUT AREA ──────────────────────────────────────────────────── */}
      <div className="p-3 bg-[#0D1118] border-t border-white/[0.08] flex-shrink-0">
        <div className="relative flex items-end gap-2 bg-[#080B10] border border-white/10 focus-within:border-[#D9A86C]/50 rounded-2xl p-2 transition-all">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            placeholder="Napisz do SoloSpot AI..."
            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none resize-none min-h-[38px] max-h-[120px] py-1 px-1 leading-relaxed"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isExecuting}
            className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#D9A86C] to-[#F2C27F] text-[#080B10] flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#D9A86C]/20 flex-shrink-0"
            title="Wyślij (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-1.5 px-1 text-[9px] font-mono text-zinc-500">
          <span>Enter: Wyślij • Shift+Enter: Nowa linia</span>
          <span>HACP Direct Live Bridge</span>
        </div>
      </div>

      {/* ── STATUS POPUP MODAL ─────────────────────────────────────────────── */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0D1118] border border-white/15 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#D9A86C]" />
                <h3 className="font-bold text-sm text-white">HACP CONTROL STATUS</h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">AI Provider:</span>
                <span className={`font-bold ${aiProviderStatus === 'ONLINE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {aiProviderStatus === 'ONLINE' ? aiProviderName : 'OFFLINE'}
                </span>
              </div>
              {aiProviderStatus === 'OFFLINE' && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
                  <span>Wymagany klucz API: </span>
                  <span className="font-bold">{missingKeys.length > 0 ? missingKeys.join(' lub ') : 'OPENCODE_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY'}</span>
                  <p className="text-zinc-400 mt-1">
                    Brak konfiguracji w .env — system nie symuluje AI, wykonuje operacje HACP w trybie kontrolowanym.
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">HACP Protocol:</span>
                <span className="text-emerald-400 font-bold">ONLINE (v3.0)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Execution Mode:</span>
                <span className="text-cyan-400 font-bold">STRICT BEFORE/AFTER</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Capabilities:</span>
                <span className="text-[#F2C27F] font-bold">{capabilities.length} available</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Current execution:</span>
                <span className="text-zinc-200 font-bold">{isExecuting ? 'BUSY' : 'IDLE'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Verification Engine:</span>
                <span className="text-emerald-400 font-bold">ACTIVE (SSOT)</span>
              </div>
            </div>

            <button
              onClick={() => setShowStatusModal(false)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      {/* ── CAPABILITIES POPUP MODAL ───────────────────────────────────────── */}
      {showCapabilitiesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0D1118] border border-white/15 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#D9A86C]" />
                <h3 className="font-bold text-sm text-white">REJESTR MOŻLIWOŚCI (CAPABILITIES)</h3>
              </div>
              <button
                onClick={() => setShowCapabilitiesModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1 text-xs">
              {(['READ', 'BUILD', 'EDIT', 'VALIDATION'] as const).map((cat) => (
                <div key={cat} className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#D9A86C] uppercase tracking-wider block mt-2">
                    {cat}
                  </span>
                  {capabilities
                    .filter((c) => c.category === cat)
                    .map((cap) => (
                      <div
                        key={cap.id}
                        className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-start justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-zinc-200 block text-xs">{cap.name}</span>
                          <span className="text-[10px] text-zinc-400 leading-snug block">{cap.description}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex-shrink-0">
                          AVAILABLE
                        </span>
                      </div>
                    ))}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCapabilitiesModal(false)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white transition-colors flex-shrink-0"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
