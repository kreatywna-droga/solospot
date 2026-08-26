import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { TextInspectorPanel } from '../../ui/components/text/TextInspectorPanel';
import { createTextNode } from '../TextDomainModel';

describe('Text UX & Inspector Integration (S17 ETAP 6)', () => {
  it('renders empty inspector state when no text node selected', () => {
    render(<TextInspectorPanel selectedNode={null} />);
    expect(screen.getByTestId('text-inspector-empty')).toBeDefined();
  });

  it('renders typography inspector panel with font controls for selected node', () => {
    const node = createTextNode('t1', 'Inspect Me', 0, 0);
    render(<TextInspectorPanel selectedNode={node} />);

    expect(screen.getByTestId('text-inspector-panel')).toBeDefined();
    expect(screen.getByTestId('font-family-select')).toBeDefined();
    expect(screen.getByTestId('font-size-input')).toBeDefined();
    expect(screen.getByTestId('align-left')).toBeDefined();
  });
});
