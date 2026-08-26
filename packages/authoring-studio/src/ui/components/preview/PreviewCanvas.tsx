import React from 'react';

export interface PreviewCanvasProps {
  scale?: number;
  width?: number;
  height?: number;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  scale = 1.0,
  width = 1920,
  height = 1080,
  onCanvasRef,
}) => {
  return (
    <div
      data-testid="preview-canvas-component"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#020617',
        transform: `scale(${scale})`,
      }}
    >
      <div style={{ border: '1px solid #334155', padding: '10px', background: '#0f172a' }}>
        <canvas
          data-testid="preview-stage-canvas"
          ref={onCanvasRef}
          width={width}
          height={height}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
        <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', textAlign: 'center', marginTop: '8px' }}>
          Stage Viewport Area (S11 Visual Canvas Backend)
        </span>
      </div>
    </div>
  );
};
