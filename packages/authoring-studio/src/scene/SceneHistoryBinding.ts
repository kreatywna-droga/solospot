/**
 * SceneHistoryBinding.ts — Sprint S19 Scene Graph History & Document Integration (ETAP 2)
 *
 * Connects Scene Graph mutations to BuilderDocument & HistoryStack.
 * Pipeline: Command → HistoryStack → BuilderDocument
 *
 * Ensures 100% undoable/redoable state mutations and single source of truth.
 */

import { BuilderDocument, touchDocument } from '../../../builder-core/src/BuilderDocument';
import { Scene } from './SceneGraphModel';
import { LayerOperationsEngine, LayerReorderAction } from './LayerOperationsEngine';

export interface SceneCommand {
  readonly id: string;
  readonly description: string;
  execute(doc: BuilderDocument, currentScene: Scene): { doc: BuilderDocument; scene: Scene };
  undo(doc: BuilderDocument, previousScene: Scene): { doc: BuilderDocument; scene: Scene };
}

export class SceneHistoryBinding {
  private history: Scene[];
  private future: Scene[];
  private currentScene: Scene;
  private currentDoc: BuilderDocument;

  constructor(initialDoc: BuilderDocument, initialScene: Scene) {
    this.currentDoc = initialDoc;
    this.currentScene = initialScene;
    this.history = [];
    this.future = [];
  }

  public get scene(): Scene {
    return this.currentScene;
  }

  public get document(): BuilderDocument {
    return this.currentDoc;
  }

  public get canUndo(): boolean {
    return this.history.length > 0;
  }

  public get canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Applies a mutation function to the scene, pushing previous state to HistoryStack
   * and updating BuilderDocument.
   */
  public executeMutation(
    description: string,
    mutationFn: (scene: Scene) => Scene
  ): { doc: BuilderDocument; scene: Scene } {
    const nextScene = mutationFn(this.currentScene);
    if (nextScene === this.currentScene) {
      return { doc: this.currentDoc, scene: this.currentScene };
    }

    this.history.push(this.currentScene);
    this.future = [];
    this.currentScene = nextScene;
    this.currentDoc = touchDocument(this.currentDoc);

    return { doc: this.currentDoc, scene: this.currentScene };
  }

  /**
   * Undo last scene mutation.
   */
  public undo(): { doc: BuilderDocument; scene: Scene } | null {
    if (!this.canUndo) return null;

    const previousScene = this.history.pop()!;
    this.future.push(this.currentScene);
    this.currentScene = previousScene;
    this.currentDoc = touchDocument(this.currentDoc);

    return { doc: this.currentDoc, scene: this.currentScene };
  }

  /**
   * Redo previously undone scene mutation.
   */
  public redo(): { doc: BuilderDocument; scene: Scene } | null {
    if (!this.canRedo) return null;

    const nextScene = this.future.pop()!;
    this.history.push(this.currentScene);
    this.currentScene = nextScene;
    this.currentDoc = touchDocument(this.currentDoc);

    return { doc: this.currentDoc, scene: this.currentScene };
  }

  public clearHistory(): void {
    this.history = [];
    this.future = [];
  }
}
