'use client'

/**
 * QuickToolbar — C16.4 Quick Action Toolbar
 *
 * Floating toolbar above/below the selected element.
 *
 * Architecture:
 *   Receives ToolbarPositionResult + selected section data → renders buttons
 *   Emits dispatch(OverlayController.actionToCommand(action))
 *   NEVER modifies document directly.
 *
 * Actions:
 *   ↑ MOVE_UP | ↓ MOVE_DOWN | ⬡ DUPLICATE | 🗑 DELETE | 🔒 LOCK | 👁 HIDE
 */

import { motion } from 'framer-motion'
import {
  ArrowUp, ArrowDown, Copy, Trash2, Lock, Eye,
} from 'lucide-react'
import { findNode, type ToolbarPositionResult, type ToolbarActionType } from '../../../../packages/builder-core/src'
import { useBuilder } from '../state/BuilderProvider'
import { useCallback } from 'react'

// ---------------------------------------------------------------------------
// Action button config
// ---------------------------------------------------------------------------

interface ActionButton {
  readonly type: ToolbarActionType
  readonly icon: React.ElementType
  readonly label: string
  readonly shortcut?: string
  /** Condition to show this action (based on section state) */
  readonly showIf: (params: { locked: boolean; hidden: boolean; index: number; total: number }) => boolean
}

const ACTIONS: ActionButton[] = [
  {
    type: 'MOVE_UP',
    icon: ArrowUp,
    label: 'Przesuń w górę',
    shortcut: 'Ctrl+↑',
    showIf: ({ index }) => index > 0,
  },
  {
    type: 'MOVE_DOWN',
    icon: ArrowDown,
    label: 'Przesuń w dół',
    shortcut: 'Ctrl+↓',
    showIf: ({ index, total }) => index < total - 1,
  },
  {
    type: 'DUPLICATE',
    icon: Copy,
    label: 'Duplikuj',
    shortcut: 'Ctrl+D',
    showIf: () => true,
  },
  {
    type: 'DELETE',
    icon: Trash2,
    label: 'Usuń',
    shortcut: 'Del',
    showIf: () => true,
  },
  {
    type: 'LOCK',
    icon: Lock,
    label: 'Zablokuj',
    shortcut: 'Ctrl+L',
    showIf: ({ locked }) => !locked,
  },
  {
    type: 'HIDE',
    icon: Eye,
    label: 'Ukryj',
    shortcut: 'Ctrl+H',
    showIf: ({ hidden }) => !hidden,
  },
]

// ---------------------------------------------------------------------------
// QuickToolbar
// ---------------------------------------------------------------------------

interface QuickToolbarProps {
  /** Toolbar position from OverlayController */
  position: ToolbarPositionResult
  /** Section ID for actions */
  sectionId: string
  /** Page ID for actions */
  pageId: string
  /** Whether the section is locked */
  locked?: boolean
  /** Whether the section is hidden */
  hidden?: boolean
  /** Section index in page */
  index: number
  /** Total sections on page */
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
  const { dispatch, document } = useBuilder()

  const handleAction = useCallback((type: ToolbarActionType) => {
    const action = { type, sectionId, pageId }

    // Map toolbar action to builder command
    switch (type) {
      case 'MOVE_UP': {
        const found = findNode(document, sectionId)
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
        const found = findNode(document, sectionId)
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
        const found = findNode(document, sectionId)
        if (found?.parent) {
          dispatch({ type: 'DUPLICATE_NODE', nodeId: sectionId } as any)
        } else {
          dispatch({ type: 'DUPLICATE_SECTION', pageId, sectionId } as any)
        }
        break
      }
      case 'DELETE': {
        const found = findNode(document, sectionId)
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
        const found = findNode(document, sectionId)
        if (found?.parent) {
          dispatch({ type: 'SET_NODE_LOCKED', nodeId: sectionId, locked: !locked } as any)
        } else {
          dispatch({ type: 'TOGGLE_LOCK', pageId, sectionId } as any)
        }
        break
      }
      case 'HIDE':
      case 'SHOW': {
        const found = findNode(document, sectionId)
        if (found?.parent) {
          dispatch({ type: 'SET_NODE_HIDDEN', nodeId: sectionId, hidden: !hidden } as any)
        } else {
          dispatch({ type: 'TOGGLE_VISIBILITY', pageId, sectionId } as any)
        }
        break
      }
      default:
        break
    }
  }, [dispatch, document, sectionId, pageId, index, total, locked, hidden])

  const direction = position.position
  const isTop = direction === 'top'

  return (
    <motion.div
      className="absolute z-[200] flex items-center gap-0.5"
      initial={false}
      animate={{
        left: position.x,
        top: position.y,
        opacity: 1,
        x: '-50%',
      }}
      transition={{
        duration: 0.15,
        ease: 'easeOut',
      }}
    >
      {/* Toolbar body */}
      <div
        className={`flex items-center gap-0.5 px-1 py-1
                    bg-[#0c0c14]/95 backdrop-blur-md
                    border border-white/10 rounded-xl
                    shadow-2xl shadow-black/40`}
      >
        {ACTIONS.map(action => {
          if (!action.showIf({ locked, hidden, index, total })) return null

          const Icon = action.icon
          const isDanger = action.type === 'DELETE'

          return (
            <button
              key={action.type}
              onClick={(e) => {
                e.stopPropagation()
                handleAction(action.type)
              }}
              className={`p-1.5 rounded-lg transition-all
                ${isDanger
                  ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
                }
                active:scale-90`}
              title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          )
        })}
      </div>

      {/* Arrow pointing to element */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-2 h-2
                    bg-[#0c0c14] border border-white/10 rotate-45
                    ${isTop ? 'bottom-[-5px] border-t-0 border-l-0' : 'top-[-5px] border-b-0 border-r-0'}`}
      />
    </motion.div>
  )
}

