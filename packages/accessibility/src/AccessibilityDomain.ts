export interface AccessibilityContext {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  screenReader: boolean;
}

export interface FocusTarget {
  id: string;
  elementType: string;
  tabIndex: number;
}

export interface KeyboardShortcut {
  key: string;
  modifiers: string[];
  action: string;
  description: string;
}