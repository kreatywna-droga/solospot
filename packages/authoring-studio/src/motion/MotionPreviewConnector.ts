/**
 * MotionPreviewConnector.ts — Sprint S13 Motion Preview Pipeline Connector
 *
 * Integrates S13 Advanced Motion evaluation (curves, velocity, 2D transforms,
 * motion paths, and declarative constraints) with S12 RealtimeEditingSession and S11 CanvasRenderer.
 *
 * NO DOM, NO React, NO window.
 */

import { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import { RealtimeEditingSession } from '../experience/RealtimeEditingSession';
import { CanvasRenderSurface } from '../rendering/CanvasRenderSurface';
import { PreviewRenderResult } from '../rendering/PreviewRendererConnector';
import { AnimationConstraint, AnimationConstraintsEvaluator } from './AnimationConstraintsEvaluator';
import { MotionPath, MotionPathEvaluator } from './MotionPathEvaluator';
import { Transform2DAnimation, Transform2DState } from './Transform2DAnimation';

export interface MotionPreviewOptions {
  readonly pageId?: string;
  readonly fps?: number;
  readonly clearColor?: string;
}

export class MotionPreviewConnector {
  private editingSession: RealtimeEditingSession;
  private paths = new Map<string, MotionPath>();
  private constraints = new Map<string, AnimationConstraint[]>();

  constructor(
    document: BuilderDocument,
    surface: CanvasRenderSurface,
    options?: MotionPreviewOptions
  ) {
    this.editingSession = new RealtimeEditingSession(document, surface, options);
  }

  public registerMotionPath(nodeId: string, path: MotionPath): void {
    this.paths.set(nodeId, path);
  }

  public registerConstraints(nodeId: string, constraints: AnimationConstraint[]): void {
    this.constraints.set(nodeId, constraints);
  }

  public renderMotionFrame(
    timestampMs: number,
    timelines: ReadonlyArray<AnimationTimeline> = []
  ): PreviewRenderResult {
    // 1. Evaluate Motion Paths for registered nodes
    for (const [nodeId, path] of this.paths.entries()) {
      const sample = MotionPathEvaluator.evaluatePath(path, (timestampMs % 3000) / 3000);
      this.editingSession.updateNodePosition(nodeId, sample.x, sample.y);
      if (path.orientToPath) {
        this.editingSession.updateNodeRotation(nodeId, sample.angleDeg);
      }
    }

    // 2. Evaluate Constraints for registered nodes
    for (const [nodeId, constraintList] of this.constraints.entries()) {
      let currentDoc = this.editingSession.getDocument();
      let nodeX = 0;
      let nodeY = 0;
      let nodeRot = 0;

      for (const page of currentDoc.pages) {
        for (const sec of page.sections) {
          if (sec.id === nodeId) {
            nodeX = typeof sec.props.x === 'number' ? sec.props.x : 0;
            nodeY = typeof sec.props.y === 'number' ? sec.props.y : 0;
            nodeRot = typeof sec.props.rotation === 'number' ? sec.props.rotation : 0;
          }
        }
      }

      for (const constraint of constraintList) {
        const result = AnimationConstraintsEvaluator.evaluateConstraint(
          nodeX,
          nodeY,
          nodeRot,
          constraint
        );
        nodeX = result.x;
        nodeY = result.y;
        nodeRot = result.rotationDeg;
      }

      this.editingSession.updateNodePosition(nodeId, nodeX, nodeY);
      this.editingSession.updateNodeRotation(nodeId, nodeRot);
    }

    // 3. Render evaluated playhead frame
    return this.editingSession.seek(timestampMs);
  }

  public getEditingSession(): RealtimeEditingSession {
    return this.editingSession;
  }

  public destroy(): void {
    this.paths.clear();
    this.constraints.clear();
    this.editingSession.destroy();
  }
}
