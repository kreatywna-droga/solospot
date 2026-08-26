import { describe, it, expect } from 'vitest';
import React from 'react';
import { PropertyInspector } from '../inspector/PropertyInspector';
import { AnimationInspector } from '../inspector/AnimationInspector';

describe('InspectorUI (Sprint S3, ETAP 3)', () => {
  it('renders PropertyInspector and AnimationInspector structures', () => {
    const propElement = <PropertyInspector nodeId="sec-1" nodeType="hero" />;
    expect(propElement).toBeDefined();
    expect(propElement.props.nodeId).toBe('sec-1');

    const animElement = <AnimationInspector timelineId="tl-hero" />;
    expect(animElement).toBeDefined();
    expect(animElement.props.timelineId).toBe('tl-hero');
  });
});
