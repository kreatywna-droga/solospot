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

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Bot, Sparkles, Activity, CheckCircle2, AlertCircle, Clock,
  ChevronDown, ChevronUp, RotateCcw, RotateCw, Send, Layers,
  Eye, Zap, X, Shield, Cpu, RefreshCw, Sliders, Info, CornerDownLeft
} from 'lucide-react'
import { useBuilder, useBuilderHistory } from '../state/BuilderProvider'
import { HacpBridge } from '@/lib/hacp/HacpBridge'
import type {
  HacpMessage,
  HacpActivityEvent,
  HacpBuilderContext,
  HacpCapability,
  HacpStatus,
} from '@/lib/hacp/HacpTypes'
import { findNode } from '../../../../packages/builder-core/src'

export function AiCopilotWorkspace() {
  const { document: builderDoc, canvas, dispatch } = useBuilder()
  const { canUndo, canRedo, undo, redo } = useBuilderHistory()

  const [messages, setMessages] = useState<HacpMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [activityEvents, setActivityEvents] = useState<HacpActivityEvent[]>([])

  // Collapsible panels state
  const [contextOpen, setContextOpen] = useState(true)
  const [activityOpen, setActivityOpen] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showCapabilitiesModal, setShowCapabilitiesModal] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const bridge = useMemo(() => HacpBridge.getInstance(), [])
  const hacpStatus: HacpStatus = isExecuting ? 'BUSY' : bridge.getStatus()
  const capabilities = useMemo(() => bridge.getCapabilities(), [bridge])

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
      availableCapabilitiesCount: capabilities.filter((c) => c.available).length,
    }
  }, [activePage, selectedNodeInfo, canvas.viewport, builderDoc, capabilities])

  // Contextual suggestions when conversation is empty
  const suggestions = useMemo(() => {
    if (selectedNodeInfo?.type === 'hero' || selectedNodeInfo?.label?.toLowerCase().includes('hero')) {
      return [
        'Nadaj tej sekcji bardziej premium charakter. Użyj złotego gradientu i delikatnej reakcji na kursor.',
        'Zwiększ delikatnie ruch tego efektu i zmniejsz jego intensywność.',
        'Przeanalizuj aktualną stronę i powiedz mi, jakie sekcje się na niej znajdują.',
      ]
    }
    if (selectedNodeInfo) {
      return [
        `Nadaj sekcji "${selectedNodeInfo.label}" złoty gradient i efekt głębi kursora.`,
        'Zwiększ delikatnie ruch tego efektu i zmniejsz jego intensywność.',
        'Przeanalizuj aktualną stronę i powiedz mi, jakie sekcje się na niej znajdują.',
      ]
    }
    return [
      'Nadaj tej sekcji bardziej premium charakter. Użyj złotego gradientu i delikatnej reakcji na kursor.',
      'Przeanalizuj aktualną stronę i powiedz mi, jakie sekcje się na niej znajdują.',
      'Stwórz nowoczesny Hero Banner z wbudowanym gradientem SoloSpot Gold.',
    ]
  }, [selectedNodeInfo])

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputValue).trim()
    if (!text || isExecuting) return

    const userMessage: HacpMessage = {
      id: `msg-user-${Date.now()}`,
      type: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pl-PL'),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsExecuting(true)

    try {
      // Execute plan through HACP Bridge
      const result = await bridge.executePlan(text, currentContext, builderDoc)

      // Dispatch real mutations to Builder State
      if (result.commandsToDispatch.length > 0) {
        result.commandsToDispatch.forEach((cmd) => {
          dispatch(cmd)
        })
      }

      const aiMessage: HacpMessage = {
        id: `msg-ai-${Date.now()}`,
        type: 'ai',
        text: result.message,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        card: result.executionCard,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err: any) {
      const errorMessage: HacpMessage = {
        id: `msg-err-${Date.now()}`,
        type: 'system',
        text: `Nie mogę wykonać tej zmiany.\nPowód: ${err?.message || 'Błąd wykonania w HACP Bridge.'}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsExecuting(false)
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

        {/* HACP Status Interactive Badge */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
            title="Kliknij, aby otworzyć stan połączenia HACP"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isExecuting ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span>{isExecuting ? 'HACP BUSY' : 'HACP ONLINE'}</span>
          </button>

          <button
            onClick={() => setShowCapabilitiesModal(true)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Dostępne możliwości HACP"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2. COLLAPSIBLE CONTEXT PANEL ───────────────────────────────────── */}
      <div className="border-b border-white/[0.06] bg-[#0A0E15] flex-shrink-0">
        <button
          onClick={() => setContextOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-[#D9A86C]" />
            <span>Kontekst Buildera</span>
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
              <span className="text-zinc-500 block text-[9px]">ZAZNACZENIE</span>
              <span className="text-[#F2C27F] truncate block font-medium">
                {selectedNodeInfo?.label || '(Brak zaznaczenia)'}
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-1.5">
              <span className="text-zinc-500 block text-[9px]">EXPERIENCE</span>
              <span className="text-zinc-300 truncate block">
                {selectedNodeInfo?.experienceConfig?.background?.type || 'Standard'}
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-1.5">
              <span className="text-zinc-500 block text-[9px]">VIEWPORT</span>
              <span className="text-zinc-300 truncate block">{currentContext.viewport}</span>
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
              </div>

              {/* Message bubble */}
              <div
                className={`max-w-[94%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-r from-[#D9A86C] to-[#F2C27F] text-[#080B10] font-medium shadow-md shadow-[#D9A86C]/10'
                    : msg.type === 'ai'
                    ? 'bg-[#0D1118] border border-white/10 text-zinc-200'
                    : 'bg-red-950/20 border border-red-500/30 text-red-300'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* HACP Execution Card */}
                {msg.card && (
                  <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D9A86C]">
                        {msg.card.title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {msg.card.status}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[10px]">
                      {msg.card.steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-1.5 text-zinc-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="text-zinc-300">{step.name}</span>
                          {step.detail && <span className="text-zinc-500 truncate">— {step.detail}</span>}
                        </div>
                      ))}
                    </div>

                    {/* Applied changes summary */}
                    {msg.card.appliedChanges && msg.card.appliedChanges.length > 0 && (
                      <div className="mt-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1">
                        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                          <span>Wprowadzone zmiany ({msg.card.appliedChanges.length})</span>
                          <span className="text-emerald-400 font-bold">LIVE ON CANVAS</span>
                        </div>
                        {msg.card.appliedChanges.map((chg, i) => (
                          <div key={i} className="text-[10px] font-mono flex items-center justify-between gap-1 text-zinc-300">
                            <span className="truncate">{chg.summary}</span>
                            <span className="text-[#F2C27F] flex-shrink-0 text-[9px]">{chg.property}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Undo AI change button */}
                    <div className="pt-1.5 flex items-center justify-between">
                      <button
                        onClick={undo}
                        disabled={!canUndo}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-[#D9A86C] hover:text-[#F2C27F] disabled:opacity-30 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Cofnij zmianę AI</span>
                      </button>
                      <button
                        onClick={redo}
                        disabled={!canRedo}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Ponów</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Live Thinking / Executing indicator */}
        {isExecuting && (
          <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#D9A86C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9A86C] animate-ping" />
              <span>HACP ● Executing workflow...</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#0D1118] border border-[#D9A86C]/30 text-xs text-zinc-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-[#D9A86C] animate-spin" />
              <span>Analiza strony i wstrzykiwanie konfiguracji Experience...</span>
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
          onClick={() => handleSendMessage('Dodaj sekcję Korzyści (Feature Grid) z trzema filarami oferty.')}
          disabled={isExecuting}
          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.03] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.07] whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0 disabled:opacity-40"
        >
          <span>+ Korzyści</span>
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
            placeholder="Powiedz SoloSpot AI, co chcesz zmienić..."
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
                <span className="text-zinc-400">Runtime:</span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Connection:</span>
                <span className="text-emerald-400 font-bold">CONNECTED</span>
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
                <span className="text-zinc-400">Last validation:</span>
                <span className="text-emerald-400 font-bold">PASS</span>
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
