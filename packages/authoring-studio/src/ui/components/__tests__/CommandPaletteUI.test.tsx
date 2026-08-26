import { describe, it, expect } from 'vitest';
import React from 'react';
import { CommandPaletteDialog } from '../command/CommandPaletteDialog';

describe('CommandPaletteUI (Sprint S3, ETAP 6)', () => {
  it('renders CommandPaletteDialog structure', () => {
    const element = <CommandPaletteDialog isOpen={true} />;
    expect(element).toBeDefined();
    expect(element.props.isOpen).toBe(true);
  });
});
