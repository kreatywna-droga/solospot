/**
 * VectorHandlesOverlay.tsx — Sprint S18 Vector Handles Overlay UI Component (ETAP 6)
 *
 * Renders interactive vector selection handles:
 * - 8-point bounding box transform handles (nw, n, ne, e, se, s, sw, w)
 * - top rotation control handle
 * - vertex handles for polygons & path controls
 */

import React from 'react';
import { VectorNode } from '../../../vector/VectorDomainModel';
import { VectorGeometry, BoundingBox2D } from '../../../vector/VectorGeometry';

export interface VectorHandlesOverlayProps {
  selectedNode: VectorNode | null;
  onHandleDragStart?: (handleId: string, startX: number, startY: number) => void;
}

export const VectorHandlesOverlay: React.FC<VectorHandlesOverlayProps> = ({
  selectedNode,
  onHandleDragStart,
}) => {
  if (!selectedNode) return null;

  const bounds: BoundingBox2D = VectorGeometry.computeBoundingBox(selectedNode);

  const handles = [
    { id: 'nw', x: bounds.x, y: bounds.y, cursor: 'nwse-resize' },
    { id: 'n', x: bounds.x + bounds.width / 2, y: bounds.y, cursor: 'ns-resize' },
    { id: 'ne', x: bounds.x + bounds.width, y: bounds.y, cursor: 'nesw-resize' },
    { id: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, cursor: 'ew-resize' },
    { id: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'nwse-resize' },
    { id: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, cursor: 'ns-resize' },
    { id: 'sw', x: bounds.x, y: bounds.y + bounds.height, cursor: 'nesw-resize' },
    { id: 'w', x: bounds.x, y: bounds.y + bounds.height / 2, cursor: 'ew-resize' },
  ];

  const rotationHandle = {
    id: 'rotate',
    x: bounds.x + bounds.width / 2,
    y: bounds.y - 24,
    cursor: 'grab',
  };

  return (
    <div
      className="vector-handles-overlay pointer-events-none absolute inset-0 select-none"
      data-testid="vector-handles-overlay"
    >
      {/* Bounding box outline */}
      <div
        className="absolute border border-blue-500 pointer-events-none"
        style={{
          left: `${bounds.x}px`,
          top: `${bounds.y}px`,
          width: `${bounds.width}px`,
          height: `${bounds.height}px`,
        }}
      />

      {/* Line to rotation handle */}
      <div
        className="absolute w-px bg-blue-500 pointer-events-none"
        style={{
          left: `${rotationHandle.x}px`,
          top: `${rotationHandle.y + 6}px`,
          height: '18px',
        }}
      />

      {/* Rotation handle */}
      <div
        className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white pointer-events-auto shadow transform -translate-x-1/2 -translate-y-1/2 cursor-grab hover:scale-125 transition-transform"
        style={{
          left: `${rotationHandle.x}px`,
          top: `${rotationHandle.y}px`,
        }}
        onMouseDown={(e) => onHandleDragStart?.(rotationHandle.id, e.clientX, e.clientY)}
        title="Rotate shape"
      />

      {/* Transform handles */}
      {handles.map((h) => (
        <div
          key={h.id}
          className="absolute w-2.5 h-2.5 bg-white border-2 border-blue-500 pointer-events-auto shadow transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform"
          style={{
            left: `${h.x}px`,
            top: `${h.y}px`,
            cursor: h.cursor,
          }}
          onMouseDown={(e) => onHandleDragStart?.(h.id, e.clientX, e.clientY)}
          title={`Resize handle ${h.id}`}
        />
      ))}
    </div>
  );
};
