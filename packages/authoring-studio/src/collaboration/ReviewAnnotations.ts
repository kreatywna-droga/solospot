/**
 * ReviewAnnotations.ts — Sprint S7 Collaboration Workspace
 *
 * Links review comments directly to elements (nodes) in the BuilderDocument SSOT.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface ReviewAnnotation {
  readonly annotationId: string;
  readonly commentId: string;
  readonly nodeId: string;
  readonly position?: { x: number; y: number }; // Optional viewport relative pin
}

export interface ReviewAnnotationsState {
  readonly annotations: ReadonlyArray<ReviewAnnotation>;
}

export function createReviewAnnotationsState(): ReviewAnnotationsState {
  return { annotations: [] };
}

export function attachAnnotation(
  state: ReviewAnnotationsState,
  commentId: string,
  nodeId: string,
  position?: { x: number; y: number }
): ReviewAnnotationsState {
  const annotation: ReviewAnnotation = {
    annotationId: `ann-${Date.now()}`,
    commentId,
    nodeId,
    position,
  };

  return { ...state, annotations: [...state.annotations, annotation] };
}

export function getAnnotationsForNode(
  state: ReviewAnnotationsState,
  nodeId: string
): ReadonlyArray<ReviewAnnotation> {
  return state.annotations.filter((a) => a.nodeId === nodeId);
}
