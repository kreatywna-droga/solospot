'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { ColorControl } from '../controls';

/**
 * ColorWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Color picker widget — delegates to the canonical ColorControl (ONE system).
 * Pure presentation — no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
const ColorWidget: React.FC<WidgetProps<string>> = ({ value, onChange }) => (
  <ColorControl
    value={value || '#D9A86C'}
    onChange={onChange}
    title="Próbnik kolorów"
  />
);

export default React.memo(ColorWidget);

