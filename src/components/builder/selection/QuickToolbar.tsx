'use client'

/**
 * QuickToolbar — C16.4 Smart Contextual Action Toolbar
 *
 * Floating toolbar above/below the selected element.
 *
 * Architecture:
 *   Receives ToolbarPositionResult + selected section data → renders contextual controls
 *   Emits dispatch() to BuilderDocument (SSOT).
 *   NEVER modifies document directly.
 *
 * Contextual Controls:
 *   - Text/Heading: Direct edit, Font Family, Quick Size (S, M, L, XL), Color, Align (L, C, R)
 *   - Image: Replace Image, Fit (Cover/Contain), Radius
 *   - Button: Label, Link URL, Style
 *   - Section: Background Media, + Add Section Below
 *   - Common: Duplicate, Delete, Lock, Reorder
 */

import { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp, ArrowDown, Copy, Trash2, Lock, Eye,
  Type, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon,
  Palette, ExternalLink, Plus, Check, ChevronDown, Sparkles,
  Video, Upload, MousePointer,
} from 'lucide-react'
import { findNode, type ToolbarPositionResult, type ToolbarActionType } from '../../../../packages/builder-core/src'
import { useBuilder } from '../state/BuilderProvider'
import { MediaPickerModal } from '../sidebar/MediaPickerModal'
import { FontPicker } from '../../../../packages/authoring-studio/src/inspector/widgets/FontPicker'

interface QuickToolbarProps {
  position: ToolbarPositionResult
  sectionId: string
  pageId: string
  locked?: boolean
  hidden?: boolean
  index: number
  total: number
}

export function QuickToolbar({
  position,
  sectionId,
  pageId,
  locked = false,
  hidden = false,
  index,
  total,
}: QuickToolbarProps) {
  const { dispatch, document, canvas } = useBuilder()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [showFontSizePopover, setShowFontSizePopover] = useState(false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [linkVal, setLinkVal] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const found = useMemo(() => findNode(document, sectionId), [document, sectionId])
  const node = found?.node
  const nodeType = node?.type || 'section'
  const isTablet = canvas.viewport.label === 'TABLET'
  const isMobile = canvas.viewport.label === 'MOBILE'
  const activeBp = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'

  const styles = useMemo(() => {
    if (!node) return {}
    if (activeBp === 'desktop') return node.styles || {}
    const resp = (node.responsive as Record<string, any>)?.[activeBp] || {}
    return { ...(node.styles || {}), ...resp }
  }, [node, activeBp])
  const props = node?.props || {}

  const handleUpdateStyles = useCallback((patch: Record<string, any>) => {
    if (activeBp === 'tablet' || activeBp === 'mobile') {
      if (found) {
        const currentResp = (found.node.responsive as Record<string, any>) || {}
        const currentBpStyles = currentResp[activeBp] || {}
        dispatch({
          type: 'UPDATE_NODE',
          nodeId: sectionId,
          updates: {
            responsive: {
              ...currentResp,
              [activeBp]: { ...currentBpStyles, ...patch },
            },
          },
          pageId,
        } as any)
      }
    } else {
      dispatch({
        type: 'SET_NODE_STYLES',
        nodeId: sectionId,
        styles: patch,
      } as any)
    }
  }, [dispatch, sectionId, activeBp, found, pageId])

  const handleUpdateProps = useCallback((patch: Record<string, any>) => {
    dispatch({
      type: 'UPDATE_PROPS',
      pageId,
      sectionId,
      props: patch,
    } as any)
  }, [dispatch, pageId, sectionId])

  const handleInsertChildNode = useCallback((childType: string, customProps?: Record<string, any>, customStyles?: Record<string, any>) => {
    const newNodeId = `node_${childType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    let nodeProps: Record<string, any> = {}
    let nodeStyles: Record<string, any> = {}
    let label = 'Element'

    switch (childType) {
      case 'text':
        label = 'Tekst'
        nodeProps = { content: 'Wpisz swój tekst tutaj...', text: 'Wpisz swój tekst tutaj...' }
        nodeStyles = { fontSize: '16px', color: '#ffffff', lineHeight: '1.5' }
        break
      case 'heading':
        label = 'Nagłówek'
        nodeProps = { content: 'Nowy nagłówek', text: 'Nowy nagłówek', level: 'h2' }
        nodeStyles = { fontSize: '32px', fontWeight: 'bold', color: '#ffffff', lineHeight: '1.2' }
        break
      case 'image':
        label = 'Obraz'
        nodeProps = { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', alt: 'Obraz' }
        nodeStyles = { width: '400px', height: '260px', objectFit: 'cover', borderRadius: '12px' }
        break
      case 'video':
        label = 'Wideo'
        nodeProps = {
          src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          controls: true,
          autoPlay: false,
          loop: false,
          muted: true,
        }
        nodeStyles = { width: '480px', height: '270px', borderRadius: '12px' }
        break
      case 'svg':
        label = 'SVG / Ikona'
        nodeProps = {
          svgContent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        }
        nodeStyles = { width: '48px', height: '48px', color: '#8b5cf6' }
        break
      case 'button':
        label = 'Przycisk'
        nodeProps = { text: 'Kliknij tutaj', href: '#' }
        nodeStyles = {
          backgroundColor: '#7c3aed',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
        }
        break
      default:
        break
    }

    const newNode = {
      id: newNodeId,
      type: childType,
      label,
      parentId: sectionId,
      order: node?.children?.length ?? 0,
      visible: true,
      locked: false,
      props: { ...nodeProps, ...(customProps || {}) },
      styles: { ...nodeStyles, ...(customStyles || {}) },
      children: [],
    }

    dispatch({
      type: 'INSERT_NODE',
      pageId,
      parentId: sectionId,
      node: newNode,
    } as any)

    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: newNodeId, pageId },
    } as any)

    setShowAddMenu(false)
  }, [dispatch, pageId, sectionId, node])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const isImg = file.type.startsWith('image/')
      const isVid = file.type.startsWith('video/')
      const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg')

      const reader = new FileReader()
      reader.onload = (uploadEvt) => {
        const dataUrl = uploadEvt.target?.result as string
        if (dataUrl) {
          const childType = isVid ? 'video' : isSvg ? 'svg' : 'image'
          handleInsertChildNode(childType, { src: dataUrl, url: dataUrl, name: file.name }, {
            width: isSvg ? '64px' : '400px',
            height: isVid ? '270px' : isSvg ? '64px' : 'auto',
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }, [handleInsertChildNode])

  const handleAction = useCallback((type: ToolbarActionType) => {
    switch (type) {
      case 'MOVE_UP': {
        if (found?.parent) {
          dispatch({
            type: 'MOVE_NODE',
            nodeId: sectionId,
            targetParentId: found.parent.id,
            targetIndex: Math.max(0, index - 1),
            pageId,
          } as any)
        } else {
          dispatch({
            type: 'MOVE_SECTION',
            pageId,
            fromIndex: index,
            toIndex: Math.max(0, index - 1),
          } as any)
        }
        break
      }
      case 'MOVE_DOWN': {
        if (found?.parent) {
          dispatch({
            type: 'MOVE_NODE',
            nodeId: sectionId,
            targetParentId: found.parent.id,
            targetIndex: Math.min(total - 1, index + 1),
            pageId,
          } as any)
        } else {
          dispatch({
            type: 'MOVE_SECTION',
            pageId,
            fromIndex: index,
            toIndex: Math.min(total - 1, index + 1),
          } as any)
        }
        break
      }
      case 'DUPLICATE': {
        if (found?.parent) {
          dispatch({ type: 'DUPLICATE_NODE', nodeId: sectionId } as any)
        } else {
          dispatch({ type: 'DUPLICATE_SECTION', pageId, sectionId } as any)
        }
        break
      }
      case 'DELETE': {
        if (found?.parent) {
          dispatch({ type: 'REMOVE_NODE', nodeId: sectionId } as any)
        } else {
          dispatch({ type: 'REMOVE_SECTION', pageId, sectionId } as any)
        }
        dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: null } } as any)
        break
      }
      case 'LOCK':
      case 'UNLOCK': {
        if (found?.parent) {
          dispatch({ type: 'SET_NODE_LOCKED', nodeId: sectionId, locked: !locked } as any)
        } else {
          dispatch({ type: 'TOGGLE_LOCK', pageId, sectionId } as any)
        }
        break
      }
      default:
        break
    }
  }, [dispatch, found, sectionId, pageId, index, total, locked])

  const direction = position.position
  const isTop = direction === 'top'

  return (
    <>
      <motion.div
        className="absolute z-[200] flex flex-col items-center gap-1"
        initial={false}
        animate={{
          left: position.x,
          top: position.y,
          opacity: 1,
          x: '-50%',
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {/* Main Toolbar Container */}
        <div
          className="flex items-center gap-1 px-2 py-1.5 bg-[#0c0c16]/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl shadow-black/60 text-white text-xs select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Element Type Badge */}
          <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-violet-300 font-bold uppercase tracking-wider mr-0.5">
            {node?.label || nodeType}
          </span>

          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {/* ------------------------------------------------------------- */}
          {/* CONTEXTUAL CONTROLS FOR TEXT / HEADING                         */}
          {/* ------------------------------------------------------------- */}
          {(nodeType === 'text' || nodeType === 'heading') && (
            <>
              {/* Font Family Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFontPicker(!showFontPicker)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-200 transition-colors"
                  title="Zmień czcionkę"
                >
                  <Type className="w-3 h-3 text-violet-400" />
                  <span className="max-w-[70px] truncate">{styles.fontFamily || 'Inter'}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                </button>

                {showFontPicker && (
                  <div className="absolute top-full left-0 mt-2 z-[300]">
                    <FontPicker
                      value={styles.fontFamily || 'Inter'}
                      onChange={(font) => {
                        handleUpdateStyles({ fontFamily: font })
                        setShowFontPicker(false)
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Font Size — Exact Value Popover + Sensitive Continuous Slider */}
              <div className="relative flex items-center">
                <button
                  onClick={() => setShowFontSizePopover(!showFontSizePopover)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono font-semibold text-white border border-white/10 transition-colors"
                  title="Rozmiar czcionki (dokładna wartość + suwak)"
                >
                  <span>{parseInt(String(styles.fontSize || '16px').replace('px', '')) || 16}px</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showFontSizePopover ? 'rotate-180' : ''}`} />
                </button>

                {showFontSizePopover && (
                  <div className="absolute top-full left-0 mt-2 p-3 bg-[#0d0d18] border border-white/15 rounded-xl shadow-2xl z-[300] min-w-[200px] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                      <span>Rozmiar tekstu</span>
                      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
                        <input
                          type="number"
                          min={8}
                          max={150}
                          value={parseInt(String(styles.fontSize || '16px').replace('px', '')) || 16}
                          onChange={(e) => {
                            const v = Math.min(150, Math.max(8, Number(e.target.value) || 8))
                            handleUpdateStyles({ fontSize: `${v}px` })
                          }}
                          className="w-10 bg-transparent text-right font-mono text-white text-xs focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400">px</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={150}
                      step={1}
                      value={parseInt(String(styles.fontSize || '16px').replace('px', '')) || 16}
                      onChange={(e) => handleUpdateStyles({ fontSize: `${e.target.value}px` })}
                      className="w-full accent-violet-500 h-1 cursor-pointer"
                    />
                    <div className="flex items-center gap-1 pt-1 border-t border-white/5">
                      {[16, 24, 32, 48, 64].map((sz) => (
                        <button
                          key={sz}
                          onClick={() => handleUpdateStyles({ fontSize: `${sz}px` })}
                          className={`flex-1 py-0.5 text-[9px] font-mono rounded border transition-all ${
                            (parseInt(String(styles.fontSize || '16px').replace('px', '')) || 16) === sz
                              ? 'bg-violet-600/40 text-violet-300 border-violet-500/50'
                              : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Alignment Buttons */}
              <div className="flex items-center bg-white/5 rounded-lg p-0.5">
                <button
                  onClick={() => handleUpdateStyles({ textAlign: 'left' })}
                  className={`p-1 rounded transition-colors ${
                    styles.textAlign === 'left' || !styles.textAlign ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Do lewej"
                >
                  <AlignLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleUpdateStyles({ textAlign: 'center' })}
                  className={`p-1 rounded transition-colors ${
                    styles.textAlign === 'center' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Wyśrodkuj"
                >
                  <AlignCenter className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleUpdateStyles({ textAlign: 'right' })}
                  className={`p-1 rounded transition-colors ${
                    styles.textAlign === 'right' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Do prawej"
                >
                  <AlignRight className="w-3 h-3" />
                </button>
              </div>

              {/* Color Swatch + Exact HEX input */}
              <div className="relative flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-1.5 py-0.5">
                <input
                  type="color"
                  value={styles.color || '#ffffff'}
                  onChange={(e) => handleUpdateStyles({ color: e.target.value })}
                  className="w-4 h-4 rounded border-0 cursor-pointer bg-transparent"
                  title="Kolor tekstu"
                />
                <input
                  type="text"
                  value={styles.color || '#ffffff'}
                  onChange={(e) => handleUpdateStyles({ color: e.target.value })}
                  className="w-14 bg-transparent text-[10px] font-mono text-slate-300 focus:outline-none focus:text-white"
                  placeholder="#ffffff"
                />
              </div>

              <div className="w-px h-4 bg-white/10 mx-0.5" />
            </>
          )}

          {/* ------------------------------------------------------------- */}
          {/* CONTEXTUAL CONTROLS FOR IMAGE                                  */}
          {/* ------------------------------------------------------------- */}
          {nodeType === 'image' && (
            <>
              <button
                onClick={() => setShowMediaPicker(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-[11px] font-semibold transition-all shadow-sm"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Zmień obraz</span>
              </button>

              {/* Fit Toggle */}
              <button
                onClick={() => handleUpdateStyles({ objectFit: styles.objectFit === 'contain' ? 'cover' : 'contain' })}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-300 transition-colors"
                title="Dopasowanie obrazu"
              >
                {styles.objectFit === 'contain' ? 'Contain' : 'Cover'}
              </button>

              {/* Radius Pills */}
              <div className="flex items-center bg-white/5 rounded-lg p-0.5">
                {[
                  { label: '0', val: '0px' },
                  { label: '8', val: '8px' },
                  { label: '16', val: '16px' },
                  { label: '●', val: '9999px' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleUpdateStyles({ borderRadius: item.val })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      styles.borderRadius === item.val
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={`Zaokrąglenie ${item.val}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-4 bg-white/10 mx-0.5" />
            </>
          )}

          {/* ------------------------------------------------------------- */}
          {/* CONTEXTUAL CONTROLS FOR BUTTON                                 */}
          {/* ------------------------------------------------------------- */}
          {nodeType === 'button' && (
            <>
              <div className="relative">
                <button
                  onClick={() => {
                    setLinkVal(String(props.href || ''))
                    setShowLinkInput(!showLinkInput)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 font-medium"
                  title="Edytuj link URL"
                >
                  <ExternalLink className="w-3 h-3 text-violet-400" />
                  <span>Link</span>
                </button>

                {showLinkInput && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-[#0c0c14] border border-white/15 rounded-xl shadow-2xl flex items-center gap-1.5 z-[300] min-w-[220px]">
                    <input
                      type="text"
                      value={linkVal}
                      onChange={(e) => setLinkVal(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                    <button
                      onClick={() => {
                        handleUpdateProps({ href: linkVal })
                        setShowLinkInput(false)
                      }}
                      className="px-2 py-1 rounded-lg bg-violet-600 text-white text-xs font-bold"
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>

              {/* Color Swatch for Button Background */}
              <input
                type="color"
                value={styles.backgroundColor || '#7c3aed'}
                onChange={(e) => handleUpdateStyles({ backgroundColor: e.target.value })}
                className="w-5 h-5 rounded-md border border-white/20 cursor-pointer bg-transparent"
                title="Kolor tła przycisku"
              />

              <div className="w-px h-4 bg-white/10 mx-0.5" />
            </>
          )}

          {/* ------------------------------------------------------------- */}
          {/* CONTEXTUAL CONTROLS FOR VIDEO                                  */}
          {/* ------------------------------------------------------------- */}
          {nodeType === 'video' && (
            <>
              <div className="relative">
                <button
                  onClick={() => {
                    setLinkVal(String(props.src || ''))
                    setShowLinkInput(!showLinkInput)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 font-medium"
                  title="Zmień adres URL wideo"
                >
                  <Video className="w-3 h-3 text-red-400" />
                  <span>URL wideo</span>
                </button>

                {showLinkInput && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-[#0c0c14] border border-white/15 rounded-xl shadow-2xl flex items-center gap-1.5 z-[300] min-w-[240px]">
                    <input
                      type="text"
                      value={linkVal}
                      onChange={(e) => setLinkVal(e.target.value)}
                      placeholder="https://... (mp4/webm)"
                      className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                    <button
                      onClick={() => {
                        handleUpdateProps({ src: linkVal, url: linkVal })
                        setShowLinkInput(false)
                      }}
                      className="px-2 py-1 rounded-lg bg-violet-600 text-white text-xs font-bold"
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleUpdateProps({ loop: !props.loop })}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                  props.loop ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
                title="Pętla odtwarzania wideo"
              >
                Pętla
              </button>

              <button
                onClick={() => handleUpdateProps({ autoPlay: !props.autoPlay })}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                  props.autoPlay ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
                title="Autoodtwarzanie"
              >
                Autoodtwarzanie
              </button>

              <div className="w-px h-4 bg-white/10 mx-0.5" />
            </>
          )}

          {/* ------------------------------------------------------------- */}
          {/* CONTEXTUAL CONTROLS FOR SVG / ICON                             */}
          {/* ------------------------------------------------------------- */}
          {(nodeType === 'svg' || nodeType === 'icon') && (
            <>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5">
                <span className="text-[10px] text-slate-400">Kolor:</span>
                <input
                  type="color"
                  value={styles.color || '#8b5cf6'}
                  onChange={(e) => handleUpdateStyles({ color: e.target.value })}
                  className="w-4 h-4 rounded border-0 cursor-pointer bg-transparent"
                  title="Kolor ikony / SVG"
                />
              </div>

              <div className="w-px h-4 bg-white/10 mx-0.5" />
            </>
          )}

          {/* ------------------------------------------------------------- */}
          {/* CONTEXTUAL CONTROLS FOR SECTION / CONTAINER / COLUMN           */}
          {/* ------------------------------------------------------------- */}
          {(nodeType === 'section' || nodeType === 'container' || nodeType === 'column' || nodeType === 'grid') && (
            <>
              {/* Contextual + Dodaj Element dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold transition-all shadow-sm"
                  title="Dodaj element bezpośrednio do tego kontenera"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dodaj element</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
                </button>

                {showAddMenu && (
                  <div className="absolute top-full left-0 mt-2 p-1.5 bg-[#0e0d1c] border border-white/15 rounded-xl shadow-2xl z-[300] min-w-[190px] space-y-1 select-none">
                    <button
                      onClick={() => handleInsertChildNode('text')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Type className="w-3.5 h-3.5 text-violet-400" />
                      <span>Tekst</span>
                    </button>
                    <button
                      onClick={() => handleInsertChildNode('heading')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Type className="w-3.5 h-3.5 text-indigo-400 font-bold" />
                      <span>Nagłówek</span>
                    </button>
                    <button
                      onClick={() => handleInsertChildNode('image')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Obraz</span>
                    </button>
                    <button
                      onClick={() => handleInsertChildNode('video')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5 text-red-400" />
                      <span>Wideo</span>
                    </button>
                    <button
                      onClick={() => handleInsertChildNode('svg')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>SVG / Ikona</span>
                    </button>
                    <button
                      onClick={() => handleInsertChildNode('button')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <MousePointer className="w-3.5 h-3.5 text-blue-400" />
                      <span>Przycisk</span>
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-violet-300 hover:text-white hover:bg-violet-600/30 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-violet-400" />
                      <span>Wgraj z dysku...</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={styles.backgroundColor || (nodeType === 'section' ? '#06060c' : 'transparent')}
                  onChange={(e) => handleUpdateStyles({ backgroundColor: e.target.value })}
                  className="w-5 h-5 rounded-md border border-white/20 cursor-pointer bg-transparent"
                  title="Kolor tła"
                />
              </div>

              <div className="w-px h-4 bg-white/10 mx-0.5" />
            </>
          )}

          {/* ------------------------------------------------------------- */}
          {/* COMMON STRUCTURAL ACTIONS                                      */}
          {/* ------------------------------------------------------------- */}
          {index > 0 && (
            <button
              onClick={() => handleAction('MOVE_UP')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Przesuń w górę (Ctrl+↑)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}

          {index < total - 1 && (
            <button
              onClick={() => handleAction('MOVE_DOWN')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Przesuń w dół (Ctrl+↓)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => handleAction('DUPLICATE')}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Duplikuj (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleAction('DELETE')}
            className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Usuń (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Small pointer arrow pointing to the selected element */}
        <div
          className={`w-2 h-2 bg-[#0c0c16] border border-white/15 rotate-45 ${
            isTop ? 'border-t-0 border-l-0' : 'border-b-0 border-r-0'
          }`}
        />
      </motion.div>

      {/* Media Picker Modal for Image elements */}
      {showMediaPicker && (
        <MediaPickerModal
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(url) => {
            handleUpdateProps({ src: url })
            setShowMediaPicker(false)
          }}
        />
      )}
      {/* Hidden file input for uploading images/videos/SVGs directly into container */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.svg"
        onChange={handleFileUpload}
        className="hidden"
      />
    </>
  )
}
