import { describe, expect, it } from 'vitest';
import { BuilderDocument, createBuilderDocument, createHistoryStack } from '../../../../builder-core/src';
import { createCamera } from '../../camera/CameraModel';
import { createLayer, createScene } from '../../scene/SceneGraphModel';
import { createSelectionState } from '../../selection/SelectionModel';
import { DEFAULT_SNAPPING_CONFIG } from '../../selection/CanvasSnappingController';
import { CanvasInteractionPipeline, CanvasInteractionState } from '../CanvasInteractionPipeline';

describe('CanvasInteractionPipeline Closed Architecture', () => {
  const layer1 = createLayer({
    id: 'l1',
    name: 'Layer 1',
    transform: { x: 0, y: 0, width: 200, height: 200, rotationDeg: 0, scaleX: 1, scaleY: 1 },
  });
  const scene = createScene({ id: 's1', layers: { [layer1.id]: layer1 } });
  const camera = createCamera({
    id: 'cam1',
    transform: { position: { x: 0, y: 0, z: 0 }, zoom: 1.0, rotationDeg: 0 },
    viewport: { width: 1920, height: 1080, devicePixelRatio: 1.0 },
  });
  const selection = createSelectionState();
  const document = createBuilderDocument({
    id: 'doc1',
    tenantId: 'tenant1',
    metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
  });
  const historyStack = createHistoryStack<BuilderDocument>(50).push(document, 'Initial Document');

  const initialState: CanvasInteractionState = {
    scene,
    selection,
    camera,
    document,
    historyStack,
    userGuides: [],
    snappingConfig: { ...DEFAULT_SNAPPING_CONFIG, snapToGrid: false },
  };

  it('should process pointer down -> selection hit test -> pointer move -> pointer up through closed pipeline', () => {
    // 1. Pointer Down at screen position (960, 540) which maps to world center (0, 0) hit testing layer1 bounds (-100, -100, 200, 200)
    const downResult = CanvasInteractionPipeline.handlePointerDown(
      initialState,
      { x: 960, y: 540 },
      { shiftKey: false, altKey: false, ctrlKey: false }
    );

    expect(downResult.interactionType).toBe('SELECT');
    expect(downResult.state.selection.selectedNodeIds).toEqual(['l1']);

    // 2. Pointer Move from (960, 540) to (980, 560) (Screen delta dx=20, dy=20)
    const moveResult = CanvasInteractionPipeline.handlePointerMove(
      downResult.state,
      { x: 980, y: 560 },
      { x: 960, y: 540 },
      downResult.interactionType,
      { shiftKey: false, altKey: false }
    );

    expect(moveResult.state.scene.layers['l1'].transform.x).toBe(20);
    expect(moveResult.state.scene.layers['l1'].transform.y).toBe(20);

    // 3. Pointer Up commits updated state to single HistoryStack<BuilderDocument>
    const finalState = CanvasInteractionPipeline.handlePointerUp(moveResult.state, downResult.interactionType, 'Drag Move');

    expect(finalState.historyStack.canUndo).toBe(true);
  });

  it('should process keyboard interaction and commit to HistoryStack', () => {
    const selectedState: CanvasInteractionState = {
      ...initialState,
      selection: createSelectionState({ selectedNodeIds: ['l1'], primarySelectedId: 'l1', mode: 'single' }),
    };

    const nextState = CanvasInteractionPipeline.handleKeyDown(selectedState, {
      key: 'ArrowRight',
      ctrlKey: false,
      metaKey: false,
      shiftKey: true, // 10px nudge
      altKey: false,
    });

    expect(nextState.scene.layers['l1'].transform.x).toBe(10);
    expect(nextState.historyStack.canUndo).toBe(true);
  });
});
