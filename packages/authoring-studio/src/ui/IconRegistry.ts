/**
 * IconRegistry.ts — Sprint S2 Icon Registry (Theme System)
 *
 * Registry of studio icon descriptors for UI tools, actions, and panels.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface IconDescriptor {
  readonly iconId: string;
  readonly category: 'tool' | 'action' | 'panel' | 'file';
  readonly name: string;
  readonly svgPathData?: string;
}

export const STANDARD_STUDIO_ICONS: ReadonlyArray<IconDescriptor> = [
  { iconId: 'icon-play', category: 'action', name: 'Play Animation' },
  { iconId: 'icon-pause', category: 'action', name: 'Pause Animation' },
  { iconId: 'icon-keyframe', category: 'tool', name: 'Add Keyframe' },
  { iconId: 'icon-timeline', category: 'panel', name: 'Timeline Panel' },
  { iconId: 'icon-inspector', category: 'panel', name: 'Inspector Panel' },
  { iconId: 'icon-cloud-sync', category: 'action', name: 'Cloud Sync' },
];

export function getIconDescriptor(iconId: string): IconDescriptor | undefined {
  return STANDARD_STUDIO_ICONS.find((i) => i.iconId === iconId);
}
