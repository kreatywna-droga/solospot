/**
 * BrowserTriggerAdapter.ts — PM34 Browser Adapter (Preview layer)
 *
 * This is the ONLY layer that touches browser APIs (window, document,
 * PointerEvent, IntersectionObserver, scroll). It translates browser signals
 * into immutable `AnimationTriggerContext` snapshots and emits them to
 * subscribers. It NEVER sends browser objects to builder-core
 * (DECISION-039) and NEVER stores business/playback state (DECISION-041).
 *
 *   Browser events
 *     ↓
 *   AnimationTriggerContext (immutable snapshot)
 *     ↓
 *   builder-core (AnimationTriggerEngine / AnimationRuntimePreviewBridge)
 *
 * The adapter is stateless between emits: each emit is a fresh, immutable
 * snapshot built from the current browser state.
 */

import { createTriggerContext } from '../../../../packages/builder-core/src/animation/AnimationTriggerContext';
import type { AnimationTriggerContext } from '../../../../packages/builder-core/src/animation/AnimationTriggerContext';

type Listener = (context: AnimationTriggerContext) => void;

export interface BrowserTriggerAdapterOptions {
  rootSelector?: string;
  targetSelector?: string;
}

/**
 * Concrete browser adapter that translates browser signals into immutable
 * `AnimationTriggerContext` snapshots. Lives in the Preview layer by
 * architectural decision (DECISION-037 / 038). It is a standalone emitter and
 * is NOT a subclass of the pure `AnimationRuntimePreviewAdapter` (which lives
 * in builder-core and operates on serializable messages only).
 */
export class BrowserTriggerAdapter {
  private readonly _rootSelector?: string;
  private readonly _targetSelector?: string;
  private readonly _listeners = new Set<Listener>();
  private _connected = false;
private _target: HTMLElement | null = null;
  private _observer: IntersectionObserver | null = null;

constructor(private readonly _win: Window, options: BrowserTriggerAdapterOptions = {}) {
    this._rootSelector = options.rootSelector;
    this._targetSelector = options.targetSelector;
  }

  /** Starts observing the browser environment. Idempotent. */
  public connect(): void {
    if (this._connected) return;
    this._connected = true;

    const doc = this._win.document;
    this._target =
      (this._targetSelector ? doc.querySelector<HTMLElement>(this._targetSelector) : null) ??
      doc.body;

// Visibility via IntersectionObserver (best-effort; optional API).
    const IO = (this._win as unknown as { IntersectionObserver?: typeof IntersectionObserver })
      .IntersectionObserver;
    if (typeof IO !== 'undefined' && this._target) {
      this._observer = new IO((entries) => {
        for (const entry of entries) {
          this._emitWith({ visibilityRatio: entry.intersectionRatio });
        }
      });
      this._observer.observe(this._target);
    }

    doc.addEventListener('scroll', this._onScroll, true);
    doc.addEventListener('pointerover', this._onPointerOver, true);
    doc.addEventListener('pointerout', this._onPointerOut, true);
    doc.addEventListener('click', this._onClick, true);
    this._win.addEventListener('resize', this._onResize);
  }

  /** Stops observing and releases all resources. Idempotent. */
  public disconnect(): void {
    if (!this._connected) return;
    this._connected = false;

    const doc = this._win.document;
    doc.removeEventListener('scroll', this._onScroll, true);
    doc.removeEventListener('pointerover', this._onPointerOver, true);
    doc.removeEventListener('pointerout', this._onPointerOut, true);
    doc.removeEventListener('click', this._onClick, true);
    this._win.removeEventListener('resize', this._onResize);

    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    this._target = null;
  }

  /** Registers a listener and returns an unsubscribe function. */
  public subscribe(callback: Listener): () => void {
    this._listeners.add(callback);
    return () => {
      this._listeners.delete(callback);
    };
  }

  /** Emits a fresh snapshot immediately (e.g. on frame start). */
  public emitSnapshot(): void {
    this._emitWith({});
  }

  private readonly _onScroll = (): void => {
    this._emitWith({ scrollY: this._win.scrollY || this._win.scrollY });
  };

  private readonly _onPointerOver = (event: PointerEvent): void => {
    if (this._isOverTarget(event)) {
      this._emitWith({ isHovered: true });
    }
  };

  private readonly _onPointerOut = (event: PointerEvent): void => {
    if (this._isOverTarget(event)) {
      this._emitWith({ isHovered: false });
    }
  };

  private readonly _onClick = (event: MouseEvent): void => {
    if (this._isOverTarget(event)) {
      this._emitWith({ isClicked: true });
    }
  };

  private readonly _onResize = (): void => {
    this._emitWith({ viewportWidth: this._win.innerWidth, viewportHeight: this._win.innerHeight });
  };

  private _isOverTarget(event: { target: EventTarget | null }): boolean {
    if (!this._target) return false;
    return this._target.contains(event.target as Node) || event.target === this._target;
  }

  private _emitWith(partial: Partial<AnimationTriggerContext>): void {
    const snapshot = createTriggerContext({
      scrollY: this._win.scrollY || 0,
      viewportWidth: this._win.innerWidth,
      viewportHeight: this._win.innerHeight,
      ...partial,
    });
    for (const listener of this._listeners) {
      listener(snapshot);
    }
  }
}
