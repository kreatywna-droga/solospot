import React from 'react';

export interface PropertyInspectorProps {
  nodeId?: string;
  nodeType?: string;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({ nodeId = 'node-1', nodeType = 'section' }) => {
  return (
    <div data-testid="property-inspector" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div>
        <span style={{ opacity: 0.7 }}>Node ID: </span>
        <strong>{nodeId}</strong>
      </div>
      <div>
        <span style={{ opacity: 0.7 }}>Type: </span>
        <span>{nodeType}</span>
      </div>
    </div>
  );
};
